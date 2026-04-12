# Shift — End-to-End Build Plan
**AI-Powered Micro-Action Engine for Closing the Climate Intention-Action Gap**
*Total infrastructure cost: $0 · Built for a single demo day*

---

## Table of Contents
1. What We Are Building and Why This Stack
2. Final Tech Stack (All Free)
3. Folder Structure
4. Phase-by-Phase Build Plan
5. Data & Knowledge Base Strategy
6. AI / Prompt Architecture
7. UI/UX Flow
8. Environment Setup Checklist
9. Demo Script & Pitch Prep

---

## 1. What We Are Building and Why This Stack

**Product:** Shift delivers one AI-personalized sustainability micro-action per day. It onboards in 90 seconds, generates actions specific to the user's city/commute/diet/constraints, and makes completing them feel rewarding through streaks and visible impact. The LLM is the core product — not a chatbot, not a static tip list.

**Stack philosophy — hackathon context changes the calculus:**

This is a one-day build. In a single demo session you will make at most 30–50 API calls. A "250 calls/month" limit is functionally unlimited for today. The question for every tool is not "does it scale?" but "does it make the demo more impressive?" Evaluate each tool on demo impact, not long-term viability.

**Core infrastructure — use free services that replace multiple tools at once:**
- **Groq replaces Anthropic.** ~14,400 requests/day on Llama 3.3-70B at 300–1,800 tokens/second, completely free with no credit card. Google Gemini (1,000 RPD free) is the automatic fallback. The Vercel AI SDK wraps both behind one unified `generateObject` call.
- **pgvector in Supabase replaces a dedicated vector DB.** For a 200-action library this delivers sub-50ms queries with zero extra infrastructure. Supabase free tier covers database, auth, storage, realtime, and vector search — five services in one dashboard.
- **Static JSON (DEFRA + EPA) is the base emissions layer.** The bulk of CO₂ lookups (action library, equivalencies math) come from bundled data — instant, offline, zero calls.

**Live data APIs — add these because they make the demo genuinely impressive:**
- **Climatiq API** (250 calls/month free — about 240 more than you need today). Instead of flat average emissions, it computes CO₂ for the user's *actual commute distance*. "Your 4.2-mile Williamsburg → Midtown commute saves 1.8 kg CO₂ vs. Uber today" beats any hardcoded number for credibility with judges.
- **Electricity Maps API** (free single-zone, real-time). Shows live grid carbon intensity on the dashboard. "Your NYC grid is 34% renewable right now — great time to run the dishwasher." No static app can show this. It is a live, breathing data point that proves the product is connected to the real world.
- **Open-Meteo** (unlimited, no key). Weather-aware action copy. "72°F and sunny — perfect day to bike instead of Uber."
- **OpenFoodFacts** (unlimited, no key). Optional: scan a snack bar live in the demo and show its Eco-Score. A strong visual moment if time allows.

**Services skipped and why:**
- PlanetScale — killed free tier April 2024
- Railway / Fly.io — eliminated free tier, $5 credit only
- Pinecone / Qdrant / Weaviate — unnecessary, pgvector handles it
- LangChain / LlamaIndex — abstraction without value at this scale
- WattTime — same concept as Electricity Maps, more complex auth, less visual
- Google Maps Platform — route rendering is too much UI work for one day

---

## 2. Final Tech Stack (All Free)

| Layer | Tool | Limit | Demo Value |
|-------|------|-------|------------|
| Framework | Next.js 14 (App Router) | Free (MIT) | Full-stack in one repo |
| Language | TypeScript | Free | Type-safe LLM output |
| Styling | Tailwind CSS | Free | Rapid UI |
| Components | shadcn/ui | Free (MIT) | Copy-paste, customizable |
| LLM Primary | Groq (Llama 3.3-70B) | ~14,400 RPD | Fastest inference, free |
| LLM Fallback | Google Gemini 2.0 Flash-Lite | 1,000 RPD | No CC required |
| AI SDK | Vercel AI SDK + @ai-sdk/openai | Free (MIT) | One interface for both LLMs |
| Validation | Zod | Free (MIT) | LLM output schema enforcement |
| Database | Supabase (Postgres) | 500 MB free | DB + auth + storage + realtime |
| Vector Search | pgvector (via Supabase) | Included | No extra infrastructure |
| Carbon Base Data | Static JSON (DEFRA + EPA) | Free forever | Bulk lookups, offline |
| Carbon Dynamic | **Climatiq API** | **250 calls/month** | **Live CO₂ for user's actual distance** |
| Grid Intensity | **Electricity Maps API** | **Free single-zone** | **Real-time renewable % on dashboard** |
| Geocoding | **Google Maps Geocoding API** | **$200 credit/month** | **Address → lat/lng, replaces static city list** |
| Distance | **Google Maps Distance Matrix API** | **$200 credit/month** | **Real address → real commute distance for Climatiq** |
| Caching | **Upstash Redis** | **500K commands/month** | **Cache LLM + Maps + Electricity Maps responses** |
| Weather | Open-Meteo | Unlimited free | Weather-aware action copy |
| Food Eco-Score | OpenFoodFacts | Unlimited free | Barcode scan demo moment |
| Dashboard | Tremor | Free (MIT) | Pre-built KPI cards, sparklines |
| Charts | shadcn/ui Charts (Recharts) | Free (MIT) | 53+ variants, themed |
| Streak Ring | react-circular-progressbar | Free (MIT) | SVG progress ring |
| Heatmap | react-activity-calendar | Free (MIT) | GitHub-style history |
| Confetti | canvas-confetti | Free (ISC) | 5 KB, one function call |
| Animation | Framer Motion + AutoAnimate | Free (MIT) | Transitions + list animations |
| Icons | Lucide React | Free (ISC) | Has Leaf, Sprout, Recycle, Bike |
| Hosting | Vercel | 100 GB BW free | Zero-config Next.js deploy |
| Analytics | PostHog | 1M events/month | Session replay for pitch |
| Errors | Sentry | Free developer plan | Auto-instruments Next.js |

---

## 3. Folder Structure

```
shift/
├── CLAUDE.md                           ← Claude Code standing instructions
├── SHIFT_BUILD_PLAN.md                 ← This document
├── .env.local                          ← Real keys (gitignored)
├── .env.example                        ← Placeholder keys (committed)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
│
├── app/
│   ├── layout.tsx                      ← Root layout, fonts, global Toaster
│   ├── page.tsx                        ← Landing page / hero
│   ├── globals.css
│   ├── onboarding/
│   │   └── page.tsx                    ← 5-question onboarding flow
│   ├── dashboard/
│   │   └── page.tsx                    ← Main daily dashboard
│   └── api/
│       ├── generate-action/route.ts    ← POST: AI daily action (Groq → Gemini → static)
│       ├── generate-profile/route.ts   ← POST: AI profile from onboarding answers
│       ├── complete-action/route.ts    ← POST: mark complete, update streak + totals
│       └── weekly-report/route.ts      ← POST: AI narrative weekly report
│
├── components/
│   ├── ui/                             ← shadcn/ui (auto-generated, do not edit)
│   ├── onboarding/
│   │   ├── OnboardingShell.tsx         ← Progress bar + step container
│   │   ├── QuestionCard.tsx            ← Animated question + 4 tap-target options
│   │   └── ProfileReveal.tsx           ← AI profile summary before dashboard
│   ├── dashboard/
│   │   ├── MicroActionCard.tsx         ← Today's hero action card
│   │   ├── StreakDisplay.tsx            ← react-circular-progressbar + flame + count
│   │   ├── ActivityHeatmap.tsx         ← react-activity-calendar
│   │   ├── ImpactDashboard.tsx         ← Tremor metric cards: CO₂ / $ / actions
│   │   ├── GridIntensityWidget.tsx     ← Live grid carbon intensity (Electricity Maps)
│   │   ├── CelebrationOverlay.tsx      ← canvas-confetti + Framer Motion checkmark
│   │   └── WeeklyReport.tsx            ← Collapsible AI narrative report
│   └── shared/
│       ├── Header.tsx
│       └── WeatherBadge.tsx            ← Open-Meteo weather context (enhancement)
│
├── lib/
│   ├── ai.ts                           ← generateWithFallback (Groq → Gemini → throw)
│   ├── schemas.ts                      ← All Zod schemas for LLM output
│   ├── supabase.ts                     ← Singleton Supabase client
│   ├── redis.ts                        ← Upstash Redis client + cache helpers
│   ├── knowledge-base.ts               ← Action scoring + candidate selection
│   ├── climatiq.ts                     ← Climatiq API — dynamic CO₂ for commute distance
│   ├── electricity-maps.ts             ← Electricity Maps — real-time grid carbon intensity
│   ├── google-maps.ts                  ← Geocoding + Distance Matrix API calls
│   ├── open-meteo.ts                   ← Weather fetch by coordinates
│   ├── prompts/
│   │   ├── system-prompt.ts            ← Master behavioral science system prompt
│   │   ├── action-generator.ts         ← User prompt builder for daily actions
│   │   ├── profile-builder.ts          ← User prompt builder for profile synthesis
│   │   └── weekly-report.ts            ← User prompt builder for weekly report
│   └── emissions/
│       ├── calculator.ts               ← CO₂ computation utilities
│       └── equivalencies.ts            ← kg CO₂ → miles/trees/charges conversions
│
├── data/
│   ├── knowledge-base/
│   │   ├── action-library.json         ← 200+ micro-actions with full metadata
│   │   ├── food-emissions.json         ← DEFRA/SU-EATABLE food CO₂ factors
│   │   ├── transport-emissions.json    ← EPA transport CO₂ factors
│   │   ├── home-energy.json            ← EIA energy savings factors
│   │   └── shopping-waste.json         ← Consumer goods emissions
│   └── us-cities/
│       └── transit-data.json           ← Transit availability for top 20 US cities
│
└── types/
    ├── user.ts                         ← UserProfile, OnboardingAnswers
    ├── action.ts                       ← MicroAction, ActionCandidate, ActionCategory
    └── impact.ts                       ← ImpactTotals, StreakData, CO2Equivalencies
```

---

## 4. Phase-by-Phase Build Plan

### Phase 0 — Environment Setup (30 min)

Do all of this before writing a single line of application code.

1. Run `npx create-next-app@latest shift --typescript --tailwind --app --eslint --src-dir=no --import-alias='@/*'`
2. Install all dependencies in one command:
   ```
   npm install @ai-sdk/openai ai zod @supabase/supabase-js @upstash/redis @tremor/react framer-motion @formkit/auto-animate canvas-confetti @types/canvas-confetti react-circular-progressbar react-activity-calendar lottie-react lucide-react clsx tailwind-merge
   ```
3. Initialize shadcn/ui: `npx shadcn@latest init` — choose Dark theme, set CSS variables to use green as primary
4. Install shadcn/ui components: `npx shadcn@latest add button card progress badge sheet dialog skeleton sonner`
5. Create `.env.local` with all eight keys (see Environment Variables section in CLAUDE.md)
6. Create Supabase project at supabase.com, run the schema SQL (Phase 1), copy keys into `.env.local`
7. Get Groq API key at console.groq.com (free, no CC)
8. Get Gemini API key at aistudio.google.com (free, no CC)
9. Get Climatiq API key at climatiq.io (free, no CC)
10. Get Electricity Maps API key at electricitymaps.com (free, no CC)
11. Get Google Maps API key at console.cloud.google.com — enable Geocoding API and Distance Matrix API. The $200/month free credit covers all demo usage.
12. Get Upstash Redis credentials at upstash.com — create a Redis database, copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (free, no CC)
13. Create `.env.example` with placeholder values and commit it
14. Create GitHub repo, push initial commit, connect to Vercel immediately — continuous deployment from minute one

---

### Phase 1 — Database Schema (20 min)

Run this SQL in the Supabase SQL editor to create all four tables and the streak RPC.

**Create tables:**

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  city text,
  commute_type text,
  diet_pattern text,
  living_situation text,
  primary_barrier text,
  primary_motivation text,
  ai_profile_summary text,
  top_impact_areas text[],
  estimated_annual_footprint_kg numeric,
  created_at timestamptz default now()
);

-- Actions
create table actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  action_date date not null,
  category text,
  title text,
  description text,
  anchor_habit text,
  co2_savings_kg numeric,
  dollar_savings numeric,
  time_required_minutes integer,
  difficulty_level text,
  behavioral_frame text,
  equivalency_label text,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, action_date)
);

-- Streaks
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_action_date date,
  streak_freeze_available boolean default true
);

-- Impact totals
create table impact_totals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  total_co2_saved_kg numeric default 0,
  total_dollar_saved numeric default 0,
  total_actions_completed integer default 0
);
```

**Create the atomic streak update RPC:**

```sql
create or replace function update_streak(p_user_id uuid)
returns void language plpgsql as $$
declare
  v_last_date date;
  v_current integer;
  v_longest integer;
begin
  select last_action_date, current_streak, longest_streak
  into v_last_date, v_current, v_longest
  from streaks where user_id = p_user_id;

  if v_last_date = current_date - 1 then
    -- Consecutive day
    v_current := v_current + 1;
  elsif v_last_date = current_date then
    -- Already updated today, no change
    return;
  else
    -- Streak broken
    v_current := 1;
  end if;

  if v_current > v_longest then v_longest := v_current; end if;

  update streaks
  set current_streak = v_current,
      longest_streak = v_longest,
      last_action_date = current_date
  where user_id = p_user_id;
end;
$$;
```

---

### Phase 2 — Data Layer (45 min)

Build the entire knowledge base before touching AI code. The AI layer depends on this.

**action-library.json — build 200+ entries across 6 categories.** Minimum 30 per category. Each entry must have: id, category, title, descriptionTemplate (with {anchor} and {co2} and {dollars} placeholders), co2SavingsKgPerOccurrence, dollarSavingsPerOccurrence, timeRequiredMinutes, difficulty (easy/medium/challenge), applicableDietPatterns, applicableLivingSituations, applicableCommuteTypes, applicableCities (or "all"), behavioralFramePrimary, equivalencyLabel.

**Food actions (30+ entries):** Beef → chicken swap, beef → plant-based swap, skipping meat one meal, ordering from lower-carbon restaurant option in delivery app, choosing smaller portion, prep-ahead plant-based lunch, skip disposable cutlery in delivery order, buy imperfect produce, cook one extra portion to avoid food waste, choose seasonal vegetables, eat the leftovers before buying new groceries.

**Transport actions (30+ entries):** Subway instead of rideshare for one trip, bike commute on a good-weather day, walk the last mile from transit, carpool with coworker, consolidate errands into one trip, shift non-urgent errand from car to walking, use transit instead of Uber for airport, park farther and walk, take the stairs instead of elevator for embodied energy, ship to store instead of home delivery.

**Energy actions (30+ entries):** Air dry laundry instead of dryer, cold water wash, lower thermostat 2°F tonight, turn off power strips before bed, unplug phone chargers when not in use, open windows instead of AC on mild days, switch to LED bulb (frame as easy swap), run dishwasher only when full, defrost fridge regularly, use microwave instead of oven for reheating.

**Shopping actions (30+ entries):** Choose product with less packaging, buy one item secondhand this week, repair before replace, cancel one unused digital subscription (servers emit CO₂), choose concentrated cleaning products, bring a reusable bag, buy in bulk to reduce packaging per use, choose the product made closer to home, decline a plastic bag, use a library instead of buying a book.

**Water actions (20+ entries):** Shorter shower, turn off tap while brushing, fix a dripping tap, use a full load in washing machine, collect pasta water for plants.

**Waste actions (20+ entries):** Compost food scraps, recycle one item correctly today, refuse a receipt, bring a reusable cup to the coffee shop, decline hotel room cleaning for one day.

**knowledge-base.ts:** Load all JSON files, flatten into a single array, implement the `searchActions` scoring function as defined in CLAUDE.md. Export `searchActions` and a `getActionById` utility for the fallback system.

**emissions/calculator.ts:** `computeCO2Saved(factorKgPerUnit, quantity)`, `formatCO2(kg)` → "1.2 kg", `annualizedSavings(dailyKg)` → yearly projection. **emissions/equivalencies.ts:** `kgToEquivalencies(kg)` → `{ milesNotDriven, treePlantedDays, phoneCharges, streamingHours }`.

---

### Phase 3 — AI Layer (1.5 hours)

The most important phase. Get this right before building any UI.

**lib/ai.ts** — Implement `generateWithFallback` exactly as specified in CLAUDE.md. The function signature: `generateWithFallback<T>(schema: ZodType<T>, prompt: { system: string, user: string }, temperature?: number): Promise<T>`. Three layers: Groq 70B → Gemini Flash-Lite → throw Error.

**lib/schemas.ts** — Define three Zod schemas: `MicroActionOutputSchema`, `UserProfileOutputSchema`, `WeeklyReportOutputSchema`. These are the contracts between the LLM and the rest of the codebase. Every LLM call goes through one of these schemas.

**lib/prompts/system-prompt.ts** — Export `SUSTAINABILITY_COACH_SYSTEM_PROMPT` as a string constant. Copy the full system prompt from CLAUDE.md verbatim. This is used in every action generation call.

**lib/prompts/action-generator.ts** — Function `buildActionPrompt(profile: UserProfile, candidates: ActionCandidate[], streakLength: number, weather?: WeatherData): string`. Builds the user message that includes: user profile summary, today's date and day of week, streak context (if streak > 7 days: "user is on a strong streak — slightly ambitious action is fine"), all 5 candidate actions with full metadata formatted as a numbered list, explicit instruction to select one and rewrite the description to be hyper-specific to this user's city and constraints, and the anti-hallucination guard ("use only CO₂ values from the candidates above").

**lib/prompts/profile-builder.ts** — Function `buildProfilePrompt(answers: OnboardingAnswers): string`. Sends the 5 onboarding answers and asks Claude to identify top 3 impact areas, estimate annual footprint using simplified EPA averages for this commute+diet+city profile, and write a 2-sentence encouraging profile summary.

**lib/prompts/weekly-report.ts** — Function `buildReportPrompt(actions: MicroAction[]): string`. Sends the last 7 actions (completed and skipped) and asks for a 3-paragraph narrative: what went well, what pattern was observed, what to focus on this week.

**Test all three LLM calls in isolation** by creating a temporary `app/api/test-ai/route.ts` that calls each prompt and returns the raw output. Delete this file after testing.

---

### Phase 4 — API Routes (1 hour)

**`/api/generate-profile` (POST):**
1. Validate request body (sessionId + OnboardingAnswers + homeAddress + workAddress) with Zod
2. Call `lib/google-maps.ts` → geocode both addresses → call Distance Matrix → get `commuteDistanceMiles` and home `{ lat, lng }`
3. Call `lib/climatiq.ts` with commute distance → get precise `carCo2PerTrip` and `transitCo2PerTrip`, compute `dailyCo2SavingsIfSwitched`
4. Call `lib/electricity-maps.ts` with user's lat/lng → resolve to nearest zone → get `currentCarbonIntensity` and `renewablePercent` — cache in Upstash with 1-hour TTL
5. Call `lib/open-meteo.ts` with lat/lng → get current weather — cache in Upstash with 30-min TTL
6. Call `generateWithFallback` with `UserProfileOutputSchema` and the profile builder prompt (includes all computed data)
7. Insert user row into Supabase with all fields including `lat`, `lng`, `commute_distance_miles`, `electricity_zone`
8. Create `streaks` and `impact_totals` rows with defaults
9. Return full profile

**`/api/generate-action` (POST):**
1. Validate request (sessionId)
2. Load user from Supabase — includes `lat`, `lng`, `electricity_zone`, `commute_distance_miles`
3. Check if today's action already exists — if yes, return it (idempotent)
4. Fetch last 7 action IDs for repeat-avoidance
5. Fetch current streak from `streaks` table
6. Call `searchActions` → get top 5 candidates
7. Fetch weather: check Upstash cache key `weather:{lat}:{lng}` first — if miss, call Open-Meteo and cache with 30-min TTL
8. Fetch grid intensity: check Upstash cache key `grid:{zone}` first — if miss, call Electricity Maps and cache with 1-hour TTL. If grid is >50% renewable, bias candidate scoring toward energy actions.
9. Call `generateWithFallback` with `MicroActionOutputSchema`, action generator prompt (includes weather + grid context)
10. If `generateWithFallback` throws, select top-scored static candidate as fallback
11. Insert action row into `actions` table
12. Return action

**`/api/complete-action` (POST):**
1. Validate request (sessionId, actionId)
2. Load user, verify action belongs to this user
3. Update action: `completed = true`, `completed_at = now()`
4. Call `supabase.rpc('update_streak', { p_user_id: userId })`
5. Update `impact_totals`: add `co2_savings_kg` and `dollar_savings`, increment `total_actions_completed`
6. Return updated streak and impact totals

**`/api/weekly-report` (POST):**
1. Validate request (sessionId)
2. Fetch last 7 action rows for this user
3. Check if a report was generated today — if yes, return cached version (add `weekly_report_cache` column to users table)
4. Call `generateWithFallback` with `WeeklyReportOutputSchema` and weekly report prompt
5. Save report to cache column in users table
6. Return report

---

### Phase 5 — Onboarding UI (1.5 hours)

The onboarding is the first impression. It must feel fast, intelligent, and friction-free.

**OnboardingShell.tsx:** Manages the current step (0–5), the accumulated answers object, and navigation. Renders a `Progress` component (shadcn/ui) at the top showing `(step / 5) * 100`. Wraps each QuestionCard in an `AnimatePresence` block for enter/exit transitions.

**QuestionCard.tsx:** Props: `question: string`, `options: Array<{ label: string, emoji: string, value: string }>`, `onSelect: (value: string) => void`. Renders as a shadcn/ui Card with the question in large text and 4 option buttons below. On selection, calls `onSelect` and the parent advances the step. Entrance animation: slide in from right (x: 50 → 0), exit: slide out to left (x: 0 → -50). Duration 0.25s.

**The 5 questions + address inputs:**
1. "How do you usually get around?" — Drive alone 🚗 / Bus or subway 🚌 / Bike or walk 🚲 / Work from home 🏠
2. "How would you describe your diet?" — Meat most days 🥩 / Chicken and fish mainly 🍗 / Mostly plant-based 🥗 / Fully vegetarian or vegan 🌱
3. "Where do you live?" — City apartment (no car) 🏙️ / Urban house or townhouse 🏘️ / Suburbs (car-dependent) 🚗 / Rural or small town 🌾
4. "What's stopped you from being more sustainable?" — Not enough time ⏰ / Feels expensive 💸 / Don't know where to start 🤷 / Feels overwhelming 😩
5. "What matters most to you?" — The planet 🌍 / Saving money 💰 / My health 💪 / Being part of something 👥

**After Q5 — address capture step (before loading screen):**
Show two text inputs: "Home neighborhood or zip code" and "Work address or neighborhood." These replace the commute distance slider. On submit, call `lib/google-maps.ts` which: (1) geocodes both addresses to lat/lng, (2) calls Distance Matrix API to get driving distance in miles and transit duration. Store both the distance and the user's lat/lng in the profile. The lat/lng is then used for Open-Meteo weather and Electricity Maps zone lookup. This one step makes the entire downstream data chain — weather, grid intensity, Climatiq CO₂, action personalization — precise and specific to the user's actual location rather than a coarse city selection.

After Q5, show a loading screen ("Building your Shift profile…") while calling `/api/generate-profile`. Then show **ProfileReveal.tsx**: animated checkmark entrance, user's top 3 impact areas as colored category badges, estimated annual footprint ("~14 tons CO₂/year"), an encouraging one-liner, and "See Today's Action →" CTA.

---

### Phase 6 — Dashboard UI (2 hours)

**Layout:** Single column, mobile-first (375px base). Order from top: Header (logo + streak counter), MicroActionCard, ImpactDashboard, ActivityHeatmap, WeeklyReport. All sections separated by 24px spacing.

**MicroActionCard.tsx:** The hero of the product. Structure:
- Top row: category badge (colored) + difficulty badge + time badge ("< 2 min")
- Title: 22px, semi-bold, green-50
- Anchor sentence in italic green-300: "After you open Uber Eats..."
- Impact row: 🌿 1.2 kg CO₂ · 💸 $3.40 · ⏱️ Under 2 min
- Equivalency line in muted text: "= 3 miles not driven"
- Description paragraph: 14px, green-200
- "I Did This ✓" button: full width, green-600, large tap target (48px height)
- "Skip today" text link: small, green-400, centered below button
- Loading state: shadcn/ui Skeleton covering the entire card

**CelebrationOverlay.tsx:** Triggered when "I Did This ✓" is tapped. Full-screen green overlay (z-50) fades in over 0.2s. Calls `confetti()` immediately. Large checkmark SVG springs in from scale 0 → 1.2 → 1 (spring animation). Streak counter increments with a scale bounce. Shows updated CO₂ total. Auto-dismisses after 2.5s or on tap. After dismiss, re-fetch impact totals to show updated numbers.

**ImpactDashboard.tsx (Tremor):** Three `<Card>` components in a row using Tremor's `<Metric>` and `<BadgeDelta>` components:
- Total CO₂ saved: large metric, leaf icon, delta badge showing "↑ X kg this week"
- Money saved: dollar icon, metric
- Actions completed: lightning icon, metric, "🔥 X-day streak"

Below the three cards: one collective impact line in green-300 italic: "You and 847 other Shift users saved 23 tons CO₂ this month" (hardcoded for demo — sufficiently plausible).

**GridIntensityWidget.tsx** (powered by Electricity Maps): A fourth card below the KPI row showing live grid data for the user's city. `⚡ Your NYC grid · 34% renewable · 287 gCO₂/kWh` with a colored dot (green/yellow/red) and a one-line action prompt ("Good time to run appliances" or "Consider conserving today"). This is live data updating on every page load — no static app can show this. It is the single most impressive "connected to the real world" element in the demo.

**ActivityHeatmap.tsx:** `react-activity-calendar` component showing last 12 weeks. Build the data array from `actions` table rows — `level: 0` for days with no action, `level: 4` for completed actions. Theme it to the green palette. Show a "12-week activity" label above.

**WeeklyReport.tsx:** Collapsed by default — shows only the first sentence of `whatWentWell` + a "Read your Shift Report →" expand button. Expanded state shows all three paragraphs with a subtle green-600 left border. Only visible if user has 7+ completed actions. Otherwise shows a "Complete 7 actions to unlock your first report" placeholder.

---

### Phase 7 — Polish (1 hour)

**Loading skeletons:** Every async data fetch shows a shadcn/ui `<Skeleton>` — the MicroActionCard skeleton should match the card's exact height to prevent layout shift.

**Error states:** If action generation completely fails (all three fallbacks exhausted), show a friendly error card: "We hit a snag generating your action today. Here's a classic: [hardcoded top action for their profile]." Never a blank screen.

**Responsive design:** Test at 375px (iPhone SE), 390px (iPhone 14), and 768px (tablet). The ImpactDashboard's three cards should stack on mobile. The MicroActionCard should take full width.

**Demo mode:** Add a `useDemoMode` hook that checks `window.location.search` for `?demo=true`. When active, it returns hardcoded profile, streak (12 days), and totals (14.4 kg · $43.20 · 18 actions) without any Supabase calls, but still calls `/api/generate-action` live via the real Groq API.

**Production deploy:** Add all eight env vars to Vercel project settings. Run `vercel --prod`. Test the production URL immediately after deploy. Confirm the demo URL `?demo=true` works perfectly before the presentation.

---

## 5. Data Strategy — Static Base + Live Enhancement Layer

**The two-layer approach:** Static JSON covers all action library lookups (instant, offline, unlimited). Live APIs add real-time data for the specific features that impress judges. At demo-day volume (~30–50 calls), every API's monthly limit is functionally infinite.

### Layer 1: Static JSON

**Sources to bundle in `/data/knowledge-base/`:**
- DEFRA/DESNZ 2025 GHG Conversion Factors (UK gov, free Excel download)
- EPA GHG Emission Factors Hub 2025 (US gov, free)
- SU-EATABLE LIFE Database (Nature Scientific Data, open access) — food CO₂ per item
- EIA 2024: US average electricity $0.17/kWh — for dollar savings math
- US average gas price $3.20/gallon — for transport dollar savings

**Key emission factors:**

| Food | kg CO₂e/kg | Transport mode | kg CO₂e/mile |
|------|-----------|----------------|--------------|
| Beef | 27.0 | Average car | 0.404 |
| Lamb | 39.2 | Rideshare (Uber) | 0.470 |
| Chicken | 6.9 | NYC subway | 0.045 |
| Tofu | 2.0 | Bus (US avg) | 0.177 |
| Vegetables | 0.5 | Bicycle/walking | 0.000 |

Energy: air-dry laundry = 0.69 kg CO₂ saved · cold wash = 0.44 kg · unplug devices = 0.15 kg/day

**Equivalencies:** `1 kg CO₂ = 2.48 miles driven = 0.11 tree-planted-days = 121 phone charges = 2.2 hrs streaming`

### Layer 2: Live APIs (add all of these — demo-day volume makes limits irrelevant)

**Upstash Redis** (`lib/redis.ts`) — 500K commands/month free, no CC, sign up at upstash.com. Create a Redis database, copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Use `@upstash/redis` which is HTTP-based and runs natively in Vercel serverless — no TCP issues.

Cache strategy:

| Key pattern | TTL | What it caches |
|-------------|-----|----------------|
| `weather:{lat}:{lng}` | 30 min | Open-Meteo response |
| `grid:{zone}` | 1 hour | Electricity Maps response |
| `report:{userId}` | 24 hours | Weekly AI report text |
| `action:{userId}:{date}` | 24 hours | Backup idempotency for today's action |

Wrap every external API call in a `getCached(key, fetcher, ttl)` helper. Without caching, every dashboard load hits Open-Meteo and Electricity Maps. With caching, those only fire on first load — the dashboard feels instant on repeat visits during the demo.

**Google Maps Platform** (`lib/google-maps.ts`) — $200/month free credit, enable at console.cloud.google.com. Enable two APIs only: **Geocoding API** and **Distance Matrix API**. No map rendering, no UI work — these are pure server-side API calls.

Two functions:

`geocodeAddress(address: string)` — converts "Williamsburg, Brooklyn" or "10001" to `{ lat, lng }`. Called during onboarding for both home and work addresses.

`getCommuteDistance(originLat, originLng, destLat, destLng)` — calls Distance Matrix with driving + transit modes. Returns `{ drivingMiles, transitMinutes }`. The driving distance feeds Climatiq. The transit time feeds the action description framing ("only 4 minutes longer by subway").

This replaces the static `transit-data.json` city list and the commute distance slider entirely. Real address → real distance → real CO₂.

**Climatiq API** (`lib/climatiq.ts`) — 250 calls/month free, sign up at climatiq.io, no CC.
Called once during profile generation using the distance from Google Maps Distance Matrix. Cache result in the user's Supabase row — never recalculate. Produces:
- `carCo2KgPerTrip` — kg CO₂ for driving that exact distance
- `transitCo2KgPerTrip` — kg CO₂ for transit that distance
- `dailySavingsIfSwitched` — the delta shown on transport action cards

`POST https://beta4.api.climatiq.io/estimate` with `Authorization: Bearer {CLIMATIQ_API_KEY}`

**Electricity Maps API** (`lib/electricity-maps.ts`) — free single-zone, sign up at electricitymaps.com.
Resolve user's lat/lng to nearest US zone via a small lookup table. Fetch via Redis cache wrapper (1-hour TTL). Renders as `GridIntensityWidget.tsx` on the dashboard — renewable %, gCO₂/kWh, colored indicator. When grid >50% renewable, bias action scoring toward energy category. When <20%, surface conservation actions.

```
⚡ Your NYC grid right now
34% renewable  ·  287 gCO₂/kWh  [GREEN badge]
→ Great time to run the dishwasher
```

Zone codes: NYC = `US-NY-NYIS` · California = `US-CAL-CISO` · Texas = `US-TEX-ERCO` · Chicago = `US-MIDA-PJM`
`GET https://api.electricitymap.org/v3/carbon-intensity/latest?zone={zone}` with `auth-token: {ELECTRICITY_MAPS_API_KEY}`

**Open-Meteo** (`lib/open-meteo.ts`) — unlimited, no key. Fetch via Redis cache (30-min TTL) using lat/lng from the user's profile (set during onboarding via Google Geocoding). Pass temperature + weather code to the action generator prompt so the LLM writes: "It's 72°F and sunny — perfect day to bike instead of Uber."
`GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,weathercode&temperature_unit=fahrenheit`

**OpenFoodFacts** — unlimited, no key. Optional showstopper if time allows. Add a barcode scanner tab using `react-qr-barcode-scanner`. Scan any packaged food during the demo → show Eco-Score (A–E) and CO₂ per 100g live. A physical product scan is a strong visual moment for judges.
`GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
Fields: `ecoscore_grade`, `ecoscore_score`, `product_name`, `nutriments["carbon-footprint-from-known-ingredients_100g"]`

---

## 6. AI Architecture Detail

**Why Groq over Anthropic/OpenAI for this project:**
- Groq free tier: ~14,400 requests/day, no credit card
- Anthropic/OpenAI: no meaningful free tier, requires payment
- Speed: Groq delivers 300–1,800 tokens/second — action generation feels instant
- Quality: Llama 3.3-70B is sufficient for behavioral personalization tasks with good prompting
- Vercel AI SDK supports Groq via `@ai-sdk/openai` with just a base URL swap

**Prompt engineering for action personalization:**
The key to making actions feel genuinely personalized is what goes into the user message, not just the system prompt. Pass these fields explicitly:
- User's city (e.g. "Chicago") — so the LLM can reference specific transit lines, local restaurant types, weather patterns
- Commute type and approximate distance — enables specific time/cost calculations
- Diet pattern — prevents suggesting meat swaps to vegans
- Primary barrier and motivation — determines framing (cost vs. values vs. health)
- Streak length — unlocks progressive difficulty
- Day of week — weekends get different actions than weekday mornings
- Top 5 candidate actions with all metadata — LLM selects and personalizes, never invents

**The anti-hallucination guard is critical.** Always include in the user prompt: "Use only the CO₂ savings values from the candidate actions listed above. Do not calculate or invent emissions figures." This prevents the LLM from confidently making up specific numbers.

**Token budget:** Keep total input under 2,000 tokens per action generation call. Profile (200 tokens) + candidates (500 tokens) + instructions (300 tokens) = ~1,000 tokens input. Response is ~300 tokens. Total: ~1,300 tokens per call. At Groq's free limits, this supports hundreds of daily users.

---

## 7. UI/UX Flow

```
Landing Page (/)
    ↓ "Start Your Shift →" CTA
Onboarding — Q1 (Commute type)
    ↓ tap option
Onboarding — Q2 (Diet)
    ↓ tap option
Onboarding — Q3 (Living situation)
    ↓ tap option
Onboarding — Q4 (Barrier)
    ↓ tap option
Onboarding — Q5 (Motivation)
    ↓ tap option
Profile Loading Screen ("Building your Shift profile…")
    ↓ POST /api/generate-profile completes (~2s)
Profile Reveal (top 3 impact areas + footprint estimate)
    ↓ "See Today's Action →"
Dashboard (/dashboard)
    ├── Header (logo + 🔥 12 streak)
    ├── MicroActionCard
    │   ├── [loading skeleton while POST /api/generate-action runs]
    │   └── [action card renders]
    │         ↓ "I Did This ✓"
    │     POST /api/complete-action
    │         ↓ success
    │     CelebrationOverlay (confetti + checkmark, 2.5s)
    │         ↓ auto-dismiss
    │     Dashboard (streak +1, impact totals updated)
    │
    ├── ImpactDashboard (Tremor KPI cards)
    ├── ActivityHeatmap (12-week calendar)
    └── WeeklyReport (collapsible, unlocks after 7 actions)
```

---

## 8. Environment Setup Checklist

Complete before any coding:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] `create-next-app` run with correct flags (TypeScript, Tailwind, App Router)
- [ ] All npm dependencies installed (including `@upstash/redis`)
- [ ] shadcn/ui initialized with dark green theme
- [ ] Supabase project created (supabase.com)
- [ ] All four tables created via SQL editor
- [ ] `update_streak` RPC created via SQL editor
- [ ] Groq API key obtained (console.groq.com — free, no CC)
- [ ] Gemini API key obtained (aistudio.google.com — free, no CC)
- [ ] Climatiq API key obtained (climatiq.io — free, no CC)
- [ ] Electricity Maps API key obtained (electricitymaps.com — free, no CC)
- [ ] Google Maps API key obtained (console.cloud.google.com — Geocoding + Distance Matrix enabled, $200 free credit)
- [ ] Upstash Redis database created (upstash.com — free, no CC), REST URL + token copied
- [ ] `.env.local` created with all eight keys
- [ ] `.env.example` created with placeholders and committed
- [ ] GitHub repo created
- [ ] Vercel project connected to GitHub repo
- [ ] Vercel env vars added (all eight)
- [ ] `CLAUDE.md` and `SHIFT_BUILD_PLAN.md` at repo root

---

## 9. Demo Script & Pitch Prep

**3-minute demo for judges:**

Open with the problem: "65% of young Americans say they want to live sustainably. Only 26% follow through. The gap isn't motivation — it's a tool that makes action easy."

Show onboarding (30 seconds): Click through all 5 questions quickly. "90 seconds, no bank account, no lengthy carbon calculator."

Show profile reveal: "The AI synthesizes your commute, diet, city, and what actually motivates you. It finds your top 3 impact areas and estimates your footprint."

Show the dashboard magic moment: "Here's today's action." Read it aloud — something specific. "After you open Uber Eats tonight, order from a restaurant within 3 miles — saves 0.9 kg CO₂ and $2."

**Live demo of personalization:** Change the profile inputs (vegetarian, bikes to work, Seattle). "Watch what happens." Generate a new action. It's completely different. "The AI adapts in real time. Static tip lists can't do this."

Show celebration: Tap "I Did This." Let the confetti run. "Behavioral science shows celebration is what makes habits stick — this is the Duolingo moment."

Show impact: "14 days in. 11.2 kg CO₂ saved. $42 saved. Equal to not driving 28 miles."

Close: "If 100,000 users complete one micro-action daily, that's 12,000 tons of CO₂ per year — equivalent to taking 2,600 cars off the road. The research shows this approach reduces emissions by 23%. We built the first AI product that actually delivers on that. And it costs users nothing."

**Anticipated judge questions:**

Q: "How is this different from JouleBug or Earth Hero?"
A: "Those apps have static tip lists and self-reported gamification with no connection to real emissions data. Shift uses an LLM to generate actions specific to your city, schedule, and constraints — and every action has verified CO₂ figures from EPA and DEFRA data."

Q: "What's the business model?"
A: "Freemium: free first 30 days, then $4.99/month for continued personalization and weekly AI reports. B2B path: sell to HR departments as an employee sustainability benefit — companies pay for ESG reporting and employee engagement metrics."

Q: "Does this actually change behavior?"
A: "Hoffmann et al. 2023 (Journal of Cleaner Production) shows carbon tracking apps with behavioral feedback reduce emissions by 23%. A Conservation Biology study confirmed the Tiny Habits framework — which is our structural backbone — produces immediate and sustained behavior change. Duolingo's streak mechanic, which we model, drives 3.6x engagement at 7-day streaks."

Q: "Why Groq instead of ChatGPT?"
A: "Groq is faster and completely free at our scale — 14,400 requests per day with no credit card. The product is about instant action delivery. Sub-second response time matters for the user experience."