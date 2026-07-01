<template>
  <SetupView
    v-if="isIdle"
    v-model="settings"
    @start="handleStart"
    @reset="handleReset"
    @cycle-theme="cycleTheme"
  />
  <WorkoutView
    v-else
    :timer="timer"
    :muted="settings.muted"
    @toggle-muted="toggleMuted"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SetupView from './components/SetupView.vue';
import WorkoutView from './components/WorkoutView.vue';
import { useTheme } from './composables/useTheme';
import { useTimer } from './composables/useTimer';
import { useTimerSettings } from './composables/useTimerSettings';

const { settings, resetToDefaults } = useTimerSettings();
const timer = useTimer(computed(() => settings.value.muted));
const { cycleTheme } = useTheme(
  computed({
    get: () => settings.value.theme,
    set: (theme) => {
      settings.value = { ...settings.value, theme };
    },
  }),
);

const isIdle = computed(() => timer.status.value === 'IDLE');

function toggleMuted() {
  settings.value = {
    ...settings.value,
    muted: !settings.value.muted,
  };
}

function handleStart() {
  void timer.start({ ...settings.value });
}

function handleReset() {
  resetToDefaults();
}
</script>
