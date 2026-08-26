<script setup lang="ts">
import { BCard, BText } from '@/ui';

withDefaults(
  defineProps<{
    label: string;
    value: string;
    hint?: string;
    /** Colours the figure when a number carries a verdict, like a DRE result. */
    tone?: 'neutral' | 'positive' | 'negative';
  }>(),
  { hint: undefined, tone: 'neutral' },
);
</script>

<template>
  <BCard class="stat">
    <BText as="span" variant="body-3" color="b-fg-neutral-secondary">{{ label }}</BText>
    <BText as="span" variant="heading-2" :class="`stat__value stat__value--${tone}`">
      {{ value }}
    </BText>
    <BText v-if="hint" as="span" variant="body-3" color="b-fg-neutral-secondary">
      {{ hint }}
    </BText>
  </BCard>
</template>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat__value--positive {
  color: var(--b-fg-success-primary, #067647);
}

.stat__value--negative {
  color: var(--b-fg-danger-primary, #b42318);
}
</style>
