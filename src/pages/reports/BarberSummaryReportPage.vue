<script setup lang="ts">
import { BCard, BEmptyState, BSkeletonLoader, BText } from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { getBarberSummary } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { usePermission } from '@/composables/usePermission';
import { useReportRange } from '@/composables/useReportRange';
import { formatMoneyOrDash, formatRateOrDash } from '@/features/reports/format';
import { ApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';

const route = useRoute();
const { hasRole } = usePermission();
const { range, setRange, error, isValid } = useReportRange();

const barberId = computed(() => String(route.params.id));
const isStaff = computed(() => hasRole('ADMIN', 'MANAGER'));

const reportQuery = useQuery({
  queryKey: computed(
    () => ['reports', 'barber', barberId.value, range.value.from, range.value.to] as const,
  ),
  queryFn: () =>
    getBarberSummary(barberId.value, { from: range.value.from, to: range.value.to }),
  enabled: isValid,
  retry: false,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);

/** A barber asking for someone else's numbers gets a 403, and should be told why. */
const isForbidden = computed(() => {
  const failure = reportQuery.error.value;
  return failure instanceof ApiError && (failure.status === 403 || failure.code === 'FORBIDDEN');
});
</script>

<template>
  <PageLayout subtitle="Cortes, receita gerada e comissão ganha no período.">
    <template #title>
      <div class="summary__title">
        <PageBackLink v-if="isStaff" to="/reports" label="Relatórios" />
        <PageBackLink v-else to="/commissions/periods" label="Comissões" />
        <BText as="h1" variant="heading-1">
          {{ report?.barberName ?? 'Resumo do barbeiro' }}
        </BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="280px" />

    <BEmptyState
      v-else-if="isForbidden"
      title="Esse resumo não é seu"
      subtitle="Um barbeiro só abre os próprios números."
    />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Confira o link e tente novamente."
    />

    <template v-else-if="report">
      <div class="summary__stats">
        <ReportStat
          label="Cortes concluídos"
          :value="String(report.cuts)"
          :hint="`${report.appointments} horário(s) na agenda`"
        />
        <ReportStat
          label="Receita gerada"
          :value="formatMoney(report.revenueCents)"
          hint="Serviços e produtos atribuídos a este barbeiro"
        />
        <ReportStat
          label="Comissão ganha"
          :value="formatMoney(report.commissionCents)"
          hint="Pelo que foi ganho, não pelo que já foi pago"
        />
        <ReportStat
          label="Ticket médio"
          :value="formatMoneyOrDash(report.averageTicketCents)"
          hint="Só serviços"
        />
      </div>

      <BCard padding="0" class="summary__table-card">
        <table class="summary__table">
          <tbody>
            <tr>
              <td>Horários na agenda</td>
              <td>{{ report.appointments }}</td>
            </tr>
            <tr>
              <td>Concluídos</td>
              <td>{{ report.cuts }}</td>
            </tr>
            <tr>
              <td>Faltas</td>
              <td>{{ report.noShows }}</td>
            </tr>
            <tr>
              <td>Cancelados</td>
              <td>{{ report.cancelled }}</td>
            </tr>
            <tr>
              <td>Taxa de falta</td>
              <td>{{ formatRateOrDash(report.noShowRate) }}</td>
            </tr>
          </tbody>
        </table>
      </BCard>

      <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
        A comissão aqui é a que foi ganha no período, que não é a mesma coisa que a paga: o que
        já virou pagamento está no
        <RouterLink to="/commissions/periods" class="summary__link">extrato de períodos</RouterLink>.
      </BText>
    </template>
  </PageLayout>
</template>

<style scoped>
.summary__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.summary__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .summary__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.summary__table-card {
  overflow: hidden;
  max-width: 480px;
}

.summary__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.summary__table td {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
}

.summary__table tr:last-child td {
  border-bottom: none;
}

.summary__table td:last-child {
  text-align: right;
  font-weight: 600;
  white-space: nowrap;
}

.summary__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}
</style>
