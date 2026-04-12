/**
 * background.js - Background Service Worker
 */

const ECOLOGITS_API_URL = "https://api.ecologits.ai/v1beta/estimations";

const UPSTASH_VECTOR_URL = "https://eager-hare-51320-us1-vector.upstash.io";
const UPSTASH_VECTOR_TOKEN = "ABQFMGVhZ2VyLWhhcmUtNTEzMjAtdXMxYWRtaW5ORGxoTWpSbE1HRXRaV1ZpTXkwME5tVTRMV0UzWW1RdE1qbGpZemN3WW1Ka05ESmg=";

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
  try {
    const response = await fetch(`${UPSTASH_VECTOR_URL}/query-data`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${UPSTASH_VECTOR_TOKEN}`,
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
      return result.result[0].metadata?.value || null;
    }
    console.log("⬜ Shift: Cache MISS",
      result.result?.[0]?.score ? `(best score: ${result.result[0].score})` : "(no results)");
    return null;
  } catch (err) {
    console.error("Upstash Check Error:", err);
    return null;
  }
}

async function saveToVectorDB(prompt, answer) {
  try {
    const response = await fetch(`${UPSTASH_VECTOR_URL}/upsert-data`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${UPSTASH_VECTOR_TOKEN}`,
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