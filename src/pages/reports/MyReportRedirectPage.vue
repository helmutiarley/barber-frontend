<script setup lang="ts">
import { BEmptyState, BSkeletonLoader } from '@barber/bcomponents';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { useOwnBarberId } from '@/composables/useOwnBarberId';
import { usePermission } from '@/composables/usePermission';

/**
 * The hub is staff-only, so a barber needs a door of their own. There is no
 * `GET /barbers/me`, so the id is resolved the same way the agenda resolves it.
 */
const router = useRouter();
const { hasRole } = usePermission();
const { ownBarberId, resolveError } = useOwnBarberId();

watch(
  ownBarberId,
  (id) => {
    if (id) {
      void router.replace(`/reports/barbers/${id}`);
    }
  },
  { immediate: true },
);

// Staff have the hub; only a barber needs resolving.
onMounted(() => {
  if (hasRole('ADMIN', 'MANAGER')) {
    void router.replace('/reports');
  }
});
</script>

<template>
  <PageLayout title="Meus números">
    <BEmptyState
      v-if="resolveError"
      title="Não encontramos o seu perfil de barbeiro"
      :subtitle="resolveError"
    />
    <BSkeletonLoader v-else height="160px" />
  </PageLayout>
</template>
