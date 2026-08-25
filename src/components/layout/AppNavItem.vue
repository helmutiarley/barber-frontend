<script setup lang="ts">
import { BIcon, BText } from '@barber/bcomponents';
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import type { NavItem } from '@/app/nav';

const props = defineProps<{ item: NavItem }>();

const route = useRoute();

const isActive = computed(
  () => route.path === props.item.path || route.path.startsWith(`${props.item.path}/`),
);
</script>

<template>
  <li class="nav-item">
    <RouterLink
      :to="item.path"
      class="nav-item__link"
      :class="{ 'nav-item__link--active': isActive }"
      :aria-current="isActive ? 'page' : undefined"
    >
      <BIcon :name="(item.icon as never)" dimensions="20px" class="nav-item__icon" />
      <BText as="span" variant="button-3" class="nav-item__title">{{ item.label }}</BText>
    </RouterLink>
  </li>
</template>

<style scoped>
.nav-item {
  list-style: none;
}

.nav-item__link {
  --nav-item-background: transparent;
  --nav-item-color: var(--b-fg-neutral-secondary);
  --nav-item-hover-background: var(--b-bg-neutral-hover);

  display: flex;
  align-items: center;
  gap: var(--b-spacing-sm);
  width: 100%;
  height: 36px;
  padding: var(--b-spacing-2xs) var(--b-spacing-xs);
  border-radius: var(--b-border-radius-sm);
  background: var(--nav-item-background);
  color: var(--nav-item-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-item__link:hover,
.nav-item__link:focus-visible,
.nav-item__link:active {
  background: var(--nav-item-hover-background);
  color: var(--b-fg-neutral-default);
}

.nav-item__link--active {
  --nav-item-background: var(--b-bg-neutral-surface);
  --nav-item-color: var(--b-fg-neutral-default);

  font-weight: 700;
}

.nav-item__icon {
  flex: 0 0 auto;
}

.nav-item__title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: inherit;
}
</style>
