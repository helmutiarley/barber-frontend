<script setup lang="ts">
import { BTabs } from '@barber/bcomponents';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const TABS = [
  { label: 'Períodos', value: '/commissions/periods' },
  { label: 'Adiantamentos', value: '/commissions/advances' },
  { label: 'Lançamentos', value: '/commissions/entries' },
  { label: 'Regras', value: '/commissions/rules' },
];

const tabs = computed(() =>
  TABS.map((tab) => ({
    ...tab,
    to: tab.value,
    isActive: route.path === tab.value || route.path.startsWith(`${tab.value}/`),
  })),
);
</script>

<template>
  <BTabs :values="tabs" aria-label="Comissões" class="commissions-tabs" />
</template>

<style scoped>
.commissions-tabs {
  margin-bottom: 1rem;
}
</style>
