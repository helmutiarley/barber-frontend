<script setup lang="ts">
import { BToast } from '@barber/bcomponents';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';
import ClientLayout from '@/layouts/ClientLayout.vue';
import GuestLayout from '@/layouts/GuestLayout.vue';
import { isStaffRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

const layout = computed(() => {
  if (route.meta.guest || route.meta.public) {
    return 'guest';
  }

  if (!auth.isAuthenticated || !auth.role) {
    return 'guest';
  }

  if (auth.role === 'CLIENT') {
    return 'client';
  }

  if (isStaffRole(auth.role)) {
    return 'app';
  }

  return 'guest';
});
</script>

<template>
  <GuestLayout v-if="layout === 'guest'" />
  <ClientLayout v-else-if="layout === 'client'" />
  <AppLayout v-else />
  <BToast />
</template>
