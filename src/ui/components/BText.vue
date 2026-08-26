<script setup lang="ts">
import { computed } from 'vue';
import { resolveColorToken, type BTextTag, type BTextVariant } from '../types';

const props = withDefaults(
  defineProps<{
    as?: BTextTag;
    variant?: BTextVariant;
    color?: string;
  }>(),
  { as: 'p', variant: 'body-2', color: undefined },
);

const style = computed(() => ({ color: resolveColorToken(props.color) }));
</script>

<template>
  <component :is="as" class="b-text" :class="`b-text--${variant}`" :style="style">
    <slot />
  </component>
</template>

<style scoped>
.b-text {
  margin: 0;
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
}

.b-text--heading-1 {
  font-size: var(--b-font-size-heading-1);
  line-height: var(--b-line-height-heading-1);
  font-weight: var(--b-font-weight-semibold);
  letter-spacing: -0.01em;
}

.b-text--heading-2 {
  font-size: var(--b-font-size-heading-2);
  line-height: var(--b-line-height-heading-2);
  font-weight: var(--b-font-weight-semibold);
  letter-spacing: -0.01em;
}

.b-text--heading-3 {
  font-size: var(--b-font-size-heading-3);
  line-height: var(--b-line-height-heading-3);
  font-weight: var(--b-font-weight-semibold);
}

.b-text--body-2,
.b-text--body-2-bold {
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
}

.b-text--body-2 {
  font-weight: var(--b-font-weight-regular);
}

.b-text--body-2-bold {
  font-weight: var(--b-font-weight-semibold);
}

.b-text--body-3,
.b-text--body-3-bold {
  font-size: var(--b-font-size-body-3);
  line-height: var(--b-line-height-body-3);
}

.b-text--body-3 {
  font-weight: var(--b-font-weight-regular);
}

.b-text--body-3-bold {
  font-weight: var(--b-font-weight-semibold);
}

.b-text--button-3 {
  font-size: var(--b-font-size-button-3);
  line-height: var(--b-line-height-button-3);
  font-weight: var(--b-font-weight-medium);
}
</style>
