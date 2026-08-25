<script setup lang="ts">
import { BIcon, BText } from '@barber/bcomponents';
import { RouterLink } from 'vue-router';

defineProps<{ to: string; label: string }>();
</script>

<template>
  <RouterLink :to="to" class="back-link">
    <BIcon name="ic-arrow-left-16" dimensions="16px" />
    <BText as="span" variant="button-3">{{ label }}</BText>
  </RouterLink>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-3xs);
  color: var(--b-fg-neutral-secondary);
  transition: color 0.2s ease;
}

.back-link:hover,
.back-link:focus-visible {
  color: var(--b-fg-neutral-default);
}
</style>
