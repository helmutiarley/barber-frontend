<script setup lang="ts">
import { BButton, BCard, BEmptyState, BSkeletonLoader, BText } from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTopServicesReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import { useReportRange } from '@/composables/useReportRange';
import { shareOf } from '@/features/reports/format';
import { formatMoney } from '@/lib/money';

const LIMIT = 20;

const route = useRoute();
const router = useRouter();
const { range, setRange, error, isValid } = useReportRange();

/** The API ranks by revenue; re-sorting by count is a client-side view of the same rows. */
const sortBy = computed<'revenue' | 'count'>(() =>
  route.query.sortBy === 'count' ? 'count' : 'revenue',
);

function setSortBy(value: 'revenue' | 'count'): void {
  void router.replace({ query: { ...route.query, sortBy: value } });
}

const reportQuery = useQuery({
  queryKey: computed(() => ['reports', 'top-services', range.value.from, range.value.to] as const),
  queryFn: () => getTopServicesReport({ from: range.value.from, to: range.value.to, limit: LIMIT }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);

const services = computed(() => {
  const rows = [...(report.value?.services ?? [])];
  return sortBy.value === 'count'
    ? rows.sort((a, b) => b.appointments - a.appointments || b.grossCents - a.grossCents)
    : rows.sort((a, b) => b.grossCents - a.grossCents || b.appointments - a.appointments);
});

const totalGross = computed(() =>
  services.value.reduce((sum, service) => sum + service.grossCents, 0),
);

const peak = computed(() =>
  services.value.reduce(
    (max, service) => Math.max(max, sortBy.value === 'count' ? service.appointments : service.grossCents),
    0,
  ),
);

function metric(service: { appointments: number; grossCents: number }): number {
  return sortBy.value === 'count' ? service.appointments : service.grossCents;
}
</script>

<template>
  <PageLayout subtitle="Os serviços que mais renderam no período, pelos pagamentos que entraram.">
    <template #title>
      <div class="top__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Serviços mais vendidos</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BCard class="top__controls">
      <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Ordenar por</BText>
      <div class="top__toggle">
        <BButton
          size="small"
          color="neutral"
          :variant="sortBy === 'revenue' ? 'contain' : 'outline'"
          @click="setSortBy('revenue')"
        >
          Receita
        </BButton>
        <BButton
          size="small"
          color="neutral"
          :variant="sortBy === 'count' ? 'contain' : 'outline'"
          @click="setSortBy('count')"
        >
          Atendimentos
        </BButton>
      </div>
    </BCard>

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="300px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="services.length === 0"
      title="Nenhum serviço pago no período"
      subtitle="Sem atendimentos pagos, não há ranking."
    />

    <template v-else-if="report">
      <BCard padding="0" class="top__table-card">
        <div class="top__table-wrap">
          <table class="top__table">
            <thead>
              <tr>
                <th class="top__rank-col">#</th>
                <th>Serviço</th>
                <th>Atendimentos</th>
                <th>Receita</th>
                <th class="top__bar-col" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(service, index) in services" :key="service.serviceId">
                <td class="top__rank-col">{{ index + 1 }}</td>
                <td>{{ service.serviceName }}</td>
                <td>{{ service.appointments }}</td>
                <td>{{ formatMoney(service.grossCents) }}</td>
                <td class="top__bar-col">
                  <div class="top__bar-track">
                    <div
                      class="top__bar-fill"
                      :style="{ width: `${shareOf(metric(service), peak) * 100}%` }"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="top__rank-col" />
                <td>Total listado</td>
                <td>{{ services.reduce((sum, s) => sum + s.appointments, 0) }}</td>
                <td>{{ formatMoney(totalGross) }}</td>
                <td class="top__bar-col" />
              </tr>
            </tfoot>
          </table>
        </div>
      </BCard>

      <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
        Os {{ LIMIT }} primeiros por receita. Produtos não entram aqui — eles têm o próprio
        relatório.
      </BText>
    </template>
  </PageLayout>
</template>

<style scoped>
.top__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.top__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.top__toggle {
  display: flex;
  gap: 0.35rem;
}

.top__table-card {
  overflow: hidden;
}

.top__table-wrap {
  overflow-x: auto;
}

.top__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.top__table th,
.top__table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.top__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.top__table tfoot td {
  font-weight: 600;
  border-bottom: none;
}

.top__rank-col {
  width: 48px;
  color: var(--b-fg-neutral-secondary, #667085);
}

.top__bar-col {
  width: 160px;
}

.top__bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--b-bg-neutral-surface-secondary, #f2f4f7);
  overflow: hidden;
}

.top__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--b-fg-neutral-default, #101828);
}
</style>
