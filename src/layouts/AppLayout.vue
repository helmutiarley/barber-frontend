<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import CashRegisterBanner from '@/components/CashRegisterBanner.vue';
import { useAuthStore } from '@/stores/auth';
import { useCashRegisterStore } from '@/stores/cash-register';
import { useDrawerStore } from '@/stores/drawer';

const auth = useAuthStore();
const cash = useCashRegisterStore();
const drawer = useDrawerStore();
const router = useRouter();

onMounted(() => {
  void cash.refresh();
});

async function onLogout(): Promise<void> {
  cash.reset();
  await auth.logout();
  await router.replace('/login');
}
</script>

<template>
  <div class="site-layout" :class="{ 'site-layout--with-drawer': drawer.isOpen && !drawer.isMobile }">
    <AppTopbar />
    <AppSidebar @logout="onLogout" />

    <main class="wrapper">
      <div class="wrapper__scroll">
        <div class="wrapper__banner">
          <CashRegisterBanner />
        </div>
        <div class="wrapper__content">
          <RouterView />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.site-layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100dvh;
}

.site-layout--with-drawer {
  grid-template-columns: var(--drawer-width) 1fr;
}

.wrapper {
  grid-column: -2 / -1;
  grid-row: 2;
  min-height: 0;
  overflow: hidden;
  background: var(--b-bg-neutral-secondary);
}

.wrapper__scroll {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: auto;
}

.wrapper__banner {
  flex: none;
  position: sticky;
  top: 0;
  z-index: 1;
}

.wrapper__content {
  flex: 1 0 auto;
  min-width: 0;
  isolation: isolate;
  padding: var(--b-spacing-2xl) var(--b-spacing-3xl);
}

@media (max-width: 959px) {
  .wrapper__content {
    padding: var(--b-spacing-sm);
  }
}
</style>
