import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { useViewport } from '@/composables/useViewport';

export const useDrawerStore = defineStore('drawer', () => {
  const { isMobile } = useViewport();
  const isOpen = ref(!isMobile.value);

  function toggle(value?: boolean): void {
    isOpen.value = value ?? !isOpen.value;
  }

  /** Crossing the breakpoint resets to that viewport's default rather than
   * stranding the drawer open behind an overlay (or closed on desktop). */
  watch(isMobile, (mobile) => {
    isOpen.value = !mobile;
  });

  return { isOpen, isMobile, toggle };
});
