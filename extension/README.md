# Shift Extension - Eco LLM

Track the environmental impact of your LLM prompts on Gemini.

## Features

- **Real-time Token Monitoring** - See token count as you type
- **Environmental Impact Metrics** - Energy (Wh), CO₂ (g), water consumption via EcoLogits API
- **Grid Carbon Intensity Forecast** - Shows optimal times to use LLMs (low carbon hours)
- **Semantic Caching** - Uses Upstash Vector DB to cache prompt/answer pairs with similarity matching
- **Cache Suggestions** - Suggests cached answers for similar prompts to avoid redundant LLM calls

## Installation

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** in the top right
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository

### 2. Configure Upstash Vector

The extension uses Upstash Vector for semantic caching. You need to configure your credentials:

1. Sign up at [upstash.com](https://upstash.com) (free tier available)
2. Create a new **Vector Index**
3. Click the extension icon in Chrome
4. Enter your Upstash Vector URL and Token
5. Click **Save Configuration**

## Usage

1. Go to [gemini.google.com](https://gemini.google.com)
2. The extension will automatically inject the monitoring UI
3. As you type, you'll see:
   - Live token count
   - Estimated energy impact
   - Grid carbon intensity (best time to prompt)
   - Cache suggestions if similar prompts exist

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

## Development

### File Structure

```
extension/
├── manifest.json      # Chrome Manifest V3
├── background.js      # Service worker (API calls)
├── content.js         # Gemini UI injection
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

- Prompts and responses are cached in **your own** Upstash Vector database
- No data is sent to third parties except:
  - EcoLogits API (for environmental impact estimates)
  - Your Upstash Vector instance (for caching)
- Extension only activates on gemini.google.com

## License

Part of the Shift sustainability platform.
