<script setup lang="ts">
import { BCard, BEmptyState, BSkeletonLoader, BText } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getAverageTicketReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { formatMoneyOrDash } from '@/features/reports/format';
import { formatMoney } from '@/lib/money';

const { range, setRange, error, isValid } = useReportRange();

const reportQuery = useQuery({
  queryKey: computed(
    () => ['reports', 'average-ticket', range.value.from, range.value.to] as const,
  ),
  queryFn: () => getAverageTicketReport({ from: range.value.from, to: range.value.to }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);
const barbers = computed(() => report.value?.barbers ?? []);
</script>

<template>
  <PageLayout subtitle="Só atendimentos: uma pomada não é uma visita. Um atendimento pago em duas vezes continua sendo um ticket.">
    <template #title>
      <div class="ticket__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Ticket médio</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="280px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <template v-else-if="report">
      <div class="ticket__stats">
        <ReportStat
          label="Ticket médio"
          :value="formatMoneyOrDash(report.overall.averageTicketCents)"
        />
        <ReportStat label="Receita de serviços" :value="formatMoney(report.overall.grossCents)" />
        <ReportStat
          label="Atendimentos"
          :value="String(report.overall.appointments)"
          hint="Concluídos e pagos no período"
        />
      </div>

      <BEmptyState
        v-if="barbers.length === 0"
        title="Nenhum atendimento no período"
        subtitle="Sem cortes pagos, não há ticket para calcular."
      />

      <BCard v-else padding="0" class="ticket__table-card">
        <div class="ticket__table-wrap">
          <table class="ticket__table">
            <thead>
              <tr>
                <th>Barbeiro</th>
                <th>Receita</th>
                <th>Atendimentos</th>
                <th>Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in barbers" :key="row.barberId">
                <td>
                  <RouterLink :to="`/reports/barbers/${row.barberId}`" class="ticket__link">
                    {{ row.barberName }}
                  </RouterLink>
                </td>
                <td>{{ formatMoney(row.grossCents) }}</td>
                <td>{{ row.appointments }}</td>
                <td>{{ formatMoneyOrDash(row.averageTicketCents) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Geral</td>
                <td>{{ formatMoney(report.overall.grossCents) }}</td>
                <td>{{ report.overall.appointments }}</td>
                <td>{{ formatMoneyOrDash(report.overall.averageTicketCents) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </BCard>

      <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
        O geral é a receita total dividida pelos atendimentos totais, não a média das médias — um
        barbeiro com um corte caro não pesa igual a um com trinta.
      </BText>
    </template>
  </PageLayout>
</template>

<style scoped>
.ticket__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ticket__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .ticket__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.ticket__table-card {
  overflow: hidden;
}

.ticket__table-wrap {
  overflow-x: auto;
}

.ticket__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.ticket__table th,
.ticket__table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.ticket__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.ticket__table tfoot td {
  font-weight: 600;
  border-bottom: none;
}

.ticket__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}
</style>
