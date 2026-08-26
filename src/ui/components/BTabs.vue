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
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  overflow: auto hidden;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid var(--b-stroke-default);
  color: var(--b-tabs-color);
}

.b-tabs__tab {
  display: inline-flex;
  flex: none;
  justify-content: center;
  align-items: center;
  gap: var(--b-spacing-2xs);
  width: fit-content;
  height: 56px;
  padding: 0 var(--b-spacing-md);
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.b-tabs__tab:hover {
  background-color: var(--b-tabs-tab-hover-bg);
}

.b-tabs__tab--active {
  color: var(--b-tabs-color-active);
  box-shadow: inset 0 -2px 0 0 var(--b-tabs-indicator-bg);
}

.b-tabs__tab:focus-visible {
  outline: var(--b-tabs-focus-visible-outline);
  outline-offset: -2px;
}
</style>
