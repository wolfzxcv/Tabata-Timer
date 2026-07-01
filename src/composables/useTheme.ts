import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import type { ThemePreference } from '../types/timer';

const THEME_CYCLE: ThemePreference[] = ['auto', 'light', 'dark'];

export function useTheme(theme: Ref<ThemePreference>) {
  let mediaQuery: MediaQueryList | null = null;

  function applyTheme() {
    const root = document.documentElement;
    if (theme.value === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme.value);
    }
  }

  function onSystemChange() {
    if (theme.value === 'auto') applyTheme();
  }

  function cycleTheme() {
    const index = THEME_CYCLE.indexOf(theme.value);
    theme.value = THEME_CYCLE[(index + 1) % THEME_CYCLE.length]!;
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', onSystemChange);
    applyTheme();
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onSystemChange);
  });

  watch(theme, applyTheme);

  return { cycleTheme };
}
