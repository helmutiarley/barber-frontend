<script setup lang="ts">
import { BIcon, BIconButton, BText } from '@barber/bcomponents';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useDrawerStore } from '@/stores/drawer';

const auth = useAuthStore();
const drawer = useDrawerStore();
</script>

<template>
  <header class="topbar">
    <div class="topbar__left">
      <BIconButton
        v-if="drawer.isMobile"
        icon="ic-menu-16"
        icon-description="Abrir menu"
        variant="text"
        color="neutral"
        icon-color="b-fg-neutral-default"
        @click="drawer.toggle()"
      />
      <RouterLink to="/" class="topbar__brand">
        <BIcon name="ic-shop-24" dimensions="24px" />
        <BText as="span" variant="heading-2" class="topbar__brand-name">Barber</BText>
      </RouterLink>
    </div>

    <div class="topbar__actions">
      <BText
        v-if="auth.user"
        as="span"
        variant="body-2"
        color="b-fg-neutral-secondary"
        class="topbar__user"
      >
        {{ auth.user.name }}
      </BText>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  grid-column: 1 / -1;
  grid-row: 1;
  position: sticky;
  top: 0;
  z-index: 1006;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--b-spacing-sm);
  background-color: var(--b-bg-neutral-default);
  border-bottom: 1px solid var(--b-stroke-default);
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  min-width: 0;
}

.topbar__brand {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  color: var(--b-fg-neutral-default);
}

.topbar__brand-name {
  letter-spacing: -0.02em;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-xs);
  min-width: 0;
}

.topbar__user {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 599px) {
  .topbar {
    padding: 0 var(--b-spacing-2xs);
  }

  .topbar__user {
    display: none;
  }
}
</style>
