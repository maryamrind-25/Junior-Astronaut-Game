require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const jwt = require("jsonwebtoken");
const {
  registerUser,
  loginUser,
  saveUserProgress,
  getUserProgress,
} = require("./services/authservices");
const { getLiveMissionData } = require("./services/NasaDataServices");
const { getAriaEvent, getFallbackEvent, chatWithAria } = require("./services/llmservices");
const {
  processMissionEvent,
  adjustSuitPressure,
  processMarsFoodSurvival,
  STAGE_PRESSURE_SPECS,
  MARS_FOOD_TRADEOFFS
} = require("./gameLogic");

const app = express();
app.use(cors());
app.use(express.json());



const OXYGEN_WARNING_THRESHOLD = 25; // Triggers warning at or below 35%

// Interactive ARIA LLM Chat Endpoint
app.post("/api/aria/chat", async (req, res) => {
  try {
    const { message, stageKey, telemetry, detailedMeters, decision } = req.body;
    if (!message || String(message).trim() === "") {
      return res.status(400).json({ error: "message is required." });
    }

    const safeTelemetry = telemetry || {};
    const safeMeters = detailedMeters || {};

    const result = await chatWithAria({
      message: String(message).trim(),
      stageKey: stageKey || "level2_transit",
      telemetry: safeTelemetry,
      detailedMeters: safeMeters
    });

    // Check incoming OR updated oxygen levels against the threshold
    const currentO2 =
      result.updatedTelemetry?.oxygenLevel ??
      safeTelemetry.oxygenLevel ??
      safeMeters.o2Percent;

    let oxygenWarning = null;
    if (typeof currentO2 === "number" && currentO2 <= OXYGEN_WARNING_THRESHOLD) {
      oxygenWarning = `⚠️ CRITICAL O2 ALERT (${currentO2}%): Oxygen reserves below ${OXYGEN_WARNING_THRESHOLD}% threshold! Initiate immediate O2 replenishment or repressurization.`;
      
      // Prepend or append warning so ARIA always communicates it to the player
      result.ariaDialogue = `${oxygenWarning}\n\n${result.ariaDialogue}`;
    }

    const isYes = /^yes\b/i.test(String(decision ?? message).trim());

    if (!isYes) {
      return res.status(200).json({
        ariaDialogue: result.ariaDialogue,
        oxygenWarning, // Explicit boolean/string flag for Godot UI HUD alerts
        source: result.source
      });
    }

    res.status(200).json({
      ...result,
      oxygenWarning
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to reach ARIA", details: err.message });
  }
});
// Health Check
app.get("/api/status", (req, res) => {
  res.status(200).json({ status: "AstroTrainee Backend Online", timestamp: new Date().toISOString() });
});

// Signup Route
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const result = await registerUser(username, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const result = await loginUser(username, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false, error: "No token provided" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "astrotrainer-key"
    );
    res.status(200).json({ valid: true, username: decoded.username, userId: decoded.id });
  } catch (err) {
    res.status(401).json({ valid: false, error: "Token expired or invalid" });
  }
});

// 1. Live NASA Space Weather, Asteroids, Mars Weather & Landing Zones (MongoDB TTL Cached)
app.get("/api/mission-data", async (req, res) => {
  try {
    const missionData = await getLiveMissionData();
    res.status(200).json(missionData);
  } catch (err) {
    res.status(500).json({ error: "Failed to load mission data", details: err.message });
  }
});

// 2. Dynamic Per-Run Hazard + ARIA LLM Telemetry Update
app.post("/api/event", async (req, res) => {
  try {
    const { stageKey, currentMeters, seenHazardIds, landingZoneId, decision } = req.body;
    const result = await processMissionEvent({
      stageKey: stageKey || "level2_transit",
      currentMeters: currentMeters || [1.0, 100.0, 100.0, 100.0, 100.0, 100.0, 20.0, 5000.0, 1500.0],
      seenHazardIds: Array.isArray(seenHazardIds) ? seenHazardIds : [],
      landingZoneId: landingZoneId || null,
      decision: decision || null
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to process mission event", details: err.message });
  }
});

// 3. Stage Cabin / Spacesuit Pressure Regulator Adjustment (Levels 1, 2 & 3)
app.get("/api/pressure/specs", (req, res) => {
  res.status(200).json(STAGE_PRESSURE_SPECS);
});

app.post("/api/pressure/adjust", async (req, res) => {
  try {
    const { stageKey, targetPressureKpa, currentMeters } = req.body;
    const result = await adjustSuitPressure({
      stageKey: stageKey || "level2_transit",
      targetPressureKpa: targetPressureKpa ?? 29.6,
      currentMeters: currentMeters || [0.95, 90.0, 90.0, 90.0, 95.0, 100.0, -55.0, 4800.0, 1400.0]
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to adjust suit pressure", details: err.message });
  }
});

// 4. Level 3: Mars 2-Day Food Trade-Offs & Survival Check
app.get("/api/mars/food-options", (req, res) => {
  res.status(200).json({ options: Object.values(MARS_FOOD_TRADEOFFS) });
});

app.post("/api/mars/survive-day", async (req, res) => {
  try {
    const { dayNumber, strategyId, currentMeters, landingZoneId } = req.body;
    const result = await processMarsFoodSurvival({
      dayNumber: Number(dayNumber) || 1,
      strategyId: strategyId || "rehydratable",
      currentMeters: currentMeters || [0.85, 75.0, 60.0, 80.0, 90.0, 95.0, -62.0, 4200.0, 950.0],
      landingZoneId: landingZoneId || null
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to process Mars survival day", details: err.message });
  }
});

// 5. Save & Load Cadet Mission Progress (Levels 1-3 + Checkpoints)
app.get("/api/progress/:username", async (req, res) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }
    const progress = await getUserProgress(username);
    res.status(200).json({ ok: true, username, progress });
  } catch (err) {
    res.status(500).json({ error: "Failed to load progress", details: err.message });
  }
});

app.post("/api/progress", async (req, res) => {
  try {
    const { username, progress } = req.body || {};
    if (!username || !progress) {
      return res.status(400).json({ error: "username and progress are required" });
    }
    const saved = await saveUserProgress(String(username).trim(), progress);
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save progress", details: err.message });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`AstroTrainee server running on port ${PORT}`);
  });
}

module.exports = app;