<script setup lang="ts">
import { computed, useSlots } from 'vue';
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

const slots = useSlots();

const blocked = computed(() => Boolean(props.isDisabled) || props.isLoading);
const iconOnly = computed(() => Boolean(props.iconPrepend) && !slots.default);
</script>

<template>
  <button
    class="b-button"
    :class="[
      `b-button--${variant}-${color}`,
      `b-button--${size}`,
      {
        'b-button--full-width': fullWidth,
        'b-button--loading': isLoading,
        'b-button--disabled': blocked,
        'b-button--icon-only': iconOnly,
      },
    ]"
    :type="type"
    :disabled="blocked"
    :aria-label="ariaLabel"
    :aria-busy="isLoading || undefined"
    @click="$emit('click', $event)"
  >
    <BIcon v-if="iconPrepend" class="b-button__icon" :name="iconPrepend" dimensions="16px" />
    <span class="b-button__text"><slot /></span>
    <span v-if="isLoading" class="b-button__loader">
      <BCircleLoader size="16px" />
    </span>
  </button>
</template>

<style scoped>
.b-button {
  position: relative;
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0;
  width: fit-content;
  min-width: max-content;
  min-height: 40px;
  padding: var(--b-spacing-2xs) var(--b-spacing-sm);
  border: none;
  border-radius: var(--b-border-radius-md);
  box-shadow: var(--b-button-border);
  background: var(--b-button-bg);
  color: var(--b-button-color);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-button-2);
  line-height: var(--b-line-height-button-2);
  font-weight: var(--b-font-weight-button-2);
  letter-spacing: var(--b-letter-spacing-button-2);
  text-wrap: wrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.1s ease-in-out,
    transform 0.1s ease-in-out;
}

.b-button__text {
  padding-inline: var(--b-spacing-2xs);
  color: inherit;
}

.b-button__text:empty {
  display: none;
}

.b-button__loader {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
}

.b-button--small {
  min-height: 32px;
  padding: 6px var(--b-spacing-xs);
  font-size: var(--b-font-size-button-4);
  line-height: var(--b-line-height-button-4);
  font-weight: var(--b-font-weight-button-4);
  letter-spacing: var(--b-letter-spacing-button-4);
}

.b-button--small .b-button__text {
  padding-inline: var(--b-spacing-3xs);
}

.b-button--icon-only {
  gap: 0;
}

.b-button--icon-only .b-button__text {
  padding-inline: 0;
}

.b-button--full-width {
  width: 100%;
  min-width: 0;
  padding-left: 0;
  padding-right: 0;
}

.b-button--loading {
  cursor: wait;
}

.b-button--loading .b-button__icon,
.b-button--loading .b-button__text {
  opacity: 0;
}

.b-button--disabled:not(.b-button--loading) {
  cursor: not-allowed;
}

.b-button:focus-visible {
  outline: 2px solid var(--b-fg-brand-secondary);
  outline-offset: 2px;
}

.b-button:active:not(.b-button--disabled):not(.b-button--loading) {
  transform: scale(0.95);
}

.b-button--contain-primary {
  --b-button-color: var(--b-button-contain-primary-color);
  --b-button-bg: var(--b-button-contain-primary-bg);
  --b-button-border: var(--b-button-contain-primary-border);
  --b-circle-loader-color: var(--b-fg-brand-inverse-default);
  --b-circle-loader-border-color: var(--b-color-primary-400);
}

.b-button--contain-primary:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-contain-primary-color-hover);
  --b-button-bg: var(--b-button-contain-primary-bg-hover);
  --b-button-border: var(--b-button-contain-primary-border-hover);
}

.b-button--contain-primary.b-button--disabled {
  --b-button-color: var(--b-button-contain-primary-color-disabled);
  --b-button-bg: var(--b-button-contain-primary-bg-disabled);
  --b-button-border: var(--b-button-contain-primary-border-disabled);
}

.b-button--contain-neutral {
  --b-button-color: var(--b-button-contain-neutral-color);
  --b-button-bg: var(--b-button-contain-neutral-bg);
  --b-button-border: var(--b-button-contain-neutral-border);
  --b-circle-loader-color: var(--b-fg-neutral-inverse-default);
  --b-circle-loader-border-color: var(--b-color-neutral-600);
}

.b-button--contain-neutral:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-contain-neutral-color-hover);
  --b-button-bg: var(--b-button-contain-neutral-bg-hover);
  --b-button-border: var(--b-button-contain-neutral-border-hover);
}

.b-button--contain-neutral.b-button--disabled {
  --b-button-color: var(--b-button-contain-neutral-color-disabled);
  --b-button-bg: var(--b-button-contain-neutral-bg-disabled);
  --b-button-border: var(--b-button-contain-neutral-border-disabled);
}

.b-button--contain-danger {
  --b-button-color: var(--b-button-contain-danger-color);
  --b-button-bg: var(--b-button-contain-danger-bg);
  --b-button-border: var(--b-button-contain-danger-border);
  --b-circle-loader-color: var(--b-fg-danger-inverse-default);
  --b-circle-loader-border-color: var(--b-color-danger-400);
}

.b-button--contain-danger:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-contain-danger-color-hover);
  --b-button-bg: var(--b-button-contain-danger-bg-hover);
  --b-button-border: var(--b-button-contain-danger-border-hover);
}

.b-button--contain-danger.b-button--disabled {
  --b-button-color: var(--b-button-contain-danger-color-disabled);
  --b-button-bg: var(--b-button-contain-danger-bg-disabled);
  --b-button-border: var(--b-button-contain-danger-border-disabled);
}

.b-button--outline-primary {
  --b-button-color: var(--b-button-outline-primary-color);
  --b-button-bg: var(--b-button-outline-primary-bg);
  --b-button-border: var(--b-button-outline-primary-border);
}

.b-button--outline-primary:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-outline-primary-color-hover);
  --b-button-bg: var(--b-button-outline-primary-bg-hover);
  --b-button-border: var(--b-button-outline-primary-border-hover);
}

.b-button--outline-primary.b-button--disabled {
  --b-button-color: var(--b-button-outline-primary-color-disabled);
  --b-button-bg: var(--b-button-outline-primary-bg-disabled);
  --b-button-border: var(--b-button-outline-primary-border-disabled);
}

.b-button--outline-neutral {
  --b-button-color: var(--b-button-outline-neutral-color);
  --b-button-bg: var(--b-button-outline-neutral-bg);
  --b-button-border: var(--b-button-outline-neutral-border);
}

.b-button--outline-neutral:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-outline-neutral-color-hover);
  --b-button-bg: var(--b-button-outline-neutral-bg-hover);
  --b-button-border: var(--b-button-outline-neutral-border-hover);
}

.b-button--outline-neutral.b-button--disabled {
  --b-button-color: var(--b-button-outline-neutral-color-disabled);
  --b-button-bg: var(--b-button-outline-neutral-bg-disabled);
  --b-button-border: var(--b-button-outline-neutral-border-disabled);
}

.b-button--outline-danger {
  --b-button-color: var(--b-button-outline-danger-color);
  --b-button-bg: var(--b-button-outline-danger-bg);
  --b-button-border: var(--b-button-outline-danger-border);
}

.b-button--outline-danger:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-outline-danger-color-hover);
  --b-button-bg: var(--b-button-outline-danger-bg-hover);
  --b-button-border: var(--b-button-outline-danger-border-hover);
}

.b-button--outline-danger.b-button--disabled {
  --b-button-color: var(--b-button-outline-danger-color-disabled);
  --b-button-bg: var(--b-button-outline-danger-bg-disabled);
  --b-button-border: var(--b-button-outline-danger-border-disabled);
}

.b-button--text-primary {
  --b-button-color: var(--b-button-text-primary-color);
  --b-button-bg: var(--b-button-text-primary-bg);
  --b-button-border: var(--b-button-text-primary-border);
}

.b-button--text-primary:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-text-primary-color-hover);
  --b-button-bg: var(--b-button-text-primary-bg-hover);
  --b-button-border: var(--b-button-text-primary-border-hover);
}

.b-button--text-primary.b-button--disabled {
  --b-button-color: var(--b-button-text-primary-color-disabled);
  --b-button-bg: var(--b-button-text-primary-bg-disabled);
  --b-button-border: var(--b-button-text-primary-border-disabled);
}

.b-button--text-neutral {
  --b-button-color: var(--b-button-text-neutral-color);
  --b-button-bg: var(--b-button-text-neutral-bg);
  --b-button-border: var(--b-button-text-neutral-border);
}

.b-button--text-neutral:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-text-neutral-color-hover);
  --b-button-bg: var(--b-button-text-neutral-bg-hover);
  --b-button-border: var(--b-button-text-neutral-border-hover);
}

.b-button--text-neutral.b-button--disabled {
  --b-button-color: var(--b-button-text-neutral-color-disabled);
  --b-button-bg: var(--b-button-text-neutral-bg-disabled);
  --b-button-border: var(--b-button-text-neutral-border-disabled);
}

.b-button--text-danger {
  --b-button-color: var(--b-button-text-danger-color);
  --b-button-bg: var(--b-button-text-danger-bg);
  --b-button-border: var(--b-button-text-danger-border);
}

.b-button--text-danger:hover:not(.b-button--disabled) {
  --b-button-color: var(--b-button-text-danger-color-hover);
  --b-button-bg: var(--b-button-text-danger-bg-hover);
  --b-button-border: var(--b-button-text-danger-border-hover);
}

.b-button--text-danger.b-button--disabled {
  --b-button-color: var(--b-button-text-danger-color-disabled);
  --b-button-bg: var(--b-button-text-danger-bg-disabled);
  --b-button-border: var(--b-button-text-danger-border-disabled);
}
</style>
