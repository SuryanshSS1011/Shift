/**
 * content.js - Injected into gemini.google.com
 */

console.log("Shift Extension: Eco-friendly LLM monitoring active.");

const ECOLOGITS_API_ENDPOINT = "https://api.ecologits.ai/v1beta/estimations";

// Map Gemini UI labels to EcoLogits model names
const MODEL_MAPPING = {
  "Fast": "gemini-3-flash-preview",
  "Thinking": "gemini-3-flash-preview", // Placeholder for thinking mode
  "Pro": "gemini-3.1-pro-preview"
};

function detectGeminiModel() {
  const modelButton = Array.from(document.querySelectorAll('button'))
    .find(btn => /Fast|Thinking|Pro/.test(btn.innerText) && btn.offsetParent !== null);
  
  if (modelButton) {
    const text = modelButton.innerText;
    if (text.includes("Fast")) return "Fast";
    if (text.includes("Thinking")) return "Thinking";
    if (text.includes("Pro")) return "Pro";
  }
  return "Fast"; // Default fallback
}

// Helper: Estimate tokens based on characters (Gemini heuristic: ~4 chars per token)
function estimateTokens(text) {
  if (!text) return 0;
  // Strip whitespace and non-printable characters for a cleaner "empty" check
  const cleaned = text.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (cleaned.length === 0) return 0;
  return Math.ceil(cleaned.length / 4);
}

// Helper to format min/max ranges with auto-scaling units
function formatRangeDisplay(metric, type) {
  if (!metric || !metric.value) return "0.000";
  
  let min = metric.value.min;
  let max = metric.value.max;
  let unit = metric.unit;

  // Auto-scaling logic
  if (type === 'energy' && unit === 'kWh' && max < 1) {
    min *= 1000; max *= 1000; unit = 'Wh';
    if (max < 1) { min *= 1000; max *= 1000; unit = 'mWh'; }
  } else if (type === 'gwp' && unit === 'kgCO2eq' && max < 1) {
    min *= 1000; max *= 1000; unit = 'g';
    if (max < 1) { min *= 1000; max *= 1000; unit = 'mg'; }
  } else if (type === 'wcf' && unit === 'L' && max < 1) {
    min *= 1000; max *= 1000; unit = 'mL';
  }

  const formatNum = (num) => num < 0.001 ? num.toExponential(2) : num.toFixed(3);
  return `${formatNum(min)} – ${formatNum(max)} ${unit}`;
}

// Inject the live monitor UI (above the input area)
function injectLiveMonitor(inputParent) {
  if (document.getElementById('shift-live-monitor')) return;

  const monitor = document.createElement('div');
  monitor.id = 'shift-live-monitor';
  monitor.className = 'shift-live-ui';
  monitor.innerHTML = `
    <div class="shift-live-metrics">
      <span class="shift-live-tag">Shift Live</span>
      <span id="shift-live-tokens">0 tokens (Fast)</span>
      <span id="shift-live-impact" style="color: #666;">⚡ 0.000 Wh</span>
      <span id="shift-live-searching" class="shift-live-searching" style="display:none;">Searching cache</span>
    </div>
    <div id="shift-cache-suggestion" class="shift-suggestion-box" style="display:none;">
      💡 Similar question found! 
      <button id="shift-use-cache" class="shift-btn-small">Use Cached Answer</button>
    </div>
  `;

  // Prepend to parent to show above input
  inputParent.insertBefore(monitor, inputParent.firstChild);

  document.getElementById('shift-use-cache').addEventListener('click', () => {
    alert("This would populate the chat with the cached answer!");
  });
}

// Update the live monitor with current stats
function updateLiveStats(text) {
  const modelLabel = detectGeminiModel();
  const tokens = estimateTokens(text);
  
  const tokenDisplay = document.getElementById('shift-live-tokens');
  const impactDisplay = document.getElementById('shift-live-impact');
  
  if (tokens === 0) {
    clearTimeout(liveUpdateTimeout); // Clear any pending updates
    tokenDisplay.innerText = `0 tokens (${modelLabel})`;
    impactDisplay.innerText = "⚡ 0.000 Wh";
    document.getElementById('shift-live-searching').style.display = 'none';
    document.getElementById('shift-cache-suggestion').style.display = 'none';
    return;
  }

  tokenDisplay.innerText = `${tokens} tokens (${modelLabel})`;
  
  // Show searching state
  document.getElementById('shift-live-searching').style.display = 'inline-block';

  // Debounce API check (both impact and cache)
  debounceLiveAPIUpdate(text, modelLabel);
}

let liveUpdateTimeout;
function debounceLiveAPIUpdate(text, modelLabel) {
  clearTimeout(liveUpdateTimeout);
  
  liveUpdateTimeout = setTimeout(() => {
    const ecoModel = MODEL_MAPPING[modelLabel] || "gemini-3-flash-preview";

    chrome.runtime.sendMessage({
      type: "FETCH_IMPACT",
      payload: {
        prompt: text,
        inputTokens: estimateTokens(text),
        provider: "google",
        model: ecoModel
      }
    }, (response) => {
      document.getElementById('shift-live-searching').style.display = 'none';
      
      if (response && response.impacts) {
        const energyStr = formatRangeDisplay(response.impacts.energy, 'energy');
        document.getElementById('shift-live-impact').innerText = `⚡ ${energyStr}`;
        
        // Also update cache suggestion based on this call's isCached
        const suggestion = document.getElementById('shift-cache-suggestion');
        if (response.isCached) {
          suggestion.style.display = 'flex';
        } else {
          suggestion.style.display = 'none';
        }
      }
    });
  }, 600);
}

// Original popup UI (for final submission metrics)
function injectMetricsUI() {
  if (document.getElementById('shift-metrics-container')) return;

  const container = document.createElement('div');
  container.id = 'shift-metrics-container';
  container.innerHTML = `
    <div class="shift-header">
      <span class="shift-title">🌍 Eco Metrics</span>
      <span class="shift-close" id="shift-close-btn">×</span>
    </div>
    <div class="shift-content">
      <div class="shift-metric">
        <span class="label">Tokens:</span>
        <span id="shift-token-count" class="value">0</span>
      </div>
      <div class="shift-metric">
        <span class="label">⚡ Energy:</span>
        <span id="shift-energy-usage" class="value">0.000 kWh</span>
      </div>
      <div class="shift-metric">
        <span class="label">☁️ CO2:</span>
        <span id="shift-ghg-emissions" class="value">0.000 kgCO2</span>
      </div>
      <div class="shift-metric">
        <span class="label">💧 Water:</span>
        <span id="shift-water-usage" class="value">0.000 L</span>
      </div>
      <div class="shift-metric">
        <span class="label">⛏️ Minerals:</span>
        <span id="shift-minerals-depletion" class="value">0.000 kgSb</span>
      </div>
      <div class="shift-status" id="shift-cache-status">
        Checking sustainability...
      </div>
    </div>
  `;
  document.body.appendChild(container);

  document.getElementById('shift-close-btn').addEventListener('click', () => {
    container.style.display = 'none';
  });
}

// Helper to format min/max ranges with auto-scaling units
function getScaleAndUnit(metric, type) {
  if (!metric || !metric.value) return { min: 0, max: 0, unit: "N/A" };
  let min = metric.value.min || 0;
  let max = metric.value.max || 0;
  let unit = metric.unit || "";

  if (type === 'energy' && unit === 'kWh' && max < 1) {
    min *= 1000; max *= 1000; unit = 'Wh';
    if (max < 1) { min *= 1000; max *= 1000; unit = 'mWh'; }
  } else if (type === 'gwp' && unit === 'kgCO2eq' && max < 1) {
    min *= 1000; max *= 1000; unit = 'g';
    if (max < 1) { min *= 1000; max *= 1000; unit = 'mg'; }
  } else if (type === 'wcf' && unit === 'L' && max < 1) {
    min *= 1000; max *= 1000; unit = 'mL';
    if (max < 1) { min *= 1000; max *= 1000; unit = 'µL'; }
  } else if (type === 'adpe' && unit === 'kgSbeq' && max < 1) {
    min *= 1000; max *= 1000; unit = 'g';
    if (max < 1) { min *= 1000; max *= 1000; unit = 'mg'; }
    if (max < 1) { min *= 1000; max *= 1000; unit = 'µg'; }
    if (max < 0.1) { min *= 1000; max *= 1000; unit = 'ng'; }
  }
  return { min, max, unit };
}

function applyMetricValue(id, metric, type) {
  const target = document.getElementById(id);
  if (!target) return;

  const { min, max, unit } = getScaleAndUnit(metric, type);
  
  const formatter = (val) => {
    if (val === 0) return "0.00";
    if (val < 0.0001) return val.toExponential(2);
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };
  
  target.innerText = `${formatter(min)} – ${formatter(max)} ${unit}`;
}

// Update the UI with fetched data
function updateMetricsUI(data) {
  console.log("📊 Shift: received metrics update", data);

  if (data.error) {
    console.error("❌ Shift: Estimation Error", data.error);
    const status = document.getElementById('shift-cache-status');
    if (status) status.innerText = `⚠️ Error: ${data.error.substring(0, 50)}`;
    return;
  }

  injectMetricsUI();
  const container = document.getElementById('shift-metrics-container');
  if (container) container.style.display = 'block';

  const totalTokens = (data.tokens || 0) + (data.outputTokens || 0);
  const tokenLabel = data.isFinal ? `${totalTokens} (final)` : `${data.tokens || 0} (est.)`;
  const tokenElem = document.getElementById('shift-token-count');
  if (tokenElem) tokenElem.innerText = tokenLabel;
  
  const impacts = data.impacts || {};
  
  applyMetricValue('shift-energy-usage', impacts.energy, 'energy');
  applyMetricValue('shift-ghg-emissions', impacts.gwp, 'gwp');
  applyMetricValue('shift-water-usage', impacts.wcf, 'wcf');
  applyMetricValue('shift-minerals-depletion', impacts.adpe, 'adpe');
  
  const cacheStatus = document.getElementById('shift-cache-status');
  if (cacheStatus) {
    if (data.isCached) {
      cacheStatus.innerText = "🔍 Similar question found in cache! Saving energy...";
      cacheStatus.classList.add('shift-cache-hit');
    } else {
      cacheStatus.innerText = "🌱 New query tracked via EcoLogits.";
      cacheStatus.classList.remove('shift-cache-hit');
    }
  }
}

const processedMessageIds = new Set();

// Capture the full conversation pairs (Prompt + Response)
function captureChatPairs() {
  const containers = document.querySelectorAll('.conversation-container');
  containers.forEach(container => {
    const id = container.id;
    if (!id || processedMessageIds.has(id)) return;

    // Check if the response is complete
    const responseFooter = container.querySelector('.response-footer');
    if (responseFooter && responseFooter.classList.contains('complete')) {
      const promptElem = container.querySelector('.query-text');
      const responseElem = container.querySelector('.markdown');

      if (promptElem && responseElem) {
        const promptText = promptElem.innerText.replace("You said", "").trim();
        const responseText = responseElem.innerText.trim();
        
        const inputTokens = estimateTokens(promptText);
        const outputTokens = estimateTokens(responseText);
        const modelLabel = detectGeminiModel();
        const ecoModel = MODEL_MAPPING[modelLabel] || "gemini-3-flash-preview";

        console.log("🚀 Shift: Finalizing Capture", { 
          id: id,
          inputTokens,
          outputTokens,
          model: modelLabel
        });

        processedMessageIds.add(id);
        
        // Fetch FINAL impact with real output tokens
        chrome.runtime.sendMessage({
          type: "FETCH_IMPACT",
          payload: {
            prompt: promptText,
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            provider: "google",
            model: ecoModel
          }
        }, (response) => {
          if (response) {
            updateMetricsUI({ ...response, isFinal: true });
          }
        });
      }
    }
  });
}

// Listen for prompt submission
function observePrompts() {
  const observer = new MutationObserver((mutations) => {
    // 1. Handle Submit Hooking
    const sendButton = document.querySelector('button[aria-label*="Send"]');
    if (sendButton && !sendButton.hasAttribute('data-shift-hooked')) {
      sendButton.setAttribute('data-shift-hooked', 'true');
      sendButton.addEventListener('click', handlePromptSubmission);
    }

    const inputArea = document.querySelector('div[contenteditable="true"]');
    if (inputArea && !inputArea.hasAttribute('data-shift-hooked')) {
      inputArea.setAttribute('data-shift-hooked', 'true');

      if (inputArea.parentElement) {
        injectLiveMonitor(inputArea.parentElement);
      }

      inputArea.addEventListener('input', (e) => {
        updateLiveStats(inputArea.innerText);
      });

      inputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          handlePromptSubmission();
        }
      });
    }

    // 2. Handle Chat History Capture
    captureChatPairs();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function handlePromptSubmission() {
  const inputArea = document.querySelector('div[contenteditable="true"]');
  const prompt = inputArea ? inputArea.innerText.trim() : "";

  if (!prompt) return;

  const modelLabel = detectGeminiModel();
  const ecoModel = MODEL_MAPPING[modelLabel] || "gemini-3-flash-preview";
  const inputTokens = estimateTokens(prompt);

  // Show loading state
  injectMetricsUI();
  document.getElementById('shift-metrics-container').style.display = 'block';
  document.getElementById('shift-cache-status').innerText = `Calculating impact for ${modelLabel}...`;

  // Send message to background to fetch EcoLogits data
  chrome.runtime.sendMessage({
    type: "FETCH_IMPACT",
    payload: {
      prompt: prompt,
      inputTokens: inputTokens,
      provider: "google",
      model: ecoModel
    }
  }, (response) => {
    if (response) {
      updateMetricsUI(response);
    }
  });
}


// Initial call
injectMetricsUI();
observePrompts();
