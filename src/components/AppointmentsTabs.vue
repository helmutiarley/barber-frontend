<script setup lang="ts">
import { BTabs } from '@/ui';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePermission } from '@/composables/usePermission';

const route = useRoute();
const { hasRole } = usePermission();

const visible = computed(() => hasRole('ADMIN') || hasRole('MANAGER'));
const tabs = computed(() => [
  {
    label: 'Dia',
    value: '/agenda',
    to: '/agenda',
    isActive: route.path === '/agenda',
  },
  {
    label: 'Consulta',
    value: '/appointments',
    to: '/appointments',
    isActive: route.path === '/appointments',
  },
]);
</script>

<template>
  <BTabs v-if="visible" :values="tabs" aria-label="Agenda" class="appointments-tabs" />
</template>

<style scoped>
.appointments-tabs {
  margin-bottom: 1rem;
}
</style>
