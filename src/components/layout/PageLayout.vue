<script setup lang="ts">
import { BCircleLoader, BText } from '@barber/bcomponents';
import { useSlots } from 'vue';

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    isLoading?: boolean;
    /** Centres the content box, for empty/error pages rather than list pages. */
    centered?: boolean;
  }>(),
  { title: undefined, subtitle: undefined, isLoading: false, centered: false },
);

const slots = useSlots();
</script>

<template>
  <div class="page-layout" :class="{ 'page-layout--centered': centered }">
    <div v-if="isLoading" class="page-layout__loader">
      <BCircleLoader />
    </div>

    <template v-else>
      <div v-if="slots.banners" class="page-layout__banners">
        <slot name="banners" />
      </div>

      <header
        v-if="title || slots.title || subtitle || slots.subtitle || slots['header-actions']"
        class="page-layout__header"
        :class="{ 'page-layout__header--has-actions': !!slots['header-actions'] }"
      >
        <div v-if="title || slots.title" class="page-layout__header-title">
          <slot name="title">
            <BText as="h1" variant="heading-1">{{ title }}</BText>
          </slot>
        </div>

        <BText
          v-if="subtitle || slots.subtitle"
          as="p"
          variant="body-2"
          color="b-fg-neutral-secondary"
          class="page-layout__header-subtitle"
        >
          <slot name="subtitle">{{ subtitle }}</slot>
        </BText>

        <div v-if="slots['header-actions']" class="page-layout__header-actions">
          <slot name="header-actions" />
        </div>
      </header>

      <slot />
    </template>
  </div>
</template>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-lg);
  width: 100%;
  min-width: 0;
  max-width: var(--page-max-width);
  margin-right: auto;
}

.page-layout--centered {
  align-items: center;
  justify-content: center;
  min-height: 100%;
  margin-left: auto;
}

.page-layout__loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.page-layout__header {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--b-spacing-3xs) var(--b-spacing-md);
  align-items: center;
}

.page-layout__header--has-actions {
  grid-template-columns: 1fr auto;
}

.page-layout__header-title {
  grid-column: 1;
  grid-row: 1;
}

.page-layout__header-subtitle {
  grid-column: 1 / -1;
}

.page-layout__header-actions {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  gap: var(--b-spacing-xs);
  flex-shrink: 0;
}

@media (max-width: 959px) {
  .page-layout {
    gap: var(--b-spacing-sm);
  }
}

@media (max-width: 599px) {
  .page-layout__header,
  .page-layout__header--has-actions {
    grid-template-columns: 1fr;
  }

  .page-layout__header-actions {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>
