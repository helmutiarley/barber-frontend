<script setup lang="ts">
import type { BLabelColor } from '../types';

withDefaults(
  defineProps<{
    color?: BLabelColor;
    variant?: 'contain' | 'outline';
  }>(),
  { color: 'gray', variant: 'contain' },
);
</script>

<template>
  <span class="b-label" :class="[`b-label--${color}`, `b-label--${variant}`]">
    <slot />
  </span>
</template>

<style scoped>
.b-label {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-4xs);
  padding: 2px var(--b-spacing-2xs);
  border: 1px solid transparent;
  border-radius: var(--b-border-radius-full);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-3);
  line-height: var(--b-line-height-body-3);
  font-weight: var(--b-font-weight-medium);
  white-space: nowrap;
}

.b-label--primary {
  background: var(--b-bg-brand-tint-default);
  color: var(--b-fg-brand-primary);
}

.b-label--success {
  background: var(--b-bg-success-tint-default);
  color: var(--b-fg-success-primary);
}

.b-label--warning {
  background: var(--b-bg-warning-tint-default);
  color: var(--b-fg-warning-primary);
}

.b-label--danger {
  background: var(--b-bg-danger-tint-default);
  color: var(--b-fg-danger-primary);
}

.b-label--gray {
  background: var(--b-color-neutral-200);
  color: var(--b-color-neutral-700);
}

.b-label--grayLight {
  background: var(--b-color-neutral-100);
  color: var(--b-color-neutral-600);
}

.b-label--outline {
  background: transparent;
  border-color: currentcolor;
}
</style>
