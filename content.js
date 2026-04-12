/**
 * content.js - Injected into gemini.google.com
 */

console.log("Shift Extension: Eco-friendly LLM monitoring active.");

const ECOLOGITS_API_ENDPOINT = "https://api.ecologits.ai/v1beta/estimations";

let lastCachedAnswer = null;

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
      <span>💡 Similar question found!</span>
      <button id="shift-use-cache" class="shift-btn-small">View Cached Answer</button>
    </div>
  `;

  // Prepend to parent to show above input
  inputParent.insertBefore(monitor, inputParent.firstChild);

  document.getElementById('shift-use-cache').addEventListener('click', () => {
    if (lastCachedAnswer) {
      showCachePopup(lastCachedAnswer);
    }
  });
}

// Gemini-style cached answer popup
function showCachePopup(answer) {
  // Remove existing popup if present
  const existing = document.getElementById('shift-cache-popup');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'shift-cache-popup';
  overlay.innerHTML = `
    <div class="shift-popup-backdrop"></div>
    <div class="shift-popup-panel">
      <div class="shift-popup-header">
        <div class="shift-popup-avatar">
          <svg viewBox="0 0 32 32" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="shift-gem-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#4285f4"/>
                <stop offset="50%" stop-color="#669df6"/>
                <stop offset="100%" stop-color="#aecbfa"/>
              </linearGradient>
            </defs>
            <path d="M16 2 L4 16 L16 30 L28 16 Z" fill="url(#shift-gem-grad)" opacity="0.9"/>
            <path d="M16 6 L8 16 L16 26 L24 16 Z" fill="white" opacity="0.25"/>
          </svg>
        </div>
        <div class="shift-popup-title-group">
          <span class="shift-popup-title">Cached Answer</span>
          <span class="shift-popup-badge">
            <span class="shift-popup-badge-dot"></span>
            Saved ${formatEnergySaved()} energy
          </span>
        </div>
        <button class="shift-popup-close" id="shift-popup-close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="shift-popup-body">
        <div class="shift-popup-message">${formatCachedAnswer(answer)}</div>
      </div>
      <div class="shift-popup-footer">
        <div class="shift-popup-footer-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M8 12l3 3 5-5"/>
          </svg>
          <span>Retrieved from Shift semantic cache</span>
        </div>
        <button class="shift-popup-copy" id="shift-popup-copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Trigger entrance animation on next frame
  requestAnimationFrame(() => {
    overlay.classList.add('shift-popup-visible');
  });

  // Close handlers
  const closePopup = () => {
    overlay.classList.remove('shift-popup-visible');
    overlay.classList.add('shift-popup-closing');
    setTimeout(() => overlay.remove(), 200);
  };

  document.getElementById('shift-popup-close').addEventListener('click', closePopup);
  overlay.querySelector('.shift-popup-backdrop').addEventListener('click', closePopup);

  // Copy button
  document.getElementById('shift-popup-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(answer).then(() => {
      const btn = document.getElementById('shift-popup-copy');
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Copied!
      `;
      btn.classList.add('shift-popup-copied');
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy
        `;
        btn.classList.remove('shift-popup-copied');
      }, 2000);
    });
  });

  // Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
}

function formatCachedAnswer(text) {
  // Convert markdown-ish text to light HTML
  return text
    .split('\n')
    .map(line => {
      if (!line.trim()) return '';
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
      return `<p>${line}</p>`;
    })
    .join('');
}

function formatEnergySaved() {
  const impactEl = document.getElementById('shift-live-impact');
  if (impactEl) {
    const text = impactEl.innerText.replace('⚡', '').trim();
    if (text && text !== '0.000 Wh') return text;
  }
  return 'some';
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
          lastCachedAnswer = response.cachedAnswer;
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

// Try multiple selector strategies for Gemini's evolving DOM
function findConversationTurns() {
  // Strategy 1: Modern Gemini uses turn-based containers
  const turnContainers = document.querySelectorAll(
    '[data-turn-id], .conversation-container, .chat-turn, [class*="turn-container"]'
  );
  if (turnContainers.length > 0) return turnContainers;

  // Strategy 2: Look for message-pair structures
  const messagePairs = document.querySelectorAll(
    '[class*="conversation"], [class*="message-pair"], [class*="chat-message"]'
  );
  if (messagePairs.length > 0) return messagePairs;

  return [];
}

function extractPromptText(container) {
  // Try most specific selectors first, based on actual Gemini DOM
  const selectors = [
    '.query-text .query-text-line',   // exact: paragraph inside query-text
    '.query-text',                     // broader: the whole query-text div
    'user-query-content .query-text',
    '[data-message-author-role="user"]',
  ];
  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el && el.innerText.trim()) {
      return el.innerText
        .replace(/^You said\s*/i, '')
        .trim();
    }
  }
  return null;
}

function extractResponseText(container) {
  // Most specific first, based on actual Gemini DOM structure
  const selectors = [
    'message-content .markdown',                   // exact current Gemini structure
    '.model-response-text message-content .markdown',
    'structured-content-container .markdown',
    '.markdown.markdown-main-panel',               // class combo unique to response
    '.response-container-content .markdown',
  ];
  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el && el.innerText.trim()) {
      const text = el.innerText.trim();
      // Guard: skip screen-reader labels that leak into selection
      if (/^(Gemini said|You said)$/i.test(text)) continue;
      if (text.length < 5) continue; // skip trivially short matches
      return text;
    }
  }

  // Fallback: grab .markdown but strip any leading "Gemini said" line
  const fallback = container.querySelector('.markdown');
  if (fallback && fallback.innerText.trim()) {
    const text = fallback.innerText.trim()
      .replace(/^Gemini said\s*/i, '')
      .trim();
    if (text.length >= 5) return text;
  }

  return null;
}

function isResponseComplete(container) {
  // Strategy 1 (primary): Footer with complete class — confirmed in Gemini DOM
  const footer = container.querySelector('.response-footer');
  if (footer && footer.classList.contains('complete')) return true;

  // Strategy 2: Action buttons visible (copy, thumbs up/down)
  // Only trust this if we ALSO have actual response text
  const actionButtons = container.querySelectorAll(
    'button[aria-label*="Copy"], button[aria-label="Good response"], button[aria-label="Bad response"]'
  );
  if (actionButtons.length >= 2) {
    const hasRealResponse = extractResponseText(container);
    if (hasRealResponse) return true;
  }

  return false;
}

// Capture the full conversation pairs (Prompt + Response)
function captureChatPairs() {
  const turns = findConversationTurns();

  turns.forEach(container => {
    // Build a stable ID from the container
    const id = container.id
      || container.getAttribute('data-turn-id')
      || container.getAttribute('data-content-id')
      || `shift-gen-${Array.from(turns).indexOf(container)}`;

    if (processedMessageIds.has(id)) return;

    if (!isResponseComplete(container)) return;

    const promptText = extractPromptText(container);
    const responseText = extractResponseText(container);

    if (!promptText || !responseText) {
      console.log("⚠️ Shift: Turn found but couldn't extract prompt/response.", {
        id, hasPrompt: !!promptText, hasResponse: !!responseText
      });
      return;
    }

    const inputTokens = estimateTokens(promptText);
    const outputTokens = estimateTokens(responseText);
    const modelLabel = detectGeminiModel();
    const ecoModel = MODEL_MAPPING[modelLabel] || "gemini-3-flash-preview";

    console.log("🚀 Shift: Finalizing Capture", {
      id, inputTokens, outputTokens, model: modelLabel,
      promptPreview: promptText.substring(0, 80)
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

        // SAVE TO CACHE if it wasn't already a cache hit
        if (!response.isCached) {
          console.log("💾 Shift: Saving new conversation to Upstash Vector", {
            promptPreview: promptText.substring(0, 60),
            responsePreview: responseText.substring(0, 60)
          });
          chrome.runtime.sendMessage({
            type: "SAVE_TO_CACHE",
            payload: { prompt: promptText, response: responseText }
          });
        } else {
          console.log("✅ Shift: Cache hit — skipping save.");
        }
      }
    });
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