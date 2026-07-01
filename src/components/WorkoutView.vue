<template>
  <div
    class="workout"
    :style="{
      backgroundColor: phaseStyle.bg,
      color: phaseStyle.text,
    }"
  >
    <button
      type="button"
      class="mute-btn"
      :aria-label="muted ? 'Unmute sounds' : 'Mute sounds'"
      :aria-pressed="muted"
      @click="emit('toggleMuted')"
    >
      {{ muted ? '🔇' : '🔊' }}
    </button>

    <!-- Complete screen -->
    <div v-if="timer.isComplete.value" class="canvas complete">
      <h2 class="complete-title">Workout Complete 🎉</h2>
      <button type="button" class="control-btn" @click="timer.exitWorkout()">
        Back to Setup
      </button>
    </div>

    <!-- Pause overlay -->
    <template v-else-if="timer.status.value === 'PAUSED'">
      <div class="canvas running dimmed">
        <p class="phase-name">{{ phaseName }}</p>
        <p class="countdown">{{ timer.remainingSeconds.value }}</p>
        <p v-if="progressLabel" class="progress">{{ progressLabel }}</p>
      </div>
      <div class="overlay">
        <p class="overlay-title">PAUSED</p>
        <div class="overlay-actions">
          <button
            type="button"
            class="control-btn"
            aria-label="Resume workout"
            @click="timer.resume()"
          >
            Resume
          </button>
          <button
            type="button"
            class="control-btn control-btn-ghost"
            aria-label="Exit workout"
            @click="confirmExit"
          >
            Exit
          </button>
        </div>
      </div>
    </template>

    <!-- Running countdown -->
    <div v-else class="canvas running">
      <p class="phase-name">{{ phaseName }}</p>
      <p class="countdown">{{ timer.remainingSeconds.value }}</p>
      <p v-if="progressLabel" class="progress">{{ progressLabel }}</p>
      <div class="controls">
        <button
          type="button"
          class="control-btn"
          aria-label="Pause workout"
          @click="timer.pause()"
        >
          Pause
        </button>
        <button
          type="button"
          class="control-btn control-btn-ghost"
          aria-label="Exit workout"
          @click="confirmExit"
        >
          Exit
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { useTimer } from '../composables/useTimer';
import { PHASE_COLORS, type IntervalType } from '../types/timer';

const props = defineProps<{
  timer: ReturnType<typeof useTimer>;
  muted: boolean;
}>();

const emit = defineEmits<{
  toggleMuted: [];
}>();

const phaseStyle = computed(() => {
  if (props.timer.isComplete.value) {
    return PHASE_COLORS.COMPLETE;
  }
  const type = props.timer.currentPhase.value?.type ?? 'WORK';
  return PHASE_COLORS[type as IntervalType];
});

const phaseName = computed(() => {
  if (props.timer.isComplete.value) return 'COMPLETE';
  return props.timer.currentPhase.value?.type ?? '';
});

const progressLabel = computed(() => {
  const phase = props.timer.currentPhase.value;
  if (!phase || props.timer.isComplete.value) return '';
  const cycle =
    phase.type === 'PREPARE'
      ? ''
      : `Cycle ${phase.cycleIndex}/${props.timer.totalCycles.value}`;
  const set =
    phase.type === 'PREPARE'
      ? ''
      : `Set ${phase.setIndex}/${props.timer.totalSets.value}`;
  return [cycle, set].filter(Boolean).join(' · ');
});

function updateThemeColor(color: string) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

watch(phaseStyle, (style) => updateThemeColor(style.bg), { immediate: true });

function confirmExit() {
  if (window.confirm('End workout?')) {
    props.timer.exitWorkout();
  }
}
</script>

<style scoped>
.workout {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.mute-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.mute-btn[aria-pressed='true'] {
  opacity: 0.75;
}

.mute-btn:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
}

.canvas.running {
  justify-content: space-between;
}

.dimmed {
  opacity: 0.35;
  filter: grayscale(0.2);
}

.phase-name {
  margin: 0;
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  font-weight: 800;
  letter-spacing: 0.12em;
}

.countdown {
  margin: 0;
  font-size: clamp(4rem, 20vw, 12rem);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.progress {
  margin: 0;
  font-size: 1rem;
  opacity: 0.85;
}

.controls,
.overlay-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 24rem;
  padding-bottom: 1rem;
}

.complete .control-btn {
  flex: none;
  width: 100%;
  max-width: 24rem;
  min-height: clamp(3rem, 12vh, 3.5rem);
  max-height: 4rem;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background: rgba(0, 0, 0, 0.45);
  padding: 1.5rem;
}

.overlay-title {
  margin: 0;
  font-size: clamp(2.5rem, 10vw, 4rem);
  font-weight: 900;
  letter-spacing: 0.15em;
}

.complete-title {
  margin: 0 0 2rem;
  font-size: clamp(1.75rem, 6vw, 2.75rem);
  font-weight: 800;
}

.controls .control-btn,
.overlay-actions .control-btn {
  flex: 1;
}

.control-btn {
  min-height: 3.5rem;
  border: none;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  color: #111;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.control-btn-ghost {
  background: rgba(0, 0, 0, 0.25);
  color: inherit;
  border: 2px solid currentColor;
}

.control-btn:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}
</style>
