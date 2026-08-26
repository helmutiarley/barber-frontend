<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSkeletonLoader,
  BText,
} from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listMyAppointments } from '@/api/appointments';
import { listBarbers } from '@/api/barbers';
import { listServices } from '@/api/services';
import PageLayout from '@/components/layout/PageLayout.vue';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/features/appointments/status-labels';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime } from '@/lib/shop-time';

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();

const offset = computed(() => {
  const raw = typeof route.query.offset === 'string' ? Number(route.query.offset) : 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const listQuery = useQuery({
  queryKey: computed(() => ['my-appointments', { offset: offset.value }] as const),
  queryFn: () => listMyAppointments({ limit: PAGE_SIZE, offset: offset.value }),
});

const { isPending: listPending, isError: listFailed } = listQuery;

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: true }] as const,
  queryFn: () => listServices({ includeInactive: true }),
});

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const rows = computed(() => listQuery.data.value?.data ?? []);
const total = computed(() => listQuery.data.value?.meta.total ?? 0);

const serviceName = computed(() => {
  const map = new Map((servicesQuery.data.value ?? []).map((s) => [s.id, s.name]));
  return (id: string) => map.get(id) ?? 'Serviço';
});

const barberName = computed(() => {
  const map = new Map((barbersQuery.data.value ?? []).map((b) => [b.id, b.displayName]));
  return (id: string) => map.get(id) ?? 'Barbeiro';
});

const canPrev = computed(() => offset.value > 0);
const canNext = computed(() => offset.value + PAGE_SIZE < total.value);

function setOffset(next: number): void {
  void router.replace({
    query: { offset: next > 0 ? String(next) : undefined },
  });
}
</script>

<template>
  <PageLayout title="Meus horários" subtitle="Próximos e histórico, do mais recente.">
    <template #header-actions>
      <RouterLink to="/book">
        <BButton color="neutral" variant="contain" icon-prepend="ic-add-16">Agendar</BButton>
      </RouterLink>
    </template>

    <BSkeletonLoader v-if="listPending" height="240px" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum horário"
      subtitle="Marque o primeiro corte."
    >
      <template #actions>
        <RouterLink to="/book">
          <BButton color="neutral" variant="contain">Agendar</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <template v-else>
      <div class="mine__list">
        <BCard v-for="row in rows" :key="row.id" class="mine__card">
          <div class="mine__row">
            <div class="mine__meta">
              <BText as="h2" variant="heading-2">
                {{ formatShopDateTime(row.startsAt) }}
              </BText>
              <BText as="p" variant="body-2">
                {{ serviceName(row.serviceId) }} · {{ barberName(row.barberId) }}
              </BText>
              <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
                {{ formatMoney(row.priceCents) }} · {{ row.durationMinutes }} min
              </BText>
            </div>
            <div class="mine__side">
              <BLabel :color="APPOINTMENT_STATUS_COLORS[row.status]">
                {{ APPOINTMENT_STATUS_LABELS[row.status] }}
              </BLabel>
              <RouterLink :to="`/appointments/${row.id}`">
                <BButton size="small" variant="outline" color="neutral">Detalhes</BButton>
              </RouterLink>
            </div>
          </div>
        </BCard>
      </div>

      <div class="mine__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="mine__pager-actions">
          <BButton
            size="small"
            variant="outline"
            color="neutral"
            :is-disabled="!canPrev"
            @click="setOffset(Math.max(0, offset - PAGE_SIZE))"
          >
            Anterior
          </BButton>
          <BButton
            size="small"
            variant="outline"
            color="neutral"
            :is-disabled="!canNext"
            @click="setOffset(offset + PAGE_SIZE)"
          >
            Próxima
          </BButton>
        </div>
      </div>
    </template>
  </PageLayout>
</template>

<style scoped>
.mine__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mine__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.mine__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mine__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.mine__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.mine__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
