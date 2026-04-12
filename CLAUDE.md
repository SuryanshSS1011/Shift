# CLAUDE.md — Shift Project

> This file is the single source of truth for the current state of the codebase. Read it fully before writing any code. The app has grown significantly across multiple sessions — never assume anything from earlier sessions still reflects reality.

---

## What Shift Is Now

Shift is a full sustainability platform with four integrated layers:

1. **Main web app (PWA)** — onboards users with goal-setting, delivers AI-personalized daily sustainability micro-actions, tracks streaks (global + per-category), awards points, shows live grid intensity, projects impact forward, and surfaces UN SDG contributions throughout.

2. **Eco-LLM dashboard (`/eco-llm`)** — tracks the environmental cost of every AI inference call made by the app. Shows energy (Wh), carbon (gCO₂), and water (mL) per query, cumulative totals, cache hit savings, and a carbon ROI ratio comparing AI cost to sustainability savings enabled. Breaks down usage by source (action generation vs. Gemini prompts).

3. **Chrome extension (`/extension/`)** — runs on Google Gemini. Counts tokens in real time, displays environmental impact per prompt, queries the semantic cache for similar past prompts, and shows a cached suggestion if similarity > 0.9. Tags action generation requests separately in the Eco-LLM dashboard.

4. **Shareable impact cards (`/share/[sessionId]`)** — public OG-image-compatible pages showing a user's level, CO₂ saved, points, top SDGs, and streak. Shareable from the dashboard.

**Stack:** Next.js 14 (App Router, PWA) · TypeScript · Tailwind CSS · shadcn/ui · Groq (primary LLM) · Gemini (fallback LLM) · Vercel AI SDK · Supabase (Postgres + pgvector) · Upstash Redis (TTL cache) · Upstash Vector (semantic cache) · Sentry · PostHog · Resend · Vercel · Framer Motion · Tremor · canvas-confetti

---

## Absolute Rules — Never Violate These

1. **Never call any LLM or external API client-side.** All Groq, Gemini, Google Maps, Climatiq, Electricity Maps, Open-Meteo calls happen in `/app/api/` only. Components call `fetch('/api/...')`.

2. **Never use `any` in TypeScript.** Define types in `/types/`. If unsure, define it explicitly.

3. **Always validate LLM output with Zod.** Use `generateObject` with a Zod schema. Never parse free-form LLM text.

4. **Never hardcode emissions values in components or API routes.** All CO₂ factors come from `/data/knowledge-base/` via `lib/knowledge-base.ts`.

5. **Never let an AI failure crash the user experience.** Every LLM route: Groq → Gemini → static fallback. Always return something.

6. **Never commit `.env.local`.** Only `.env.example` with placeholders gets committed.

7. **Always return correct HTTP status codes.** 200 success · 400 bad input (ZodError as 400, not 500) · 500 server error.

8. **Never store PII in Upstash Vector.** Semantic cache stores prompt/response text only — never session IDs, user profiles, or personal data.

9. **Supabase free projects pause after 7 days of inactivity.** Check the dashboard daily during development.

10. **Never inflate displayed CO₂ figures.** Streak multipliers and point bonuses apply to points only — never to the actual CO₂ or dollar savings shown on action cards.

---

## Complete Project Structure

```
shift/
├── app/
│   ├── layout.tsx                         ← Root layout, PostHog provider, Toaster
│   ├── page.tsx                           ← Landing page
│   ├── globals.css
│   ├── manifest.json                      ← PWA manifest
│   ├── onboarding/page.tsx                ← Enhanced onboarding (5 questions + goal-setting + addresses)
│   ├── dashboard/page.tsx                 ← Main daily dashboard
│   ├── eco-llm/page.tsx                   ← Eco-LLM impact dashboard
│   ├── history/page.tsx                   ← Action history with points + SDG columns
│   ├── settings/page.tsx                  ← User settings
│   ├── share/[sessionId]/page.tsx         ← PUBLIC: shareable impact card (OG-compatible)
│   └── api/
│       ├── generate-action/route.ts       ← POST: AI daily action (stores points, SDGs, ai_cost_co2)
│       ├── generate-profile/route.ts      ← POST: full onboarding pipeline
│       ├── complete-action/route.ts       ← POST: mark done, update streak + category streak + points
│       ├── weekly-report/route.ts         ← POST: AI report citing SDGs (Redis cached 24h)
│       ├── grid-forecast/route.ts         ← GET: 24-hour carbon intensity forecast
│       ├── grid-intensity/route.ts        ← GET: current grid intensity for user's zone
│       ├── get-profile/route.ts           ← GET: load user profile by sessionId
│       ├── action-history/route.ts        ← GET: paginated history with points + SDGs
│       ├── eco-llm-track/route.ts         ← POST: track LLM call · GET: session metrics
│       ├── eco-llm-metrics/route.ts       ← GET: cumulative eco-llm stats by source
│       ├── freeze-streak/route.ts         ← POST: use streak freeze
│       ├── export-data/route.ts           ← GET: full user data export
│       └── push-subscribe/route.ts        ← POST: web push subscription
│
├── components/
│   ├── ui/                                ← shadcn/ui (never edit)
│   ├── onboarding/
│   │   ├── OnboardingShell.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── GoalSetting.tsx                ← duration/frequency/difficulty/focus areas
│   │   └── ProfileReveal.tsx              ← shows level, top SDGs, footprint estimate
│   ├── dashboard/
│   │   ├── MicroActionCard.tsx            ← shows points badge, SDG tags, AI cost line
│   │   ├── StreakDisplay.tsx              ← global streak ring
│   │   ├── CategoryStreaks.tsx            ← horizontal scrollable per-category streak badges
│   │   ├── ActivityHeatmap.tsx
│   │   ├── ImpactDashboard.tsx            ← CO₂, $, points, level badge
│   │   ├── ImpactProjection.tsx           ← forward projection card (unlocks at 3 actions)
│   │   ├── GridIntensityWidget.tsx        ← live grid carbon intensity
│   │   ├── GridForecastChart.tsx          ← 24-hour forecast with best/worst windows
│   │   ├── CelebrationOverlay.tsx         ← confetti + points earned display
│   │   └── WeeklyReport.tsx               ← AI narrative with SDG citations
│   ├── eco-llm/
│   │   ├── EcoLLMDashboard.tsx
│   │   ├── ImpactPerQuery.tsx
│   │   ├── CarbonROICard.tsx
│   │   ├── SourceBreakdown.tsx            ← action generation vs. Gemini prompts
│   │   └── SessionSummary.tsx
│   ├── share/
│   │   └── ImpactShareCard.tsx            ← rendered on /share/[sessionId]
│   └── shared/
│       ├── Header.tsx
│       ├── SDGBadge.tsx                   ← reusable SDG number badge with official color
│       └── WeatherBadge.tsx
│
├── extension/                             ← Chrome extension (Manifest V3, targets Gemini)
│   ├── manifest.json
│   ├── background.js                      ← semantic cache, carbon estimation, eco-llm-track
│   ├── content.js                         ← token counter, impact overlay, cache suggestion banner
│   ├── popup.html
│   ├── styles.css
│   └── markdown.html
│
├── lib/
│   ├── ai.ts                              ← generateWithFallback() Groq → Gemini → throw
│   ├── schemas.ts                         ← All Zod schemas
│   ├── supabase.ts                        ← Singleton Supabase client
│   ├── redis.ts                           ← Upstash Redis + getCached() helper
│   ├── upstash-vector.ts                  ← Semantic cache: store/query prompt embeddings
│   ├── knowledge-base.ts                  ← Action scoring + candidate selection
│   ├── carbon-estimation.ts               ← EcoLogits TypeScript model
│   ├── points.ts                          ← Points formula + level computation
│   ├── climatiq.ts
│   ├── electricity-maps.ts                ← getGridIntensity() + getGridForecast()
│   ├── google-maps.ts
│   ├── open-meteo.ts
│   ├── batch-scheduler.ts                 ← defer jobs to low-carbon windows
│   ├── posthog.ts
│   ├── email.ts                           ← Resend weekly digest
│   ├── notifications.ts                   ← Web push triggers
│   ├── prompts/
│   │   ├── system-prompt.ts
│   │   ├── action-generator.ts
│   │   ├── profile-builder.ts
│   │   └── weekly-report.ts               ← includes SDG citations in narrative
│   └── emissions/
│       ├── calculator.ts
│       ├── equivalencies.ts
│       └── projection.ts                  ← projectImpact() forward projection
│
├── data/
│   ├── knowledge-base/
│   │   ├── action-library.json            ← 190 actions, each with sdgTags: number[]
│   │   ├── food-emissions.json
│   │   ├── transport-emissions.json
│   │   ├── home-energy.json
│   │   └── shopping-waste.json
│   ├── sdgs.json                          ← All 17 SDGs: id, name, shortName, color, emoji
│   └── us-cities/
│       └── transit-data.json
│
├── public/
│   ├── sw.js                              ← PWA service worker
│   └── icons/
│
└── types/
    ├── user.ts                            ← UserProfile, OnboardingAnswers (with goal-setting)
    ├── action.ts                          ← MicroAction, ActionCandidate (with sdgTags, points, aiCostCo2Grams)
    ├── impact.ts                          ← ImpactTotals, StreakData, EcoLLMCall, EcoLLMMetrics
    └── grid.ts                            ← GridForecast, IntensityLevel, ForecastDataPoint
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
  goalDuration: 7 | 14 | 21 | 30
  actionFrequency: 'hourly' | 'multiple_daily' | 'daily' | 'every_other_day' | 'twice_weekly'
  preferredTime: 'morning' | 'afternoon' | 'evening'
  difficultyPreference: 'easy' | 'moderate' | 'challenge'
  focusAreas: ActionCategory[]
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
  goalDuration: number
  actionFrequency: OnboardingAnswers['actionFrequency']
  preferredTime: OnboardingAnswers['preferredTime']
  difficultyPreference: OnboardingAnswers['difficultyPreference']
  focusAreas: ActionCategory[]
  aiProfileSummary: string
  topImpactAreas: ActionCategory[]
  estimatedAnnualFootprintKg: number
  lat: number | null
  lng: number | null
  electricityZone: string | null
  carCo2KgPerTrip: number | null
  transitCo2KgPerTrip: number | null
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
  sdgTags: number[]                // e.g. [13, 7] for energy actions
  applicableDietPatterns: string[]
  applicableLivingSituations: string[]
  applicableCommuteTypes: string[]
  applicableCities: string[]
}

interface MicroAction {
  id: string
  userId: string
  actionDate: string
  category: ActionCategory
  title: string
  description: string
  anchorHabit: string
  co2SavingsKg: number
  dollarSavings: number
  timeRequiredMinutes: number
  difficultyLevel: DifficultyLevel
  behavioralFrame: BehavioralFrame
  equivalencyLabel: string
  sdgTags: number[]               // stored from action-library entry
  points: number                  // computed at generation time
  aiCostCo2Grams: number          // carbon cost of the inference that generated this
  completed: boolean
  completedAt: string | null
  createdAt: string
}

// types/impact.ts
type LevelName = 'Seedling' | 'Sprout' | 'Sapling' | 'Tree' | 'Forest'

interface ImpactTotals {
  totalCo2SavedKg: number
  totalDollarSaved: number
  totalActionsCompleted: number
  totalPoints: number
  level: LevelName
  levelEmoji: string
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActionDate: string | null
  streakFreezeAvailable: boolean
}

interface CategoryStreak {
  category: ActionCategory
  currentStreak: number
  longestStreak: number
  lastActionDate: string | null
}

interface EcoLLMCall {
  id: string
  sessionId: string
  model: string
  inputTokens: number
  outputTokens: number
  energyWh: number
  co2Grams: number
  waterMl: number
  wasCacheHit: boolean
  co2Saved: number
  source: 'action_generation' | 'gemini_prompt' | 'other'
  createdAt: string
}

interface EcoLLMMetrics {
  totalCalls: number
  totalEnergyWh: number
  totalCo2Grams: number
  totalWaterMl: number
  cacheHits: number
  co2SavedFromCaching: number
  carbonROIRatio: number
  bySource: Record<EcoLLMCall['source'], { calls: number; co2Grams: number }>
}

interface ImpactProjection {
  projectedCo2Kg: number
  projectedDollarSavings: number
  projectedPoints: number
  treeEquivalent: number
  milesEquivalent: number
  daysRemaining: number
}

// types/grid.ts
type IntensityLevel = 'low' | 'moderate' | 'high'

interface ForecastDataPoint {
  datetime: string
  carbonIntensity: number
  level: IntensityLevel
}

interface GridForecast {
  zone: string
  forecast: ForecastDataPoint[]
  bestWindow: { start: string; end: string; avgIntensity: number }
  worstWindow: { start: string; end: string; avgIntensity: number }
  currentIntensity: number
  currentLevel: IntensityLevel
}
```

---

## Points System — `lib/points.ts`

```typescript
// Points formula — applied at action generation time, stored on the actions row
export function computePoints(
  co2SavingsKg: number,
  dollarSavings: number,
  difficulty: DifficultyLevel,
  actionFrequency: OnboardingAnswers['actionFrequency']
): number {
  const difficultyMultiplier = { easy: 1.0, medium: 1.5, challenge: 2.0 }[difficulty]
  const frequencyMultiplier = {
    hourly: 3.0,
    multiple_daily: 2.0,
    daily: 1.0,
    every_other_day: 0.8,
    twice_weekly: 0.6,
  }[actionFrequency]
  return Math.round((co2SavingsKg * 10 + dollarSavings * 2) * difficultyMultiplier * frequencyMultiplier)
}

// Level thresholds — derived from total_points, never stored
export function computeLevel(totalPoints: number): { level: LevelName; emoji: string; nextLevelAt: number } {
  if (totalPoints >= 5000) return { level: 'Forest',  emoji: '🌍', nextLevelAt: Infinity }
  if (totalPoints >= 2000) return { level: 'Tree',    emoji: '🌲', nextLevelAt: 5000 }
  if (totalPoints >= 500)  return { level: 'Sapling', emoji: '🌳', nextLevelAt: 2000 }
  if (totalPoints >= 100)  return { level: 'Sprout',  emoji: '🌿', nextLevelAt: 500  }
  return                          { level: 'Seedling', emoji: '🌱', nextLevelAt: 100  }
}
```

**Important:** Points represent engagement and impact magnitude — they are a gamification layer. They do not affect the CO₂ or dollar savings displayed on the action card. Those figures always come from the emissions data, never from the points formula.

---

## SDG System

### `data/sdgs.json` — structure
```json
[
  { "id": 1,  "name": "No Poverty",                "shortName": "No Poverty",         "color": "#E5243B", "emoji": "🏠" },
  { "id": 2,  "name": "Zero Hunger",               "shortName": "Zero Hunger",        "color": "#DDA63A", "emoji": "🌾" },
  { "id": 3,  "name": "Good Health",               "shortName": "Good Health",        "color": "#4C9F38", "emoji": "💚" },
  { "id": 6,  "name": "Clean Water",               "shortName": "Clean Water",        "color": "#26BDE2", "emoji": "💧" },
  { "id": 7,  "name": "Clean Energy",              "shortName": "Clean Energy",       "color": "#FCC30B", "emoji": "⚡" },
  { "id": 9,  "name": "Industry & Innovation",     "shortName": "Innovation",         "color": "#FD6925", "emoji": "🔧" },
  { "id": 11, "name": "Sustainable Cities",        "shortName": "Sust. Cities",       "color": "#FD9D24", "emoji": "🏙️" },
  { "id": 12, "name": "Responsible Consumption",   "shortName": "Resp. Consumption",  "color": "#BF8B2E", "emoji": "♻️" },
  { "id": 13, "name": "Climate Action",            "shortName": "Climate Action",     "color": "#3F7E44", "emoji": "🌍" },
  { "id": 14, "name": "Life Below Water",          "shortName": "Below Water",        "color": "#0A97D9", "emoji": "🌊" },
  { "id": 15, "name": "Life on Land",              "shortName": "On Land",            "color": "#56C02B", "emoji": "🌳" }
]
```

### SDG mapping rules for `action-library.json`
Every action must have `sdgTags`. Apply these:

| Category | Always include | Conditionally include |
|----------|---------------|----------------------|
| All | 13 (Climate Action) | — |
| food | 2 (Zero Hunger), 12 (Resp. Consumption) | 3 (Good Health) for plant-based |
| transport | 11 (Sustainable Cities) | 3 (Good Health) for active transport (bike/walk) |
| energy | 7 (Clean Energy) | — |
| shopping | 12 (Resp. Consumption) | 9 (Innovation) for repair/reuse actions |
| water | 6 (Clean Water) | 14 (Life Below Water) |
| waste | 12 (Resp. Consumption) | 15 (Life on Land) |

### Where SDGs appear in the UI
- **`MicroActionCard`** — 2–3 SDG number badges below the impact row, each in its official color
- **`ProfileReveal`** — top 3 SDGs across user's `focusAreas` shown as "Your actions contribute to:"
- **`WeeklyReport`** — AI narrative cites which SDGs were advanced that week (prompt updated)
- **`ImpactShareCard`** — top 3 SDGs displayed with icons
- **`SDGBadge.tsx`** — shared component, props: `sdgId: number`, `size?: 'sm' | 'md'`. Loads color + shortName from `data/sdgs.json` at runtime.

---

## Carbon Estimation — `lib/carbon-estimation.ts`

EcoLogits TypeScript reimplementation. Used by the server-side `eco-llm-track` route, the action generation route, and the Chrome extension's `background.js` (copied inline, no module imports in extensions).

```typescript
const ALPHA = 8.91e-5   // Wh per output token per billion active params
const BETA  = 1.43e-3   // Wh per output token baseline
const PUE   = 1.2
const GROQ_LPU_MULTIPLIER = 0.3  // LPU efficiency vs. A100 baseline
const SPOKANE_GRID_GCO2_PER_KWH = 273   // US-NW-PACW, Groq's WA data center
const WORLD_AVG_GCO2_PER_KWH    = 490

const MODEL_PARAMS: Record<string, { active: number; total: number }> = {
  'llama-3.3-70b-versatile': { active: 70,  total: 70 },
  'llama-3.1-8b-instant':    { active: 8,   total: 8  },
  'gemini-2.0-flash-lite':   { active: 8,   total: 8  },
}

export function estimateCarbon(model: string, outputTokens: number): {
  energyWh: number
  co2Grams: number
  waterMl: number
} {
  const params = MODEL_PARAMS[model] ?? { active: 70, total: 70 }
  const gpuEnergyPerToken = ALPHA * params.active + BETA
  const gpusRequired = Math.ceil((params.total * 2 * 1.2) / 80)
  const totalEnergyWh = gpuEnergyPerToken * outputTokens * gpusRequired * PUE * GROQ_LPU_MULTIPLIER
  const gridIntensity = model.startsWith('llama') ? SPOKANE_GRID_GCO2_PER_KWH : WORLD_AVG_GCO2_PER_KWH
  return {
    energyWh:  totalEnergyWh,
    co2Grams:  (totalEnergyWh / 1000) * gridIntensity,
    waterMl:   0,  // air-cooled LPU racks, scope-1 water ≈ 0
  }
}
```

**Carbon ROI formula (used on `MicroActionCard` and `CarbonROICard`):**
```typescript
// Display as "You're saving 1,200× the AI cost"
const roi = Math.round((co2SavingsKg * 1000) / aiCostCo2Grams / 10) * 10
const displayRoi = roi > 10000 ? '10,000×+' : `${roi.toLocaleString()}×`
```

---

## Grid Intensity — `lib/electricity-maps.ts`

Two functions, both use coordinates directly (no zone lookup table needed):

`getGridIntensity(lat, lng)` — current intensity. Redis cached 1 hour at `grid:{lat}:{lng}`.
`getGridForecast(lat, lng)` — 24-hour forecast returning `GridForecast`. Redis cached 1 hour at `forecast:{lat}:{lng}`.

**Threshold values — apply these consistently everywhere:**
```typescript
export function classifyIntensity(gco2PerKwh: number): IntensityLevel {
  if (gco2PerKwh < 150) return 'low'
  if (gco2PerKwh < 300) return 'moderate'
  return 'high'
}
```

Grid state influences action scoring: `intensity === 'low'` → add +2 to energy category candidates in `searchActions()`.

---

## Impact Projection — `lib/emissions/projection.ts`

```typescript
export function projectImpact(
  recentActions: MicroAction[],
  goalDays: number,
  daysElapsed: number
): ImpactProjection | null {
  if (recentActions.filter(a => a.completed).length < 3) return null
  const completed = recentActions.filter(a => a.completed)
  const avgDailyCo2 = completed.reduce((s, a) => s + a.co2SavingsKg, 0) / Math.max(daysElapsed, 1)
  const avgDailyDollars = completed.reduce((s, a) => s + a.dollarSavings, 0) / Math.max(daysElapsed, 1)
  const avgDailyPoints = completed.reduce((s, a) => s + a.points, 0) / Math.max(daysElapsed, 1)
  const daysRemaining = Math.max(goalDays - daysElapsed, 0)
  const projectedCo2Kg = avgDailyCo2 * daysRemaining
  return {
    projectedCo2Kg,
    projectedDollarSavings: avgDailyDollars * daysRemaining,
    projectedPoints: Math.round(avgDailyPoints * daysRemaining),
    treeEquivalent: Math.round(projectedCo2Kg * 0.11),
    milesEquivalent: Math.round(projectedCo2Kg * 2.48),
    daysRemaining,
  }
}
```

`ImpactProjection` returns `null` if fewer than 3 completed actions — the UI shows a locked placeholder in that case.

---

## Supabase Schema — Current State

### Original tables (unchanged)
`users`, `actions`, `streaks`, `impact_totals` — all as originally defined.

### Additional columns on `users`
```sql
alter table users add column if not exists goal_duration integer default 30;
alter table users add column if not exists action_frequency text default 'daily';
alter table users add column if not exists preferred_time text default 'morning';
alter table users add column if not exists difficulty_preference text default 'moderate';
alter table users add column if not exists focus_areas text[] default '{}';
alter table users add column if not exists lat numeric;
alter table users add column if not exists lng numeric;
alter table users add column if not exists electricity_zone text;
alter table users add column if not exists car_co2_kg_per_trip numeric;
alter table users add column if not exists transit_co2_kg_per_trip numeric;
alter table users add column if not exists weekly_report_cache text;
alter table users add column if not exists push_subscription jsonb;
```

### Additional columns on `actions`
```sql
alter table actions add column if not exists sdg_tags integer[] default '{}';
alter table actions add column if not exists points integer default 0;
alter table actions add column if not exists ai_cost_co2_grams numeric default 0;
```

### Additional columns on `impact_totals`
```sql
alter table impact_totals add column if not exists total_points integer default 0;
```

### New tables
```sql
-- Per-category streak tracking
create table if not exists category_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  category text not null,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_action_date date,
  unique(user_id, category)
);

-- Eco-LLM call tracking
create table if not exists eco_llm_calls (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  model text not null,
  input_tokens integer default 0,
  output_tokens integer default 0,
  energy_wh numeric default 0,
  co2_grams numeric default 0,
  water_ml numeric default 0,
  was_cache_hit boolean default false,
  co2_saved numeric default 0,
  source text default 'other',   -- 'action_generation' | 'gemini_prompt' | 'other'
  created_at timestamptz default now()
);
create index on eco_llm_calls(session_id);
create index on eco_llm_calls(source);
```

---

## API Routes Reference (13 total)

| Route | Method | What's notable |
|-------|--------|----------------|
| `/api/generate-action` | POST | Stores `points`, `sdg_tags`, `ai_cost_co2_grams` on the action row |
| `/api/generate-profile` | POST | Full pipeline: Maps → Climatiq → Electricity Maps → Open-Meteo → AI |
| `/api/complete-action` | POST | Updates global streak + category streak + `total_points` |
| `/api/weekly-report` | POST | AI prompt includes SDG list from completed actions |
| `/api/grid-forecast` | GET | Returns `GridForecast` with best/worst windows |
| `/api/grid-intensity` | GET | Current intensity for user's lat/lng |
| `/api/get-profile` | GET | Returns profile with computed `level` and `levelEmoji` |
| `/api/action-history` | GET | Paginated, includes `points`, `sdgTags`, `aiCostCo2Grams` |
| `/api/eco-llm-track` | POST/GET | POST stores call · GET returns session metrics by source |
| `/api/eco-llm-metrics` | GET | Cumulative stats, `bySource` breakdown |
| `/api/freeze-streak` | POST | One-time use per user |
| `/api/export-data` | GET | Full GDPR-style export |
| `/api/push-subscribe` | POST | Web push registration |

---

## Key UI Components — What Each One Shows

**`MicroActionCard`**
- Category badge · Difficulty badge · Time badge
- Title + anchor habit sentence
- Impact row: 🌿 X kg CO₂ · 💸 $Y · ⏱️ Z min
- Equivalency line: "= N miles not driven"
- SDG badges (2–3, colored by official SDG color)
- Points badge: "+12 pts" (top right corner)
- Description paragraph
- "I Did This ✓" button (full width, green-600)
- AI cost line (muted, bottom): "⚡ 0.08 gCO₂ AI cost · saving 1,200×"
- Skip link

**`ImpactDashboard`**
- CO₂ saved (Tremor Metric + delta badge)
- $ saved
- Total points + level emoji + level name

**`CelebrationOverlay`**
- canvas-confetti
- Checkmark spring animation
- "+N pts" prominently displayed alongside streak increment
- Updated CO₂ total

**`ImpactProjection`**
- Locked state (< 3 actions): "Complete 3 actions to unlock"
- Unlocked: "At your pace: save X kg · $Y · N pts in Z days = N trees"
- Framer Motion count-up animation on first render

**`CategoryStreaks`**
- Horizontal scroll row
- Only shows categories with `current_streak > 0`
- Format: `🍽️ 4` · `🚇 2` · `⚡ 7`

**`ImpactShareCard`** (rendered on `/share/[sessionId]`)
- Level emoji + level name
- Total CO₂ saved (large)
- Total points
- Top 3 SDG badges
- Current streak
- "Join Shift" CTA
- OG meta tags for social preview

---

## Chrome Extension Notes

**The extension is a separate build environment.** It cannot use Node modules, Next.js APIs, or `.env.local`. Any shared logic must be manually copied and transpiled into extension source files.

**Shared logic in the extension:**
- `estimateCarbon()` from `lib/carbon-estimation.ts` — copied inline into `background.js`
- Upstash Vector REST API — called directly via `fetch()`, credentials stored in `chrome.storage.local`

**Tagging action generation calls:** When `background.js` detects a request to `/api/generate-action` (via `chrome.webRequest` or message from content script), it tags the resulting `eco-llm-track` POST with `source: 'action_generation'`. All other Gemini prompts are tagged `source: 'gemini_prompt'`.

**Extension ↔ app sessionId handshake:** During onboarding, the web app posts the sessionId to `chrome.runtime` if the extension is installed. The extension stores it in `chrome.storage.local` and uses it for all `eco-llm-track` API calls.

---

## Environment Variables

```
GROQ_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLIMATIQ_API_KEY=
ELECTRICITY_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=
RESEND_API_KEY=
```

---

## Demo Mode (`?demo=true`)

- Hardcoded profile: NYC · transit · meat_most_days · time-constrained · money-motivated
- Hardcoded streak: 12 days · 14.4 kg CO₂ saved · $43.20 saved · 18 actions · 847 points · Sprout 🌿
- Hardcoded category streaks: food 4 · energy 7 · transport 2
- Hardcoded eco-LLM: 47 queries · 8.2 Wh · 2.1 gCO₂ · 12 cache hits · 238,000:1 ROI
- **Still call Groq live** for action generation
- Skip all Supabase reads/writes

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
    "@ai-sdk/google": "3.0.62",
    "ai": "latest",
    "zod": "latest",
    "@supabase/supabase-js": "latest",
    "@upstash/redis": "latest",
    "@upstash/vector": "1.2.3",
    "@sentry/nextjs": "10.48.0",
    "posthog-js": "1.367.0",
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
    "tailwind-merge": "latest",
    "resend": "latest"
  }
}
```

---

## Build Status

**Complete:**
- ✅ Phase 0–1: Setup, dependencies, Supabase schema
- ✅ Phase 2: Data layer (190 actions + SDG tags, emissions JSON, knowledge-base.ts)
- ✅ Phase 3: Infrastructure (Redis, Supabase, Google Maps, Climatiq, Electricity Maps, Open-Meteo, AI, prompts)
- ✅ Phase 4: Original 4 API routes
- ✅ Phase 5: Enhanced onboarding UI with goal-setting
- ✅ Chrome extension (full Manifest V3)
- ✅ Eco-LLM dashboard
- ✅ Semantic caching (Upstash Vector)
- ✅ Grid forecast
- ✅ PWA, PostHog, Sentry
- ✅ 9 additional API routes (13 total)
- ✅ Points system (`lib/points.ts`, DB columns, MicroActionCard badge, ImpactDashboard, CelebrationOverlay)
- ✅ SDG tags (`data/sdgs.json`, SDGBadge component, MicroActionCard badges)
- ✅ AI cost transparency (`lib/carbon-estimation.ts`, MicroActionCard AI cost line)
- ✅ Impact projection (`lib/emissions/projection.ts`, ImpactProjection component)
- ✅ Category streaks (category_streaks table, CategoryStreaks component)
- ✅ Shareable impact card (`/share/[sessionId]`, ImpactShareCard component, OG metadata)
- ✅ Dashboard share button with clipboard copy

**Remaining:**
- Polish, responsive mobile testing
- Update action-library.json with sdgTags for all 190 actions (currently using default SDGs by category)
- Production deploy

---

## Common Mistakes to Avoid

- **Calling any external API client-side.** Never. All external calls in `/app/api/`.
- **Forgetting `'use client'`** on components using hooks or browser APIs.
- **Not handling generate-action idempotency.** Existing action for today → return it, never regenerate.
- **Inflating CO₂ figures with points multipliers.** Points are gamification only. Displayed CO₂ and dollar savings are always raw emissions data values.
- **Wrapping external API calls without Redis cache.** Open-Meteo and Electricity Maps must use `getCached()`.
- **Storing PII in Upstash Vector.** Prompt/response text only. No session IDs, no profiles.
- **Catching ZodError as 500.** It's a 400.
- **Using wrong intensity thresholds.** Low < 150 · Moderate 150–300 · High ≥ 300. Consistent everywhere.
- **Treating the Chrome extension as part of Next.js.** Separate build. Shared logic must be copied manually.
- **New Supabase/Redis/Vector clients per request.** Always import singletons.
- **Hardcoding CO₂ values outside `/data/`.** Single source of truth.
- **Missing the static fallback.** Groq + Gemini both fail → `getActionById()` returns something valid.
- **Computing level from total_points in the DB.** Level is always derived in code, never stored. Use `computeLevel()` from `lib/points.ts`.
- **SDG colors from memory.** Always load from `data/sdgs.json`. The `SDGBadge` component handles this — never hardcode hex colors for SDGs elsewhere.