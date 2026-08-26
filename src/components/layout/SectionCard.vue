<script setup lang="ts">
import { BCard, BText } from '@/ui';
import { useSlots } from 'vue';

withDefaults(defineProps<{ title?: string; subtitle?: string }>(), {
  title: undefined,
  subtitle: undefined,
});

const slots = useSlots();
</script>

<template>
  <BCard class="section-card" :header-no-divider="true">
    <template v-if="title || subtitle || slots['header-actions']" #header>
      <div class="section-card__header">
        <div class="section-card__heading">
          <BText v-if="title" as="h2" variant="heading-2">{{ title }}</BText>
          <BText
            v-if="subtitle"
            as="p"
            variant="body-2"
            color="b-fg-neutral-secondary"
            class="section-card__subtitle"
          >
            {{ subtitle }}
          </BText>
        </div>
        <slot name="header-actions" />
      </div>
    </template>

    <slot />
  </BCard>
</template>

<style scoped>
.section-card {
  --b-card-bg: var(--b-bg-neutral-default);
  --b-card-header-bg: var(--b-bg-neutral-default);
}

.section-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--b-spacing-2xs);
}

.section-card__subtitle {
  margin-top: var(--b-spacing-4xs);
}
</style>
