<script setup lang="ts">
import { BDivider, BIcon, BIconButton, BText } from '@barber/bcomponents';
import { computed } from 'vue';
import { staffBottomNavItems, staffNavSections } from '@/app/nav';
import AppNavItem from '@/components/layout/AppNavItem.vue';
import { usePermission } from '@/composables/usePermission';
import { useDrawerStore } from '@/stores/drawer';

const emit = defineEmits<{ logout: [] }>();

const drawer = useDrawerStore();
const { canAccessNav } = usePermission();

const sections = computed(() =>
  staffNavSections
    .map((section) => ({ ...section, items: section.items.filter((i) => canAccessNav(i.roles)) }))
    .filter((section) => section.items.length > 0),
);

const bottomItems = computed(() => staffBottomNavItems.filter((i) => canAccessNav(i.roles)));

/** On mobile the drawer sits above the content, so navigating has to dismiss it. */
function closeOnMobile(): void {
  if (drawer.isMobile) {
    drawer.toggle(false);
  }
}
</script>

<template>
  <div
    v-if="drawer.isMobile"
    class="drawer-overlay"
    :class="{ 'drawer-overlay--active': drawer.isOpen }"
    @click="drawer.toggle(false)"
  />

  <nav
    class="drawer"
    :class="{ 'drawer--open': drawer.isOpen }"
    aria-label="Menu principal"
    @click="closeOnMobile"
  >
    <ul class="drawer__list drawer__list--scrollable">
      <li
        v-for="section in sections"
        :key="section.id"
        class="drawer__section"
        role="group"
        :aria-labelledby="section.label ? `nav-section-${section.id}` : undefined"
      >
        <BText
          v-if="section.label"
          :id="`nav-section-${section.id}`"
          as="span"
          variant="body-3-bold"
          color="b-fg-neutral-secondary"
          class="drawer__section-header"
        >
          {{ section.label }}
        </BText>
        <ul class="drawer__section-items">
          <AppNavItem v-for="item in section.items" :key="item.path" :item="item" />
        </ul>
      </li>
    </ul>

    <BDivider />

    <div class="drawer__bottom">
      <ul class="drawer__list">
        <AppNavItem v-for="item in bottomItems" :key="item.path" :item="item" />
        <li class="nav-item">
          <button type="button" class="drawer__logout" @click="emit('logout')">
            <BIcon name="ic-arrow-right-square-24" dimensions="20px" />
            <BText as="span" variant="button-3">Sair</BText>
          </button>
        </li>
      </ul>
    </div>
  </nav>

  <BIconButton
    v-if="drawer.isMobile"
    icon="ic-close-16"
    icon-description="Fechar menu"
    variant="text"
    color="neutral"
    class="drawer-close"
    :class="{ 'drawer-close--active': drawer.isOpen }"
    @click="drawer.toggle(false)"
  />
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1004;
  background-color: var(--b-color-dark-a50);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s ease-in-out;
}

.drawer-overlay--active {
  opacity: 1;
  pointer-events: auto;
}

.drawer {
  grid-column: 1;
  grid-row: 2;
  position: relative;
  z-index: 1005;
  display: flex;
  flex-direction: column;
  width: var(--drawer-width);
  background-color: var(--b-bg-neutral-default);
  border-right: 1px solid var(--b-stroke-default);
  overflow: hidden;
  transform: translateX(-100%);
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer--open {
  transform: translateX(0);
}

.drawer__list {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-3xs);
  padding: var(--b-spacing-xs);
  margin: 0;
  list-style: none;
}

.drawer__list--scrollable {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  gap: var(--b-spacing-xs);
}

.drawer__section {
  list-style: none;
}

.drawer__section-header {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--b-spacing-xs);
}

.drawer__section-items {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-4xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.drawer__bottom {
  flex: 0 0 auto;
}

.drawer__logout {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-sm);
  width: 100%;
  height: 36px;
  padding: var(--b-spacing-2xs) var(--b-spacing-xs);
  border-radius: var(--b-border-radius-sm);
  color: var(--b-fg-neutral-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drawer__logout:hover,
.drawer__logout:focus-visible {
  background: var(--b-bg-neutral-hover);
  color: var(--b-fg-neutral-default);
}

.drawer-close {
  position: fixed;
  top: calc(var(--header-height) + var(--b-spacing-2xs));
  left: calc(var(--drawer-width) + var(--b-spacing-2xs));
  z-index: 1005;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
}

.drawer-close--active {
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 959px) {
  .drawer {
    position: fixed;
    top: var(--header-height);
    bottom: 0;
    left: 0;
  }
}
</style>
