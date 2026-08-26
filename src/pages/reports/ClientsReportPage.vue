<script setup lang="ts">
import { BCard, BEmptyState, BSkeletonLoader, BText } from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getClientsReport } from '@/api/reports';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import ReportRangePicker from '@/components/reports/ReportRangePicker.vue';
import ReportStat from '@/components/reports/ReportStat.vue';
import { useReportRange } from '@/composables/useReportRange';
import { formatRate } from '@/features/commissions/rate';
import { formatCalendarDate } from '@/features/reports/range';

const { range, setRange, error, isValid } = useReportRange();

const reportQuery = useQuery({
  queryKey: computed(() => ['reports', 'clients', range.value.from, range.value.to] as const),
  queryFn: () => getClientsReport({ from: range.value.from, to: range.value.to }),
  enabled: isValid,
});

// `isLoading`, not `isPending`: an invalid range disables the query, and a
// disabled query stays pending forever.
const { isLoading: reportLoading, isError: reportFailed } = reportQuery;

const report = computed(() => reportQuery.data.value ?? null);

const attended = computed(() =>
  report.value ? report.value.newClients + report.value.recurringClients : 0,
);

const newShare = computed(() =>
  attended.value === 0 || !report.value ? null : report.value.newClients / attended.value,
);
</script>

<template>
  <PageLayout subtitle="Quem veio pela primeira vez, quem voltou, e quantos não aparecem desde antes do período.">
    <template #title>
      <div class="clients__title">
        <PageBackLink to="/reports" label="Relatórios" />
        <BText as="h1" variant="heading-1">Clientes</BText>
      </div>
    </template>

    <ReportRangePicker :range="range" @update:range="setRange" />

    <BEmptyState v-if="error" title="Ajuste o período" :subtitle="error" />

    <BSkeletonLoader v-else-if="reportLoading" height="220px" />

    <BEmptyState
      v-else-if="reportFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <template v-else-if="report">
      <div class="clients__stats">
        <ReportStat
          label="Novos"
          :value="String(report.newClients)"
          hint="Primeiro atendimento concluído caiu no período"
        />
        <ReportStat
          label="Recorrentes"
          :value="String(report.recurringClients)"
          hint="Já tinham vindo antes"
        />
        <ReportStat
          label="Inativos"
          :value="String(report.inactiveClients)"
          :hint="`Sem atendimento desde ${formatCalendarDate(report.from)}`"
        />
      </div>

      <BCard class="clients__mix">
        <BText as="h2" variant="heading-3">Quem foi atendido</BText>
        <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
          {{ attended }} cliente(s) no período.
          <template v-if="newShare !== null">
            {{ formatRate(newShare) }} eram novos.
          </template>
        </BText>

        <div v-if="attended > 0" class="clients__bar">
          <div
            class="clients__bar-new"
            :style="{ width: `${(report.newClients / attended) * 100}%` }"
          />
          <div
            class="clients__bar-returning"
            :style="{ width: `${(report.recurringClients / attended) * 100}%` }"
          />
        </div>

        <div v-if="attended > 0" class="clients__legend">
          <span class="clients__legend-item">
            <span class="clients__swatch clients__swatch--new" />
            Novos ({{ report.newClients }})
          </span>
          <span class="clients__legend-item">
            <span class="clients__swatch clients__swatch--returning" />
            Recorrentes ({{ report.recurringClients }})
          </span>
        </div>

        <BText v-else as="p" variant="body-2">Ninguém foi atendido neste período.</BText>
      </BCard>

      <BCard class="clients__note">
        <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
          Um cliente é novo quando o primeiro atendimento concluído dele caiu dentro do período, e
          recorrente quando já tinha um antes. Inativo tem o sentido do CRM: nenhum atendimento
          concluído de {{ formatCalendarDate(report.from) }} para cá — a lista de quem são está em
          <RouterLink to="/clients" class="clients__link">Clientes</RouterLink>.
        </BText>
      </BCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.clients__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.clients__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .clients__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.clients__mix {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.clients__bar {
  display: flex;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--b-bg-neutral-surface-secondary, #f2f4f7);
}

.clients__bar-new {
  background: var(--b-fg-neutral-default, #101828);
}

.clients__bar-returning {
  background: var(--b-fg-neutral-secondary, #98a2b3);
}

.clients__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.clients__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.clients__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.clients__swatch--new {
  background: var(--b-fg-neutral-default, #101828);
}

.clients__swatch--returning {
  background: var(--b-fg-neutral-secondary, #98a2b3);
}

.clients__note {
  border-left: 3px solid var(--b-fg-neutral-secondary, #667085);
}

.clients__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}
</style>
