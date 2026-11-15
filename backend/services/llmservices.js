const fs = require("fs");
const path = require("path");

const clamp = (val, min, max) => Math.min(Math.max(Number(val) || 0, min), max);

function buildLlmHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "X-Tunnel-Skip-AntiPhishing-Page": "1"
  };
  if (process.env.LLM_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.LLM_API_KEY}`;
  }
  return headers;
}

function parseLevelNumber(stageKey) {
  const match = String(stageKey || "").match(/(\d+)/);
  return match ? Number(match[1]) : 2;
}

function buildTeammateRequest({ stageKey, telemetry = {}, detailedMeters = {}, hazardContext = {}, message = "" }) {
  return {
    level: parseLevelNumber(stageKey),
    telemetry: {
      oxygenLevel: Number(telemetry.oxygenLevel ?? detailedMeters.o2Percent ?? 100),
      suitPower: Number(telemetry.suitPower ?? detailedMeters.powerPercent ?? 100),
      speed: Number(telemetry.speed ?? 100)
    },
    nasaHazard: {
      type: String(hazardContext?.type || hazardContext?.name || (message ? `Cadet Query: ${message}` : "Solar Flare")),
      severity: String(hazardContext?.severity || "Moderate"),
      location: String(hazardContext?.location || stageKey || "Jezero Crater")
    }
  };
}

async function chatWithAria({ message, stageKey = "level2_transit", telemetry = {}, detailedMeters = {} }) {
  const apiUrl = process.env.LLM_API_URL;
  const o2 = telemetry.oxygenLevel ?? detailedMeters.o2Percent ?? 100;
  const power = telemetry.suitPower ?? detailedMeters.powerPercent ?? 100;

  if (apiUrl) {
    try {
      const payload = buildTeammateRequest({ stageKey, telemetry, detailedMeters, message });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: buildLlmHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        const reply =
          data?.ariaDialogue ||
          data?.dialogue ||
          data?.aria_response ||
          data?.prediction ||
          data?.reply ||
          data?.response ||
          data?.message ||
          data?.text ||
          (typeof data === "string" ? data : null);

     if (reply) {
          const isYes = /^yes\b/i.test(String(message).trim());

          // Only include updatedTelemetry & detailedMeters when the user selects "yes"
          if (!isYes) {
            return {
              ariaDialogue: String(reply).trim(),
              source: "LIVE_LLM"
            };
          }

          const m = Array.isArray(data?.allNineMeters) ? data.allNineMeters : [];
          const o2Norm = m[0] !== undefined ? (m[0] <= 1.0 ? m[0] * 100 : m[0]) : (data?.updatedTelemetry?.oxygenLevel ?? o2);

          return {
            ariaDialogue: String(reply).trim(),
            updatedTelemetry: {
              oxygenLevel: clamp(data?.updatedTelemetry?.oxygenLevel ?? o2Norm, 0, 100),
              suitPower: clamp(data?.updatedTelemetry?.suitPower ?? m[3] ?? power, 0, 100),
              speed: clamp(data?.updatedTelemetry?.speed ?? 100, 0, 200)
            },
            detailedMeters: {
              o2Percent: clamp(o2Norm, 0, 100),
              waterPercent: clamp(m[1] ?? detailedMeters.waterPercent ?? 90, 0, 100),
              foodPercent: clamp(m[2] ?? detailedMeters.foodPercent ?? 90, 0, 100),
              powerPercent: clamp(m[3] ?? power, 0, 100),
              shieldPercent: clamp(m[4] ?? detailedMeters.shieldPercent ?? 80, 0, 100),
              suitIntegrityPercent: clamp(m[5] ?? detailedMeters.suitIntegrityPercent ?? 80, 0, 100),
              thermalCelsius: Number(m[6] ?? detailedMeters.thermalCelsius ?? -60.0),
              massKg: Number(m[7] ?? detailedMeters.massKg ?? 4800.0),
              fuelKg: Math.max(0, Number(m[8] ?? detailedMeters.fuelKg ?? 1300.0))
            },
            source: "LIVE_LLM"
          };
        
        }
  
      } else {
        const errText = await response.text();
        console.error(`ARIA LLM HTTP ${response.status}:`, errText);
      }
    } catch (err) {
      console.error("ARIA live LLM request failed, using telemetry fallback:", err.message);
    }
  }

  return {
    ariaDialogue: `ARIA: Copy that, Cadet. On ${stageKey}, O2 is at ${Math.round(o2)}% and suit power is at ${Math.round(power)}%. Keep both above 30% to maintain mission safety margins.`,
    source: "FALLBACK_TELEMETRY"
  };
}

function getFallbackEvent(stageKey) {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "../mockData/marsData.json"), "utf8");
    const mock = JSON.parse(raw);
    return mock[stageKey]?.ariaResponse || mock.level2_transit.ariaResponse;
  } catch (err) {
    return {
      ariaDialogue: "ARIA: Telemetry link nominal. Proceed with mission protocol.",
      updatedTelemetry: { oxygenLevel: 90.0, suitPower: 85.0, speed: 100 },
      detailedMeters: {
        o2Percent: 90.0,
        waterPercent: 92.0,
        foodPercent: 94.0,
        powerPercent: 85.0,
        shieldPercent: 88.0,
        suitIntegrityPercent: 90.0,
        thermalCelsius: -45.0,
        massKg: 4850.0,
        fuelKg: 1350.0
      }
    };
  }
}

async function getAriaEvent(stageKey, hazardContext, currentMeters = []) {
  const llmUrl = process.env.LLM_API_URL;
  if (!llmUrl) {
    return getFallbackEvent(stageKey);
  }

  try {
    const o2Current = currentMeters[1] ?? 90;
    const powerCurrent = currentMeters[4] ?? 85;

    const payload = buildTeammateRequest({
      stageKey,
      telemetry: { oxygenLevel: o2Current, suitPower: powerCurrent, speed: 100 },
      hazardContext
    });

    const response = await fetch(llmUrl, {
      method: "POST",
      headers: buildLlmHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`ARIA HTTP ${response.status}`);
    }

    const data = await response.json();
    const m = Array.isArray(data.allNineMeters) ? data.allNineMeters : [];

    const o2Normalized = m[0] !== undefined
      ? (m[0] <= 1.0 ? m[0] * 100 : m[0])
      : (data.updatedTelemetry?.oxygenLevel ?? o2Current);

    const dialogue =
      data.ariaDialogue ||
      data.dialogue ||
      data.aria_response ||
      data.prediction ||
      data.reply ||
      data.response ||
      "ARIA: Telemetry updated.";

    return {
      ariaDialogue: String(dialogue).trim(),
      updatedTelemetry: {
        oxygenLevel: clamp(data.updatedTelemetry?.oxygenLevel ?? o2Normalized, 0, 100),
        suitPower: clamp(data.updatedTelemetry?.suitPower ?? m[3] ?? powerCurrent, 0, 100),
        speed: clamp(data.updatedTelemetry?.speed ?? 100, 0, 200)
      },
      detailedMeters: {
        o2Percent: clamp(o2Normalized, 0, 100),
        waterPercent: clamp(m[1] ?? currentMeters[2] ?? 90, 0, 100),
        foodPercent: clamp(m[2] ?? currentMeters[3] ?? 90, 0, 100),
        powerPercent: clamp(m[3] ?? powerCurrent, 0, 100),
        shieldPercent: clamp(m[4] ?? currentMeters[5] ?? 80, 0, 100),
        suitIntegrityPercent: clamp(m[5] ?? ((currentMeters[0] ?? 0.9) * 100), 0, 100),
        thermalCelsius: Number(m[6] ?? currentMeters[6] ?? -60.0),
        massKg: Number(m[7] ?? currentMeters[7] ?? 4800.0),
        fuelKg: Math.max(0, Number(m[8] ?? currentMeters[8] ?? 1300.0))
      }
    };
  } catch (err) {
    console.warn("ARIA endpoint offline/timeout, serving fallback:", err.message);
    return getFallbackEvent(stageKey);
  }
}

module.exports = { getAriaEvent, getFallbackEvent, chatWithAria };