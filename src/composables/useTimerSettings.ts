import { onMounted, ref, watch } from 'vue';
import { DEFAULT_SETTINGS, type TimerSettings } from '../types/timer';
import { parseSettings } from '../utils/parseSettings';

const STORAGE_KEY = 'tabata-settings';

export function useTimerSettings() {
  const settings = ref<TimerSettings>({ ...DEFAULT_SETTINGS });
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      settings.value = raw
        ? parseSettings(JSON.parse(raw))
        : { ...DEFAULT_SETTINGS };
    } catch {
      settings.value = { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveSettings, 300);
  }

  function resetToDefaults() {
    settings.value = { ...DEFAULT_SETTINGS };
  }

  onMounted(loadSettings);

  watch(settings, debouncedSave, { deep: true });

  return { settings, resetToDefaults, loadSettings };
}
