/**
 * background.js - Background Service Worker
 */

const ECOLOGITS_API_URL = "https://api.ecologits.ai/v1beta/estimations";

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_CACHE") {
    const isCached = checkVectorDB(request.payload.prompt);
    sendResponse({ isCached: isCached });
    return true;
  }

  if (request.type === "FETCH_IMPACT") {
    const { prompt, inputTokens, outputTokens, provider, model } = request.payload;

    // Simulate Vector DB Search (Placeholder)
    const isCached = checkVectorDB(prompt);

    // Call EcoLogits API
    fetchImpactMetrics(provider, model, inputTokens, outputTokens)
      .then(impactData => {
        sendResponse({
          tokens: inputTokens,
          outputTokens: outputTokens,
          impacts: impactData.impacts,
          isCached: isCached
        });
      })
      .catch(error => {
        console.error("Error fetching impacts:", error);
        sendResponse({
          tokens: inputTokens,
          impacts: null,
          isCached: isCached,
          error: "API estimation failed"
        });
      });

    return true; // Keep the message channel open for async response
  }
});

// Simulate checking if a similar prompt exists in a vector database
function checkVectorDB(prompt) {
  // TODO: Implement actual vector DB check later
  return prompt.toLowerCase().includes("hello shift");
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
