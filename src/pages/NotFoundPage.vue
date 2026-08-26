<script setup lang="ts">
import { BButton, BEmptyState } from '@/ui';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';

const router = useRouter();
</script>

<template>
  <PageLayout centered>
    <BEmptyState title="Página não encontrada" subtitle="Esse endereço não existe." />
    <BButton color="neutral" @click="router.push('/')">Ir para o início</BButton>
  </PageLayout>
</template>
