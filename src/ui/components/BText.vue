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
  font-weight: var(--b-font-weight-heading-1);
  letter-spacing: var(--b-letter-spacing-heading-1);
}

.b-text--heading-2 {
  font-size: var(--b-font-size-heading-2);
  line-height: var(--b-line-height-heading-2);
  font-weight: var(--b-font-weight-heading-2);
  letter-spacing: var(--b-letter-spacing-heading-2);
}

.b-text--heading-3 {
  font-size: var(--b-font-size-heading-3);
  line-height: var(--b-line-height-heading-3);
  font-weight: var(--b-font-weight-heading-3);
  letter-spacing: var(--b-letter-spacing-heading-3);
}

.b-text--body-2 {
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
}

.b-text--body-2-bold {
  font-size: var(--b-font-size-body-2-bold);
  line-height: var(--b-line-height-body-2-bold);
  font-weight: var(--b-font-weight-body-2-bold);
  letter-spacing: var(--b-letter-spacing-body-2-bold);
}

.b-text--body-3 {
  font-size: var(--b-font-size-body-3);
  line-height: var(--b-line-height-body-3);
  font-weight: var(--b-font-weight-body-3);
  letter-spacing: var(--b-letter-spacing-body-3);
}

.b-text--body-3-bold {
  font-size: var(--b-font-size-body-3-bold);
  line-height: var(--b-line-height-body-3-bold);
  font-weight: var(--b-font-weight-body-3-bold);
  letter-spacing: var(--b-letter-spacing-body-3-bold);
}

.b-text--button-3 {
  font-size: var(--b-font-size-button-3);
  line-height: var(--b-line-height-button-3);
  font-weight: var(--b-font-weight-button-3);
  letter-spacing: var(--b-letter-spacing-button-3);
}
</style>
