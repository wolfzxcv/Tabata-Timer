import { computed, onUnmounted, ref, type Ref } from 'vue';
import {
  getRemainingSeconds,
  isWorkoutComplete,
  type TimerSettings,
  type TimelineItem,
  type WorkoutStatus,
} from '../types/timer';
import { buildTimeline } from '../utils/buildTimeline';
import { useAudio } from './useAudio';
import { useWakeLock } from './useWakeLock';

const CATCH_UP_THRESHOLD_MS = 250;

export function useTimer(muted: Ref<boolean>) {
  const status = ref<WorkoutStatus>('IDLE');
  const timeline = ref<TimelineItem[]>([]);
  const currentIndex = ref(0);
  const phaseEndTime = ref(0);
  const remainingSeconds = ref(0);
  const snapshotSettings = ref<TimerSettings | null>(null);

  let playedBeeps = new Set<number>();
  let loopTimer: ReturnType<typeof setInterval> | null = null;
  let pausedRemainingMs: number | null = null;

  const { playBeep, unlockAudio } = useAudio(muted);
  const { acquire, release } = useWakeLock();

  const isComplete = computed(() =>
    isWorkoutComplete(currentIndex.value, timeline.value.length),
  );

  const currentPhase = computed(
    () => timeline.value[currentIndex.value] ?? null,
  );

  const totalSets = computed(() => snapshotSettings.value?.sets ?? 1);
  const totalCycles = computed(() => snapshotSettings.value?.cycles ?? 8);

  function resetPlayedBeeps() {
    playedBeeps = new Set();
  }

  function checkCountdownBeeps(remaining: number) {
    for (const milestone of [3, 2, 1]) {
      if (remaining <= milestone && !playedBeeps.has(milestone)) {
        playBeep(800, 0.1);
        playedBeeps.add(milestone);
      }
    }
    if (remaining === 0 && !playedBeeps.has(0)) {
      playBeep(1200, 0.4);
      playedBeeps.add(0);
    }
  }

  function vibrateOnTransition() {
    if (!muted.value && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  function setPhaseEndFromNow(index: number, now: number) {
    const item = timeline.value[index];
    if (!item) return;
    phaseEndTime.value = now + item.duration * 1000;
    resetPlayedBeeps();
  }

  function chainPhaseEnd(index: number) {
    const item = timeline.value[index];
    if (!item) return;
    phaseEndTime.value += item.duration * 1000;
    resetPlayedBeeps();
  }

  function stopLoop() {
    if (loopTimer !== null) {
      clearInterval(loopTimer);
      loopTimer = null;
    }
  }

  function handleComplete() {
    stopLoop();
    void release();
  }

  function advancePhase(options: {
    skipFeedback?: boolean;
    chainEnd?: boolean;
    now?: number;
  } = {}) {
    const { skipFeedback = false, chainEnd = false, now = performance.now() } =
      options;

    if (!skipFeedback) {
      vibrateOnTransition();
    }

    currentIndex.value++;

    if (isComplete.value) {
      handleComplete();
      return;
    }

    if (chainEnd) {
      chainPhaseEnd(currentIndex.value);
    } else {
      setPhaseEndFromNow(currentIndex.value, now);
    }
  }

  function tick(now: number) {
    if (status.value !== 'ACTIVE' || isComplete.value) return;

    const overdue = now - phaseEndTime.value;

    if (now >= phaseEndTime.value) {
      if (overdue > CATCH_UP_THRESHOLD_MS) {
        while (
          now >= phaseEndTime.value &&
          currentIndex.value < timeline.value.length
        ) {
          advancePhase({ skipFeedback: true, chainEnd: true, now });
          if (isComplete.value) return;
        }
      } else {
        checkCountdownBeeps(0);
        advancePhase({ skipFeedback: false, now });
        if (isComplete.value) return;
      }
    } else {
      const remaining = getRemainingSeconds(phaseEndTime.value, now);
      remainingSeconds.value = remaining;
      checkCountdownBeeps(remaining);
      return;
    }

    remainingSeconds.value = getRemainingSeconds(phaseEndTime.value, now);
  }

  function startLoop() {
    stopLoop();
    loopTimer = setInterval(() => tick(performance.now()), 100);
    tick(performance.now());
  }

  function onVisibilityChange() {
    if (
      document.visibilityState === 'visible' &&
      status.value === 'ACTIVE' &&
      !isComplete.value
    ) {
      tick(performance.now());
      void acquire();
    }
  }

  async function start(settings: TimerSettings) {
    snapshotSettings.value = { ...settings };
    timeline.value = buildTimeline(settings);
    currentIndex.value = 0;
    status.value = 'ACTIVE';
    pausedRemainingMs = null;

    await unlockAudio();

    const now = performance.now();
    setPhaseEndFromNow(0, now);
    remainingSeconds.value = getRemainingSeconds(phaseEndTime.value, now);

    startLoop();
    void acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function pause() {
    if (status.value !== 'ACTIVE' || isComplete.value) return;
    pausedRemainingMs = phaseEndTime.value - performance.now();
    status.value = 'PAUSED';
    stopLoop();
    void release();
  }

  function resume() {
    if (status.value !== 'PAUSED' || pausedRemainingMs === null) return;
    phaseEndTime.value = performance.now() + pausedRemainingMs;
    pausedRemainingMs = null;
    status.value = 'ACTIVE';
    startLoop();
    void acquire();
  }

  function exitWorkout() {
    stopLoop();
    void release();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    status.value = 'IDLE';
    timeline.value = [];
    currentIndex.value = 0;
    snapshotSettings.value = null;
    pausedRemainingMs = null;
    resetPlayedBeeps();
  }

  function finishToSetup() {
    exitWorkout();
  }

  onUnmounted(() => {
    stopLoop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return {
    status,
    timeline,
    currentIndex,
    remainingSeconds,
    isComplete,
    currentPhase,
    totalSets,
    totalCycles,
    start,
    pause,
    resume,
    exitWorkout,
    finishToSetup,
    tick,
  };
}
