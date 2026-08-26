<script setup lang="ts">
import { BButton, BIcon, BText } from '@/ui';
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { clientNavItems } from '@/app/nav';
import { useAuthStore } from '@/stores/auth';
import { useCashRegisterStore } from '@/stores/cash-register';

const auth = useAuthStore();
const cash = useCashRegisterStore();
const route = useRoute();
const router = useRouter();

const items = computed(() => clientNavItems);

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`);
}

async function onLogout(): Promise<void> {
  cash.reset();
  await auth.logout();
  await router.replace('/login');
}
</script>

<template>
  <div class="client-shell">
    <header class="client-shell__top">
      <RouterLink to="/book" class="client-shell__brand">
        <BIcon name="ic-shop-24" dimensions="24px" />
        <BText as="span" variant="heading-2">Barber</BText>
      </RouterLink>

      <nav class="client-shell__nav" aria-label="Menu">
        <RouterLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="client-shell__link"
          :class="{ 'client-shell__link--active': isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <BIcon :name="(item.icon as never)" dimensions="20px" />
          <BText as="span" variant="button-3">{{ item.label }}</BText>
        </RouterLink>
      </nav>

      <div class="client-shell__actions">
        <BText as="span" variant="body-2" color="b-fg-neutral-secondary" class="client-shell__name">
          {{ auth.user?.name }}
        </BText>
        <BButton size="small" variant="outline" color="neutral" @click="onLogout">Sair</BButton>
      </div>
    </header>

    <main class="client-shell__scroll">
      <div class="client-shell__content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.client-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100dvh;
}

.client-shell__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--b-spacing-sm);
  min-height: var(--header-height);
  padding: var(--b-spacing-2xs) var(--b-spacing-sm);
  background: var(--b-bg-neutral-default);
  border-bottom: 1px solid var(--b-stroke-default);
}

.client-shell__brand {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  color: var(--b-fg-neutral-default);
  letter-spacing: -0.02em;
}

.client-shell__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--b-spacing-3xs);
  flex: 1;
}

.client-shell__link {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  height: 36px;
  padding: var(--b-spacing-2xs) var(--b-spacing-xs);
  border-radius: var(--b-border-radius-sm);
  color: var(--b-fg-neutral-secondary);
  transition: background-color 0.2s ease;
}

.client-shell__link:hover,
.client-shell__link:focus-visible {
  background: var(--b-bg-neutral-hover);
  color: var(--b-fg-neutral-default);
}

.client-shell__link--active {
  background: var(--b-bg-neutral-surface);
  color: var(--b-fg-neutral-default);
  font-weight: 700;
}

.client-shell__actions {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-xs);
}

.client-shell__scroll {
  min-height: 0;
  overflow: auto;
  background: var(--b-bg-neutral-secondary);
}

.client-shell__content {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--b-spacing-2xl) var(--b-spacing-3xl);
}

@media (max-width: 959px) {
  .client-shell__content {
    padding: var(--b-spacing-sm);
  }

  .client-shell__name {
    display: none;
  }
}
</style>
