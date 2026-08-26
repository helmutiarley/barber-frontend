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
  <span class="b-label" :class="`b-label--${variant}-${color}`">
    <span class="b-label__text"><slot /></span>
  </span>
</template>

<style scoped>
.b-label {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-3xs);
  width: fit-content;
  max-width: 100%;
  min-height: calc(var(--b-line-height-body-3) + 4px);
  padding: 2px var(--b-spacing-2xs);
  border-radius: var(--b-border-radius-sm);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-3-bold);
  line-height: var(--b-line-height-body-3-bold);
  font-weight: var(--b-font-weight-body-3-bold);
  letter-spacing: var(--b-letter-spacing-body-3-bold);
  white-space: nowrap;
  overflow: hidden;
}

.b-label__text {
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

.b-label--contain-primary {
  background: var(--b-label-contain-primary-bg);
  color: var(--b-label-contain-primary-color);
  box-shadow: var(--b-label-contain-primary-outline);
}

.b-label--contain-success {
  background: var(--b-label-contain-success-bg);
  color: var(--b-label-contain-success-color);
  box-shadow: var(--b-label-contain-success-outline);
}

.b-label--contain-warning {
  background: var(--b-label-contain-warning-bg);
  color: var(--b-label-contain-warning-color);
  box-shadow: var(--b-label-contain-warning-outline);
}

.b-label--contain-danger {
  background: var(--b-label-contain-danger-bg);
  color: var(--b-label-contain-danger-color);
  box-shadow: var(--b-label-contain-danger-outline);
}

.b-label--contain-gray {
  background: var(--b-label-contain-gray-bg);
  color: var(--b-label-contain-gray-color);
  box-shadow: var(--b-label-contain-gray-outline);
}

.b-label--contain-grayLight {
  background: var(--b-label-contain-grayLight-bg);
  color: var(--b-label-contain-grayLight-color);
  box-shadow: var(--b-label-contain-grayLight-outline);
}

.b-label--outline-primary {
  background: var(--b-label-outline-primary-bg);
  color: var(--b-label-outline-primary-color);
  box-shadow: var(--b-label-outline-primary-outline);
}

.b-label--outline-success {
  background: var(--b-label-outline-success-bg);
  color: var(--b-label-outline-success-color);
  box-shadow: var(--b-label-outline-success-outline);
}

.b-label--outline-warning {
  background: var(--b-label-outline-warning-bg);
  color: var(--b-label-outline-warning-color);
  box-shadow: var(--b-label-outline-warning-outline);
}

.b-label--outline-danger {
  background: var(--b-label-outline-danger-bg);
  color: var(--b-label-outline-danger-color);
  box-shadow: var(--b-label-outline-danger-outline);
}

.b-label--outline-gray {
  background: var(--b-label-outline-gray-bg);
  color: var(--b-label-outline-gray-color);
  box-shadow: var(--b-label-outline-gray-outline);
}

.b-label--outline-grayLight {
  background: var(--b-label-outline-grayLight-bg);
  color: var(--b-label-outline-grayLight-color);
  box-shadow: var(--b-label-outline-grayLight-outline);
}
</style>
