/**
 * content.js - Injected into gemini.google.com
 */

console.log("Shift Extension: Eco-friendly LLM monitoring active.");

const ECOLOGITS_API_ENDPOINT = "https://api.ecologits.ai/v1beta/estimations";

const IMAGE_MAX_DIMENSION = 1024;
const IMAGE_QUALITY = 0.75;

let lastCachedAnswer = null;

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > IMAGE_MAX_DIMENSION) {
            height *= IMAGE_MAX_DIMENSION / width;
            width = IMAGE_MAX_DIMENSION;
          }
        } else {
          if (height > IMAGE_MAX_DIMENSION) {
            width *= IMAGE_MAX_DIMENSION / height;
            height = IMAGE_MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, "image/jpeg", IMAGE_QUALITY);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function detectImageGeneration(text) {
  if (!text) return false;
  
  // More robust detection using regex to handle typos like "generat"
  const actionRegex = /(generat|creat|make|draw|paint|render|visualiz|illustrat)/i;
  const imageRegex = /(image|picture|photo|portrait|landscape|illustration|drawing|painting|sketch|graphic)/i;
  
  const hasAction = actionRegex.test(text);
  const hasImage = imageRegex.test(text);
  
  return hasAction && hasImage;
}

function showImageDeflection(prompt) {
  const container = document.getElementById('shift-deflection-status');
  if (!container) return;

  // More aggressive cleanup for better search subjects
  let searchQuery = prompt
    .replace(/(could you|can you|please|i want to|i want you to|hey gemini|ok gemini)\s+/gi, "")
    .replace(/(generat|creat|make|draw|paint|render|visualiz|illustrat)[a-z]*\s+/gi, "")
    .replace(/(an|a|the)\s+/gi, "")
    .replace(/(image|picture|photo|portrait|landscape|illustration|drawing|painting|sketch|graphic)[a-z]*\s+(of|odf)\s+/gi, "")
    .replace(/(image|picture|photo|portrait|landscape|illustration|drawing|painting|sketch|graphic)[a-z]*/gi, "")
    // Remove common trailing filler
    .replace(/\s+(for me|please|now|fast|today|instantly|thank you|thanks|right away)$/gi, "")
    .replace(/[.!?]+$/, "")
    .trim();

  // Fallback to original prompt if cleanup was too aggressive or result is empty
  if (!searchQuery) searchQuery = prompt;

  container.style.display = 'block';
  container.innerHTML = `
    <div class="shift-deflection-banner" id="shift-deflection-banner">
      <div class="shift-deflection-header">
        <div class="shift-deflection-title">
          <span>🎨</span>
          <span>Image request detected</span>
        </div>
        <div class="shift-deflection-dismiss" id="shift-deflection-dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </div>
      </div>
      <p class="shift-deflection-text">AI image generation is carbon-intensive. Consider a sustainable web search instead?</p>
      <div class="shift-deflection-impact">
        🌿 0g CO₂ (Search) vs ~5-10g CO₂ (AI)
      </div>
      <div class="shift-deflection-actions">
        <button class="shift-deflection-btn shift-btn-primary" id="shift-search-google">
          <span>🔍</span> Google Images
        </button>
        <button class="shift-deflection-btn shift-btn-outline" id="shift-search-unsplash">
          <span>📸</span> Unsplash
        </button>
      </div>
    </div>
  `;

  document.getElementById('shift-deflection-dismiss').onclick = () => {
    container.style.display = 'none';
  };

  document.getElementById('shift-search-google').onclick = () => {
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  document.getElementById('shift-search-unsplash').onclick = () => {
    window.open(`https://unsplash.com/s/photos/${encodeURIComponent(searchQuery)}`, '_blank');
  };
}

// Map Gemini UI labels to EcoLogits model names
const MODEL_MAPPING = {
  "Fast": "gemini-3-flash-preview",
  "Thinking": "gemini-3-flash-preview",
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
  return "Fast";
}

function estimateTokens(text) {
  if (!text) return 0;
  const cleaned = text.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (cleaned.length === 0) return 0;
  return Math.ceil(cleaned.length / 4);
}

function formatRangeDisplay(metric, type) {
  if (!metric || !metric.value) return "0.000";
  
  let min = metric.value.min;
  let max = metric.value.max;
  let unit = metric.unit;

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

function generateGridForecast() {
  const now = new Date();
  const forecast = [];

  for (let i = -12; i < 12; i++) {
    const dt = new Date(now);
    dt.setHours(now.getHours() + i, 0, 0, 0);
    const hour = dt.getHours();

    let intensity;
    if (hour >= 10 && hour <= 15) {
      intensity = 130 + Math.sin((hour - 10) * Math.PI / 5) * 40;
    } else if (hour >= 6 && hour < 10) {
      intensity = 250 - (hour - 6) * 25;
    } else if (hour > 15 && hour < 17) {
      intensity = 180 + (hour - 15) * 50;
    } else if (hour >= 17 && hour <= 21) {
      intensity = 340 + Math.sin((hour - 17) * Math.PI / 4) * 80;
    } else if (hour > 21) {
      intensity = 320 - (hour - 21) * 25;
    } else {
      intensity = 240 - hour * 5;
    }

    intensity += ((hour * 7 + dt.getDate() * 3) % 20) - 10;

    forecast.push({
      hour: hour,
      intensity: Math.round(Math.max(80, Math.min(450, intensity))),
      isCurrent: i === 0
    });
  }
  return forecast;
}

function getIntensityLevel(intensity) {
  if (intensity < 200) return 'low';
  if (intensity < 340) return 'moderate';
  return 'high';
}

function getGridStatusText(level) {
  switch (level) {
    case 'low':      return { label: 'Off-peak', detail: 'Low grid carbon — good time to prompt' };
    case 'moderate': return { label: 'Moderate', detail: 'Average grid demand' };
    case 'high':     return { label: 'Peak hours', detail: 'High grid carbon — consider deferring' };
    default:         return { label: 'Unknown', detail: '' };
  }
}

function formatHour12(h) {
  if (h === 0 || h === 24) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function buildGridChartHTML() {
  const forecast = generateGridForecast();
  const currentEntry = forecast.find(f => f.isCurrent) || forecast[12];
  const currentLevel = getIntensityLevel(currentEntry.intensity);
  const status = getGridStatusText(currentLevel);
  const maxIntensity = Math.max(...forecast.map(f => f.intensity));

  const bars = forecast.map(f => {
    const level = getIntensityLevel(f.intensity);
    const height = Math.max(2, Math.round((f.intensity / maxIntensity) * 22));
    const nowClass = f.isCurrent ? ' shift-bar-now' : '';
    const futureClass = (!f.isCurrent && forecast.indexOf(f) > forecast.findIndex(x => x.isCurrent)) ? ' shift-bar-future' : '';
    const tooltip = `<span class="shift-grid-tooltip">${formatHour12(f.hour)} · ${f.intensity} gCO₂</span>`;
    return `<div class="shift-grid-bar shift-grid-tooltip-container shift-bar-${level}${nowClass}${futureClass}" style="height:${height}px">${tooltip}</div>`;
  }).join('');

  return {
    chart: `<div class="shift-grid-chart">${bars}</div>`,
    status: `
      <div class="shift-grid-status">
        <span class="shift-grid-dot shift-dot-${currentLevel}"></span>
        <span class="shift-grid-label">
          <strong>${status.label}</strong>
          <span class="shift-grid-sublabel"> · US grid</span>
        </span>
      </div>
    `,
    detail: status.detail,
    level: currentLevel
  };
}

function injectLiveMonitor(inputParent) {
  if (document.getElementById('shift-live-monitor')) return;

  const grid = buildGridChartHTML();

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
    <div id="shift-compression-status" style="display:none;"></div>
    <div id="shift-deflection-status" style="display:none;"></div>
    <div class="shift-grid-row" id="shift-grid-row" title="${grid.detail}">
      ${grid.chart}
      ${grid.status}
    </div>
    <div id="shift-cache-suggestion" class="shift-suggestion-box" style="display:none;">
      <span>💡 Similar question found!</span>
      <button id="shift-use-cache" class="shift-btn-small">View Cached Answer</button>
    </div>
  `;

  inputParent.insertBefore(monitor, inputParent.firstChild);

  document.getElementById('shift-use-cache').addEventListener('click', () => {
    if (lastCachedAnswer) {
      showCachePopup(lastCachedAnswer);
    }
  });

  setInterval(() => {
    const gridRow = document.getElementById('shift-grid-row');
    if (gridRow) {
      const updated = buildGridChartHTML();
      gridRow.innerHTML = updated.chart + updated.status;
      gridRow.title = updated.detail;
    }
  }, 60000);
}

function showCachePopup(answer) {
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

  requestAnimationFrame(() => {
    overlay.classList.add('shift-popup-visible');
  });

  const closePopup = () => {
    overlay.classList.remove('shift-popup-visible');
    overlay.classList.add('shift-popup-closing');
    setTimeout(() => overlay.remove(), 200);
  };

  document.getElementById('shift-popup-close').addEventListener('click', closePopup);
  overlay.querySelector('.shift-popup-backdrop').addEventListener('click', closePopup);

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

  const escHandler = (e) => {
    if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
}

function formatCachedAnswer(text) {
  return text
    .split('\n')
    .map(line => {
      if (!line.trim()) return '';
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
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

function showOptimizedNotice(tokensSaved, localWh, cloudWh) {
  const existing = document.getElementById('shift-optimized-notice');
  if (existing) existing.remove();

  const notice = document.createElement('div');
  notice.id = 'shift-optimized-notice';
  notice.style.cssText = `
    font-size: 11px;
    color: #2e7d32;
    padding: 3px 8px;
    background: #f0f9f0;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    opacity: 1;
    transition: opacity 0.5s ease;
  `;
  notice.innerHTML = `
    ✨ Optimized −${tokensSaved} tokens · 
    <span style="color:#888; font-size:10px;">
      ${(localWh * 1000).toFixed(1)}mWh used · 
      ~${(cloudWh * 1000).toFixed(2)}mWh saved
    </span>
  `;

  const metricsBar = document.querySelector('.shift-live-metrics');
  if (metricsBar) metricsBar.appendChild(notice);

  setTimeout(() => {
    notice.style.opacity = '0';
    setTimeout(() => notice.remove(), 500);
  }, 3000);
}

function updateLiveStats(text) {
  const modelLabel = detectGeminiModel();
  const tokens = estimateTokens(text);
  
  const tokenDisplay = document.getElementById('shift-live-tokens');
  const impactDisplay = document.getElementById('shift-live-impact');
  
  if (tokens === 0) {
    clearTimeout(liveUpdateTimeout);
    tokenDisplay.innerText = `0 tokens (${modelLabel})`;
    impactDisplay.innerText = "⚡ 0.000 Wh";
    document.getElementById('shift-live-searching').style.display = 'none';
    document.getElementById('shift-cache-suggestion').style.display = 'none';
    const deflectionStatus = document.getElementById('shift-deflection-status');
    if (deflectionStatus) deflectionStatus.style.display = 'none';
    return;
  }

  // Image generation deflection check
  if (detectImageGeneration(text)) {
    showImageDeflection(text);
  } else {
    const deflectionStatus = document.getElementById('shift-deflection-status');
    if (deflectionStatus) deflectionStatus.style.display = 'none';
  }

  tokenDisplay.innerText = `${tokens} tokens (${modelLabel})`;
  document.getElementById('shift-live-searching').style.display = 'inline-block';
  debounceLiveAPIUpdate(text, modelLabel);
}

let liveUpdateTimeout;
function debounceLiveAPIUpdate(text, modelLabel) {
  clearTimeout(liveUpdateTimeout);
  
  liveUpdateTimeout = setTimeout(() => {
    const ecoModel = MODEL_MAPPING[modelLabel] || "gemini-3-flash-preview";

    // Auto-compress if prompt is long enough
    if (text.split(/\s+/).length > 10) {
      chrome.runtime.sendMessage({
        type: "COMPRESS_PROMPT",
        payload: { prompt: text }
      }, (response) => {
        if (response?.success && response.tokensSaved > 3 && response.cloudWhSaved > response.localWhUsed) {
          const inputArea = document.querySelector('div[contenteditable="true"]');
          if (!inputArea) return;

          inputArea.focus();
          document.execCommand('selectAll');
          document.execCommand('insertText', false, response.compressed);

          showOptimizedNotice(response.tokensSaved, response.localWhUsed, response.cloudWhSaved);
          updateLiveStats(response.compressed);
        }
      });
    }

    // Fetch impact metrics
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

function findConversationTurns() {
  const turnContainers = document.querySelectorAll(
    '[data-turn-id], .conversation-container, .chat-turn, [class*="turn-container"]'
  );
  if (turnContainers.length > 0) return turnContainers;

  const messagePairs = document.querySelectorAll(
    '[class*="conversation"], [class*="message-pair"], [class*="chat-message"]'
  );
  if (messagePairs.length > 0) return messagePairs;

  return [];
}

function extractPromptText(container) {
  const selectors = [
    '.query-text .query-text-line',
    '.query-text',
    'user-query-content .query-text',
    '[data-message-author-role="user"]',
  ];
  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el && el.innerText.trim()) {
      return el.innerText.replace(/^You said\s*/i, '').trim();
    }
  }
  return null;
}

function extractResponseText(container) {
  const selectors = [
    'message-content .markdown',
    '.model-response-text message-content .markdown',
    'structured-content-container .markdown',
    '.markdown.markdown-main-panel',
    '.response-container-content .markdown',
  ];
  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el && el.innerText.trim()) {
      const text = el.innerText.trim();
      if (/^(Gemini said|You said)$/i.test(text)) continue;
      if (text.length < 5) continue;
      return text;
    }
  }

  const fallback = container.querySelector('.markdown');
  if (fallback && fallback.innerText.trim()) {
    const text = fallback.innerText.trim().replace(/^Gemini said\s*/i, '').trim();
    if (text.length >= 5) return text;
  }

  return null;
}

function isResponseComplete(container) {
  const footer = container.querySelector('.response-footer');
  if (footer && footer.classList.contains('complete')) return true;

  const actionButtons = container.querySelectorAll(
    'button[aria-label*="Copy"], button[aria-label="Good response"], button[aria-label="Bad response"]'
  );
  if (actionButtons.length >= 2) {
    const hasRealResponse = extractResponseText(container);
    if (hasRealResponse) return true;
  }

  return false;
}

function captureChatPairs() {
  const turns = findConversationTurns();

  turns.forEach(container => {
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

async function handleFileUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const originalFile = files[0];
  if (!originalFile.type.startsWith('image/')) return;
  
  // Skip if already compressed by us
  if (e.target.dataset.shiftProcessing === 'true') return;

  console.log("📸 Shift: Intercepted image upload", originalFile.name, (originalFile.size / 1024 / 1024).toFixed(2), "MB");

  const statusContainer = document.getElementById('shift-compression-status');
  if (statusContainer) {
    statusContainer.style.display = 'block';
    statusContainer.innerHTML = `
      <div class="shift-compression-notice">
        <span class="shift-compression-icon">⏳</span>
        <span>Optimizing image for sustainability...</span>
      </div>
    `;
  }

  const compressedFile = await compressImage(originalFile);
  
  const originalSizeMB = originalFile.size / 1024 / 1024;
  const compressedSizeMB = compressedFile.size / 1024 / 1024;
  const reduction = ((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(0);
  
  // Estimated tokens for image (Gemini uses ~258-768 tokens depending on size)
  const estTokensSaved = originalSizeMB > 0.5 ? Math.round(500 * (1 - compressedSizeMB / originalSizeMB)) : 0;

  if (statusContainer) {
    statusContainer.innerHTML = `
      <div class="shift-compression-notice">
        <span class="shift-compression-icon">✨</span>
        <span>Compressed: ${originalSizeMB.toFixed(1)}MB → ${compressedSizeMB.toFixed(1)}MB (−${reduction}%) · ~${estTokensSaved} tokens saved</span>
      </div>
    `;
    setTimeout(() => {
      statusContainer.style.opacity = '0';
      setTimeout(() => {
        statusContainer.style.display = 'none';
        statusContainer.style.opacity = '1';
      }, 500);
    }, 5000);
  }

  // Replace file in input
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(compressedFile);
  
  e.target.dataset.shiftProcessing = 'true';
  e.target.files = dataTransfer.files;
  
  // Trigger change event again so Gemini sees the new file
  e.target.dispatchEvent(new Event('change', { bubbles: true }));
  
  setTimeout(() => {
    delete e.target.dataset.shiftProcessing;
  }, 100);
}

function observePrompts() {
  const observer = new MutationObserver((mutations) => {
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

    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      if (!input.hasAttribute('data-shift-hooked')) {
        input.setAttribute('data-shift-hooked', 'true');
        input.addEventListener('change', handleFileUpload);
      }
    });

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

  injectMetricsUI();
  document.getElementById('shift-metrics-container').style.display = 'block';
  document.getElementById('shift-cache-status').innerText = `Calculating impact for ${modelLabel}...`;

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
