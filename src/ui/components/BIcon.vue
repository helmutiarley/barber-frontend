<script setup lang="ts">
import { computed } from 'vue';
import { iconMarkup } from '../icons';
import { resolveColorToken } from '../types';

const props = withDefaults(
  defineProps<{
    name: string;
    dimensions?: string;
    color?: string;
  }>(),
  { dimensions: '24px', color: undefined },
);

const markup = computed(() => iconMarkup(props.name));

const style = computed(() => ({
  width: props.dimensions,
  height: props.dimensions,
  color: resolveColorToken(props.color),
}));
</script>

<template>
  <svg
    class="b-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    :style="style"
    v-html="markup"
  />
</template>

<style scoped>
.b-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}
</style>
