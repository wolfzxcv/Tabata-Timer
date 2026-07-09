import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import {
  resetAudioContextForTests,
  useAudio
} from '../../src/composables/useAudio';

class MockOscillator {
  frequency = { value: 0 };
  type = 'sine';
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGain {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn()
  };
  connect = vi.fn();
}

class MockBufferSource {
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  sampleRate = 44100;

  createOscillator = vi.fn(() => new MockOscillator());
  createGain = vi.fn(() => new MockGain());
  createBuffer = vi.fn(() => ({}) as AudioBuffer);
  createBufferSource = vi.fn(() => new MockBufferSource());
  destination = {};

  resume = vi.fn(async () => {
    this.state = 'running';
  });

  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

const AudioContextMock = vi.fn(() => new MockAudioContext());

function latestContext(): MockAudioContext {
  return AudioContextMock.mock.results.at(-1)!.value as MockAudioContext;
}

describe('useAudio', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', AudioContextMock);
    AudioContextMock.mockClear();
  });

  afterEach(() => {
    resetAudioContextForTests();
    vi.unstubAllGlobals();
  });

  it('unlockAudio recreates a suspended context and primes iOS output', () => {
    const muted = ref(false);
    const { unlockAudio, playBeep } = useAudio(muted);

    unlockAudio();

    const ctx = latestContext();
    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.createBuffer).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();

    playBeep(800, 0.1);
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it('playBeep is skipped while muted or before unlock', () => {
    const { playBeep: playBeepMuted } = useAudio(ref(true));
    playBeepMuted(800, 0.1);
    expect(AudioContextMock).not.toHaveBeenCalled();

    const { playBeep: playBeepLocked } = useAudio(ref(false));
    playBeepLocked(800, 0.1);
    expect(AudioContextMock).not.toHaveBeenCalled();
  });

  it('unlockAudio replaces a non-running context', () => {
    const { unlockAudio } = useAudio(ref(false));

    unlockAudio();
    const firstCtx = latestContext();
    firstCtx.state = 'interrupted' as AudioContextState;

    unlockAudio();

    expect(AudioContextMock.mock.results.length).toBeGreaterThanOrEqual(2);
    expect(firstCtx.close).toHaveBeenCalled();
  });
});
