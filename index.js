require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { pipeline } = require('@xenova/transformers');
const sustainabilityData = require('./data.json');
const { pingRedis, getGridApiConfigFromRedis } = require('./redis');

const WEEKDAY_FROM_PARTS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getLocalDatePartsInZone(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const byType = {};
    for (const p of parts) {
        if (p.type !== 'literal') byType[p.type] = p.value;
    }
    const dow = WEEKDAY_FROM_PARTS[byType.weekday];
    const hour = parseInt(byType.hour, 10);
    const minute = parseInt(byType.minute, 10);
    return { dow, hour, minute };
}

function isPeakDemandAt(date, timeZone, peakWindows) {
    if (!Array.isArray(peakWindows) || peakWindows.length === 0) return false;
    const { dow, hour, minute } = getLocalDatePartsInZone(date, timeZone);
    const fractionalHour = hour + minute / 60;
    for (const w of peakWindows) {
        if (!Array.isArray(w.days) || w.days.includes(dow) === false) continue;
        const start = Number(w.startHour);
        const end = Number(w.endHour);
        if (Number.isFinite(start) && Number.isFinite(end) && fractionalHour >= start && fractionalHour < end) {
            return true;
        }
    }
    return false;
}

function findNextOffPeakUtc(fromDate, timeZone, peakWindows, stepMinutes = 15, maxSteps = 672) {
    const stepMs = stepMinutes * 60 * 1000;
    let t = new Date(fromDate.getTime());
    for (let i = 0; i < maxSteps; i++) {
        if (!isPeakDemandAt(t, timeZone, peakWindows)) return t;
        t = new Date(t.getTime() + stepMs);
    }
    return fromDate;
}

function formatLocalDateTime(date, timeZone) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone,
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function buildGridSchedulingAdvice({ evaluatedAt, timeZone, regionKey }) {
    const region = sustainabilityData.regions?.[regionKey] || sustainabilityData.regions?.['us-east'];
    const tz = timeZone || region?.defaultTimeZone || 'UTC';
    const peakWindows = region?.grid_peak_windows || [];
    const at = evaluatedAt instanceof Date ? evaluatedAt : new Date(evaluatedAt);
    const peakNow = isPeakDemandAt(at, tz, peakWindows);
    const nextEfficient = peakNow ? findNextOffPeakUtc(at, tz, peakWindows) : at;
    const loadLevel = peakNow ? 'high' : 'low';

    let message;
    if (peakNow) {
        message = `Grid demand is modeled as high for your region right now. For a greener run, batch this prompt until after ${formatLocalDateTime(nextEfficient, tz)} (${tz}).`;
    } else {
        message = `Modeled grid demand is lower now — a reasonable time to run this prompt without deferring.`;
    }

    return {
        evaluatedAtUtc: at.toISOString(),
        timeZone: tz,
        region: regionKey,
        loadLevel,
        isPeakDemand: peakNow,
        recommendedRunAtUtc: nextEfficient.toISOString(),
        recommendedRunAtLocal: formatLocalDateTime(nextEfficient, tz),
        suggestDeferUntilUtc: peakNow ? nextEfficient.toISOString() : null,
        suggestDeferUntilLocal: peakNow ? formatLocalDateTime(nextEfficient, tz) : null,
        message
    };
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🧠 AI MEMORY & CONTEXT
const promptCache = []; // Array to store { embedding, data, signature }
const conversationContexts = new Map();

// 🤖 Load Local AI Model (Small & Green)
let extractor;
async function loadModel() {
    console.log("📦 Loading Local Embedding Model...");
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("✅ AI Model Ready for Semantic Matching!");
}
loadModel();

// 🔍 VECTOR MATH: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const providerMap = {
    'gpt-3.5-turbo': 'openai', 'gpt-4': 'openai', 'gpt-4o': 'openai',
    'gemini-pro': 'google', 'claude-3-opus': 'anthropic', 'claude-3-sonnet': 'anthropic'
};

app.get('/', (req, res) => res.send('AI Sustainability Server with SEMANTIC EMBEDDINGS!'));

app.get('/health/redis', async (req, res) => {
    try {
        const result = await pingRedis();
        if (!result.available) {
            return res.json({ ok: false, configured: false, reason: result.reason });
        }
        return res.json({ ok: true, configured: true, ping: result.pong });
    } catch (err) {
        return res.status(502).json({ ok: false, configured: true, error: err.message });
    }
});

/** Whether Redis has a JSON grid config (endpoint + apiKey); does not return secrets. */
app.get('/health/grid-config', async (req, res) => {
    try {
        const cfg = await getGridApiConfigFromRedis();
        return res.json({ ok: true, gridConfigPresent: !!cfg });
    } catch (err) {
        return res.status(502).json({ ok: false, error: err.message });
    }
});

function attachGridScheduling(body, payload) {
    const { enableGridScheduling, clientTimestamp, timeZone } = body;
    if (!enableGridScheduling) return payload;
    const evaluatedAt = clientTimestamp ? new Date(clientTimestamp) : new Date();
    if (Number.isNaN(evaluatedAt.getTime())) {
        return {
            ...payload,
            gridScheduling: {
                error: 'Invalid clientTimestamp; expected an ISO-8601 string.'
            }
        };
    }
    return {
        ...payload,
        gridScheduling: buildGridSchedulingAdvice({
            evaluatedAt,
            timeZone,
            regionKey: body.region || 'us-east'
        })
    };
}

app.post('/calculate-cost', async (req, res) => {
    const { model, tokenCount, prompt = '', aiResponse = '', conversationId = 'default', region = 'us-east' } = req.body;

    if (!model || !tokenCount || !extractor) {
        return res.status(400).json({ error: 'Server initializing or missing data.' });
    }

    // 1. CONTEXT RESOLUTION
    if (!conversationContexts.has(conversationId)) {
        conversationContexts.set(conversationId, new Set());
    }
    const sessionMemory = conversationContexts.get(conversationId);
    
    // Add current keywords to memory
    prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).forEach(w => sessionMemory.add(w));
    
    // Merge context: current prompt + keywords from previous messages
    const contextPrompt = Array.from(sessionMemory).join(" ") + " " + prompt;

    // 2. GENERATE SEMANTIC SIGNATURE (Embedding the Contextual Prompt)
    console.log(`🧠 Analyzing meaning with context: "${contextPrompt}"`);
    const output = await extractor(contextPrompt, { pooling: 'mean', normalize: true });
    const currentEmbedding = Array.from(output.data);

    // 2. SEMANTIC CACHE LOOKUP (Scanning for similar meaning)
    for (const cachedItem of promptCache) {
        const similarity = cosineSimilarity(currentEmbedding, cachedItem.embedding);
        
        if (similarity > 0.88) { // 88% semantic similarity threshold
            console.log(`🎯 Semantic Match! Similarity: ${(similarity*100).toFixed(1)}%`);
            const cachedPayload = {
                ...cachedItem.data,
                cachedAiResponse: cachedItem.data.aiResponse,
                source: 'Sustainability Cache (SEMANTIC-MATCH)',
                message: `♻️ Semantic Match! We found a previous answer with the same meaning (${(similarity*100).toFixed(0)}% match). 100% Carbon Saved.`
            };
            return res.json(attachGridScheduling(req.body, cachedPayload));
        }
    }

    try {
        console.log(`📡 Fetching EcoLogits data for ${model}...`);
        const ecoResponse = await axios.post('https://api.ecologits.ai/v1beta/estimates', {
            provider: providerMap[model] || 'openai',
            model: model,
            usage: { total_tokens: tokenCount }
        }, { timeout: 3000 });

        const impacts = ecoResponse.data.impacts;

        const finalResponse = {
            source: 'EcoLogits API',
            model,
            tokenCount,
            aiResponse,
            impact: {
                energy_kwh: impacts.energy.value.toFixed(6),
                carbon_g: (impacts.gwp.value * 1000).toFixed(4),
                water_ml: "Real-time water data pending",
                sustainability_score: 98
            },
            message: "Standard calculation complete. This prompt is now in the semantic memory."
        };

        // 3. SAVE TO SEMANTIC CACHE
        promptCache.push({
            embedding: currentEmbedding,
            data: finalResponse
        });

        return res.json(attachGridScheduling(req.body, finalResponse));

    } catch (error) {
        console.warn('⚠️ API Fallback triggered.');
        // (Fallback logic remains the same...)
        const modelInfo = sustainabilityData.models[model] || sustainabilityData.models['gpt-3.5-turbo'];
        const totalEnergyKwh = (tokenCount / 1000) * modelInfo.energy_kwh_per_1k_tokens;
        
        const fallbackResponse = {
            source: 'Local Fallback',
            model, tokenCount, impact: { energy_kwh: totalEnergyKwh.toFixed(6), carbon_g: (totalEnergyKwh * 380).toFixed(4) }
        };
        
        promptCache.push({ embedding: currentEmbedding, data: fallbackResponse });
        res.json(attachGridScheduling(req.body, fallbackResponse));
    }
});

app.listen(PORT, () => console.log(`Eco-Server running on http://localhost:${PORT}`));
