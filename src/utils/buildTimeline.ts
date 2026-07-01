import type { TimerSettings, TimelineItem } from '../types/timer';

export function buildTimeline(settings: TimerSettings): TimelineItem[] {
  const items: TimelineItem[] = [];

  if (settings.prepare > 0) {
    items.push({
      type: 'PREPARE',
      duration: settings.prepare,
      cycleIndex: 0,
      setIndex: 1,
    });
  }

  for (let set = 1; set <= settings.sets; set++) {
    for (let cycle = 1; cycle <= settings.cycles; cycle++) {
      items.push({
        type: 'WORK',
        duration: settings.work,
        cycleIndex: cycle,
        setIndex: set,
      });
      if (cycle < settings.cycles) {
        items.push({
          type: 'REST',
          duration: settings.rest,
          cycleIndex: cycle,
          setIndex: set,
        });
      }
    }
    if (set < settings.sets && settings.setRest > 0) {
      items.push({
        type: 'SET_REST',
        duration: settings.setRest,
        cycleIndex: settings.cycles,
        setIndex: set,
      });
    }
  }

  return items;
}

export function totalWorkoutSeconds(settings: TimerSettings): number {
  const prepare = settings.prepare > 0 ? settings.prepare : 0;
  const workTotal = settings.sets * settings.cycles * settings.work;
  const restTotal = settings.sets * Math.max(settings.cycles - 1, 0) * settings.rest;
  const setRestTotal =
    settings.setRest > 0 && settings.sets > 1
      ? (settings.sets - 1) * settings.setRest
      : 0;

  return prepare + workTotal + restTotal + setRestTotal;
}
