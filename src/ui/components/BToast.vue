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
    <div
      class="b-toast b-toast--bottom-right"
      role="region"
      aria-live="polite"
      aria-label="Notificações"
    >
      <TransitionGroup name="b-toast-stack">
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="b-toast-row"
          :class="`b-toast-row--${entry.severity}`"
          role="status"
        >
          <div class="b-toast-row__content">
            <BIcon
              :name="ICON_FOR[entry.severity]"
              dimensions="20px"
              class="b-toast-row__icon"
            />

            <p class="b-toast-row__message">{{ entry.message }}</p>
          </div>

          <div class="b-toast-row__divider" />

          <div class="b-toast-row__actions">
            <button
              class="b-toast-row__close"
              type="button"
              aria-label="Fechar notificação"
              @click="dismiss(entry.id)"
            >
              <BIcon name="ic-close-16" dimensions="16px" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.b-toast {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
  margin: var(--b-spacing-md);
  max-width: min(420px, calc(100vw - 2 * var(--b-spacing-md)));
  z-index: var(--b-z-index-tooltip);
  pointer-events: none;
}

.b-toast--bottom-right {
  right: 0;
  bottom: 0;
}

.b-toast-row {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: var(--b-border-radius-md);
  background-color: var(--b-toast-bg-color);
  box-shadow: var(--b-toast-shadow);
  color: var(--b-toast-text-color);
  pointer-events: auto;
}

.b-toast-row__content {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--b-spacing-2xs);
  min-width: 0;
  padding: var(--b-spacing-sm);
}

.b-toast-row__icon {
  flex-shrink: 0;
}

.b-toast-row--success .b-toast-row__icon {
  color: var(--b-fg-success-secondary);
}

.b-toast-row--failure .b-toast-row__icon {
  color: var(--b-fg-danger-secondary);
}

.b-toast-row--warning .b-toast-row__icon {
  color: var(--b-fg-warning-secondary);
}

.b-toast-row__message {
  flex-grow: 1;
  margin: 0;
  padding: 0 var(--b-spacing-3xs);
  color: inherit;
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
}

.b-toast-row__divider {
  flex-shrink: 0;
  width: 1px;
  height: 32px;
  background-color: var(--b-toast-divider-color);
}

.b-toast-row__actions {
  display: flex;
  align-items: center;
  padding: 0 var(--b-spacing-2xs);
}

.b-toast-row__close {
  display: flex;
  flex: none;
  align-items: center;
  padding: var(--b-spacing-2xs);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.b-toast-stack-enter-active {
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.b-toast-stack-leave-active {
  position: absolute;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.b-toast-stack-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.b-toast-stack-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

@media (prefers-reduced-motion: reduce) {
  .b-toast-stack-enter-active,
  .b-toast-stack-leave-active {
    transition: none;
  }
}
</style>
