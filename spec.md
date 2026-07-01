# Project Specification: Minimalist Tabata Timer

## 1. Project Overview

A web-based, mobile-friendly, highly responsive Tabata Timer built with **Vue 3 (Composition API)** and **TypeScript**. The design focuses on extreme minimalism, high-contrast visibility for workouts, and intuitive mobile interactions.

- **Language:** Full English UI (no i18n in v1).
- **Hosting:** Static deployment to **GitHub Pages**.
  - Repository: `Tabata-Timer`
  - Live URL: `https://wolfzxcv.github.io/Tabata-Timer`
- **Audience:**
  - End users: free public access via URL — no clone, install, or dev server required.
  - Developers: a small, well-structured reference project demonstrating common web app patterns (PWA offline, composables, localStorage, testing, theme toggle, accurate timers).

---

## 2. Tech Stack

| Include | Exclude (v1) |
|---------|--------------|
| Vue 3 (Composition API) | vue-router (single-page, state-driven views) |
| TypeScript | Pinia / Vuex |
| Vite | Tailwind CSS |
| Scoped component CSS + shared CSS only when needed | Element Plus, Vuetify, or other UI libraries |
| Web Audio API | External `.mp3` / `.wav` assets |
| localStorage | vue-i18n |
| `vite-plugin-pwa` (minimal offline cache) | Complex offline sync / background sync |
| Vitest + `@vue/test-utils` | E2E testing (Playwright/Cypress) in v1 |
| Basic a11y (semantic HTML, aria-labels) | Full WCAG audit / screen-reader countdown |

### Styling Approach

- Prefer **scoped styles per component** (`<style scoped>`).
- Extract to shared stylesheets only for truly shared concerns (e.g. phase color tokens, CSS reset, Setup theme variables).
- Use **CSS custom properties** for Setup light/dark themes and Workout phase colors.
- Use `clamp()` for responsive typography and `100dvh` for full-screen workout layout.

---

## 3. Core Architectural Concepts

- **App has two rendering modes** — not vue-router:

  | Condition | View |
  |-----------|------|
  | `status === 'IDLE'` | `SetupView` only |
  | `status !== 'IDLE'` | `WorkoutView` only — internal UI (running / paused / complete) handled inside `WorkoutView` |

  `App.vue` does not need to understand pause or completion; only whether the user is in Setup or Workout.

- **Immutable workout timeline:**
  - On **START**, snapshot current `TimerSettings`, build `TimelineItem[]` once from that snapshot.
  - The active workout never reads live settings again — Setup is not mounted during workout.

- **Accurate timing via absolute timestamps** (`performance.now()`), not decrementing counters.

- **Workout completion is derived, not a global status:**
  - `isComplete = currentIndex >= timeline.length`
  - Finish screen is a **UI state inside `WorkoutView`**, not a fourth `WorkoutStatus`.

- **Audio Feedback:** Web Audio API with milestone-based deduplication (no duplicate beeps).

- **State Management:** Local composables — no global store library.

- **Settings Persistence:** `localStorage` key `tabata-settings` with per-field validation and forward-compatible parsing.

- **Offline Support:** Minimal Service Worker caches static assets after first visit.

---

## 4. Project Structure

```
Tabata-Timer/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── App.vue                # IDLE → SetupView | NON-IDLE → WorkoutView
│   ├── components/
│   │   ├── SetupView.vue
│   │   ├── WorkoutView.vue    # Running / paused overlay / complete screen (internal)
│   │   └── NumberStepper.vue
│   ├── composables/
│   │   ├── useTimer.ts
│   │   ├── useTimerSettings.ts
│   │   ├── useAudio.ts
│   │   ├── useWakeLock.ts
│   │   └── useTheme.ts
│   ├── utils/
│   │   ├── buildTimeline.ts
│   │   ├── parseSettings.ts
│   │   └── formatDuration.ts
│   ├── types/
│   │   └── timer.ts
│   └── styles/
│       └── global.css
├── tests/
│   └── …
├── vite.config.ts
└── package.json
```

---

## 5. Data Structure & State (TypeScript)

```typescript
type IntervalType = 'PREPARE' | 'WORK' | 'REST' | 'SET_REST';

type WorkoutStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

type ThemePreference = 'auto' | 'light' | 'dark';

interface TimerSettings {
  prepare: number;
  work: number;
  rest: number;
  cycles: number;
  sets: number;
  setRest: number;
  muted: boolean;
  theme: ThemePreference;
}

interface TimelineItem {
  type: IntervalType;
  duration: number;
  cycleIndex: number; // 1-based for display
  setIndex: number;
}

interface WorkoutState {
  status: WorkoutStatus;
  timeline: TimelineItem[]; // immutable after START
  currentIndex: number;
  phaseEndTime: number; // performance.now() when current phase ends
}

// playedBeeps: phase-local ephemeral — lives inside useTimer closure only,
// NOT in WorkoutState, NOT reactive, NOT persisted.

// Derived — not stored as status
const isComplete = (state: WorkoutState) =>
  state.currentIndex >= state.timeline.length;
```

### WorkoutStatus State Machine

Three global statuses only:

| Status | App renders | Wake Lock |
|--------|-------------|-----------|
| `IDLE` | SetupView | off |
| `ACTIVE` | WorkoutView | on (unless `isComplete`) |
| `PAUSED` | WorkoutView | off |

`ACTIVE` covers both in-progress countdown and workout complete — UI distinguishes via `isComplete`.

**Transitions:**

```
IDLE ──START──► ACTIVE
ACTIVE ──pause (if !isComplete)──► PAUSED
PAUSED ──resume──► ACTIVE
ACTIVE ──all phases done──► isComplete (status stays ACTIVE; WorkoutView shows finish UI)
ACTIVE | PAUSED ──exit (confirmed)──► IDLE
isComplete ──Back to Setup──► IDLE
```

### WorkoutView — Single State-Driven Canvas

`WorkoutView` is **one component**, not three separate sub-views. It renders entirely from `{ status, isComplete, currentPhase }`:

| Condition | Screen |
|-----------|--------|
| `isComplete` | Finish screen (`Workout Complete 🎉`) |
| `status === 'PAUSED'` | Pause overlay |
| otherwise | Running countdown |

Do **not** split into `WorkoutRunning.vue` / `WorkoutPaused.vue` / `WorkoutComplete.vue`.

### localStorage: `tabata-settings`

- **Key:** `tabata-settings` — do **not** version the key name.
- **Write:** Debounce ~300 ms after any setting change.
- **Read:** On app mount via `parseSettings.ts`:
  - **Unknown properties:** ignore.
  - **Missing properties:** fall back to `DEFAULT_SETTINGS` for that field.
  - **Invalid values:** fall back to default for that field.
  - **Corrupt JSON:** fall back to full `DEFAULT_SETTINGS`.

### Input Validation Ranges

| Field | Min | Max |
|-------|-----|-----|
| prepare | 0 | 300 |
| work | 5 | 300 |
| rest | 0 | 300 |
| cycles | 1 | 99 |
| sets | 1 | 99 |
| setRest | 0 | 600 |

When `setRest` is `0`, omit `SET_REST` intervals entirely from the timeline.

---

## 6. UI/UX Design & Layout Requirements

### General Styling

- **Setup Mode theme:** Light or dark; default `auto`.
- **Workout Mode theme:** Fixed high-contrast phase colors — **not** affected by Setup theme.
- **Touch targets:** Minimum **48×48 px** (prefer **56 px**).
- **Setup layout:** Centered column, `max-width: 28rem`.

### Setup Theme (Light / Dark)

- Setup only. **🌓 button** cycles `auto` → `light` → `dark` → `auto`.
- Persisted in `tabata-settings.theme`.

### Setup Mode (`status === 'IDLE'`)

| Element | Requirement |
|---------|-------------|
| **Header** | Total Workout Time + **🌓 theme toggle** |
| **Classic Tabata preset** | One-tap; preserves current `theme` and `muted` |
| **PREPARE / WORK / REST** | Color-accented steppers |
| **CYCLES & SETS** | Side-by-side steppers |
| **SET REST** | Stepper; `0` disables rest between sets |
| **Mute toggle** | Disables beeps and vibration |
| **Reset to defaults** | Full `DEFAULT_SETTINGS` including `theme: 'auto'` |
| **START** | Snapshot settings → build timeline → `status = 'ACTIVE'` |

### Workout Mode — Running (`status === 'ACTIVE'` && !`isComplete`)

| Phase | Background | Text |
|-------|------------|------|
| `PREPARE` | `#f59e0b` (amber) | black |
| `WORK` | `#059669` (emerald) | white |
| `REST` | `#e11d48` (rose) | white |
| `SET_REST` | `#2563eb` (blue) | white |

**Elements:** phase name, countdown (`clamp(4rem, 20vw, 12rem)`), progress (`Cycle 3/8` · `Set 1/2`), **Pause** and **Exit** (with confirmation).

**Layout:** `height: 100dvh`. **theme-color:** match current phase.

### Pause Overlay (`status === 'PAUSED'`)

- Large **`PAUSED`** text on semi-transparent overlay.
- **Resume** → `ACTIVE` · **Exit** → confirm → `IDLE`.
- Timer frozen at paused remaining time.

### Finish Screen (`isComplete`)

- Background `#9333ea` (purple).
- **`Workout Complete 🎉`**
- **Back to Setup** → `IDLE`.
- Do **not** auto-return. No Pause control on this screen.

### Lock Setup During Workout

When `status !== 'IDLE'`: `App.vue` renders **only** `WorkoutView`; `SetupView` is not mounted.

---

## 7. UX Enhancements

### Audio & Haptics

- **First interaction unlocks audio:** `AudioContext.resume()` on START.
- **Countdown beeps:** 3, 2, 1 → short beep (`800 Hz, 0.1s`).
- **Phase transition:** 0 / GO → longer beep (`1200 Hz, 0.4s`).
- **Mute:** skip beeps and vibration when `muted === true`.
- **Vibration:** `navigator.vibrate(200)` on phase transition if supported and not muted.

#### Avoid Duplicate Beeps

Track milestones per **current phase only** via `playedBeeps: Set<number>` inside the **timer loop closure** (see §5 — not part of `WorkoutState`):

- **Reset `playedBeeps` on every phase transition** — never persist across timeline items, reactive state, or localStorage.
- Do **not** use `if (remaining === 3)` on a coarse tick.

During **catch-up advances** (tab suspend, §9): skip all beeps and vibration.

### Screen Wake Lock

Implement in `composables/useWakeLock.ts`:

| Event | Action |
|-------|--------|
| `status → ACTIVE` (and !`isComplete`) | acquire wake lock |
| `isComplete` | release wake lock |
| `status → PAUSED` | release wake lock |
| `status → IDLE` | release wake lock |
| `visibilitychange` → visible **and** `status === 'ACTIVE'` **and** !`isComplete` | re-acquire wake lock |
| API unavailable | silent no-op |

#### Idempotent Acquire

Wake Lock requests **must be idempotent**:

- Track a single `WakeLockSentinel | null` reference.
- If a lock is already held, ignore duplicate acquire calls.
- Only call `request()` after a prior lock has been released or was lost.
- Handle promise rejections safely (no unhandled rejections on race/retry).

### Responsive Design (RWD)

- Primary: laptop browser. Secondary: mobile browser.
- Setup: centered narrow column. Workout: full viewport, thumb-reach controls.

### Basic Accessibility (a11y)

- Semantic `<button>` elements; no click-only `<div>` controls.
- Icon-only buttons: **`aria-label`**.
- Setup steppers: `<label>` or `aria-labelledby`.
- Visible **`:focus-visible`** on interactive elements.
- Do **not** announce countdown every second via `aria-live`.

### PWA & Offline (v1)

- **`manifest.json` + app icons** for Add to Home Screen.
- **`vite-plugin-pwa`:** cache static assets; reliable offline after first visit.
- **No `404.html` redirect in v1** — no client-side router.

---

## 8. Web Audio API Utility

Implement in `composables/useAudio.ts`:

- Single shared **`AudioContext`** instance.
- `playBeep(frequency, duration)` respects `muted`.
- Scheduling driven by milestone dedup (§7), not raw timer ticks.

---

## 9. Timer Logic

### Absolute Timestamps

Timer loop uses **`requestAnimationFrame` or a short interval (<100ms)** and **always derives display time from `phaseEndTime`** — never accumulates elapsed time by decrementing a counter.

```typescript
// Phase start:
phaseEndTime = performance.now() + duration * 1000;

// Display:
function getRemainingSeconds(): number {
  return Math.max(0, Math.ceil((phaseEndTime - performance.now()) / 1000));
}
```

### Pause / Resume

```typescript
// Pause:  pausedRemainingMs = phaseEndTime - performance.now();  status = 'PAUSED'
// Resume:  phaseEndTime = performance.now() + pausedRemainingMs;  status = 'ACTIVE'
```

### Tab Suspend & Large Time Jumps

Timing **must tolerate large jumps** when the tab is backgrounded, frozen, or resumed from suspension (iOS / Android / laptop sleep).

When `performance.now() >= phaseEndTime`, **while-loop advance** until caught up or workout ends:

```typescript
while (performance.now() >= phaseEndTime && currentIndex < timeline.length) {
  advancePhase({ skipFeedback: true }); // no beeps, no vibration
}
if (currentIndex >= timeline.length) {
  // isComplete — show finish screen, release wake lock
}
```

Do **not** play catch-up beeps or animate through skipped phases — jump directly to the correct current phase (or completion).

On normal (non-catch-up) phase advance: play transition beep, vibrate, reset `playedBeeps`, set new `phaseEndTime`.

### Workout Flow

1. **START:** snapshot settings → `buildTimeline()` → `currentIndex = 0` → set `phaseEndTime` → `status = 'ACTIVE'`.
2. **Update loop:** compute `remaining` → milestone beep checks → catch-up while-loop if needed.
3. **Complete:** when `currentIndex >= timeline.length`, `isComplete` is true; release wake lock; show finish UI.
4. **`SET_REST` skipped** when snapshot had `setRest === 0` (in `buildTimeline`).

---

## 10. Frontend Testing

### Tooling

- **Vitest** + **@vue/test-utils**
- Scripts: `"test": "vitest"`, `"test:run": "vitest run"`

### What to Test

| Target | Examples |
|--------|----------|
| `utils/buildTimeline.ts` | `setRest === 0`; multi-set order; indices |
| `utils/parseSettings.ts` | Unknown keys ignored; missing fields defaulted |
| `utils/formatDuration.ts` | `400` → `"6 min 40 sec"` |
| `composables/useTimer.ts` | `getRemainingSeconds`; pause/resume; catch-up while-loop skips multiple phases; `isComplete` derivation (mock `performance.now`) |
| `composables/useTimerSettings.ts` | Read/write; debounced save |
| `components/NumberStepper.vue` | +/- clamping |
| `components/SetupView.vue` (light) | Classic Tabata preset; START emits |

### What NOT to Test in v1

- WorkoutView layout / phase colors.
- Actual AudioContext output (mock if needed).
- Wake Lock API (mock if needed).
- E2E flows.

### Developer Documentation

README **Testing** section: how to run tests, why pure functions and timestamp logic are tested, balanced coverage philosophy.

---

## 11. Deployment (GitHub Pages)

- **Build tool:** Vite with `base: '/Tabata-Timer/'` in `vite.config.ts`.
- **Deploy:** GitHub Actions (preferred) or `gh-pages` package.
- **Live URL:** `https://wolfzxcv.github.io/Tabata-Timer`
- **No `404.html` SPA redirect in v1.**

---

## 12. Execution Checklist for Implementation

1. Scaffold Vite + Vue 3 + TypeScript in `Tabata-Timer/`.
2. Configure `vite-plugin-pwa` and Vitest.
3. Implement types, `buildTimeline.ts`, `parseSettings.ts`, `formatDuration.ts`.
4. Implement composables: `useTimerSettings`, `useAudio`, `useTimer`, `useWakeLock`, `useTheme`.
5. Implement timestamp timer: three-status machine, `isComplete` derivation, catch-up while-loop.
6. Build `SetupView` (steppers, Classic Tabata, 🌓, mute, reset, START).
7. Build `WorkoutView` (running, pause overlay, complete screen — internal UI states).
8. Wire `App.vue`: `IDLE` → SetupView, `NON-IDLE` → WorkoutView.
9. Wire idempotent wake lock + visibility re-acquire.
10. Wire beep milestone dedup (`playedBeeps` per phase) and vibration.
11. Apply basic a11y.
12. Persist settings via `parseSettings` → `tabata-settings`.
13. Add `manifest.json`, icons, meta tags.
14. Write tests per §10; ensure `npm test` passes.
15. Add README with testing guide.
16. Configure GitHub Pages deploy; verify live URL + offline after first visit.
