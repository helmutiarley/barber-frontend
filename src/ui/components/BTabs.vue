<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { BTabValue } from '../types';

withDefaults(
  defineProps<{
    values?: BTabValue[];
    ariaLabel?: string;
  }>(),
  { values: () => [], ariaLabel: undefined },
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>

<template>
  <nav class="b-tabs" :aria-label="ariaLabel">
    <component
      :is="tab.to ? RouterLink : 'button'"
      v-for="tab in values"
      :key="tab.value"
      class="b-tabs__tab"
      :class="{ 'b-tabs__tab--active': tab.isActive }"
      :to="tab.to"
      :type="tab.to ? undefined : 'button'"
      :aria-current="tab.isActive ? 'page' : undefined"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </component>
  </nav>
</template>

<style scoped>
.b-tabs {
  display: flex;
  gap: var(--b-spacing-2xs);
  overflow-x: auto;
  border-bottom: 1px solid var(--b-stroke-default);
}

.b-tabs__tab {
  padding: var(--b-spacing-2xs) var(--b-spacing-xs);
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--b-fg-neutral-secondary);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--b-transition),
    border-color var(--b-transition);
}

.b-tabs__tab:hover {
  color: var(--b-fg-neutral-default);
}

.b-tabs__tab--active {
  color: var(--b-fg-brand-primary);
  border-bottom-color: var(--b-color-brand-500);
}

.b-tabs__tab:focus-visible {
  outline: 2px solid var(--b-fg-brand-default);
  outline-offset: -2px;
}
</style>
