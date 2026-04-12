# 🌍 AI Sustainability Server (Hackathon Project)

An intelligent Node.js backend that calculates the environmental impact of AI prompts and reduces carbon footprints through smart caching.

## 🚀 Features
- **EcoLogits API Integration:** Fetches real-world energy (kWh) and carbon (kgCO2eq) data.
- **SMART Redundancy Caching:** Detects identical prompts regardless of word order.
- **Contextual Memory:** Resolves short follow-up questions (e.g., "Population?") based on conversation history.
- **Fuzzy Typo Matching:** Uses Levenshtein distance to recognize and reuse results for prompts with minor typos.
- **Local Fallback:** Built-in impact estimation if external APIs are unreachable.

## 🛠️ Setup
1. Clone the repository: `git clone <your-repo-url>`
2. Install dependencies: `npm install`
3. Start the server: `node index.js`

## 📡 API Usage
**Endpoint:** `POST /calculate-cost`
**Body:**
```json
{
  "prompt": "What is the capital of France?",
  "model": "gpt-4o",
  "tokenCount": 150,
  "conversationId": "user-session-123"
}
```

## 🍃 Sustainability Impact
This project aims to reduce the "Carbon cost per query" by minimizing redundant GPU calls through intelligent local caching and context resolution.
