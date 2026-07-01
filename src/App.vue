<script setup lang="ts">
import { computed } from 'vue';
import SetupView from './components/SetupView.vue';
import WorkoutView from './components/WorkoutView.vue';
import { useTheme } from './composables/useTheme';
import { useTimer } from './composables/useTimer';
import { useTimerSettings } from './composables/useTimerSettings';

const { settings, resetToDefaults } = useTimerSettings();
const muted = computed(() => settings.value.muted);
const timer = useTimer(muted);
const { cycleTheme } = useTheme(computed(() => settings.value.theme));

const isIdle = computed(() => timer.status.value === 'IDLE');

function handleStart() {
  void timer.start({ ...settings.value });
}

function handleReset() {
  resetToDefaults();
}
</script>

<template>
  <SetupView
    v-if="isIdle"
    v-model="settings"
    @start="handleStart"
    @reset="handleReset"
    @cycle-theme="cycleTheme"
  />
  <WorkoutView v-else :timer="timer" />
</template>
