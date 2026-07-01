# Tabata Timer

A minimalist Tabata interval timer built with Vue 3, TypeScript, and Vite.

Live demo: [https://wolfzxcv.github.io/Tabata-Timer](https://wolfzxcv.github.io/Tabata-Timer)

## Features

- Setup and full-screen workout modes
- Accurate timestamp-based countdown (`performance.now()`)
- Classic Tabata preset (20s work / 10s rest × 8)
- Settings persisted in `localStorage` (`tabata-settings`)
- Light / dark / auto theme on Setup screen
- Web Audio beeps, optional vibration, screen wake lock
- PWA offline support after first visit
- Vitest unit tests for core logic

## Development

```bash
npm install
npm run dev
npm run lint      # ESLint
npm run lint:fix  # auto-fix where possible
```

## Testing

```bash
npm test        # watch mode
npm run test:run
```

### What we test (and why)

| Layer | Why |
|-------|-----|
| `buildTimeline`, `parseSettings`, `formatDuration` | Pure functions — easiest to test, highest value |
| Timer timestamp helpers | Time accuracy is critical for a timer app |
| `NumberStepper` | Basic component interaction and bounds |

**Linting:** `npm run lint` runs ESLint (Vue + TypeScript essentials). Formatting is not enforced — `vue-tsc` handles types in `src/`.

We intentionally skip WorkoutView pixel tests and real AudioContext output — balanced coverage, not 100% UI.

## Build & Deploy

```bash
npm run build
```

GitHub Pages base path is `/Tabata-Timer/`. Push to GitHub and deploy `dist/` to the `gh-pages` branch, or use the included GitHub Actions workflow.

## Project structure

```
src/
├── components/     SetupView, WorkoutView (single canvas), NumberStepper
├── composables/    useTimer, useTimerSettings, useAudio, useWakeLock, useTheme
├── utils/          buildTimeline, parseSettings, formatDuration
└── types/          shared TypeScript types
```

## License

MIT
