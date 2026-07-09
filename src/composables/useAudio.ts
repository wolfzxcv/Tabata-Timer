// AudioContext wrapper — no Vue imports needed
import type { Ref } from 'vue';

let audioCtx: AudioContext | null = null;

function newAudioContext(): AudioContext {
  return new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();
}

function ensureFreshContext(): AudioContext {
  if (audioCtx && audioCtx.state === 'running') {
    return audioCtx;
  }
  if (audioCtx) {
    void audioCtx.close();
    audioCtx = null;
  }
  audioCtx = newAudioContext();
  return audioCtx;
}

const CELEBRATION_NOTES = [1175, 1480, 1760, 2093, 1760, 2093];
const CELEBRATION_INTERVAL_MS = 110;
const CELEBRATION_BEEP_DURATION = 0.09;
/** Peak gain (0–1). Device/media volume still applies on top. */
const BEEP_PEAK_GAIN = 0.95;

let celebrationTimer: ReturnType<typeof setInterval> | null = null;

function scheduleBeep(ctx: AudioContext, frequency: number, duration: number) {
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

function primeIosOutput(ctx: AudioContext) {
  // Prime iOS output with a silent buffer during the same gesture.
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  source.stop(0);
}

export function useAudio(muted: Ref<boolean>) {
  /**
   * Must be invoked synchronously inside a user gesture (tap/click).
   * Do not await before calling — iOS Safari drops the gesture context.
   */
  function unlockAudio() {
    const ctx = ensureFreshContext();
    primeIosOutput(ctx);
    void ctx.resume().then(() => {
      if (audioCtx !== ctx) return;
      primeIosOutput(ctx);
    });
  }

  function playBeep(frequency: number, duration: number) {
    if (muted.value || !audioCtx || audioCtx.state !== 'running') return;
    scheduleBeep(audioCtx, frequency, duration);
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
  if (audioCtx) {
    void audioCtx.close();
    audioCtx = null;
  }
}
