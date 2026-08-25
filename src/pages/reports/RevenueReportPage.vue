<script setup lang="ts">
import { BCard, BEmptyState, BSelect, BSkeletonLoader, BText } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getRevenueReport } from '@/api/reports';
import type { RevenueGrouping } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { bucketLabel, shareOf } from '@/features/reports/format';
import { isRevenueGrouping, REVENUE_GROUPING_OPTIONS } from '@/features/reports/labels';
import { formatMoney } from '@/lib/money';

const route = useRoute();
const router = useRouter();
const { range, setRange, error, isValid } = useReportRange();

const groupBy = computed<RevenueGrouping>(() =>
  isRevenueGrouping(route.query.groupBy) ? route.query.groupBy : 'day',
);

function setGroupBy(value: string | number): void {
  void router.replace({ query: { ...route.query, groupBy: String(value) } });
}

const reportQuery = useQuery({
  queryKey: computed(
    () => ['reports', 'revenue', range.value.from, range.value.to, groupBy.value] as const,
  ),
  queryFn: () =>
    getRevenueReport({ from: range.value.from, to: range.value.to, groupBy: groupBy.value }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);
const buckets = computed(() => report.value?.buckets ?? []);

/** Bars are read against the biggest bucket, not the total, or every bar is a sliver. */
const peakGross = computed(() =>
  buckets.value.reduce((max, bucket) => Math.max(max, bucket.grossCents), 0),
);
</script>

<template>
  <PageLayout subtitle="Bruto é o que o cliente pagou; líquido é o que sobrou depois da taxa da maquininha.">
    <template #title>
      <div class="revenue__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Faturamento</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BCard class="revenue__controls">
      <BSelect
        :model-value="groupBy"
        label="Agrupar por"
        :options="REVENUE_GROUPING_OPTIONS"
        @update:model-value="setGroupBy"
      />
    </BCard>

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="320px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <template v-else-if="report">
      <div class="revenue__stats">
        <ReportStat label="Bruto" :value="formatMoney(report.totals.grossCents)" />
        <ReportStat
          label="Líquido"
          :value="formatMoney(report.totals.netCents)"
          :hint="`Taxas de cartão: ${formatMoney(report.totals.cardFeeCents)}`"
        />
        <ReportStat label="Serviços" :value="formatMoney(report.totals.serviceGrossCents)" />
        <ReportStat
          label="Produtos"
          :value="formatMoney(report.totals.productGrossCents)"
          :hint="`${report.totals.payments} pagamento(s) no período`"
        />
      </div>

      <BCard v-if="buckets.length === 0" class="revenue__empty">
        <BText as="p" variant="body-2">
          Nenhum pagamento neste período. Nada foi recebido, ou o período ainda não chegou.
        </BText>
      </BCard>

      <BCard v-else padding="0" class="revenue__table-card">
        <div class="revenue__table-wrap">
          <table class="revenue__table">
            <thead>
              <tr>
                <th>{{ REVENUE_GROUPING_OPTIONS.find((o) => o.value === groupBy)?.label }}</th>
                <th>Bruto</th>
                <th>Taxas</th>
                <th>Líquido</th>
                <th>Pagamentos</th>
                <th class="revenue__share-col">Participação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bucket in buckets" :key="String(bucket.key)">
                <td>
                  <span :class="{ 'revenue__unattributed': bucket.key === null }">
                    {{ bucketLabel(bucket, groupBy) }}
                  </span>
                </td>
                <td>{{ formatMoney(bucket.grossCents) }}</td>
                <td>{{ formatMoney(bucket.cardFeeCents) }}</td>
                <td>{{ formatMoney(bucket.netCents) }}</td>
                <td>{{ bucket.payments }}</td>
                <td class="revenue__share-col">
                  <div class="revenue__bar-track">
                    <div
                      class="revenue__bar-fill"
                      :style="{ width: `${shareOf(bucket.grossCents, peakGross) * 100}%` }"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{{ formatMoney(report.totals.grossCents) }}</td>
                <td>{{ formatMoney(report.totals.cardFeeCents) }}</td>
                <td>{{ formatMoney(report.totals.netCents) }}</td>
                <td>{{ report.totals.payments }}</td>
                <td class="revenue__share-col" />
              </tr>
            </tfoot>
          </table>
        </div>
      </BCard>

      <BText
        v-if="groupBy === 'barber' || groupBy === 'service'"
        as="p"
        variant="body-3"
        color="b-fg-neutral-secondary"
        class="revenue__note"
      >
        <template v-if="groupBy === 'barber'">
          "Venda da casa" é o que ninguém levou comissão por.
        </template>
        <template v-else>
          "Sem serviço" são pagamentos de produto, que não passam por um atendimento.
        </template>
        Aparecem na lista de propósito: sem eles as linhas não somariam o total.
      </BText>
    </template>
  </PageLayout>
</template>

<style scoped>
.revenue__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.revenue__controls {
  max-width: 320px;
}

.revenue__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .revenue__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.revenue__empty {
  border-left: 3px solid var(--b-fg-neutral-secondary, #667085);
}

.revenue__table-card {
  overflow: hidden;
}

.revenue__table-wrap {
  overflow-x: auto;
}

.revenue__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.revenue__table th,
.revenue__table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.revenue__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.revenue__table tfoot td {
  font-weight: 600;
  border-bottom: none;
}

.revenue__unattributed {
  color: var(--b-fg-neutral-secondary, #667085);
  font-style: italic;
}

.revenue__share-col {
  width: 140px;
}

.revenue__bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--b-bg-neutral-surface-secondary, #f2f4f7);
  overflow: hidden;
}

.revenue__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--b-fg-neutral-default, #101828);
}

.revenue__note {
  margin-top: 0.25rem;
}
</style>
