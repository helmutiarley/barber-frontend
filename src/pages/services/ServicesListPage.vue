<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
} from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listServices } from '@/api/services';
import PageLayout from '@/components/layout/PageLayout.vue';
import { usePermission } from '@/composables/usePermission';
import { formatMoney } from '@/lib/money';

const route = useRoute();
const router = useRouter();
const { hasRole } = usePermission();

const isAdmin = computed(() => hasRole('ADMIN'));
const canSeeInactive = computed(() => hasRole('ADMIN') || hasRole('MANAGER'));

const inactiveFilter = computed({
  get: () => (typeof route.query.inactive === 'string' ? route.query.inactive : 'false'),
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        inactive: String(value) === 'true' ? 'true' : undefined,
      },
    });
  },
});

const includeInactive = computed(
  () => canSeeInactive.value && inactiveFilter.value === 'true',
);

const { data, isPending, isError } = useQuery({
  queryKey: computed(() => ['services', { includeInactive: includeInactive.value }] as const),
  queryFn: () => listServices({ includeInactive: includeInactive.value }),
});

const services = computed(() => data.value ?? []);

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
</script>

<template>
  <PageLayout
    title="Serviços"
    subtitle="Cardápio de cortes e tratamentos. Alterações valem só para novos agendamentos."
  >
    <template v-if="isAdmin" #header-actions>
      <RouterLink to="/services/new">
        <BButton color="neutral" variant="contain" icon-prepend="ic-add-16">Novo serviço</BButton>
      </RouterLink>
    </template>

    <BCard v-if="canSeeInactive" class="services__filters">
      <div class="services__filters-row">
        <BSelect
          v-model="inactiveFilter"
          label="Status"
          :options="[
            { label: 'Somente ativos', value: 'false' },
            { label: 'Incluir inativos', value: 'true' },
          ]"
        />
      </div>
    </BCard>

    <BSkeletonLoader v-if="isPending" height="240px" />

    <BEmptyState
      v-else-if="isError"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="services.length === 0"
      title="Nenhum serviço"
      subtitle="Crie o primeiro item do cardápio."
    />

    <BCard v-else padding="0" class="services__table-card">
      <div class="services__table-wrap">
        <table class="services__table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Duração</th>
              <th>Preço</th>
              <th>Status</th>
              <th v-if="isAdmin" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in services" :key="row.id">
              <td>
                <div class="services__name">
                  <BText as="span" variant="body-2-bold">{{ row.name }}</BText>
                  <BText
                    v-if="row.description"
                    as="span"
                    variant="body-3"
                    color="b-fg-neutral-secondary"
                    class="services__description"
                  >
                    {{ row.description }}
                  </BText>
                </div>
              </td>
              <td>{{ formatDuration(row.durationMinutes) }}</td>
              <td class="services__price">{{ formatMoney(row.priceCents) }}</td>
              <td>
                <BLabel :color="row.active ? 'success' : 'grayLight'">
                  {{ row.active ? 'Ativo' : 'Inativo' }}
                </BLabel>
              </td>
              <td v-if="isAdmin" class="services__actions">
                <RouterLink :to="`/services/${row.id}`">
                  <BButton size="small" variant="outline" color="neutral">Editar</BButton>
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BCard>
  </PageLayout>
</template>

<style scoped>
.services__filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 240px));
  gap: var(--b-spacing-sm);
}

.services__table-card {
  min-width: 0;
  overflow: hidden;
}

.services__table-wrap {
  overflow-x: auto;
}

.services__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.services__table th,
.services__table td {
  padding: var(--b-spacing-xs) var(--b-spacing-sm);
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--b-stroke-default);
}

.services__table th {
  font-weight: 700;
  color: var(--b-fg-neutral-secondary);
  background: var(--b-bg-neutral-surface);
  white-space: nowrap;
}

.services__table tbody tr:last-child td {
  border-bottom: none;
}

.services__table tbody tr:hover {
  background: var(--b-bg-neutral-hover);
}

.services__name {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-4xs);
  min-width: 0;
}

.services__description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.services__price {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.services__actions {
  text-align: right;
  white-space: nowrap;
}
</style>
