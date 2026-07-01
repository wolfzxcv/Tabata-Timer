import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/types/timer';
import { buildTimeline, totalWorkoutSeconds } from '../../src/utils/buildTimeline';

describe('buildTimeline', () => {
  it('builds classic tabata without SET_REST when setRest is 0', () => {
    const timeline = buildTimeline({
      ...DEFAULT_SETTINGS,
      prepare: 0,
      setRest: 0,
      sets: 1,
      cycles: 8,
    });

    expect(timeline.some((item) => item.type === 'SET_REST')).toBe(false);
    expect(timeline.filter((item) => item.type === 'WORK')).toHaveLength(8);
    expect(timeline.filter((item) => item.type === 'REST')).toHaveLength(7);
  });

  it('includes SET_REST between sets', () => {
    const timeline = buildTimeline({
      ...DEFAULT_SETTINGS,
      prepare: 0,
      sets: 2,
      cycles: 2,
      setRest: 60,
    });

    expect(timeline.filter((item) => item.type === 'SET_REST')).toHaveLength(1);
    expect(timeline.at(-1)?.type).toBe('WORK');
  });

  it('includes PREPARE once at the start', () => {
    const timeline = buildTimeline({ ...DEFAULT_SETTINGS, prepare: 10 });
    expect(timeline[0]?.type).toBe('PREPARE');
    expect(timeline.filter((item) => item.type === 'PREPARE')).toHaveLength(1);
  });

  it('calculates total workout seconds', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      prepare: 0,
      work: 20,
      rest: 10,
      cycles: 2,
      sets: 1,
      setRest: 0,
    };
    expect(totalWorkoutSeconds(settings)).toBe(20 + 10 + 20);
  });
});
