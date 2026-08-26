<script setup lang="ts">
import { useBToastQueue } from '../composables/useBToast';
import BIcon from './BIcon.vue';

const { entries, dismiss } = useBToastQueue();

const ICON_FOR = {
  success: 'ic-info-16',
  failure: 'ic-warning-circle-16',
  warning: 'ic-warning-circle-16',
} as const;
</script>

<template>
  <Teleport to="body">
    <div class="b-toast" role="region" aria-live="polite" aria-label="Notificações">
      <TransitionGroup name="b-toast">
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="b-toast__item"
          :class="`b-toast__item--${entry.severity}`"
          role="status"
        >
          <BIcon :name="ICON_FOR[entry.severity]" dimensions="18px" class="b-toast__icon" />

          <p class="b-toast__message">{{ entry.message }}</p>

          <button
            class="b-toast__close"
            type="button"
            aria-label="Fechar notificação"
            @click="dismiss(entry.id)"
          >
            <BIcon name="ic-close-16" dimensions="14px" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.b-toast {
  position: fixed;
  z-index: 1100;
  right: var(--b-spacing-sm);
  bottom: var(--b-spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
  max-width: min(380px, calc(100vw - 2 * var(--b-spacing-sm)));
  pointer-events: none;
}

.b-toast__item {
  display: flex;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
  padding: var(--b-spacing-xs);
  background: var(--b-bg-neutral-default);
  border: 1px solid var(--b-stroke-default);
  border-left: 3px solid var(--b-fg-neutral-secondary);
  border-radius: var(--b-border-radius-sm);
  box-shadow: var(--b-shadow-2-bottom);
  pointer-events: auto;
}

.b-toast__item--success {
  border-left-color: var(--b-fg-success-default);
}

.b-toast__item--success .b-toast__icon {
  color: var(--b-fg-success-default);
}

.b-toast__item--failure {
  border-left-color: var(--b-fg-danger-default);
}

.b-toast__item--failure .b-toast__icon {
  color: var(--b-fg-danger-default);
}

.b-toast__item--warning {
  border-left-color: var(--b-fg-warning-default);
}

.b-toast__item--warning .b-toast__icon {
  color: var(--b-fg-warning-default);
}

.b-toast__message {
  flex: 1;
  margin: 0;
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  color: var(--b-fg-neutral-default);
}

.b-toast__close {
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--b-fg-neutral-secondary);
  cursor: pointer;
}

.b-toast-enter-active,
.b-toast-leave-active {
  transition:
    opacity var(--b-transition),
    transform var(--b-transition);
}

.b-toast-enter-from,
.b-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .b-toast-enter-active,
  .b-toast-leave-active {
    transition: none;
  }
}
</style>
