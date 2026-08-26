<script setup lang="ts">
import { BCard, BEmptyState, BLabel, BSkeletonLoader, BText } from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getProductsReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { formatMoneyOrDash } from '@/features/reports/format';
import { formatMoney } from '@/lib/money';

const { range, setRange, error, isValid } = useReportRange();

const reportQuery = useQuery({
  queryKey: computed(() => ['reports', 'products', range.value.from, range.value.to] as const),
  queryFn: () => getProductsReport({ from: range.value.from, to: range.value.to }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);
const products = computed(() => report.value?.products ?? []);
const lowStock = computed(() => report.value?.lowStock ?? []);
const missingCost = computed(() => report.value?.totals.productsWithoutCost ?? 0);
</script>

<template>
  <PageLayout subtitle="O que saiu da prateleira no período, e o que está prestes a acabar.">
    <template #title>
      <div class="products-report__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Produtos</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="320px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <template v-else-if="report">
      <div class="products-report__stats">
        <ReportStat label="Unidades vendidas" :value="String(report.totals.units)" />
        <ReportStat label="Receita" :value="formatMoney(report.totals.revenueCents)" />
        <ReportStat
          label="Margem"
          :value="formatMoney(report.totals.marginCents)"
          :hint="
            missingCost > 0
              ? `Parcial: ${missingCost} produto(s) sem custo cadastrado`
              : 'Todos os produtos têm custo cadastrado'
          "
        />
      </div>

      <BCard v-if="missingCost > 0" class="products-report__warning">
        <BText as="p" variant="body-2">
          {{ missingCost }} produto(s) vendido(s) não têm custo cadastrado, então a margem acima
          cobre só uma parte das vendas. A margem também usa o custo de hoje — a venda guardou o
          preço, não o custo —, então ela é aproximada por natureza.
        </BText>
      </BCard>

      <BEmptyState
        v-if="products.length === 0"
        title="Nenhuma venda no período"
        subtitle="Nada saiu da prateleira neste intervalo."
      />

      <BCard v-else padding="0" class="products-report__table-card">
        <div class="products-report__table-wrap">
          <table class="products-report__table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Unidades</th>
                <th>Receita</th>
                <th>Custo unitário</th>
                <th>Margem</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in products" :key="row.productId">
                <td>
                  <RouterLink :to="`/products/${row.productId}`" class="products-report__link">
                    {{ row.productName }}
                  </RouterLink>
                </td>
                <td>{{ row.units }}</td>
                <td>{{ formatMoney(row.revenueCents) }}</td>
                <td>{{ formatMoneyOrDash(row.costCents) }}</td>
                <td>
                  <span v-if="row.marginCents === null" class="products-report__muted">
                    sem custo
                  </span>
                  <span v-else>{{ formatMoney(row.marginCents) }}</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{{ report.totals.units }}</td>
                <td>{{ formatMoney(report.totals.revenueCents) }}</td>
                <td />
                <td>{{ formatMoney(report.totals.marginCents) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </BCard>

      <BCard class="products-report__low">
        <div class="products-report__low-head">
          <BText as="h2" variant="heading-3">Estoque baixo</BText>
          <BLabel v-if="lowStock.length > 0" color="warning">{{ lowStock.length }}</BLabel>
        </div>

        <BText v-if="lowStock.length === 0" as="p" variant="body-2">
          Nenhum produto no limite. Vale lembrar que esta lista é de agora, não do período.
        </BText>

        <ul v-else class="products-report__low-list">
          <li v-for="row in lowStock" :key="row.productId">
            <RouterLink :to="`/products/${row.productId}/stock`" class="products-report__link">
              {{ row.productName }}
            </RouterLink>
            <span class="products-report__muted">
              {{ row.stockQuantity }} em estoque, alerta em {{ row.lowStockThreshold }}
            </span>
          </li>
        </ul>
      </BCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.products-report__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.products-report__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .products-report__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.products-report__warning {
  border-left: 3px solid var(--b-fg-warning-primary, #b54708);
}

.products-report__table-card {
  overflow: hidden;
}

.products-report__table-wrap {
  overflow-x: auto;
}

.products-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.products-report__table th,
.products-report__table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.products-report__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.products-report__table tfoot td {
  font-weight: 600;
  border-bottom: none;
}

.products-report__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}

.products-report__muted {
  color: var(--b-fg-neutral-secondary, #667085);
  font-size: 0.8125rem;
}

.products-report__low-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.products-report__low-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.products-report__low-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
}
</style>
