<script setup lang="ts">
import type { BSegment } from '../types';

withDefaults(
  defineProps<{
    modelValue?: string;
    segments?: BSegment[];
    ariaLabel?: string;
  }>(),
  { modelValue: '', segments: () => [], ariaLabel: undefined },
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>

<template>
  <div class="b-segmented-control" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="segment in segments"
      :key="segment.id"
      class="b-segmented-control__segment"
      :class="{ 'b-segmented-control__segment--active': segment.id === modelValue }"
      type="button"
      role="radio"
      :aria-checked="segment.id === modelValue"
      @click="emit('update:modelValue', segment.id)"
    >
      {{ segment.label }}
    </button>
  </div>
</template>

<style scoped>
.b-segmented-control {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  padding: 2px;
  border-radius: var(--b-border-radius-2xl);
  background-color: var(--b-segmented-control-bg);
  touch-action: none;
  user-select: none;
}

.b-segmented-control__segment {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: var(--b-spacing-2xs) var(--b-spacing-sm);
  border: none;
  border-radius: var(--b-border-radius-2xl);
  background: none;
  color: var(--b-segmented-control-segment-color);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
  user-select: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}

.b-segmented-control__segment:hover:not(.b-segmented-control__segment--active) {
  color: var(--b-segmented-control-segment-hover-color);
}

.b-segmented-control__segment:focus-visible {
  outline: none;
  box-shadow: var(--b-segmented-control-segment-focus-shadow);
}

.b-segmented-control__segment--active {
  background: var(--b-segmented-control-segment-active-bg);
  box-shadow: var(--b-segmented-control-segment-active-shadow);
  color: var(--b-segmented-control-segment-active-color);
}
</style>
