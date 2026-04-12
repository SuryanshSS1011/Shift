/**
 * background.js - Background Service Worker
 *
 * Configuration is loaded from chrome.storage.sync
 * Set your Upstash Vector credentials via the extension popup
 */

const ECOLOGITS_API_URL = "https://api.ecologits.ai/v1beta/estimations";

// Config loaded from chrome.storage.sync (no hardcoded credentials)
let config = {
  UPSTASH_VECTOR_URL: "",
  UPSTASH_VECTOR_TOKEN: "",
  SHIFT_API_URL: "https://useshift.vercel.app" // Default to production
};

// Average environmental impact per LLM query (from EcoLogits data)
const AVG_IMPACT_PER_QUERY = {
  energyWh: 0.5,
  co2Grams: 0.3,
  waterMl: 1.5
};

// Load config on startup
chrome.storage.sync.get(["UPSTASH_VECTOR_URL", "UPSTASH_VECTOR_TOKEN", "SHIFT_API_URL"], (result) => {
  if (result.UPSTASH_VECTOR_URL) config.UPSTASH_VECTOR_URL = result.UPSTASH_VECTOR_URL;
  if (result.UPSTASH_VECTOR_TOKEN) config.UPSTASH_VECTOR_TOKEN = result.UPSTASH_VECTOR_TOKEN;
  if (result.SHIFT_API_URL) config.SHIFT_API_URL = result.SHIFT_API_URL;
  console.log("🔧 Shift: Config loaded", config.UPSTASH_VECTOR_URL ? "✓" : "⚠️ Missing URL");
});

// Listen for config updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    if (changes.UPSTASH_VECTOR_URL) config.UPSTASH_VECTOR_URL = changes.UPSTASH_VECTOR_URL.newValue;
    if (changes.UPSTASH_VECTOR_TOKEN) config.UPSTASH_VECTOR_TOKEN = changes.UPSTASH_VECTOR_TOKEN.newValue;
    if (changes.SHIFT_API_URL) config.SHIFT_API_URL = changes.SHIFT_API_URL.newValue;
    console.log("🔧 Shift: Config updated");
  }
});

// Track events to the Shift web app
async function trackEvent(event, impacts = null) {
  try {
    const body = { event };
    if (impacts) {
      body.energyWh = impacts.energyWh || AVG_IMPACT_PER_QUERY.energyWh;
      body.co2Grams = impacts.co2Grams || AVG_IMPACT_PER_QUERY.co2Grams;
      body.waterMl = impacts.waterMl || AVG_IMPACT_PER_QUERY.waterMl;
    }

    await fetch(`${config.SHIFT_API_URL}/api/eco-llm-track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    console.log(`📊 Shift: Tracked ${event}`);
  } catch (err) {
    // Silent fail - tracking is non-critical
    console.warn("⚠️ Shift: Failed to track event", err.message);
  }
}

// Helper to check if config is valid
function isConfigured() {
  return config.UPSTASH_VECTOR_URL && config.UPSTASH_VECTOR_TOKEN;
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_CACHE") {
    checkVectorDB(request.payload.prompt)
      .then(cachedAnswer => {
        sendResponse({ isCached: !!cachedAnswer, cachedAnswer: cachedAnswer });
      })
      .catch(() => sendResponse({ isCached: false }));
    return true;
  }

  if (request.type === "SAVE_TO_CACHE") {
    saveToVectorDB(request.payload.prompt, request.payload.response)
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  if (request.type === "FETCH_IMPACT") {
    const { prompt, inputTokens, outputTokens, provider, model } = request.payload;

    // First check cache, then fetch impact
    checkVectorDB(prompt)
      .then(cachedAnswer => {
        const isCached = !!cachedAnswer;
        return fetchImpactMetrics(provider, model, inputTokens, outputTokens)
          .then(impactData => {
            sendResponse({
              tokens: inputTokens,
              outputTokens: outputTokens,
              impacts: impactData.impacts,
              isCached: isCached,
              cachedAnswer: cachedAnswer
            });
          });
      })
      .catch(error => {
        console.error("Error in FETCH_IMPACT flow:", error);
        sendResponse({ tokens: inputTokens, impacts: null, isCached: false, error: "Flow failed" });
      });

    return true;
  }
});

// Semantic Cache via Upstash Vector
async function checkVectorDB(prompt) {
  if (!isConfigured()) {
    console.warn("⚠️ Shift: Upstash not configured - skipping cache check");
    return null;
  }
  try {
    const response = await fetch(`${config.UPSTASH_VECTOR_URL}/query-data`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.UPSTASH_VECTOR_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: prompt,
        topK: 1,
        includeMetadata: true
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("❌ Shift: Upstash query-data failed", response.status, errBody);
      return null;
    }
    const result = await response.json();
    console.log("🔍 Shift: Upstash query-data result", JSON.stringify(result).substring(0, 300));
    
    // Semantic threshold (0.9 as defined in api.md)
    if (result.result && result.result.length > 0 && result.result[0].score > 0.9) {
      console.log("✅ Shift: Cache HIT (score:", result.result[0].score, ")");
      // Track cache hit with environmental savings
      trackEvent('cache_hit', AVG_IMPACT_PER_QUERY);
      return result.result[0].metadata?.value || null;
    }
    console.log("⬜ Shift: Cache MISS",
      result.result?.[0]?.score ? `(best score: ${result.result[0].score})` : "(no results)");
    // Track cache miss
    trackEvent('cache_miss');
    return null;
  } catch (err) {
    console.error("Upstash Check Error:", err);
    return null;
  }
}

async function saveToVectorDB(prompt, answer) {
  if (!isConfigured()) {
    console.warn("⚠️ Shift: Upstash not configured - skipping cache save");
    return;
  }
  try {
    const response = await fetch(`${config.UPSTASH_VECTOR_URL}/upsert-data`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.UPSTASH_VECTOR_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: btoa(prompt.substring(0, 50) + Date.now()), // Unique ID
        data: prompt,
        metadata: { value: answer }
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("❌ Shift: Upstash upsert-data failed", response.status, errBody);
      return;
    }
    const result = await response.json();
    console.log("💾 Shift: Upstash upsert-data success", result);
    // Track prompt saved
    trackEvent('prompt_saved');
  } catch (err) {
    console.error("Upstash Save Error:", err);
  }
}

// Fetch environmental impacts from EcoLogits.ai /estimations
async function fetchImpactMetrics(provider, model, inputTokens, outputTokens) {
  try {
    const body = {
      provider: provider === "google" ? "google_genai" : provider,
      model_name: model,
      output_token_count: outputTokens || Math.ceil(inputTokens * 0.5),
      request_latency: 1.5,
      electricity_mix_zone: "WOR"
    };

    const response = await fetch(ECOLOGITS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorDetail = await response.json().catch(() => ({}));
      console.error("❌ Shift: EcoLogits API Error", {
        status: response.status,
        detail: errorDetail
      });
      throw new Error(JSON.stringify(errorDetail));
    }

    return await response.json();
  } catch (error) {
    console.warn("⚠️ Shift: API failure, falling back to local calculation.");
    throw error;
  }
}