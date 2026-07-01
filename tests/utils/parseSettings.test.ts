import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/types/timer';
import { parseSettings } from '../../src/utils/parseSettings';

describe('parseSettings', () => {
  it('returns defaults for corrupt input', () => {
    expect(parseSettings('bad')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores unknown properties', () => {
    const parsed = parseSettings({
      ...DEFAULT_SETTINGS,
      vibration: true,
      unknownField: 'x',
    });
    expect(parsed).toEqual(DEFAULT_SETTINGS);
    expect('vibration' in parsed).toBe(false);
  });

  it('clamps out-of-range values', () => {
    const parsed = parseSettings({
      work: 9999,
      cycles: 0,
      theme: 'invalid',
    });
    expect(parsed.work).toBe(300);
    expect(parsed.cycles).toBe(1);
    expect(parsed.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it('preserves valid partial input', () => {
    const parsed = parseSettings({ work: 30, muted: true });
    expect(parsed.work).toBe(30);
    expect(parsed.muted).toBe(true);
    expect(parsed.rest).toBe(DEFAULT_SETTINGS.rest);
  });
});
