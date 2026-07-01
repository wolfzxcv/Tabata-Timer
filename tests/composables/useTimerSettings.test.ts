import { effectScope } from 'vue';
import { DEFAULT_SETTINGS } from '../../src/types/timer';
import { useTimerSettings } from '../../src/composables/useTimerSettings';

describe('useTimerSettings', () => {
  it('resetToDefaults preserves theme and muted', () => {
    const scope = effectScope();
    scope.run(() => {
      const { settings, resetToDefaults } = useTimerSettings();

      settings.value = {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
        muted: true,
        work: 99,
      };

      resetToDefaults();

      expect(settings.value.theme).toBe('dark');
      expect(settings.value.muted).toBe(true);
      expect(settings.value.work).toBe(DEFAULT_SETTINGS.work);
    });
    scope.stop();
  });
});
