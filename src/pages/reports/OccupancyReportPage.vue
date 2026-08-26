<script setup lang="ts">
import { BCard, BEmptyState, BSkeletonLoader, BText } from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getOccupancyReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { formatMinutes, formatRateOrDash } from '@/features/reports/format';

const { range, setRange, error, isValid } = useReportRange();

const reportQuery = useQuery({
  queryKey: computed(() => ['reports', 'occupancy', range.value.from, range.value.to] as const),
  queryFn: () => getOccupancyReport({ from: range.value.from, to: range.value.to }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);
const barbers = computed(() => report.value?.barbers ?? []);
</script>

<template>
  <PageLayout subtitle="Minutos ocupados sobre minutos de expediente. Um cancelamento devolveu a cadeira, então não conta; uma falta ocupou o horário e conta.">
    <template #title>
      <div class="occupancy__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Ocupação</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="300px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <template v-else-if="report">
      <div class="occupancy__stats">
        <ReportStat
          label="Ocupação geral"
          :value="formatRateOrDash(report.overall.occupancyRate)"
        />
        <ReportStat label="Ocupado" :value="formatMinutes(report.overall.bookedMinutes)" />
        <ReportStat
          label="Expediente"
          :value="formatMinutes(report.overall.scheduledMinutes)"
          hint="Escala menos intervalos e bloqueios"
        />
      </div>

      <BEmptyState
        v-if="barbers.length === 0"
        title="Ninguém trabalhou neste período"
        subtitle="Sem escala no intervalo, não há o que ocupar."
      />

      <BCard v-else padding="0" class="occupancy__table-card">
        <div class="occupancy__table-wrap">
          <table class="occupancy__table">
            <thead>
              <tr>
                <th>Barbeiro</th>
                <th>Ocupado</th>
                <th>Expediente</th>
                <th>Taxa</th>
                <th class="occupancy__bar-col" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in barbers" :key="row.barberId">
                <td>
                  <RouterLink :to="`/reports/barbers/${row.barberId}`" class="occupancy__link">
                    {{ row.barberName }}
                  </RouterLink>
                </td>
                <td>{{ formatMinutes(row.bookedMinutes) }}</td>
                <td>{{ formatMinutes(row.scheduledMinutes) }}</td>
                <td>{{ formatRateOrDash(row.occupancyRate) }}</td>
                <td class="occupancy__bar-col">
                  <div v-if="row.occupancyRate !== null" class="occupancy__bar-track">
                    <div
                      class="occupancy__bar-fill"
                      :style="{ width: `${Math.min(1, row.occupancyRate) * 100}%` }"
                    />
                  </div>
                  <span v-else class="occupancy__muted">sem escala</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
        Um barbeiro sem escala no período aparece com traço em vez de zero: não é que ele ficou
        vazio, é que não havia expediente para ocupar.
      </BText>
    </template>
  </PageLayout>
</template>

<style scoped>
.occupancy__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.occupancy__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .occupancy__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.occupancy__table-card {
  overflow: hidden;
}

.occupancy__table-wrap {
  overflow-x: auto;
}

.occupancy__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.occupancy__table th,
.occupancy__table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.occupancy__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.occupancy__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}

.occupancy__bar-col {
  width: 160px;
}

.occupancy__bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--b-bg-neutral-surface-secondary, #f2f4f7);
  overflow: hidden;
}

.occupancy__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--b-fg-neutral-default, #101828);
}

.occupancy__muted {
  color: var(--b-fg-neutral-secondary, #667085);
  font-size: 0.8125rem;
}
</style>
