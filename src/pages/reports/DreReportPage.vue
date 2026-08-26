<script setup lang="ts">
import { BCard, BEmptyState, BSkeletonLoader, BText } from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { getDreReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { EXPENSE_CATEGORY_LABELS } from '@/features/expenses/labels';
import { formatMoney } from '@/lib/money';

const { range, setRange, error, isValid } = useReportRange();

const reportQuery = useQuery({
  queryKey: computed(() => ['reports', 'dre', range.value.from, range.value.to] as const),
  queryFn: () => getDreReport({ from: range.value.from, to: range.value.to }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);
const isProfit = computed(() => (report.value?.resultCents ?? 0) >= 0);
</script>

<template>
  <PageLayout subtitle="Simplificado de propósito: despesas e receitas contam quando o dinheiro se moveu, e só a comissão conta quando foi ganha.">
    <template #title>
      <div class="dre__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">DRE simplificado</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="360px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <template v-else-if="report">
      <div class="dre__stats">
        <ReportStat label="Receita bruta" :value="formatMoney(report.revenue.grossCents)" />
        <ReportStat
          label="Receita líquida"
          :value="formatMoney(report.revenue.netCents)"
          hint="Depois das taxas de cartão"
        />
        <ReportStat
          :label="isProfit ? 'Resultado' : 'Prejuízo'"
          :value="formatMoney(report.resultCents)"
          :tone="isProfit ? 'positive' : 'negative'"
        />
      </div>

      <BCard padding="0" class="dre__table-card">
        <table class="dre__table">
          <tbody>
            <tr class="dre__group">
              <th colspan="2">Receita</th>
            </tr>
            <tr>
              <td>Serviços</td>
              <td>{{ formatMoney(report.revenue.serviceGrossCents) }}</td>
            </tr>
            <tr>
              <td>Produtos</td>
              <td>{{ formatMoney(report.revenue.productGrossCents) }}</td>
            </tr>
            <tr class="dre__subtotal">
              <td>Receita bruta</td>
              <td>{{ formatMoney(report.revenue.grossCents) }}</td>
            </tr>
            <tr class="dre__negative">
              <td>(−) Taxas de cartão</td>
              <td>{{ formatMoney(report.revenue.cardFeeCents) }}</td>
            </tr>
            <tr class="dre__subtotal">
              <td>Receita líquida</td>
              <td>{{ formatMoney(report.revenue.netCents) }}</td>
            </tr>

            <tr class="dre__group">
              <th colspan="2">Despesas pagas</th>
            </tr>
            <tr v-for="row in report.expenses.byCategory" :key="row.category" class="dre__negative">
              <td>(−) {{ EXPENSE_CATEGORY_LABELS[row.category] ?? row.category }}</td>
              <td>{{ formatMoney(row.amountCents) }}</td>
            </tr>
            <tr v-if="report.expenses.byCategory.length === 0">
              <td colspan="2" class="dre__muted">Nenhuma despesa paga no período.</td>
            </tr>
            <tr class="dre__subtotal dre__negative">
              <td>(−) Total de despesas</td>
              <td>{{ formatMoney(report.expenses.totalCents) }}</td>
            </tr>

            <tr class="dre__group">
              <th colspan="2">Comissões</th>
            </tr>
            <tr class="dre__negative">
              <td>(−) Comissões ganhas no período</td>
              <td>{{ formatMoney(report.commissionsCents) }}</td>
            </tr>

            <tr class="dre__result" :class="isProfit ? 'dre__profit' : 'dre__loss'">
              <td>{{ isProfit ? 'Resultado' : 'Prejuízo' }}</td>
              <td>{{ formatMoney(report.resultCents) }}</td>
            </tr>
          </tbody>
        </table>
      </BCard>

      <BCard class="dre__notes">
        <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
          Despesa entra pela data em que foi paga e receita pela data em que foi recebida, então um
          corte feito na segunda e pago na terça é receita de terça. A comissão é a exceção: conta
          quando foi ganha, junto da receita que a gerou — lançá-la de novo como despesa no dia do
          pagamento contaria duas vezes.
        </BText>
      </BCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.dre__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dre__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .dre__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.dre__table-card {
  overflow: hidden;
}

.dre__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.dre__table th,
.dre__table td {
  padding: 0.6rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
}

.dre__table td:last-child {
  text-align: right;
  white-space: nowrap;
}

.dre__group th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  background: var(--b-bg-neutral-surface-secondary, #f9fafb);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

.dre__subtotal td {
  font-weight: 600;
}

.dre__negative td:last-child {
  color: var(--b-fg-danger-primary, #b42318);
}

.dre__muted {
  color: var(--b-fg-neutral-secondary, #667085);
}

.dre__result td {
  font-weight: 700;
  font-size: 1rem;
  border-bottom: none;
}

.dre__profit td:last-child {
  color: var(--b-fg-success-primary, #067647);
}

.dre__loss td:last-child {
  color: var(--b-fg-danger-primary, #b42318);
}

.dre__notes {
  border-left: 3px solid var(--b-fg-neutral-secondary, #667085);
}
</style>
