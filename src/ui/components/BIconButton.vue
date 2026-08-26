<script setup lang="ts">
import { computed } from 'vue';
import { resolveColorToken } from '../types';
import BIcon from './BIcon.vue';

const props = withDefaults(
  defineProps<{
    icon: string;
    iconColor?: string;
    iconDescription?: string;
    color?: 'primary' | 'neutral' | 'danger';
    variant?: 'contain' | 'outline' | 'text';
    size?: string;
    isDisabled?: boolean | null;
  }>(),
  {
    iconColor: undefined,
    iconDescription: undefined,
    color: 'neutral',
    variant: 'text',
    size: '20px',
    isDisabled: false,
  },
);

defineEmits<{ click: [MouseEvent] }>();

const style = computed(() => ({ color: resolveColorToken(props.iconColor) }));
</script>

<template>
  <button
    class="b-icon-button"
    :class="[
      `b-icon-button--${variant}-${color}`,
      { 'b-icon-button--disabled': Boolean(isDisabled) },
    ]"
    type="button"
    :disabled="Boolean(isDisabled)"
    :aria-label="iconDescription"
    :style="style"
    @click="$emit('click', $event)"
  >
    <BIcon :name="icon" :dimensions="size" />
  </button>
</template>

<style scoped>
.b-icon-button {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border: none;
  border-radius: var(--b-border-radius-md);
  box-shadow: var(--b-icon-button-border);
  background: var(--b-icon-button-bg);
  color: var(--b-icon-button-color);
  line-height: 16px;
  cursor: pointer;
  transition:
    background 0.1s ease-in-out,
    transform 0.1s ease-in-out;
}

.b-icon-button--disabled {
  cursor: not-allowed;
}

.b-icon-button:focus-visible {
  outline: 2px solid var(--b-color-meteorite-500);
  outline-offset: 2px;
}

.b-icon-button:active:not(.b-icon-button--disabled) {
  transform: scale(0.95);
}

.b-icon-button--contain-primary {
  --b-icon-button-color: var(--b-button-contain-primary-color);
  --b-icon-button-bg: var(--b-button-contain-primary-bg);
  --b-icon-button-border: var(--b-button-contain-primary-border);
}

.b-icon-button--contain-primary:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-contain-primary-color-hover);
  --b-icon-button-bg: var(--b-button-contain-primary-bg-hover);
  --b-icon-button-border: var(--b-button-contain-primary-border-hover);
}

.b-icon-button--contain-primary.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-contain-primary-color-disabled);
  --b-icon-button-bg: var(--b-button-contain-primary-bg-disabled);
  --b-icon-button-border: var(--b-button-contain-primary-border-disabled);
}

.b-icon-button--contain-neutral {
  --b-icon-button-color: var(--b-button-contain-neutral-color);
  --b-icon-button-bg: var(--b-button-contain-neutral-bg);
  --b-icon-button-border: var(--b-button-contain-neutral-border);
}

.b-icon-button--contain-neutral:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-contain-neutral-color-hover);
  --b-icon-button-bg: var(--b-button-contain-neutral-bg-hover);
  --b-icon-button-border: var(--b-button-contain-neutral-border-hover);
}

.b-icon-button--contain-neutral.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-contain-neutral-color-disabled);
  --b-icon-button-bg: var(--b-button-contain-neutral-bg-disabled);
  --b-icon-button-border: var(--b-button-contain-neutral-border-disabled);
}

.b-icon-button--contain-danger {
  --b-icon-button-color: var(--b-button-contain-danger-color);
  --b-icon-button-bg: var(--b-button-contain-danger-bg);
  --b-icon-button-border: var(--b-button-contain-danger-border);
}

.b-icon-button--contain-danger:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-contain-danger-color-hover);
  --b-icon-button-bg: var(--b-button-contain-danger-bg-hover);
  --b-icon-button-border: var(--b-button-contain-danger-border-hover);
}

.b-icon-button--contain-danger.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-contain-danger-color-disabled);
  --b-icon-button-bg: var(--b-button-contain-danger-bg-disabled);
  --b-icon-button-border: var(--b-button-contain-danger-border-disabled);
}

.b-icon-button--outline-primary {
  --b-icon-button-color: var(--b-button-outline-primary-color);
  --b-icon-button-bg: var(--b-button-outline-primary-bg);
  --b-icon-button-border: var(--b-button-outline-primary-border);
}

.b-icon-button--outline-primary:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-outline-primary-color-hover);
  --b-icon-button-bg: var(--b-button-outline-primary-bg-hover);
  --b-icon-button-border: var(--b-button-outline-primary-border-hover);
}

.b-icon-button--outline-primary.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-outline-primary-color-disabled);
  --b-icon-button-bg: var(--b-button-outline-primary-bg-disabled);
  --b-icon-button-border: var(--b-button-outline-primary-border-disabled);
}

.b-icon-button--outline-neutral {
  --b-icon-button-color: var(--b-button-outline-neutral-color);
  --b-icon-button-bg: var(--b-button-outline-neutral-bg);
  --b-icon-button-border: var(--b-button-outline-neutral-border);
}

.b-icon-button--outline-neutral:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-outline-neutral-color-hover);
  --b-icon-button-bg: var(--b-button-outline-neutral-bg-hover);
  --b-icon-button-border: var(--b-button-outline-neutral-border-hover);
}

.b-icon-button--outline-neutral.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-outline-neutral-color-disabled);
  --b-icon-button-bg: var(--b-button-outline-neutral-bg-disabled);
  --b-icon-button-border: var(--b-button-outline-neutral-border-disabled);
}

.b-icon-button--outline-danger {
  --b-icon-button-color: var(--b-button-outline-danger-color);
  --b-icon-button-bg: var(--b-button-outline-danger-bg);
  --b-icon-button-border: var(--b-button-outline-danger-border);
}

.b-icon-button--outline-danger:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-outline-danger-color-hover);
  --b-icon-button-bg: var(--b-button-outline-danger-bg-hover);
  --b-icon-button-border: var(--b-button-outline-danger-border-hover);
}

.b-icon-button--outline-danger.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-outline-danger-color-disabled);
  --b-icon-button-bg: var(--b-button-outline-danger-bg-disabled);
  --b-icon-button-border: var(--b-button-outline-danger-border-disabled);
}

.b-icon-button--text-primary {
  --b-icon-button-color: var(--b-button-text-primary-color);
  --b-icon-button-bg: var(--b-button-text-primary-bg);
  --b-icon-button-border: var(--b-button-text-primary-border);
}

.b-icon-button--text-primary:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-text-primary-color-hover);
  --b-icon-button-bg: var(--b-button-text-primary-bg-hover);
  --b-icon-button-border: var(--b-button-text-primary-border-hover);
}

.b-icon-button--text-primary.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-text-primary-color-disabled);
  --b-icon-button-bg: var(--b-button-text-primary-bg-disabled);
  --b-icon-button-border: var(--b-button-text-primary-border-disabled);
}

.b-icon-button--text-neutral {
  --b-icon-button-color: var(--b-button-text-neutral-color);
  --b-icon-button-bg: var(--b-button-text-neutral-bg);
  --b-icon-button-border: var(--b-button-text-neutral-border);
}

.b-icon-button--text-neutral:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-text-neutral-color-hover);
  --b-icon-button-bg: var(--b-button-text-neutral-bg-hover);
  --b-icon-button-border: var(--b-button-text-neutral-border-hover);
}

.b-icon-button--text-neutral.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-text-neutral-color-disabled);
  --b-icon-button-bg: var(--b-button-text-neutral-bg-disabled);
  --b-icon-button-border: var(--b-button-text-neutral-border-disabled);
}

.b-icon-button--text-danger {
  --b-icon-button-color: var(--b-button-text-danger-color);
  --b-icon-button-bg: var(--b-button-text-danger-bg);
  --b-icon-button-border: var(--b-button-text-danger-border);
}

.b-icon-button--text-danger:hover:not(.b-icon-button--disabled) {
  --b-icon-button-color: var(--b-button-text-danger-color-hover);
  --b-icon-button-bg: var(--b-button-text-danger-bg-hover);
  --b-icon-button-border: var(--b-button-text-danger-border-hover);
}

.b-icon-button--text-danger.b-icon-button--disabled {
  --b-icon-button-color: var(--b-button-text-danger-color-disabled);
  --b-icon-button-bg: var(--b-button-text-danger-bg-disabled);
  --b-icon-button-border: var(--b-button-text-danger-border-disabled);
}
</style>
