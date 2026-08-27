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

const hasHeader = computed(() => Boolean(slots.header));

const style = computed(() => {
  if (props.padding === undefined) {
    return undefined;
  }

  const padding = typeof props.padding === 'number' ? `${props.padding}px` : props.padding;

  return { '--b-card-padding': padding };
});
</script>

<template>
  <section
    class="b-card"
    :class="hasHeader ? 'b-card--with-header' : 'b-card--no-header'"
    :style="style"
    role="region"
  >
    <header
      v-if="hasHeader"
      class="b-card__header"
      :class="{ 'b-card__header--no-divider': headerNoDivider }"
    >
      <slot name="header" />
    </header>

    <div v-if="hasHeader && slots.default" class="b-card__body">
      <slot />
    </div>
    <slot v-else />
  </section>
</template>

<style scoped>
.b-card {
  padding: 0;
  border: 1px solid var(--b-card-border-color);
  border-radius: var(--b-card-border-radius);
}

.b-card--no-header {
  padding: var(--b-card-padding);
  background-color: var(--b-card-bg);
}

.b-card--with-header {
  border: none;
  border-radius: 0;
}

.b-card__header {
  padding: var(--b-card-padding);
  background-color: var(--b-card-header-bg);
  border-top: 1px solid var(--b-card-header-border-color);
  border-right: 1px solid var(--b-card-header-border-color);
  border-left: 1px solid var(--b-card-header-border-color);
  border-bottom: 1px solid var(--b-card-header-divider-color);
  border-top-left-radius: var(--b-card-border-radius);
  border-top-right-radius: var(--b-card-border-radius);
}

.b-card__header--no-divider {
  border-bottom: none;
}

.b-card__body {
  padding: var(--b-card-padding);
  background-color: var(--b-card-bg);
}

.b-card--with-header .b-card__body {
  border-top: none;
  border-right: 1px solid var(--b-card-border-color);
  border-bottom: 1px solid var(--b-card-border-color);
  border-left: 1px solid var(--b-card-border-color);
  border-bottom-left-radius: var(--b-card-border-radius);
  border-bottom-right-radius: var(--b-card-border-radius);
}

.b-card--with-header:not(:has(.b-card__body)) .b-card__header {
  border-bottom: 1px solid var(--b-card-border-color);
  border-bottom-left-radius: var(--b-card-border-radius);
  border-bottom-right-radius: var(--b-card-border-radius);
}
</style>
