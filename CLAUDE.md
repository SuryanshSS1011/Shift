# CLAUDE.md — Shift Project

> This file tells Claude Code everything it needs to know to build, extend, and reason about the Shift codebase. Read this fully before writing any code. Re-read the relevant sections when working on a specific subsystem.

---

## What Is Shift

Shift is an AI-powered sustainability micro-action engine for urban professionals. It onboards users in 90 seconds (5 questions), builds a behavioral profile, and delivers one AI-personalized sustainability micro-action per day — each with precise CO₂ and dollar impact. The LLM is the core product, not a chatbot. Every action is grounded in EPA/DEFRA emissions data bundled as static JSON, structured using Fogg's B=MAP behavioral framework, and personalized to the user's specific city, commute, diet, and motivation.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Groq API (primary LLM) · Gemini API (fallback LLM) · Vercel AI SDK · Supabase (Postgres + pgvector + Auth) · Vercel · Framer Motion · Tremor · canvas-confetti

**Cost: $0.** Every service is on a genuinely free tier at hackathon scale. No credit card required for Groq or Gemini. Supabase free tier covers all DB, auth, and vector search needs.

---

## Absolute Rules — Never Violate These

1. **Never call any LLM API client-side.** All Groq and Gemini calls happen in `/app/api/` server-side route handlers only. Never import `lib/ai.ts` into any component.

2. **Never use `any` in TypeScript.** Define proper types in `/types/`. If you are unsure of a type, define it explicitly — do not use `any`.

3. **Always validate LLM output with Zod.** Use `generateObject` from the Vercel AI SDK with a Zod schema. Never parse free-form text from the LLM.

4. **Never hardcode emissions values in components or API routes.** All CO₂ factors come exclusively from the JSON files in `/data/knowledge-base/` loaded via `lib/knowledge-base.ts`. That file is the single source of truth.

5. **Never let an AI API failure crash the user experience.** Every route that calls the LLM must try Groq first, fall back to Gemini on any error, then fall back to a deterministically selected static action from the knowledge base. Log all errors server-side. Always return a graceful response to the client.

6. **Never commit `.env.local`.** It is gitignored. Only `.env.example` with placeholder values gets committed.

7. **Always return correct HTTP status codes.** 200 for success, 400 for bad input with a `{ error: string }` body, 500 for server errors. Never return 200 with an error buried in the body.

8. **Supabase free projects pause after 7 days of inactivity.** Log into the Supabase dashboard at least once daily during development to prevent this.

---

## Project Structure

```
shift/
├── app/
│   ├── layout.tsx                     ← Root layout, fonts, global Toaster
│   ├── page.tsx                       ← Landing page / hero
│   ├── globals.css
│   ├── onboarding/page.tsx            ← 5-question onboarding flow
│   ├── dashboard/page.tsx             ← Main user dashboard
│   └── api/
│       ├── generate-action/route.ts   ← POST: generate today's micro-action
│       ├── generate-profile/route.ts  ← POST: synthesize user profile from onboarding answers
│       ├── complete-action/route.ts   ← POST: mark action complete, update streak + totals
│       └── weekly-report/route.ts     ← POST: generate AI narrative weekly report
├── components/
│   ├── ui/                            ← shadcn/ui primitives (auto-generated, never edit)
│   ├── onboarding/
│   │   ├── OnboardingShell.tsx        ← Progress bar + step container
│   │   ├── QuestionCard.tsx           ← Animated question + tap-target options
│   │   └── ProfileReveal.tsx          ← AI profile preview before routing to dashboard
│   ├── dashboard/
│   │   ├── MicroActionCard.tsx        ← Today's action card (the hero element)
│   │   ├── StreakDisplay.tsx           ← react-circular-progressbar + streak count
│   │   ├── ActivityHeatmap.tsx        ← react-activity-calendar heatmap
│   │   ├── ImpactDashboard.tsx        ← Tremor metric cards: CO₂, $, actions
│   │   ├── CelebrationOverlay.tsx     ← canvas-confetti + spring checkmark animation
│   │   └── WeeklyReport.tsx           ← AI narrative report card, collapsible
│   └── shared/
│       ├── Header.tsx
│       └── WeatherBadge.tsx           ← Open-Meteo weather context (optional enhancement)
├── lib/
│   ├── ai.ts                          ← Multi-provider LLM client (Groq primary, Gemini fallback)
│   ├── schemas.ts                     ← All Zod schemas for LLM output validation
│   ├── supabase.ts                    ← Singleton Supabase client
│   ├── redis.ts                       ← Upstash Redis client + getCached() helper
│   ├── knowledge-base.ts              ← Loads JSON data, scores action candidates
│   ├── climatiq.ts                    ← Climatiq API — precise CO₂ for user's actual commute distance
│   ├── electricity-maps.ts            ← Electricity Maps — real-time grid carbon intensity by zone
│   ├── google-maps.ts                 ← Geocoding API + Distance Matrix API (address → lat/lng + miles)
│   ├── open-meteo.ts                  ← Weather fetch by lat/lng (cached via Redis)
│   ├── prompts/
│   │   ├── system-prompt.ts           ← Master system prompt (behavioral science framing)
│   │   ├── action-generator.ts        ← Prompt builder for daily action generation
│   │   ├── profile-builder.ts         ← Prompt builder for onboarding profile synthesis
│   │   └── weekly-report.ts           ← Prompt builder for weekly narrative report
│   └── emissions/
│       ├── calculator.ts              ← CO₂ math utilities
│       └── equivalencies.ts           ← "= X miles not driven" conversions
├── data/
│   ├── knowledge-base/
│   │   ├── action-library.json        ← 200+ curated micro-actions with full metadata
│   │   ├── food-emissions.json        ← DEFRA/EPA food CO₂ factors
│   │   ├── transport-emissions.json   ← EPA transport CO₂ factors by mode
│   │   ├── home-energy.json           ← EIA energy savings data
│   │   └── shopping-waste.json        ← Consumer goods emissions
│   └── us-cities/
│       └── transit-data.json          ← Transit availability for major US cities
└── types/
    ├── user.ts                        ← UserProfile, OnboardingAnswers
    ├── action.ts                      ← MicroAction, ActionCandidate, ActionCategory
    └── impact.ts                      ← ImpactTotals, StreakData, CO2Equivalencies
```

---

## TypeScript Types — Always Use These

```typescript
// types/user.ts
interface OnboardingAnswers {
  commuteType: 'drive' | 'transit' | 'bike_walk' | 'wfh' | 'mixed'
  dietPattern: 'meat_most_days' | 'chicken_fish' | 'mostly_plant' | 'vegan_vegetarian'
  livingSituation: 'city_apartment' | 'urban_house' | 'suburbs' | 'rural'
  primaryBarrier: 'time' | 'cost' | 'knowledge' | 'overwhelmed'
  primaryMotivation: 'planet' | 'money' | 'health' | 'community'
  city: string
}

interface UserProfile {
  id: string
  sessionId: string
  city: string
  commuteType: OnboardingAnswers['commuteType']
  commuteDistanceMiles: number | null
  dietPattern: OnboardingAnswers['dietPattern']
  livingSituation: OnboardingAnswers['livingSituation']
  primaryBarrier: OnboardingAnswers['primaryBarrier']
  primaryMotivation: OnboardingAnswers['primaryMotivation']
  aiProfileSummary: string
  topImpactAreas: ActionCategory[]
  estimatedAnnualFootprintKg: number
  createdAt: string
}

// types/action.ts
type ActionCategory = 'food' | 'transport' | 'energy' | 'shopping' | 'water' | 'waste'
type DifficultyLevel = 'easy' | 'medium' | 'challenge'
type BehavioralFrame = 'cost' | 'values' | 'health' | 'convenience' | 'identity'

interface ActionCandidate {
  id: string
  category: ActionCategory
  title: string
  descriptionTemplate: string
  co2SavingsKgPerOccurrence: number
  dollarSavingsPerOccurrence: number
  timeRequiredMinutes: number
  difficulty: DifficultyLevel
  behavioralFramePrimary: BehavioralFrame
  equivalencyLabel: string
  applicableDietPatterns: string[]
  applicableLivingSituations: string[]
  applicableCommuteTypes: string[]
  applicableCities: string[]
}

interface MicroAction {
  id: string
  userId: string
  actionDate: string          // ISO date string YYYY-MM-DD
  category: ActionCategory
  title: string
  description: string         // AI-personalized, not the raw template
  anchorHabit: string         // "After you [existing habit]..."
  co2SavingsKg: number
  dollarSavings: number
  timeRequiredMinutes: number
  difficultyLevel: DifficultyLevel
  behavioralFrame: BehavioralFrame
  equivalencyLabel: string    // "= 3 miles not driven"
  completed: boolean
  completedAt: string | null
  createdAt: string
}

// types/impact.ts
interface ImpactTotals {
  totalCo2SavedKg: number
  totalDollarSaved: number
  totalActionsCompleted: number
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActionDate: string | null
  streakFreezeAvailable: boolean
}

interface CO2Equivalencies {
  milesNotDriven: number
  treePlantedDays: number
  phoneCharges: number
  streamingHours: number
}
```

---

## AI Layer — Multi-Provider LLM Client

### Architecture
The Vercel AI SDK unifies Groq and Gemini behind one interface via their OpenAI-compatible endpoints. Groq is primary (fastest inference, best free tier for interactive use). Gemini 2.0 Flash-Lite is the fallback (1,000 RPD free, 1M token context). Both require only a free API key with no credit card.

### `lib/ai.ts` — singleton and fallback wrapper

```typescript
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
})

const gemini = createOpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  apiKey: process.env.GEMINI_API_KEY,
})

// Use this function for every LLM call in the project
export async function generateWithFallback<T>(
  schema: z.ZodType<T>,
  prompt: { system: string; user: string },
  temperature = 0.6
): Promise<T> {
  const providers = [
    { client: groq, model: 'llama-3.3-70b-versatile', name: 'Groq' },
    { client: gemini, model: 'gemini-2.0-flash-lite', name: 'Gemini' },
  ]
  for (const provider of providers) {
    try {
      const { object } = await generateObject({
        model: provider.client(provider.model),
        schema,
        system: prompt.system,
        prompt: prompt.user,
        temperature,
      })
      return object
    } catch (err) {
      console.error(`[AI] ${provider.name} failed:`, err)
    }
  }
  throw new Error('All AI providers exhausted')
}
```

### Model selection
- **`llama-3.3-70b-versatile` on Groq** — all action generation, profile synthesis, weekly reports. Best reasoning for behavioral personalization.
- **`llama-3.1-8b-instant` on Groq** — use this model if the 70B hits rate limits (higher RPM). Acceptable quality for simpler tasks.
- **`gemini-2.0-flash-lite`** — automatic fallback only. Do not use as primary.

### Temperature settings by task
- Profile synthesis: `0.3` — factual, consistent across calls
- Action generation: `0.6` — varied enough to prevent repeat suggestions
- Weekly report: `0.8` — warm, narrative, creative

### Zod schemas in `lib/schemas.ts`
Define all schemas here and import them into API routes. Example:

```typescript
import { z } from 'zod'

export const MicroActionOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  anchorHabit: z.string(),
  co2SavingsKg: z.number().positive(),
  dollarSavings: z.number().nonnegative(),
  timeRequiredMinutes: z.number().int().nonnegative(),
  difficultyLevel: z.enum(['easy', 'medium', 'challenge']),
  behavioralFrame: z.enum(['cost', 'values', 'health', 'convenience', 'identity']),
  equivalencyLabel: z.string(),
  category: z.enum(['food', 'transport', 'energy', 'shopping', 'water', 'waste']),
})

export const UserProfileOutputSchema = z.object({
  topImpactAreas: z.array(z.enum(['food', 'transport', 'energy', 'shopping', 'water', 'waste'])).length(3),
  estimatedAnnualFootprintKg: z.number().positive(),
  aiProfileSummary: z.string().max(300),
})

export const WeeklyReportOutputSchema = z.object({
  whatWentWell: z.string(),
  patternObserved: z.string(),
  focusThisWeek: z.string(),
})
```

---

## System Prompt — Core Content

This lives in `lib/prompts/system-prompt.ts` and is passed as the `system` field to every `generateWithFallback` call for action generation:

```
You are Shift's behavioral sustainability coach. You generate one highly personalized,
immediately actionable sustainability micro-action per day for urban professionals.

BEHAVIORAL FRAMEWORKS YOU APPLY:
1. Fogg B=MAP Model: Behavior = Motivation × Ability × Prompt
   - Maximize Ability: make the action trivially easy, under 2 minutes of decision time
   - Always include a Prompt anchored to an existing daily habit the user already has
   - Motivation is derived from the user's stated primary motivation
2. Tiny Habits structure: "After I [existing anchor habit], I will [micro-action]"
3. Domain-specific framing rules:
   - Transport actions → frame around cost savings and time ("saves $X, only Y min longer")
   - Food actions → frame around values and identity ("someone who cares about the planet chooses...")
   - Energy actions → frame around comfort and savings ("same comfort, $X less this month")
   - Shopping actions → frame around quality ("better value AND better for the planet")

GOOD MICRO-ACTION CRITERIA:
- Requires under 2 minutes of decision time and 0–10 minutes of execution time
- Requires no purchases or significant upfront cost
- Is specific to this user's city, commute type, diet, and stated constraints
- Uses only the CO₂ values from the candidate actions provided — never invent figures

NEVER DO THESE:
- Suggest carbon offsets (this is a behavior change product, not an offset platform)
- Moralize, guilt, or use fear language
- Give vague advice like "try to eat less meat" — always be specific
- Contradict the user's dietary pattern or stated constraints
- Invent CO₂ or dollar savings figures not present in the candidates
```

---

## Knowledge Base — Scoring and Structure

### `action-library.json` entry format

```json
{
  "id": "food-001",
  "category": "food",
  "title": "Swap beef for chicken in tonight's dinner",
  "descriptionTemplate": "After you {anchor}, choose chicken, fish, or a plant-based option instead of beef — saves {co2} kg CO₂ and about ${dollars} vs. a beef-based meal.",
  "co2SavingsKgPerOccurrence": 1.5,
  "dollarSavingsPerOccurrence": 2.0,
  "timeRequiredMinutes": 0,
  "difficulty": "easy",
  "applicableDietPatterns": ["meat_most_days", "chicken_fish"],
  "applicableLivingSituations": ["all"],
  "applicableCommuteTypes": ["all"],
  "applicableCities": ["all"],
  "behavioralFramePrimary": "values",
  "equivalencyLabel": "= 3.7 miles not driven"
}
```

### Scoring algorithm in `lib/knowledge-base.ts`

Function signature: `searchActions(profile: UserProfile, recentActionIds: string[], currentStreak: number, count: number): ActionCandidate[]`

Weights applied to each candidate:
- Category is in `profile.topImpactAreas`: **+3**
- Applicable to `profile.dietPattern` or "all": **+2**
- Applicable to `profile.livingSituation` or "all": **+2**
- Applicable to `profile.commuteType` or "all": **+1**
- Applicable to `profile.city` or "all": **+1**
- Not in `recentActionIds` (last 7 days): **+2**
- Difficulty appropriate to streak (easy <7 days, medium 7–30, any >30): **+1**

Return top 5 by score. Pass all 5 to the LLM. The LLM selects the single best candidate and rewrites the description to be hyper-specific to this user's context.

---

## Supabase — Schema and Query Patterns

### Client (`lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Import this singleton everywhere. Never instantiate a new client in API routes or components.

### Four database tables

**users** — `id` (uuid PK), `session_id` (text unique), `city`, `commute_type`, `diet_pattern`, `living_situation`, `primary_barrier`, `primary_motivation`, `ai_profile_summary`, `top_impact_areas` (text[]), `estimated_annual_footprint_kg` (numeric), `created_at`

**actions** — `id` (uuid PK), `user_id` (uuid FK → users), `action_date` (date), `category`, `title`, `description`, `anchor_habit`, `co2_savings_kg`, `dollar_savings`, `time_required_minutes`, `difficulty_level`, `behavioral_frame`, `equivalency_label`, `completed` (bool default false), `completed_at` (timestamptz null), `created_at`

**streaks** — `id` (uuid PK), `user_id` (uuid FK unique), `current_streak` (int default 0), `longest_streak` (int default 0), `last_action_date` (date null), `streak_freeze_available` (bool default true)

**impact_totals** — `id` (uuid PK), `user_id` (uuid FK unique), `total_co2_saved_kg` (numeric default 0), `total_dollar_saved` (numeric default 0), `total_actions_completed` (int default 0)

### Session management
No auth for MVP. Generate a UUID session ID client-side on first visit and store it in `localStorage`. Pass `sessionId` with every API request. Server routes resolve the user via `eq('session_id', sessionId)`. This is intentional — removing auth friction is correct for a hackathon demo.

### Key query patterns

```typescript
// Look up user by session
const { data: user } = await supabase
  .from('users').select('*').eq('session_id', sessionId).single()

// Idempotency check — does today's action already exist?
const today = new Date().toISOString().split('T')[0]
const { data: existing } = await supabase
  .from('actions').select('*').eq('user_id', userId).eq('action_date', today).single()

// Last 7 action IDs for repeat-avoidance scoring
const { data: recent } = await supabase
  .from('actions').select('id, category, title')
  .eq('user_id', userId)
  .order('action_date', { ascending: false })
  .limit(7)

// Atomic streak update — always use an RPC to prevent race conditions
await supabase.rpc('update_streak', { p_user_id: userId })
```

---

## Emissions Data — Sources and Key Values

All CO₂ factors are static JSON in `/data/knowledge-base/`. Never call an external carbon API — it is unnecessary and rate-limited.

**Sources:**
- DEFRA/DESNZ 2025 GHG Conversion Factors (UK government, freely downloadable Excel)
- EPA GHG Emission Factors Hub 2025 (US government, free download)
- SU-EATABLE LIFE Database (published in Nature Scientific Data, open access) — food items

| Action | CO₂ saved | $ saved |
|--------|-----------|---------|
| Beef meal → chicken | 1.5 kg | ~$2.00 |
| Beef meal → plant-based | 2.7 kg | ~$3.00 |
| Rideshare → subway (3 mi, NYC) | 1.1 kg | ~$14.00 |
| Drive → bike (5-mile commute) | 1.6 kg | ~$4.00 |
| Air dry one laundry load | 0.69 kg | ~$0.30 |
| Cold vs. hot water wash | 0.44 kg | ~$0.10 |
| Unplug devices (daily habit) | 0.15 kg | ~$0.03 |
| Skip rideshare → walk | 0.47 kg | ~$12.00 |

**Equivalencies (in `lib/emissions/equivalencies.ts`):**
`1 kg CO₂ = 2.48 miles driven = 0.11 tree-planted-days = 121 phone charges = 2.2 hrs streaming`

---

## UI — What to Use for Each Feature

### Charts and KPI cards
**Tremor** (`@tremor/react`) for all metric/KPI cards — `<Metric>`, `<BadgeDelta>`, `<ProgressBar>`, `<Sparkline>`. **shadcn/ui Charts** (Recharts-based) for the CO₂ breakdown donut and weekly trend bar chart. Do not install Recharts directly — always go through shadcn/ui chart components.

### Streak ring
**`react-circular-progressbar`** — SVG ring around the streak number. `value={currentStreak}` and `maxValue={30}` shows progress toward the 30-day milestone. Style with CSS variables to match the green palette.

### Activity history heatmap
**`react-activity-calendar`** — GitHub contribution-style heatmap. Pass `data` as `Array<{ date: string, count: number, level: 0|1|2|3|4 }>`. SSR-compatible with Next.js App Router.

### Celebration
**`canvas-confetti`** — call this directly from an event handler (no React wrapper needed):
```typescript
confetti({
  particleCount: 120,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#16a34a', '#86efac', '#f0fdf4', '#ffffff'],
})
```

### Page and component animations
**Framer Motion** for page transitions (`opacity` + `y` slide-up, 0.3s), card entrance animations, and the spring checkmark animation on the celebration overlay. **AutoAnimate** (`@formkit/auto-animate`) for zero-config list add/remove on the dashboard — apply with `const [parent] = useAutoAnimate()` and `<div ref={parent}>`.

### Onboarding forms
shadcn/ui `Card` + `Progress` + `Button` — no form library needed. Each question is a standalone component showing 4 option buttons. No `<form>` tags, no `<input>` elements — just `onClick` handlers and local state.

---

## UI Color System (Tailwind)

```
Body background:   bg-[#0f1a0f]   ← near-black with green tint
Card background:   bg-[#1a2e1a]
Primary green:     green-600  (#16a34a)   ← CTAs, streak, active states
Text primary:      green-50   (#f0fdf4)
Text muted:        green-300  (#86efac)
Celebration:       green-400

Category badge colors:
  food      →  bg-amber-500
  transport →  bg-blue-600
  energy    →  bg-yellow-500
  shopping  →  bg-purple-600
  water     →  bg-cyan-500
  waste     →  bg-orange-500
```

---

## Free External APIs — Use All of These

These are free at demo-day volume (~30–50 total calls). Never call any of them client-side — all live in server-side API routes, wrapped in the Redis cache helper.

**Upstash Redis** (`lib/redis.ts`) — free, no CC, sign up at upstash.com. `@upstash/redis` is HTTP-based and runs natively in Vercel serverless — no TCP connection issues.

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached
  const fresh = await fetcher()
  await redis.setex(key, ttlSeconds, fresh)
  return fresh
}
```

Cache TTLs: weather → 1800s (30 min) · grid intensity → 3600s (1 hr) · weekly report → 86400s (24 hr)

**Google Maps Platform** (`lib/google-maps.ts`) — $200/month free credit, no CC needed for setup. Enable at console.cloud.google.com. Enable **Geocoding API** and **Distance Matrix API** only — no map rendering, pure server-side calls.

Two functions to implement:
- `geocodeAddress(address: string): Promise<{ lat: number, lng: number }>` — converts "Williamsburg, Brooklyn" or "10001" to coordinates. Called during onboarding for both home and work addresses.
- `getCommuteDistance(originLat, originLng, destLat, destLng): Promise<{ drivingMiles: number, transitMinutes: number }>` — returns driving distance (fed to Climatiq for CO₂) and transit duration (fed to action prompt for framing: "only 4 min longer by subway").

This replaces the static city list and the commute slider. Chain: real address → real distance → real CO₂.

**Climatiq** (`lib/climatiq.ts`) — 250 calls/month free, no CC, sign up at climatiq.io.
Called once during `/api/generate-profile` using the distance from Google Maps. Result cached in the user's Supabase row — never recalculated per action.

```
POST https://beta4.api.climatiq.io/estimate
Authorization: Bearer {CLIMATIQ_API_KEY}
Body: { "emission_factor": { "activity_id": "passenger_vehicle-vehicle_type_car-..." }, "parameters": { "distance": 4.6, "distance_unit": "mi" } }
```

Store `car_co2_kg_per_trip`, `transit_co2_kg_per_trip`, and `daily_savings_if_switched` in the users table.

**Electricity Maps** (`lib/electricity-maps.ts`) — free single-zone, sign up at electricitymaps.com.
Wrap call in `getCached('grid:{zone}', fetcher, 3600)`. Renders as `GridIntensityWidget.tsx` on the dashboard. When `carbonIntensity < 150` → green. 150–300 → yellow. >300 → red. When green, bias action candidate scoring toward energy category.

```
GET https://api.electricitymap.org/v3/carbon-intensity/latest?zone={zone}
auth-token: {ELECTRICITY_MAPS_API_KEY}
```

Zone lookup from lat/lng (implement as a simple bounding-box lookup in `lib/electricity-maps.ts`):
NYC = `US-NY-NYIS` · California = `US-CAL-CISO` · Texas = `US-TEX-ERCO` · Chicago = `US-MIDA-PJM`

**Open-Meteo** (`lib/open-meteo.ts`) — unlimited, no key. Wrap in `getCached('weather:{lat}:{lng}', fetcher, 1800)`. Pass `temperature_2m` and `weathercode` to the action generator prompt so the LLM writes contextual copy naturally.

```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,weathercode&temperature_unit=fahrenheit
```

**OpenFoodFacts** — unlimited, no key. Optional showstopper if time allows. Add a barcode scanner tab using `react-qr-barcode-scanner`. Scan any packaged food live in the demo → show Eco-Score (A–E) and CO₂/100g.

```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
→ product.ecoscore_grade, product.product_name, product.nutriments["carbon-footprint-from-known-ingredients_100g"]
```

---

## API Route Pattern (Use This Structure Every Time)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  sessionId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = RequestSchema.parse(body)

    // 1. Load user from Supabase
    // 2. Run knowledge base scoring → get top 5 candidates
    // 3. Call generateWithFallback (Groq → Gemini → static fallback)
    // 4. Save result to Supabase
    // 5. Return

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[route-name]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Environment Variables

`.env.local` (gitignored, never committed):
```
GROQ_API_KEY=                       # Get free at console.groq.com — no CC
GEMINI_API_KEY=                     # Get free at aistudio.google.com — no CC
NEXT_PUBLIC_SUPABASE_URL=           # From Supabase project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # From Supabase project Settings → API
CLIMATIQ_API_KEY=                   # Get free at climatiq.io — no CC, 250 calls/month
ELECTRICITY_MAPS_API_KEY=           # Get free at electricitymaps.com — single zone free
GOOGLE_MAPS_API_KEY=                # console.cloud.google.com — $200/month free credit, enable Geocoding + Distance Matrix
UPSTASH_REDIS_REST_URL=             # From Upstash dashboard — free, no CC
UPSTASH_REDIS_REST_TOKEN=           # From Upstash dashboard — free, no CC
```

`.env.example` (committed to repo):
```
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
CLIMATIQ_API_KEY=your_climatiq_api_key_here
ELECTRICITY_MAPS_API_KEY=your_electricity_maps_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

---

## Demo Mode

When `?demo=true` is present in the URL:
- Use hardcoded profile: `city: "New York", commuteType: "transit", dietPattern: "meat_most_days", primaryBarrier: "time", primaryMotivation: "money"`
- Hardcoded streak: 12 days
- Hardcoded totals: 14.4 kg CO₂ saved · $43.20 saved · 18 actions
- **Still call Groq live** for action generation — this is the magic moment judges need to see adapt in real time
- Skip all Supabase reads/writes in demo mode

---

## Installed Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "@ai-sdk/openai": "latest",
    "ai": "latest",
    "zod": "latest",
    "@supabase/supabase-js": "latest",
    "@upstash/redis": "latest",
    "@tremor/react": "latest",
    "framer-motion": "latest",
    "@formkit/auto-animate": "latest",
    "canvas-confetti": "latest",
    "@types/canvas-confetti": "latest",
    "react-circular-progressbar": "latest",
    "react-activity-calendar": "latest",
    "lottie-react": "latest",
    "lucide-react": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

shadcn/ui components to install: `button card progress badge sheet dialog skeleton sonner`

---

## Build Order for Claude Code Sessions

1. **Setup** — Create Next.js project, install all dependencies (including `@upstash/redis`), configure Tailwind green theme, init shadcn/ui, create `.env.local` with all nine keys, create all four Supabase tables + `update_streak` RPC via SQL editor, create `.env.example`, push to GitHub, connect Vercel with all env vars added
2. **Data** — Create all JSON files in `/data/knowledge-base/` (action library + emissions factors), implement `lib/knowledge-base.ts` scoring function, implement `lib/emissions/calculator.ts` and `lib/emissions/equivalencies.ts`
3. **Infrastructure layer** — Implement `lib/redis.ts` (Upstash singleton + `getCached` helper), `lib/supabase.ts`, `lib/google-maps.ts` (geocodeAddress + getCommuteDistance), `lib/climatiq.ts`, `lib/electricity-maps.ts` (with zone lookup), `lib/open-meteo.ts`. Test each with a temporary route before moving on.
4. **AI layer** — Implement `lib/ai.ts` (Groq + Gemini via Vercel AI SDK), define all Zod schemas in `lib/schemas.ts`, write all four prompt builders in `lib/prompts/`
5. **API routes** — All four route handlers: `generate-profile` (Google Maps → Climatiq → AI → Supabase), `generate-action` (Redis cache → knowledge base → AI → Supabase), `complete-action` (streak RPC + impact totals), `weekly-report` (Redis cache → AI)
6. **Onboarding UI** — 5-question flow with Framer Motion transitions, home + work address inputs, connect to `/api/generate-profile`, profile reveal screen
7. **Dashboard UI** — MicroActionCard, GridIntensityWidget (Electricity Maps), ImpactDashboard (Tremor), StreakDisplay (react-circular-progressbar), ActivityHeatmap (react-activity-calendar), CelebrationOverlay (canvas-confetti), WeeklyReport
8. **Polish** — Loading skeletons, error states, demo mode (`?demo=true`), responsive mobile (375px), production deploy

---

## Common Mistakes to Avoid

- **Calling any external API client-side.** Never. LLM, Google Maps, Climatiq, Electricity Maps, Open-Meteo — all live in `/app/api/` route handlers only. Components call `fetch('/api/...')`.
- **Forgetting `'use client'`** on any component using `useState`, `useEffect`, `useRef`, `localStorage`, or browser APIs.
- **Not handling idempotency.** The `generate-action` route must check Supabase (and optionally Redis) for today's existing action before generating a new one. Never generate twice for the same user on the same date.
- **Not wrapping external API calls in `getCached`.** Every call to Open-Meteo, Electricity Maps, and the weekly report AI call must go through the Redis cache helper. Raw calls on every request will feel slow and waste quota.
- **Catching ZodError as a 500.** ZodError from request validation is a client error (400). Only unexpected server failures are 500.
- **Creating a new Supabase or Redis client per request.** Always import singletons from `lib/supabase.ts` and `lib/redis.ts`.
- **Using Recharts directly.** Always use shadcn/ui chart components (which wrap Recharts) to stay consistent with the design system.
- **Hardcoding CO₂ values anywhere outside `/data/`.** The data directory is the single source of truth. API routes read from it via `lib/knowledge-base.ts`.
- **Forgetting the static fallback.** If Groq AND Gemini both fail, return the top-scored candidate from the knowledge base. Never error on the action generation endpoint.
- **Calling Google Maps Distance Matrix without caching the result.** The commute distance never changes — store it in the `users` Supabase row on profile creation and read from there forever after.
- **Missing `type-only` imports.** Use `import type { MicroAction }` for type-only imports in server components to avoid bundling issues.