const { getLiveMissionData, MARS_LANDING_SITES } = require("./services/NasaDataServices");
const { getAriaEvent } = require("./services/llmservices");

const OXYGEN_WARNING_THRESHOLD = 25;

function getLowOxygenWarning(oxygenLevel) {
  const o2 = Number(oxygenLevel);
  if (!Number.isNaN(o2) && o2 > 0 && o2 <= OXYGEN_WARNING_THRESHOLD) {
    return `⚠️ CRITICAL O2 ALERT (${o2.toFixed(1)}%): Oxygen reserves below ${OXYGEN_WARNING_THRESHOLD}%! Replenish O2 or repressurize immediately.`;
  }
  return null;
}

function pickLandingSite(nasaData, preferredZoneId = null) {
  const sites = nasaData?.level3_mars?.availableLandingZones || MARS_LANDING_SITES;
  if (preferredZoneId) {
    const found = sites.find((s) => s.id === preferredZoneId);
    if (found) return found;
  }
  return sites[Math.floor(Math.random() * sites.length)];
}

// ============================================================================
// 1. STAGE PRESSURE SPECIFICATIONS (Level 1 Launch, Level 2 Space, Level 3 Mars)
// ============================================================================
const STAGE_PRESSURE_SPECS = {
  level1_prep_and_launch: {
    label: "Launch Cabin Pressurization",
    ambientKpa: 101.3,
    safeMinKpa: 95.0,
    safeMaxKpa: 105.0,
    recommendedKpa: 101.3
  },
  level2_transit: {
    label: "Deep Space EVA Suit Regulator",
    ambientKpa: 0.0,
    safeMinKpa: 27.5,
    safeMaxKpa: 32.0,
    recommendedKpa: 29.6
  },
  level3_mars: {
    label: "Martian Surface Suit Regulator",
    ambientKpa: 0.74,
    safeMinKpa: 29.0,
    safeMaxKpa: 36.0,
    recommendedKpa: 32.5
  }
};

// ============================================================================
// 2. LEVEL 3: MARS FOOD PREPARATION TRADE-OFFS & 2-DAY SURVIVAL THRESHOLDS
// ============================================================================
const MARS_FOOD_TRADEOFFS = {
  rehydratable: {
    id: "rehydratable",
    name: "Freeze-Dried Rehydratable Rations",
    summary: "High calorie boost with minimal power draw, but consumes significant potable water.",
    deltas: { o2: 0, water: -18, food: +28, power: -4 }
  },
  thermostabilized: {
    id: "thermostabilized",
    name: "Thermostabilized Retort Pouches",
    summary: "Zero water required and quick prep, but moderate calorie yield and higher heating power.",
    deltas: { o2: 0, water: -2, food: +20, power: -10 }
  },
  hydroponic_harvest: {
    id: "hydroponic_harvest",
    name: "Habitat Hydroponic Crop Harvest",
    summary: "Fresh nutrient-dense harvest that generates bonus O2, at the cost of heavy grow-light power & irrigation.",
    deltas: { o2: +8, water: -14, food: +32, power: -22 }
  },
  cryo_regolith_cache: {
    id: "cryo_regolith_cache",
    name: "Subsurface Martian Regolith Cache (-80°C)",
    summary: "Uses ambient Martian cold instead of power to preserve rations, but requires an EVA trek (-4% O2).",
    deltas: { o2: -4, water: -6, food: +22, power: +4 }
  }
};

const DAILY_MARS_BURN = {
  o2: -12,
  water: -10,
  food: -15,
  power: -12
};

const MARS_SURVIVAL_THRESHOLDS = {
  minO2: 15,
  minWater: 15,
  minFood: 10,
  minPower: 15
};

// ============================================================================
// 3. DYNAMIC PER-RUN HAZARD POOLS & UNMITIGATED IMPACT TABLE
// ============================================================================
const STAGE_HAZARD_POOLS = {
  level1_prep_and_launch: [
    (nasa) => ({
      id: "WIND_SHEAR",
      severity: "Moderate",
      description: `Upper-atmosphere jet stream shear (145 km/h) over ${nasa.level1_prep_and_launch.site} during Max-Q.`
    }),
    (nasa) => ({
      id: "GEOMAGNETIC_SPIKE",
      severity: "High",
      description: `Geomagnetic storm index Kp-${nasa.level1_prep_and_launch.geomagneticStormIndex + 2} interfering with ascent telemetry.`
    }),
    () => ({
      id: "BOOSTER_VALVE_PRESSURE",
      severity: "Moderate",
      description: "Liquid oxygen turbopump pressure fluctuation detected at T+52 seconds."
    })
  ],

  level2_transit: [
    (nasa) => {
      const list = nasa.level2_transit.asteroids || [];
      const ast = list[Math.floor(Math.random() * list.length)] || {
        name: "AST-209",
        diameterMeters: 85,
        velocityKms: 24.1,
        hazardLevel: "High"
      };
      return {
        id: "NEO_PROXIMITY",
        severity: ast.hazardLevel || "High",
        description: `Near-Earth Object ${ast.name} (${ast.diameterMeters}m wide) crossing trajectory at ${ast.velocityKms} km/s.`
      };
    },
    (nasa) => ({
      id: "SOLAR_FLARE_CME",
      severity: "Critical",
      description: `Live NASA DONKI alert: Class ${nasa.level2_transit.solarFlareClass} solar flare & coronal mass ejection inbound.`
    }),
    () => ({
      id: "MICROMETEOROID_IMPACT",
      severity: "Moderate",
      description: "High-velocity micrometeoroid swarm impacting starboard radiator panels in deep space transit."
    })
  ],

  level3_mars: [
    (nasa, site) => ({
      id: "MARS_DUST_SQUALL",
      severity: "High",
      description: `Regional dust storm crossing ${site.landingZone} (${site.coordinates}); dust opacity spiked to ${(site.dustOpacity + 0.35).toFixed(2)}.`
    }),
    (nasa, site) => ({
      id: "MARS_THERMAL_PLUNGE",
      severity: "High",
      description: `Katabatic wind front at ${site.landingZone} dropping surface temperature to ${site.surfaceTempCelsius}°C (${site.terrainHazard}).`
    }),
    (nasa, site) => ({
      id: "MARS_TERRAIN_HAZARD",
      severity: "Moderate",
      description: `Surface EVA alert at ${site.landingZone} (${site.coordinates}): ${site.terrainHazard} detected near habitat.`
    })
  ]
};

// Single most physically affected metric when a hazard hits unmitigated ("no")
// currentMeters indices: [0: o2 (0-1), 1: water (%), 2: food (%), 3: power (%), 4: shield (%), 5: suitIntegrity (%), 6: tempC, 7: massKg, 8: fuelKg]
const UNMITIGATED_HAZARD_IMPACTS = {
  // Level 1: Launch
  WIND_SHEAR:             { index: 8, delta: -45,   label: "Propellant burned fighting aerodynamic shear (-45 kg fuel)" },
  GEOMAGNETIC_SPIKE:      { index: 3, delta: -18,   label: "Avionics bus surge drained battery (-18% power)" },
  BOOSTER_VALVE_PRESSURE: { index: 0, delta: -0.15, label: "LOX feed fluctuation reduced oxygen reserve (-15% O2)" },

  // Level 2: Deep Space Transit
  NEO_PROXIMITY:          { index: 5, delta: -22,   label: "Debris strike damaged outer pressure shell (-22% suit integrity)" },
  SOLAR_FLARE_CME:        { index: 4, delta: -25,   label: "Coronal mass ejection degraded radiation shielding (-25% shield)" },
  MICROMETEOROID_IMPACT:  { index: 5, delta: -20,   label: "Micrometeoroid punctured radiator & suit layer (-20% suit integrity)" },

  // Level 3: Mars Surface
  MARS_DUST_SQUALL:       { index: 3, delta: -20,   label: "Dust opacity choked solar array charging (-20% power)" },
  MARS_THERMAL_PLUNGE:    { index: 3, delta: -22,   label: "Katabatic freeze forced emergency suit heaters (-22% power)" },
  MARS_TERRAIN_HAZARD:    { index: 5, delta: -18,   label: "Regolith abrasion damaged EVA boot & joint seals (-18% suit integrity)" }
};

function selectDynamicHazard(stageKey, nasaData, seenHazardIds = [], landingSite = null) {
  const pool = STAGE_HAZARD_POOLS[stageKey] || STAGE_HAZARD_POOLS.level2_transit;
  const activeSite = landingSite || pickLandingSite(nasaData);
  const candidates = pool.map((builder) => builder(nasaData, activeSite));
  const unseen = candidates.filter((h) => !seenHazardIds.includes(h.id));
  const activePool = unseen.length > 0 ? unseen : candidates;
  return activePool[Math.floor(Math.random() * activePool.length)];
}

// ============================================================================
// 4. CORE GAMEPLAY CONTROLLERS
// ============================================================================
async function processMissionEvent({ stageKey, currentMeters, seenHazardIds = [], landingZoneId = null, decision = null }) {
  const nasaData = await getLiveMissionData();
  const activeLandingSite = stageKey === "level3_mars" ? pickLandingSite(nasaData, landingZoneId) : null;
  const hazard = selectDynamicHazard(stageKey, nasaData, seenHazardIds, activeLandingSite);
  const ariaResult = await getAriaEvent(stageKey, hazard.description, currentMeters);

  const normalizedDecision = String(decision || "").trim().toLowerCase();

  // 1. Initial encounter (no button clicked yet) -> pause and wait for player choice
  if (!normalizedDecision) {
    return {
      missionStatus: "AWAITING_DECISION",
      activeLandingSite,
      hazardTriggered: hazard,
      ariaDialogue: ariaResult.ariaDialogue
    };
  }

  // 2. Player pressed "No" -> apply single most realistic physical impact
  if (/^no\b/.test(normalizedDecision)) {
    const meters = Array.isArray(currentMeters) ? [...currentMeters] : [1, 100, 100, 100, 100, 100, 21, 1200, 500];
    const impact = UNMITIGATED_HAZARD_IMPACTS[hazard.id] || {
      index: 5,
      delta: -15,
      label: "Unmitigated hazard stress (-15% suit integrity)"
    };

    if (impact.index === 0) {
      meters[0] = Number(Math.max(0, Math.min(1, meters[0] + impact.delta)).toFixed(2));
    } else if (impact.index >= 1 && impact.index <= 5) {
      meters[impact.index] = Math.max(0, Math.min(100, meters[impact.index] + impact.delta));
    } else {
      meters[impact.index] = Math.max(0, meters[impact.index] + impact.delta);
    }

    const updatedTelemetry = {
      oxygenLevel: Number((meters[0] * 100).toFixed(1)),
      waterReserve: meters[1],
      foodSupply: meters[2],
      suitPower: meters[3],
      radiationShield: meters[4],
      suitIntegrity: meters[5]
    };

    const detailedMeters = {
      temperatureC: meters[6],
      payloadMassKg: meters[7],
      fuelKg: meters[8]
    };

    const isCriticalFailure =
      updatedTelemetry.oxygenLevel <= 0 ||
      updatedTelemetry.suitPower <= 0 ||
      updatedTelemetry.suitIntegrity <= 0 ||
      detailedMeters.fuelKg <= 0;

    const oxygenWarning = getLowOxygenWarning(updatedTelemetry.oxygenLevel);
    const impactNotice = `⚠️ HAZARD IMPACT (${hazard.id}): ${impact.label}.`;

    return {
      missionStatus: isCriticalFailure ? "CRITICAL_FAILURE" : "ACTIVE",
      decisionApplied: "NO",
      activeLandingSite,
      hazardTriggered: hazard,
      impactSummary: impactNotice,
      oxygenWarning,
      ariaDialogue: oxygenWarning
        ? `${oxygenWarning}\n\n${impactNotice}\n${ariaResult.ariaDialogue}`
        : `${impactNotice}\n${ariaResult.ariaDialogue}`,
      updatedTelemetry,
      detailedMeters,
      rawMeters: meters
    };
  }

  // 3. Player pressed "Yes" -> apply standard mitigation tradeoff from llmservices
  const { oxygenLevel, suitPower } = ariaResult.updatedTelemetry;
  const { fuelKg } = ariaResult.detailedMeters;
  const isCriticalFailure = oxygenLevel <= 0 || suitPower <= 0 || fuelKg <= 0;

  const oxygenWarning = getLowOxygenWarning(oxygenLevel);
  if (oxygenWarning) {
    ariaResult.ariaDialogue = `${oxygenWarning}\n\n${ariaResult.ariaDialogue}`;
  }

  return {
    missionStatus: isCriticalFailure ? "CRITICAL_FAILURE" : "ACTIVE",
    decisionApplied: "YES",
    activeLandingSite,
    hazardTriggered: hazard,
    oxygenWarning,
    ...ariaResult
  };
}

async function adjustSuitPressure({ stageKey = "level2_transit", targetPressureKpa, currentMeters }) {
  const spec = STAGE_PRESSURE_SPECS[stageKey] || STAGE_PRESSURE_SPECS.level2_transit;
  const pressure = Number(targetPressureKpa);
  const meters = [...currentMeters];
  const currentO2Percent = meters[0] <= 1 ? meters[0] * 100 : meters[0];

  let status = "NOMINAL";
  let alertDetail = `${spec.label} stabilized at ${pressure.toFixed(1)} kPa (Target: ${spec.recommendedKpa} kPa).`;

  if (pressure < spec.safeMinKpa) {
    status = "DECOMPRESSION_WARNING";
    alertDetail = `Pressure too low (${pressure.toFixed(1)} kPa < ${spec.safeMinKpa} kPa)! Risk of hypoxia and decompression sickness.`;
    meters[0] = Number((Math.max(0, currentO2Percent - 18) / 100).toFixed(2));
    meters[5] = Math.max(0, meters[5] - 12);
  } else if (pressure > spec.safeMaxKpa) {
    status = "OVERPRESSURE_WARNING";
    alertDetail = `Pressure too high (${pressure.toFixed(1)} kPa > ${spec.safeMaxKpa} kPa)! Suit joints rigid and seal stress elevated.`;
    meters[3] = Math.max(0, meters[3] - 14);
    meters[5] = Math.max(0, meters[5] - 15);
  } else {
    meters[3] = Math.min(100, meters[3] + 2);
  }

  const ariaResult = await getAriaEvent(stageKey, alertDetail, meters);
  const updatedO2 = ariaResult.updatedTelemetry?.oxygenLevel ?? (meters[0] * 100);
  const oxygenWarning = getLowOxygenWarning(updatedO2);
  if (oxygenWarning) {
    ariaResult.ariaDialogue = `${oxygenWarning}\n\n${ariaResult.ariaDialogue}`;
  }

  const isCriticalFailure = meters[0] <= 0 || meters[3] <= 0 || meters[5] <= 0;

  return {
    missionStatus: isCriticalFailure ? "CRITICAL_FAILURE" : "ACTIVE",
    pressureStatus: status,
    appliedPressureKpa: pressure,
    safeRangeKpa: { min: spec.safeMinKpa, max: spec.safeMaxKpa, recommended: spec.recommendedKpa },
    oxygenWarning,
    ...ariaResult
  };
}

async function processMarsFoodSurvival({ dayNumber = 1, strategyId, currentMeters, landingZoneId = null }) {
  const nasaData = await getLiveMissionData();
  const activeLandingSite = pickLandingSite(nasaData, landingZoneId);
  const strategy = MARS_FOOD_TRADEOFFS[strategyId] || MARS_FOOD_TRADEOFFS.rehydratable;

  // currentMeters indices: [0: o2 (0-1), 1: water (%), 2: food (%), 3: power (%), 4: shield, 5: suitIntegrity, 6: tempC, 7: massKg, 8: fuelKg]
  const meters = [...currentMeters];
  const currentO2Percent = meters[0] <= 1 ? meters[0] * 100 : meters[0];

  const nextO2 = Math.min(100, Math.max(0, currentO2Percent + strategy.deltas.o2 + DAILY_MARS_BURN.o2));
  const nextWater = Math.min(100, Math.max(0, meters[1] + strategy.deltas.water + DAILY_MARS_BURN.water));
  const nextFood = Math.min(100, Math.max(0, meters[2] + strategy.deltas.food + DAILY_MARS_BURN.food));
  const nextPower = Math.min(100, Math.max(0, meters[3] + strategy.deltas.power + DAILY_MARS_BURN.power));

  meters[0] = Number((nextO2 / 100).toFixed(2));
  meters[1] = Number(nextWater.toFixed(1));
  meters[2] = Number(nextFood.toFixed(1));
  meters[3] = Number(nextPower.toFixed(1));

  const failureReasons = [];
  if (nextO2 < MARS_SURVIVAL_THRESHOLDS.minO2) failureReasons.push(`Oxygen critical (${nextO2.toFixed(0)}% < ${MARS_SURVIVAL_THRESHOLDS.minO2}%)`);
  if (nextWater < MARS_SURVIVAL_THRESHOLDS.minWater) failureReasons.push(`Water reserves depleted (${nextWater.toFixed(0)}% < ${MARS_SURVIVAL_THRESHOLDS.minWater}%)`);
  if (nextFood < MARS_SURVIVAL_THRESHOLDS.minFood) failureReasons.push(`Caloric starvation (${nextFood.toFixed(0)}% < ${MARS_SURVIVAL_THRESHOLDS.minFood}%)`);
  if (nextPower < MARS_SURVIVAL_THRESHOLDS.minPower) failureReasons.push(`Habitat power failure (${nextPower.toFixed(0)}% < ${MARS_SURVIVAL_THRESHOLDS.minPower}%)`);

  let missionStatus = "SURVIVED_SOL_1";
  if (failureReasons.length > 0) {
    missionStatus = "MISSION_FAILED";
  } else if (dayNumber >= 2) {
    missionStatus = "MISSION_ACCOMPLISHED";
  }

  const promptContext = failureReasons.length > 0
    ? `Mars Sol ${dayNumber} at ${activeLandingSite.landingZone}: Astronaut chose ${strategy.name}, resulting in CRITICAL FAILURE: ${failureReasons.join(", ")}.`
    : `Mars Sol ${dayNumber} of 2 at ${activeLandingSite.landingZone}: Astronaut prepared ${strategy.name} (${strategy.summary}). Status: ${missionStatus}.`;

  const ariaResult = await getAriaEvent("level3_mars", promptContext, meters);
  const oxygenWarning = getLowOxygenWarning(nextO2);
  if (oxygenWarning && missionStatus !== "MISSION_FAILED") {
    ariaResult.ariaDialogue = `${oxygenWarning}\n\n${ariaResult.ariaDialogue}`;
  }

  return {
    missionStatus,
    dayCompleted: dayNumber,
    daysRequired: 2,
    activeLandingSite,
    strategyApplied: strategy,
    thresholds: MARS_SURVIVAL_THRESHOLDS,
    failureReasons,
    oxygenWarning,
    ...ariaResult
  };
}

module.exports = {
  processMissionEvent,
  adjustSuitPressure,
  processMarsFoodSurvival,
  selectDynamicHazard,
  pickLandingSite,
  getLowOxygenWarning,
  OXYGEN_WARNING_THRESHOLD,
  STAGE_PRESSURE_SPECS,
  MARS_FOOD_TRADEOFFS,
  UNMITIGATED_HAZARD_IMPACTS
};