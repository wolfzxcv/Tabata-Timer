import { onUnmounted } from 'vue';

export function useWakeLock() {
  let sentinel: WakeLockSentinel | null = null;

  async function acquire() {
    if (!('wakeLock' in navigator)) return;
    if (sentinel) return;

    try {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
      });
    } catch {
      sentinel = null;
    }
  }

  async function release() {
    if (!sentinel) return;
    try {
      await sentinel.release();
    } catch {
      // ignore
    }
    sentinel = null;
  }

  onUnmounted(() => {
    void release();
  });

  return { acquire, release };
}
