export type IntervalType = 'PREPARE' | 'WORK' | 'REST' | 'SET_REST';

export type WorkoutStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

export type ThemePreference = 'auto' | 'light' | 'dark';

export interface TimerSettings {
  prepare: number;
  work: number;
  rest: number;
  cycles: number;
  sets: number;
  setRest: number;
  muted: boolean;
  theme: ThemePreference;
}

export interface TimelineItem {
  type: IntervalType;
  duration: number;
  cycleIndex: number;
  setIndex: number;
}

export interface WorkoutState {
  status: WorkoutStatus;
  timeline: TimelineItem[];
  currentIndex: number;
  phaseEndTime: number;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  prepare: 10,
  work: 20,
  rest: 10,
  cycles: 8,
  sets: 1,
  setRest: 60,
  muted: false,
  theme: 'auto'
};

export const CLASSIC_TABATA_VALUES = {
  prepare: 10,
  work: 20,
  rest: 10,
  cycles: 8,
  sets: 1,
  setRest: 0
};

export const PHASE_COLORS: Record<
  IntervalType | 'COMPLETE',
  { bg: string; text: string }
> = {
  PREPARE: { bg: '#f59e0b', text: '#000' },
  WORK: { bg: '#059669', text: '#fff' },
  REST: { bg: '#e11d48', text: '#fff' },
  SET_REST: { bg: '#2563eb', text: '#fff' },
  COMPLETE: { bg: '#9333ea', text: '#fff' }
};

export function isWorkoutComplete(
  currentIndex: number,
  timelineLength: number
): boolean {
  return currentIndex >= timelineLength;
}

export function getRemainingSeconds(phaseEndTime: number, now: number): number {
  return Math.max(0, Math.ceil((phaseEndTime - now) / 1000));
}
