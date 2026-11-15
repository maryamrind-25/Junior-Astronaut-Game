const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const NasaCache = require("../modes/NASAdatacached");

const MARS_LANDING_SITES = [
  {
    id: "jezero_crater",
    landingZone: "Jezero Crater",
    coordinates: "18.38° N, 77.58° E",
    rover: "perseverance",
    surfaceTempCelsius: -62,
    dustOpacity: 0.45,
    terrainHazard: "Ancient River Delta Boulders & Dust Squalls"
  },
  {
    id: "gale_crater",
    landingZone: "Gale Crater (Aeolis Mons)",
    coordinates: "5.40° S, 137.80° E",
    rover: "curiosity",
    surfaceTempCelsius: -56,
    dustOpacity: 0.38,
    terrainHazard: "Steep Basal Scarp Slope & Thermal Inversions"
  },
  {
    id: "elysium_planitia",
    landingZone: "Elysium Planitia",
    coordinates: "4.50° N, 135.62° E",
    rover: "perseverance",
    surfaceTempCelsius: -68,
    dustOpacity: 0.30,
    terrainHazard: "High Katabatic Winds & Seismic Tremors"
  },
  {
    id: "arcadia_planitia",
    landingZone: "Arcadia Planitia",
    coordinates: "39.20° N, 189.00° E",
    rover: "perseverance",
    surfaceTempCelsius: -81,
    dustOpacity: 0.25,
    terrainHazard: "Subsurface Ice Sheet Cryo-Stress"
  }
];

function loadFallbackData() {
  const raw = fs.readFileSync(path.join(__dirname, "../mockData/marsData.json"), "utf8");
  return JSON.parse(raw);
}

async function getLiveMissionData() {
  const CACHE_KEY = "latest_mission_telemetry";

  // 1. CACHE CHECK: Serve immediately from MongoDB Atlas on cache hit (only if connected)
  if (mongoose.connection.readyState === 1) {
    try {
      const cachedDoc = await NasaCache.findOne({ cacheKey: CACHE_KEY }).lean();
      if (cachedDoc && cachedDoc.payload) {
        return {
          ...cachedDoc.payload,
          cacheStatus: "MONGODB_HIT"
        };
      }
    } catch (dbReadErr) {
      console.warn("MongoDB cache read skipped:", dbReadErr.message);
    }
  }

  // 2. CACHE MISS: Query NASA APIs in parallel
  const fallback = loadFallbackData();
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const now = Date.now();

  const endDate = new Date(now).toISOString().split("T")[0];
  const startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Baseline values from marsData.json
  let geomagneticStormIndex = fallback.level1_prep_and_launch.geomagneticStormIndex;
  let weatherStatus = fallback.level1_prep_and_launch.weatherStatus;

  let solarFlareClass = fallback.level2_transit.solarFlareClass;
  let radiationAlert = fallback.level2_transit.radiationAlert;
  let asteroids = fallback.level2_transit.asteroids;

  const defaultSite = MARS_LANDING_SITES[0];
  let surfaceTempCelsius = defaultSite.surfaceTempCelsius;
  let atmosphericPressurePa = 740;
  let windSpeedMs = 12.4;
  let surfaceReconImageUrl = null;
  let latestSol = 1200;

  let dataSource = "mock_fallback";

  try {
    const [gstRes, flrRes, neoRes, marsRes, roverRes] = await Promise.all([
      fetch(`https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`, {
        signal: AbortSignal.timeout(4500)
      }),
      fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`, {
        signal: AbortSignal.timeout(4500)
      }),
      fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${endDate}&end_date=${endDate}&api_key=${apiKey}`, {
        signal: AbortSignal.timeout(4500)
      }),
      fetch(`https://api.nasa.gov/insight_weather/?api_key=${apiKey}&feedtype=json&ver=1.0`, {
        signal: AbortSignal.timeout(4500)
      }),
      fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${defaultSite.rover}/latest_photos?api_key=${apiKey}`, {
        signal: AbortSignal.timeout(4500)
      })
    ]);

    let liveSuccess = false;

    // A. Level 1: NASA DONKI Geomagnetic Storm (Kp Index)
    if (gstRes.ok) {
      const storms = await gstRes.json();
      if (Array.isArray(storms) && storms.length > 0) {
        const latestStorm = storms[storms.length - 1];
        const kpEntries = latestStorm.allKpIndex || [];
        if (kpEntries.length > 0) {
          geomagneticStormIndex = Math.round(kpEntries[kpEntries.length - 1].kpIndex);
          weatherStatus = geomagneticStormIndex >= 5
            ? `Geomagnetic Storm Warning (Kp-${geomagneticStormIndex})`
            : `Nominal - Clear for T-Minus Countdown (Kp-${geomagneticStormIndex})`;
          liveSuccess = true;
        }
      }
    }

    // B. Level 2: NASA DONKI Solar Flare (FLR)
    if (flrRes.ok) {
      const flares = await flrRes.json();
      if (Array.isArray(flares) && flares.length > 0) {
        const latestFlare = flares[flares.length - 1];
        solarFlareClass = latestFlare.classType || solarFlareClass;
        radiationAlert = solarFlareClass.startsWith("M") || solarFlareClass.startsWith("X");
        liveSuccess = true;
      }
    }

    // C. Level 2: NASA NeoWs Near-Earth Asteroids
    if (neoRes.ok) {
      const neoData = await neoRes.json();
      const flatNeos = Object.values(neoData.near_earth_objects || {}).flat();
      if (flatNeos.length > 0) {
        asteroids = flatNeos.slice(0, 5).map((ast, idx) => {
          const diam = Math.round(ast.estimated_diameter?.meters?.estimated_diameter_max || 50);
          const vel = Number(parseFloat(ast.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || 18.5).toFixed(1));
          return {
            id: ast.neo_reference_id || `AST-${100 + idx}`,
            name: ast.name || `Asteroid-${idx + 1}`,
            diameterMeters: diam,
            velocityKms: vel,
            hazardLevel: ast.is_potentially_hazardous_asteroid ? "High" : (diam > 60 ? "Medium" : "Low")
          };
        });
        liveSuccess = true;
      }
    }

    // D. Level 3: NASA Mars InSight Weather Service
    if (marsRes.ok) {
      const marsData = await marsRes.json();
      const solKeys = marsData.sol_keys || [];
      if (solKeys.length > 0) {
        const latestSolData = marsData[solKeys[solKeys.length - 1]];
        if (latestSolData?.AT?.av !== undefined) surfaceTempCelsius = Number(latestSolData.AT.av.toFixed(1));
        if (latestSolData?.PRE?.av !== undefined) atmosphericPressurePa = Number(latestSolData.PRE.av.toFixed(1));
        if (latestSolData?.HWS?.av !== undefined) windSpeedMs = Number(latestSolData.HWS.av.toFixed(1));
        liveSuccess = true;
      }
    }

    // E. Level 3: NASA Mars Rover Reconnaissance Photo
    if (roverRes.ok) {
      const roverData = await roverRes.json();
      const photos = roverData.latest_photos || [];
      if (photos.length > 0) {
        surfaceReconImageUrl = photos[0].img_src;
        latestSol = photos[0].sol || latestSol;
        liveSuccess = true;
      }
    }

    if (liveSuccess) {
      dataSource = "nasa_live_api";
    }
  } catch (err) {
    console.warn("NASA API unreachable/timeout, using marsData.json fallback:", err.message);
  }

  const mergedPayload = {
    source: dataSource,
    fetchedAt: new Date().toISOString(),
    level1_prep_and_launch: {
      ...fallback.level1_prep_and_launch,
      geomagneticStormIndex,
      weatherStatus
    },
    level2_transit: {
      ...fallback.level2_transit,
      solarFlareClass,
      radiationAlert,
      asteroids
    },
    level3_mars: {
      ...fallback.level3_mars,
      landingZone: defaultSite.landingZone,
      coordinates: defaultSite.coordinates,
      terrainHazard: defaultSite.terrainHazard,
      surfaceTempCelsius,
      dustOpacity: defaultSite.dustOpacity,
      atmosphericPressurePa,
      windSpeedMs,
      latestSol,
      surfaceReconImageUrl,
      availableLandingZones: MARS_LANDING_SITES
    }
  };

  // 3. SAVE TO MONGODB ATLAS (TTL index automatically purges after 600s)
  if (dataSource === "nasa_live_api" && mongoose.connection.readyState === 1) {
    try {
      await NasaCache.findOneAndUpdate(
        { cacheKey: CACHE_KEY },
        {
          cacheKey: CACHE_KEY,
          payload: mergedPayload,
          source: dataSource,
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (dbWriteErr) {
      console.warn("MongoDB cache write failed:", dbWriteErr.message);
    }
  }

  return {
    ...mergedPayload,
    cacheStatus: "CACHE_MISS_FETCHED_LIVE"
  };
}

module.exports = { getLiveMissionData, MARS_LANDING_SITES };