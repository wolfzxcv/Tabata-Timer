import {
  DEFAULT_SETTINGS,
  type ThemePreference,
  type TimerSettings,
} from '../types/timer';

const VALID_THEMES: ThemePreference[] = ['auto', 'light', 'dark'];

function clampField(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function parseTheme(value: unknown): ThemePreference {
  return VALID_THEMES.includes(value as ThemePreference)
    ? (value as ThemePreference)
    : DEFAULT_SETTINGS.theme;
}

export function parseSettings(raw: unknown): TimerSettings {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = raw as Record<string, unknown>;

  return {
    prepare: clampField(obj.prepare, 0, 300, DEFAULT_SETTINGS.prepare),
    work: clampField(obj.work, 5, 300, DEFAULT_SETTINGS.work),
    rest: clampField(obj.rest, 0, 300, DEFAULT_SETTINGS.rest),
    cycles: clampField(obj.cycles, 1, 99, DEFAULT_SETTINGS.cycles),
    sets: clampField(obj.sets, 1, 99, DEFAULT_SETTINGS.sets),
    setRest: clampField(obj.setRest, 0, 600, DEFAULT_SETTINGS.setRest),
    muted: parseBoolean(obj.muted, DEFAULT_SETTINGS.muted),
    theme: parseTheme(obj.theme),
  };
}
