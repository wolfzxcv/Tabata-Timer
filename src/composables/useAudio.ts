// AudioContext wrapper — no Vue imports needed
import type { Ref } from 'vue';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  }
  return audioCtx;
}

const CELEBRATION_NOTES = [1175, 1480, 1760, 2093, 1760, 2093];
const CELEBRATION_INTERVAL_MS = 110;
const CELEBRATION_BEEP_DURATION = 0.09;
/** Peak gain (0–1). Device/media volume still applies on top. */
const BEEP_PEAK_GAIN = 0.95;

let celebrationTimer: ReturnType<typeof setInterval> | null = null;

export function useAudio(muted: Ref<boolean>) {
  async function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  function playBeep(frequency: number, duration: number) {
    if (muted.value) return;

    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(BEEP_PEAK_GAIN, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.00001,
      ctx.currentTime + duration
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  function stopCelebration() {
    if (celebrationTimer !== null) {
      clearInterval(celebrationTimer);
      celebrationTimer = null;
    }
  }

  function startCelebration() {
    if (muted.value) return;

    stopCelebration();

    let noteIndex = 0;
    const playNext = () => {
      if (muted.value) {
        stopCelebration();
        return;
      }
      const frequency =
        CELEBRATION_NOTES[noteIndex % CELEBRATION_NOTES.length]!;
      playBeep(frequency, CELEBRATION_BEEP_DURATION);
      noteIndex++;
    };

    playNext();
    celebrationTimer = setInterval(playNext, CELEBRATION_INTERVAL_MS);
  }

  return { playBeep, unlockAudio, startCelebration, stopCelebration };
}

export function resetAudioContextForTests() {
  if (celebrationTimer !== null) {
    clearInterval(celebrationTimer);
    celebrationTimer = null;
  }
  audioCtx = null;
}
