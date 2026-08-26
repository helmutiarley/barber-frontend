<script setup lang="ts">
import { useSlots } from 'vue';
import BIcon from './BIcon.vue';
import BText from './BText.vue';

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: string;
    borderless?: boolean;
  }>(),
  { title: undefined, subtitle: undefined, icon: undefined, borderless: false },
);

const slots = useSlots();
</script>

<template>
  <div class="b-empty-state" :class="{ 'b-empty-state--borderless': borderless }">
    <div class="b-empty-state__title-wrapper">
      <BIcon v-if="icon" :name="icon" dimensions="28px" class="b-empty-state__icon" />

      <BText v-if="title" as="h3" variant="heading-3">{{ title }}</BText>

      <BText
        v-if="subtitle"
        as="p"
        variant="body-2"
        color="b-fg-neutral-secondary"
        class="b-empty-state__subtitle"
      >
        {{ subtitle }}
      </BText>
    </div>

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
  gap: var(--b-spacing-md);
  padding: var(--b-spacing-3xl) var(--b-spacing-md);
  border: none;
  border-radius: var(--b-border-radius-lg);
  background-color: var(--b-bg-neutral-default);
  box-shadow: 0 0 0 1px var(--b-stroke-default);
}

.b-empty-state--borderless {
  box-shadow: none;
}

.b-empty-state > div {
  max-width: 480px;
}

.b-empty-state__title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--b-spacing-xs);
  text-align: center;
}

.b-empty-state__icon {
  color: var(--b-fg-neutral-disabled);
}

.b-empty-state__subtitle {
  text-align: center;
}

.b-empty-state__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--b-spacing-sm);
  padding-top: var(--b-spacing-3xs);
}
</style>
