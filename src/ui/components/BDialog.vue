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
            <div class="b-dialog__header-content">
              <BText :id="titleId" as="h2" variant="heading-3" class="b-dialog__header-title">
                {{ titleText }}
              </BText>

              <div class="b-dialog__header-append">
                <BIconButton icon="ic-close-16" icon-description="Fechar" @click="close" />
              </div>
            </div>
          </header>

          <div class="b-dialog__content">
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
  z-index: var(--b-z-index-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--b-spacing-sm);
  -webkit-tap-highlight-color: transparent;
}

.b-dialog__backdrop {
  position: absolute;
  inset: 0;
  background-color: var(--b-dialog-backdrop-bg);
}

.b-dialog__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: calc(100vh - 2 * var(--b-spacing-sm));
  border-radius: var(--b-border-radius-lg);
  background-color: var(--b-dialog-bg);
  box-shadow:
    0 0 0 1px var(--b-dialog-border-color),
    var(--b-dialog-shadow);
  overflow: hidden;
}

.b-dialog__panel:focus {
  outline: none;
}

.b-dialog__header {
  flex-shrink: 0;
  padding: var(--b-spacing-xs) var(--b-spacing-sm);
  border-bottom: 1px solid var(--b-dialog-stroke-color);
}

.b-dialog__header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--b-spacing-2xs);
  min-height: 36px;
}

.b-dialog__header-title {
  flex: 1;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.b-dialog__header-append {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-width: 36px;
  min-height: 36px;
}

.b-dialog__content {
  flex: auto;
  padding: var(--b-spacing-sm);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
}

.b-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: var(--b-spacing-sm);
  padding: var(--b-spacing-xs) var(--b-spacing-sm);
  border-top: 1px solid var(--b-dialog-stroke-color);
}

.b-dialog-enter-active,
.b-dialog-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.b-dialog-enter-from,
.b-dialog-leave-to {
  opacity: 0;
}

.b-dialog-enter-from .b-dialog__panel {
  transform: translateY(100px);
}

.b-dialog-leave-to .b-dialog__panel {
  transform: translateY(40px);
}
</style>
