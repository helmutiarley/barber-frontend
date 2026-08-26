<script setup lang="ts">
import { nextTick, useId, useSlots, ref, watch } from 'vue';
import BIconButton from './BIconButton.vue';
import BText from './BText.vue';

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    titleText?: string;
    width?: string;
  }>(),
  { isOpen: false, titleText: undefined, width: '480px' },
);

const emit = defineEmits<{ 'update:isOpen': [boolean] }>();

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const slots = useSlots();
const titleId = useId();
const panel = ref<HTMLElement | null>(null);

let previouslyFocused: HTMLElement | null = null;

function close(): void {
  emit('update:isOpen', false);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close();
    return;
  }

  if (event.key !== 'Tab' || !panel.value) {
    return;
  }

  const focusables = [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)];

  if (focusables.length === 0) {
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      await nextTick();
      panel.value?.focus();
      return;
    }

    previouslyFocused?.focus();
    previouslyFocused = null;
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="b-dialog">
      <div v-if="isOpen" class="b-dialog" @keydown="onKeydown">
        <div class="b-dialog__backdrop" @click="close" />

        <div
          ref="panel"
          class="b-dialog__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleText ? titleId : undefined"
          tabindex="-1"
          :style="{ width }"
        >
          <header v-if="titleText" class="b-dialog__header">
            <BText :id="titleId" as="h2" variant="heading-3">{{ titleText }}</BText>

            <BIconButton icon="ic-close-16" icon-description="Fechar" @click="close" />
          </header>

          <div class="b-dialog__body">
            <slot />
          </div>

          <footer v-if="slots.footer" class="b-dialog__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.b-dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--b-spacing-sm);
}

.b-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: var(--b-color-dark-a50);
}

.b-dialog__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: calc(100vh - 2 * var(--b-spacing-sm));
  background: var(--b-bg-neutral-default);
  border-radius: var(--b-border-radius-lg);
  box-shadow: var(--b-shadow-2-bottom);
  overflow: hidden;
}

.b-dialog__panel:focus {
  outline: none;
}

.b-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--b-spacing-2xs);
  padding: var(--b-spacing-md) var(--b-spacing-md) var(--b-spacing-2xs);
}

.b-dialog__body {
  padding: var(--b-spacing-2xs) var(--b-spacing-md) var(--b-spacing-md);
  overflow-y: auto;
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  color: var(--b-fg-neutral-default);
}

.b-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--b-spacing-2xs);
  padding: var(--b-spacing-xs) var(--b-spacing-md) var(--b-spacing-md);
  border-top: 1px solid var(--b-stroke-default);
}

.b-dialog-enter-active,
.b-dialog-leave-active {
  transition: opacity var(--b-transition);
}

.b-dialog-enter-from,
.b-dialog-leave-to {
  opacity: 0;
}
</style>
