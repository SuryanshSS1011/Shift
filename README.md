# Shift

**AI-personalized sustainability actions with radical transparency about AI's environmental cost.**

## The Problem

65% of people want to live more sustainably — only 26% follow through. The gap isn't motivation. It's tools.

Existing apps show guilt dashboards and generic tip lists. They don't tell you what to do *today*, in *your* city, with *your* diet, on *your* commute. And every AI product quietly ignores its own environmental footprint, making the problem worse.

## How Shift Works

Shift onboards users in 90 seconds, then delivers **one AI-personalized sustainability micro-action per day** — tailored to:

- Your actual commute distance
- Your diet pattern
- Your city's live electricity grid carbon intensity
- Current weather conditions

Actions are grounded in EPA and DEFRA emissions data, structured using behavioral science frameworks (Fogg's B=MAP, Tiny Habits), and scored against 190 curated actions in a knowledge base. Users earn points, build streaks, advance through five levels, and track contributions to UN Sustainable Development Goals.

### Radical Transparency

Unlike every other AI product, Shift shows you what the AI costs:

- Every action card displays the inference carbon cost alongside savings enabled
- A Chrome extension monitors the environmental impact of every Gemini prompt in real time
- A dedicated Eco-LLM dashboard tracks energy (Wh), carbon (gCO₂), and water (mL) per query
- Semantic caching serves similar queries without extra inference — zero additional carbon

**Typical carbon ROI: 10,000:1 or higher.**

## Technology

- **Frontend:** Next.js 14 (App Router, PWA) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Tremor
- **AI:** Groq (Llama 3.3-70B) with Gemini fallback via Vercel AI SDK
- **Database:** Supabase (Postgres + pgvector)
- **Caching:** Upstash Redis (TTL cache) · Upstash Vector (semantic deduplication)
- **APIs:** Climatiq (commute CO₂) · Electricity Maps (live grid intensity) · Google Maps Distance Matrix · Open-Meteo
- **Carbon Estimation:** EcoLogits model with Groq LPU efficiency multiplier
- **Analytics:** PostHog · Sentry
- **Email:** Resend

## Potential Impact

At 100,000 daily users completing one action each, Shift removes an estimated **12,000 tonnes of CO₂ per year** — equivalent to taking 2,600 cars off the road.

The Eco-LLM transparency layer is also a standalone product for enterprise teams navigating AI carbon disclosure requirements under EU AI Act regulations.

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# Run development server
npm run dev
```

## License

MIT
v0.1.0 planned and built in 12 hours for the GDG @ Penn State Solution Challenge Hackathon
Team: [Suryansh Sijwali](https://github.com/SuryanshSS1011), [Nabeel Ahmed](https://github.com/NabeelAhmed1721), [Neil Barbara](https://github.com/abb6640)
