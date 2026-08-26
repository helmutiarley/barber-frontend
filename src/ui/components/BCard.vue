<script setup lang="ts">
import { computed, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    padding?: string | number;
    headerNoDivider?: boolean;
  }>(),
  { padding: undefined, headerNoDivider: false },
);

const slots = useSlots();

const bodyPadding = computed(() => {
  if (props.padding === undefined) {
    return 'var(--b-spacing-md)';
  }

  return typeof props.padding === 'number' ? `${props.padding}px` : props.padding;
});
</script>

<template>
  <section class="b-card">
    <header v-if="slots.header" class="b-card__header" :class="{ 'b-card__header--flush': headerNoDivider }">
      <slot name="header" />
    </header>

    <div class="b-card__body" :style="{ padding: bodyPadding }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.b-card {
  overflow: hidden;
  background: var(--b-card-bg, var(--b-bg-neutral-default));
  border: 1px solid var(--b-stroke-default);
  border-radius: var(--b-border-radius-lg);
}

.b-card__header {
  padding: var(--b-spacing-md) var(--b-spacing-md) var(--b-spacing-sm);
  background: var(--b-card-header-bg, transparent);
  border-bottom: 1px solid var(--b-stroke-default);
}

.b-card__header--flush {
  border-bottom: 0;
  padding-bottom: 0;
}

.b-card__body:empty {
  display: none;
}
</style>
