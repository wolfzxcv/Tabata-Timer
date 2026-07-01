<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: number;
  min: number;
  max: number;
  accent?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();
</script>

<template>
  <div class="stepper" :style="{ '--accent': accent ?? '#71717a' }">
    <span class="stepper-label" :id="`label-${label}`">{{ label }}</span>
    <div class="stepper-controls" :aria-labelledby="`label-${label}`">
      <button
        type="button"
        class="stepper-btn"
        :aria-label="`Decrease ${label}`"
        :disabled="modelValue <= min"
        @click="emit('update:modelValue', Math.max(modelValue - 1, min))"
      >
        −
      </button>
      <span class="stepper-value" aria-live="polite">{{ modelValue }}</span>
      <button
        type="button"
        class="stepper-btn"
        :aria-label="`Increase ${label}`"
        :disabled="modelValue >= max"
        @click="emit('update:modelValue', Math.min(modelValue + 1, max))"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--setup-card-bg);
  border-left: 4px solid var(--accent);
}

.stepper-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.stepper-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.stepper-value {
  font-size: 1.75rem;
  font-weight: 700;
  min-width: 3rem;
  text-align: center;
}

.stepper-btn {
  width: 3.5rem;
  height: 3.5rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--setup-btn-bg);
  color: var(--setup-text);
  font-size: 1.5rem;
  cursor: pointer;
}

.stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
