# Shift Extension - Eco LLM

Track the environmental impact of your LLM prompts on Gemini.

## Features

- **Real-time Token Monitoring** - See token count as you type
- **Environmental Impact Metrics** - Energy (Wh), CO₂ (g), water consumption via EcoLogits API
- **Grid Carbon Intensity Forecast** - Shows optimal times to use LLMs (low carbon hours)
- **Semantic Caching** - Uses Upstash Vector DB to cache prompt/answer pairs with similarity matching
- **Cache Suggestions** - Suggests cached answers for similar prompts to avoid redundant LLM calls
- **Prompt Compression** - Overwrites lengthy prompts into more concise and efficient prompts
- **Smart Image Handling** - Compresses uploaded images client-side before sending, and detects image generation requests to suggest a web search alternative with a carbon cost comparison


## Installation

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** in the top right
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository

### 2. Configure Groq API key

1. Go to console.groq.com
2. Sign in and click API Keys in the left sidebar
3. Copy an existing key or create a new one

### 3. Configure Upstash Vector

The extension uses Upstash Vector for semantic caching. You need to configure your credentials:

1. Sign up at [upstash.com](https://upstash.com) (free tier available)
2. Create a new **Vector Index**
3. Click the extension icon in Chrome
4. Enter your Upstash Vector URL + Token + Groq API key
5. Click **Save Configuration**

## Usage

1. Go to [gemini.google.com](https://gemini.google.com)
2. The extension will automatically inject the monitoring UI
3. As you type, you'll see:
   - Live token count
   - Estimated energy impact
   - Grid carbon intensity (best time to prompt)
   - Cache suggestions if similar prompts exist
   - Prompt compression to get more concise prompts

## Supported Sites

- [x] Google Gemini (gemini.google.com)
- [ ] ChatGPT (coming soon)
- [ ] Claude (coming soon)

## How It Works

### Semantic Cache

When you send a prompt, the extension:
1. Checks the Upstash Vector DB for similar cached prompts
2. If a similar prompt is found (>90% similarity), suggests the cached answer
3. If you proceed with a new query, the prompt+response is cached for future use

### Prompt Compression

When you type a prompt, the extension:

1. Waits for you to pause typing (600ms debounce)
2. If your prompt is over 10 words, sends it to Groq (Llama 3.1 8B) for compression
3. Rewrites it to be shorter and more efficient while preserving the full meaning
4. Automatically replaces your input with the optimized version
5. Shows a brief notice with tokens saved and energy impact (mWh used vs mWh saved vs cloud inference)

Groq's LPU hardware is ~10x more energy efficient than standard GPU inference, making the compression call a fraction of the cost of the tokens it saves on Gemini's larger models.


### Smart Image Handling

When you upload an image, the extension:

1. Intercepts it client-side before it reaches Gemini
2. Resizes and compresses it to the minimum resolution the model needs
3. Shows estimated tokens saved from the size reduction

When you type an image generation request, the extension:

1. Detects phrases like "generate", "create an image", "draw", or "show me a picture of"
2. Shows a banner with the estimated carbon cost of AI generation vs a web search alternative
3. Offers a direct search link — letting you decide whether generation is worth the cost

### Environmental Impact

The extension estimates environmental impact using the [EcoLogits API](https://ecologits.ai):
- **Energy**: Wh consumed by the LLM inference
- **CO₂**: Grams of CO₂ equivalent emissions
- **Water**: mL of water used for cooling

### Grid Carbon Intensity

The extension shows a 24-hour forecast of US grid carbon intensity:
- **Green (Low)**: 10 AM - 3 PM (solar peak)
- **Yellow (Moderate)**: Morning/evening ramps
- **Red (High)**: 5 PM - 9 PM (peak demand)

This helps you time your LLM usage for minimal environmental impact.

## Configuration

Settings are stored in `chrome.storage.sync` and persist across devices if signed into Chrome.

| Setting | Description |
|---------|-------------|
| `UPSTASH_VECTOR_URL` | Your Upstash Vector index URL |
| `UPSTASH_VECTOR_TOKEN` | Your Upstash Vector API token |
| `GROQ_API_KEY` | Your Groq API key |

## Development

### File Structure

```
extension/
├── manifest.json      # Chrome Manifest V3
├── background.js      # Service worker (API calls)
├── content.js         # Gemini UI injection
├── popup.js           # Storage for token, URL, and key
├── styles.css         # Extension styles
├── popup.html         # Extension popup + config
├── markdown.html      # Markdown viewer
└── README.md          # This file
```

### Local Development

1. Make changes to the extension files
2. Go to `chrome://extensions`
3. Click the refresh icon on the Shift extension
4. Reload the Gemini page

## Privacy

- Prompts and responses are cached/compressed in **your own** Upstash Vector database
- No data is sent to third parties except:
  - EcoLogits API (for environmental impact estimates)
  - Your Upstash Vector instance (for caching)
  - Groq API (for prompt compression)
- Extension only activates on gemini.google.com

## License

Part of the Shift sustainability platform.
