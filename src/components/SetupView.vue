<template>
  <div class="setup">
    <header class="setup-header">
      <div>
        <h1 class="setup-title">Tabata Timer</h1>
        <p class="setup-total">{{ totalLabel }}</p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="icon-btn"
          :aria-label="settings.muted ? 'Unmute sounds' : 'Mute sounds'"
          :aria-pressed="settings.muted"
          @click="toggleMuted"
        >
          {{ settings.muted ? '🔇' : '🔊' }}
        </button>
        <button
          type="button"
          class="icon-btn"
          aria-label="Cycle theme (auto, light, dark)"
          @click="emit('cycleTheme')"
        >
          🌓
        </button>
      </div>
    </header>

    <div class="preset-row">
      <button
        type="button"
        class="chip-btn"
        aria-label="Apply Classic Tabata preset (20s work, 10s rest, 8 cycles)"
        title="20s work · 10s rest · 8 cycles"
        @click="applyClassicTabata"
      >
        Classic
      </button>
      <button
        type="button"
        class="chip-btn"
        aria-label="Reset interval settings to defaults"
        @click="emit('reset')"
      >
        Defaults
      </button>
    </div>

    <NumberStepper
      v-model="settings.prepare"
      label="PREPARE"
      :min="0"
      :max="300"
      accent="#f59e0b"
    />
    <NumberStepper
      v-model="settings.work"
      label="WORK"
      :min="5"
      :max="300"
      accent="#059669"
    />
    <NumberStepper
      v-model="settings.rest"
      label="REST"
      :min="0"
      :max="300"
      accent="#e11d48"
    />

    <div class="grid-row">
      <NumberStepper
        v-model="settings.cycles"
        label="CYCLES"
        :min="1"
        :max="99"
        accent="#71717a"
      />
      <NumberStepper
        v-model="settings.sets"
        label="SETS"
        :min="1"
        :max="99"
        accent="#71717a"
      />
    </div>

    <NumberStepper
      v-model="settings.setRest"
      label="SET REST"
      :min="0"
      :max="600"
      accent="#2563eb"
    />

    <button type="button" class="start-btn" @click="emit('start')">
      START
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CLASSIC_TABATA_VALUES, type TimerSettings } from '../types/timer';
import { totalWorkoutSeconds } from '../utils/buildTimeline';
import { formatDuration } from '../utils/formatDuration';
import NumberStepper from './NumberStepper.vue';

const settings = defineModel<TimerSettings>({ required: true });

const emit = defineEmits<{
  start: [];
  reset: [];
  cycleTheme: [];
}>();

const totalLabel = computed(() => {
  const seconds = totalWorkoutSeconds(settings.value);
  return `Total: ~${formatDuration(seconds)}`;
});

function applyClassicTabata() {
  settings.value = {
    ...settings.value,
    ...CLASSIC_TABATA_VALUES,
  };
}

function toggleMuted() {
  settings.value = {
    ...settings.value,
    muted: !settings.value.muted,
  };
}
</script>

<style scoped>
.setup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 2rem;
}

.setup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.setup-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.setup-total {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.75;
}

.icon-btn {
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--setup-btn-bg);
  font-size: 1.25rem;
  cursor: pointer;
}

.icon-btn[aria-pressed='true'] {
  opacity: 0.65;
}

.icon-btn:focus-visible,
.chip-btn:focus-visible,
.start-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.preset-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.chip-btn {
  min-height: 2.75rem;
  border: 1px solid var(--setup-border);
  border-left: 4px solid #71717a;
  border-radius: 0.75rem;
  background: var(--setup-btn-bg);
  color: var(--setup-text);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.grid-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  min-width: 0;
}

.start-btn {
  margin-top: 0.5rem;
  min-height: 3.75rem;
  border: none;
  border-radius: 0.75rem;
  background: #059669;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
}
</style>
