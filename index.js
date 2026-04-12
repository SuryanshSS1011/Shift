const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sustainabilityData = require('./data.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🧠 Prompt Cache & Conversation Memory
const promptCache = new Map();
const conversationContexts = new Map();

// 🔍 FUZZY MATCHING ALGORITHM (Levenshtein Distance)
function getSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    
    // Simple edit distance calculation
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return (longerLength - costs[s2.length]) / parseFloat(longerLength);
}

// ... (rest of the setup)

// Status check
app.get('/', (req, res) => {
    res.send('AI Sustainability Server is LIVE with Contextual Memory!');
});

// Endpoint to calculate environmental cost
app.post('/calculate-cost', async (req, res) => {
    const { model, tokenCount, prompt = '', aiResponse = '', conversationId = 'default', region = 'us-east' } = req.body;

    if (!model || !tokenCount) {
        return res.status(400).json({ error: 'Model and tokenCount are required' });
    }

    // 🔍 CONTEXT-AWARE SIGNATURE GENERATOR
    const getContextualSignature = (text, sessionId) => {
        const currentKeywords = text.toLowerCase()
            .replace(/[?.,!]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 2);

        if (!conversationContexts.has(sessionId)) {
            conversationContexts.set(sessionId, new Set());
        }
        const sessionMemory = conversationContexts.get(sessionId);
        currentKeywords.forEach(word => sessionMemory.add(word));
        return Array.from(sessionMemory).sort().join(" ");
    };

    const signature = getContextualSignature(prompt, conversationId);
    
    // 1. EXACT & CONTEXT MATCH (Now returns the cached AI Response!)
    if (signature && promptCache.has(signature)) {
        console.log(`🧠 Context Match! Returning cached AI response.`);
        const cachedData = promptCache.get(signature);
        return res.json({
            ...cachedData,
            cachedAiResponse: cachedData.aiResponse, // Send the actual answer back!
            source: 'Sustainability Cache (FULL-REUSE)',
            message: "♻️ 100% ENERGY SAVED! We found the answer in our eco-cache. No AI call was needed."
        });
    }

    // 2. FUZZY MATCH (Handle typos)
    if (signature) {
        for (let [cachedSignature, cachedData] of promptCache.entries()) {
            const similarity = getSimilarity(signature, cachedSignature);
            if (similarity > 0.85) {
                console.log(`🔎 Fuzzy Match! Returning cached AI response.`);
                return res.json({
                    ...cachedData,
                    cachedAiResponse: cachedData.aiResponse,
                    source: 'Sustainability Cache (FUZZY-REUSE)',
                    message: `♻️ Fuzzy Match! We found a similar previous answer. Energy saved by re-using the cached AI response.`
                });
            }
        }
    }

    try {
        console.log(`📡 Fetching REAL sustainability data for ${model}...`);
        
        // ... (EcoLogits call logic)
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
            aiResponse, // Store the response sent by the extension
            impact: {
                energy_kwh: impacts.energy.value.toFixed(6),
                carbon_g: (impacts.gwp.value * 1000).toFixed(4),
                water_ml: "Real-time water data pending",
                sustainability_score: 95
            },
            message: getSustainabilityMessage(impacts.gwp.value * 1000)
        };

        if (signature) promptCache.set(signature, finalResponse);
        return res.json(finalResponse);

    } catch (error) {
        console.warn('⚠️ EcoLogits API failed or timed out. Using local fallback math.');
        
        // FALLBACK: Use local data.json if API fails
        const modelInfo = sustainabilityData.models[model] || sustainabilityData.models['gpt-3.5-turbo'];
        const regionInfo = sustainabilityData.regions[region] || sustainabilityData.regions['us-east'];

        const totalEnergyKwh = (tokenCount / 1000) * modelInfo.energy_kwh_per_1k_tokens;
        const totalWaterMl = (tokenCount / 1000) * modelInfo.water_ml_per_1k_tokens;
        const totalCarbonG = totalEnergyKwh * regionInfo.carbon_g_per_kwh;

        const fallbackResponse = {
            source: 'Local Fallback',
            model,
            tokenCount,
            impact: {
                energy_kwh: totalEnergyKwh.toFixed(6),
                carbon_g: totalCarbonG.toFixed(4),
                water_ml: totalWaterMl.toFixed(4),
                sustainability_score: regionInfo.sustainability_score
            },
            message: getSustainabilityMessage(totalCarbonG)
        };

        // SAVE TO CACHE (using the signature)
        if (signature) promptCache.set(signature, fallbackResponse);

        res.json(fallbackResponse);
    }
});

function getSustainabilityMessage(carbonG) {
    if (carbonG < 0.5) return "This prompt has a very low impact. Great!";
    if (carbonG < 2.0) return "Moderate impact. Consider if this prompt is necessary.";
    return "High impact prompt. Try to be more concise to save energy!";
}

app.listen(PORT, () => {
    console.log(`AI Sustainability Server running on http://localhost:${PORT}`);
});
