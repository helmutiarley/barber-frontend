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
    :class="[`b-icon-button--${variant}`, `b-icon-button--${color}`]"
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--b-spacing-2xs);
  border: 1px solid transparent;
  border-radius: var(--b-border-radius-sm);
  background: transparent;
  color: var(--b-fg-neutral-default);
  cursor: pointer;
  transition:
    background-color var(--b-transition),
    border-color var(--b-transition);
}

.b-icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.b-icon-button:focus-visible {
  outline: 2px solid var(--b-fg-brand-default);
  outline-offset: 2px;
}

.b-icon-button--primary {
  color: var(--b-fg-brand-primary);
}

.b-icon-button--danger {
  color: var(--b-fg-danger-primary);
}

.b-icon-button--outline {
  border-color: var(--b-border-neutral-secondary);
}

.b-icon-button--contain {
  background: var(--b-bg-neutral-secondary);
}

.b-icon-button:hover:not(:disabled) {
  background: var(--b-bg-neutral-hover);
}
</style>
