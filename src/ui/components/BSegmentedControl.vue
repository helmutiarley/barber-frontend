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
  <div class="b-segmented" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="segment in segments"
      :key="segment.id"
      class="b-segmented__item"
      :class="{ 'b-segmented__item--active': segment.id === modelValue }"
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
.b-segmented {
  display: inline-flex;
  gap: var(--b-spacing-4xs);
  padding: var(--b-spacing-4xs);
  background: var(--b-bg-neutral-secondary);
  border-radius: var(--b-border-radius-sm);
}

.b-segmented__item {
  padding: var(--b-spacing-3xs) var(--b-spacing-xs);
  min-height: 32px;
  border: 0;
  border-radius: var(--b-border-radius-xs);
  background: transparent;
  color: var(--b-fg-neutral-secondary);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--b-transition),
    color var(--b-transition);
}

.b-segmented__item:hover {
  color: var(--b-fg-neutral-default);
}

.b-segmented__item--active {
  background: var(--b-bg-neutral-default);
  color: var(--b-fg-neutral-default);
  box-shadow: var(--b-shadow-1-bottom);
}

.b-segmented__item:focus-visible {
  outline: 2px solid var(--b-fg-brand-default);
  outline-offset: 1px;
}
</style>
