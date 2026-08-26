<script setup lang="ts">
import { BButton, BEmptyState } from '@/ui';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { homePathForRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

function goHome(): void {
  if (auth.role) {
    void router.push(homePathForRole(auth.role));
  }
}
</script>

<template>
  <PageLayout centered>
    <BEmptyState title="Acesso negado" subtitle="Você não tem permissão para ver esta página." />
    <BButton color="neutral" @click="goHome">Voltar ao início</BButton>
  </PageLayout>
</template>
