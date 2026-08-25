<script setup lang="ts">
import { BCard, BEmptyState, BSkeletonLoader, BText } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getNoShowsReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { formatRateOrDash } from '@/features/reports/format';

const { range, setRange, error, isValid } = useReportRange();

const reportQuery = useQuery({
  queryKey: computed(() => ['reports', 'no-shows', range.value.from, range.value.to] as const),
  queryFn: () => getNoShowsReport({ from: range.value.from, to: range.value.to }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);
const barbers = computed(() => report.value?.barbers ?? []);
</script>

<template>
  <PageLayout subtitle="Quem não apareceu e quem desmarcou, sobre o total de horários marcados no período.">
    <template #title>
      <div class="noshow__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Faltas e cancelamentos</BText>
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
      <div class="noshow__stats">
        <ReportStat
          label="Taxa de falta"
          :value="formatRateOrDash(report.overall.noShowRate)"
          :hint="`${report.overall.noShows} de ${report.overall.total} horário(s)`"
        />
        <ReportStat
          label="Taxa de cancelamento"
          :value="formatRateOrDash(report.overall.cancellationRate)"
          :hint="`${report.overall.cancelled} cancelamento(s)`"
        />
        <ReportStat label="Concluídos" :value="String(report.overall.completed)" />
        <ReportStat label="Total de horários" :value="String(report.overall.total)" />
      </div>

      <BEmptyState
        v-if="barbers.length === 0"
        title="Nenhum horário no período"
        subtitle="Sem agendamentos, não há falta para medir."
      />

      <BCard v-else padding="0" class="noshow__table-card">
        <div class="noshow__table-wrap">
          <table class="noshow__table">
            <thead>
              <tr>
                <th>Barbeiro</th>
                <th>Concluídos</th>
                <th>Faltas</th>
                <th>Cancelados</th>
                <th>Total</th>
                <th>Taxa de falta</th>
                <th>Taxa de cancel.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in barbers" :key="row.barberId">
                <td>
                  <RouterLink :to="`/reports/barbers/${row.barberId}`" class="noshow__link">
                    {{ row.barberName }}
                  </RouterLink>
                </td>
                <td>{{ row.completed }}</td>
                <td>{{ row.noShows }}</td>
                <td>{{ row.cancelled }}</td>
                <td>{{ row.total }}</td>
                <td>{{ formatRateOrDash(row.noShowRate) }}</td>
                <td>{{ formatRateOrDash(row.cancellationRate) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Geral</td>
                <td>{{ report.overall.completed }}</td>
                <td>{{ report.overall.noShows }}</td>
                <td>{{ report.overall.cancelled }}</td>
                <td>{{ report.overall.total }}</td>
                <td>{{ formatRateOrDash(report.overall.noShowRate) }}</td>
                <td>{{ formatRateOrDash(report.overall.cancellationRate) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </BCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.noshow__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.noshow__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .noshow__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.noshow__table-card {
  overflow: hidden;
}

.noshow__table-wrap {
  overflow-x: auto;
}

.noshow__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.noshow__table th,
.noshow__table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.noshow__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.noshow__table tfoot td {
  font-weight: 600;
  border-bottom: none;
}

.noshow__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}
</style>
