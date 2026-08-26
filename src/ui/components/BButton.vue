<script setup lang="ts">
import { computed } from 'vue';
import type { BButtonColor, BButtonSize, BButtonVariant } from '../types';
import BCircleLoader from './BCircleLoader.vue';
import BIcon from './BIcon.vue';

const props = withDefaults(
  defineProps<{
    color?: BButtonColor;
    variant?: BButtonVariant;
    size?: BButtonSize;
    type?: 'button' | 'submit' | 'reset';
    isDisabled?: boolean | null;
    isLoading?: boolean;
    fullWidth?: boolean;
    iconPrepend?: string;
    ariaLabel?: string;
  }>(),
  {
    color: 'primary',
    variant: 'contain',
    size: 'medium',
    type: 'button',
    isDisabled: false,
    isLoading: false,
    fullWidth: false,
    iconPrepend: undefined,
    ariaLabel: undefined,
  },
);

defineEmits<{ click: [MouseEvent] }>();

const blocked = computed(() => Boolean(props.isDisabled) || props.isLoading);
</script>

<template>
  <button
    class="b-button"
    :class="[
      `b-button--${variant}`,
      `b-button--${color}`,
      `b-button--${size}`,
      { 'b-button--full': fullWidth, 'b-button--loading': isLoading },
    ]"
    :type="type"
    :disabled="blocked"
    :aria-label="ariaLabel"
    :aria-busy="isLoading || undefined"
    @click="$emit('click', $event)"
  >
    <BCircleLoader v-if="isLoading" size="16px" />
    <BIcon v-else-if="iconPrepend" :name="iconPrepend" dimensions="16px" />
    <span class="b-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.b-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--b-spacing-2xs);
  border: 1px solid transparent;
  border-radius: var(--b-border-radius-sm);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-button-3);
  line-height: var(--b-line-height-button-3);
  font-weight: var(--b-font-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--b-transition),
    border-color var(--b-transition),
    color var(--b-transition);
}

.b-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.b-button:focus-visible {
  outline: 2px solid var(--b-fg-brand-default);
  outline-offset: 2px;
}

.b-button--medium {
  padding: var(--b-spacing-2xs) var(--b-spacing-sm);
  min-height: 40px;
}

.b-button--small {
  padding: var(--b-spacing-3xs) var(--b-spacing-xs);
  min-height: 32px;
  font-size: var(--b-font-size-body-3);
}

.b-button--full {
  width: 100%;
}

.b-button--contain.b-button--primary {
  background: var(--b-color-brand-500);
  color: var(--b-fg-neutral-inverse);
}

.b-button--contain.b-button--primary:hover:not(:disabled) {
  background: var(--b-color-brand-600);
}

.b-button--contain.b-button--neutral {
  background: var(--b-color-neutral-800);
  color: var(--b-fg-neutral-inverse);
}

.b-button--contain.b-button--neutral:hover:not(:disabled) {
  background: var(--b-color-neutral-900);
}

.b-button--contain.b-button--danger {
  background: var(--b-color-danger-500);
  color: var(--b-fg-neutral-inverse);
}

.b-button--contain.b-button--danger:hover:not(:disabled) {
  background: var(--b-color-danger-600);
}

.b-button--outline {
  background: transparent;
  border-color: var(--b-border-neutral-secondary);
}

.b-button--outline.b-button--primary {
  color: var(--b-fg-brand-primary);
  border-color: var(--b-color-brand-500);
}

.b-button--outline.b-button--neutral {
  color: var(--b-fg-neutral-default);
}

.b-button--outline.b-button--danger {
  color: var(--b-fg-danger-primary);
  border-color: var(--b-color-danger-500);
}

.b-button--outline:hover:not(:disabled) {
  background: var(--b-bg-neutral-hover);
}

.b-button--text {
  background: transparent;
  border-color: transparent;
}

.b-button--text.b-button--primary {
  color: var(--b-fg-brand-primary);
}

.b-button--text.b-button--neutral {
  color: var(--b-fg-neutral-default);
}

.b-button--text.b-button--danger {
  color: var(--b-fg-danger-primary);
}

.b-button--text:hover:not(:disabled) {
  background: var(--b-bg-neutral-hover);
}

.b-button__label:empty {
  display: none;
}
</style>
