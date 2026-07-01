import { describe, expect, it } from 'vitest';
import { getRemainingSeconds, isWorkoutComplete } from '../../src/types/timer';

describe('timer helpers', () => {
  it('computes remaining seconds from phaseEndTime', () => {
    expect(getRemainingSeconds(5000, 2000)).toBe(3);
    expect(getRemainingSeconds(5000, 5000)).toBe(0);
    expect(getRemainingSeconds(5000, 6000)).toBe(0);
  });

  it('derives isComplete from index', () => {
    expect(isWorkoutComplete(3, 3)).toBe(true);
    expect(isWorkoutComplete(2, 3)).toBe(false);
  });
});

describe('useTimer catch-up logic', () => {
  it('advances multiple phases when time jumps', () => {
    const timeline = [
      { type: 'WORK' as const, duration: 20, cycleIndex: 1, setIndex: 1 },
      { type: 'REST' as const, duration: 10, cycleIndex: 1, setIndex: 1 },
      { type: 'WORK' as const, duration: 20, cycleIndex: 2, setIndex: 1 },
    ];

    let currentIndex = 0;
    let phaseEndTime = 1000 + 20_000;

    const now = 1000 + 45_000;

    while (now >= phaseEndTime && currentIndex < timeline.length) {
      currentIndex++;
      if (currentIndex >= timeline.length) break;
      phaseEndTime += timeline[currentIndex]!.duration * 1000;
    }

    expect(currentIndex).toBe(2);
    expect(isWorkoutComplete(currentIndex, timeline.length)).toBe(false);

    currentIndex++;
    expect(isWorkoutComplete(currentIndex, timeline.length)).toBe(true);
  });
});
