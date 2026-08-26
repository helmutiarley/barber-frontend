<script setup lang="ts">
import { useSlots } from 'vue';
import BIcon from './BIcon.vue';
import BText from './BText.vue';

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: string;
  }>(),
  { title: undefined, subtitle: undefined, icon: undefined },
);

const slots = useSlots();
</script>

<template>
  <div class="b-empty-state">
    <BIcon v-if="icon" :name="icon" dimensions="28px" class="b-empty-state__icon" />

    <BText v-if="title" as="h3" variant="heading-3">{{ title }}</BText>

    <BText v-if="subtitle" as="p" variant="body-2" color="b-fg-neutral-secondary">
      {{ subtitle }}
    </BText>

    <slot />

    <div v-if="slots.actions" class="b-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.b-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--b-spacing-2xs);
  padding: var(--b-spacing-lg) var(--b-spacing-md);
  text-align: center;
}

.b-empty-state__icon {
  color: var(--b-fg-neutral-tertiary);
  margin-bottom: var(--b-spacing-3xs);
}

.b-empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--b-spacing-2xs);
  margin-top: var(--b-spacing-2xs);
}
</style>
