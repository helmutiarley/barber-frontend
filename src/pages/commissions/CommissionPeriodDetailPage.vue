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
import { DateTime } from 'luxon';
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { getCommissionStatement } from '@/api/commissions';
import CommissionsTabs from '@/components/commissions/CommissionsTabs.vue';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { usePermission } from '@/composables/usePermission';
import {
  COMMISSION_BASE_LABELS,
  PERIOD_STATUS_COLORS,
  PERIOD_STATUS_LABELS,
} from '@/features/commissions/labels';
import { formatRate } from '@/features/commissions/rate';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/method-labels';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime } from '@/lib/shop-time';

const route = useRoute();
const { hasRole } = usePermission();
const { barberName } = useBarberNames();

const id = computed(() => String(route.params.id));
const isAdmin = computed(() => hasRole('ADMIN'));

const statementQuery = useQuery({
  queryKey: computed(() => ['commission-periods', id.value] as const),
  queryFn: () => getCommissionStatement(id.value),
});

const { isPending: statementPending, isError: statementFailed } = statementQuery;

const statement = computed(() => statementQuery.data.value ?? null);
const period = computed(() => statement.value?.period ?? null);
const entries = computed(() => statement.value?.entries ?? []);
const advances = computed(() => statement.value?.advances ?? []);

const canPay = computed(() => isAdmin.value && period.value?.status === 'closed');

function formatDate(value: string): string {
  const date = DateTime.fromISO(value);
  return date.isValid ? date.toFormat('dd/MM/yyyy') : value;
}
</script>

<template>
  <PageLayout>
    <template #title>
      <div class="statement__title">
        <PageBackLink to="/commissions/periods" label="Períodos" />
        <BText as="h1" variant="heading-1">Extrato</BText>
      </div>
    </template>

    <template v-if="canPay" #header-actions>
      <RouterLink :to="`/commissions/periods/${id}/pay`">
        <BButton color="neutral" variant="contain">Pagar</BButton>
      </RouterLink>
    </template>

    <CommissionsTabs />

    <BSkeletonLoader v-if="statementPending" height="320px" />

    <BEmptyState
      v-else-if="statementFailed || !period"
      title="Extrato indisponível"
      subtitle="O período não existe ou não é seu."
    />

    <template v-else>
      <div class="statement__stats">
        <BCard class="statement__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Lançamentos</BText>
          <BText as="span" variant="heading-2">
            {{ formatMoney(period.totalEntriesCents) }}
          </BText>
        </BCard>
        <BCard class="statement__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Vales</BText>
          <BText as="span" variant="heading-2">
            {{ formatMoney(period.totalAdvancesCents) }}
          </BText>
        </BCard>
        <BCard class="statement__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">A pagar</BText>
          <BText
            as="span"
            variant="heading-2"
            :class="{ 'statement__negative': period.totalDueCents < 0 }"
          >
            {{ formatMoney(period.totalDueCents) }}
          </BText>
        </BCard>
      </div>

      <SectionCard title="Período">
        <dl class="statement__summary">
          <div>
            <dt>Barbeiro</dt>
            <dd>{{ barberName(period.barberId) }}</dd>
          </div>
          <div>
            <dt>Intervalo</dt>
            <dd>{{ formatDate(period.startsOn) }} – {{ formatDate(period.endsOn) }}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <BLabel :color="PERIOD_STATUS_COLORS[period.status]">
                {{ PERIOD_STATUS_LABELS[period.status] }}
              </BLabel>
            </dd>
          </div>
          <div>
            <dt>Fechado em</dt>
            <dd>{{ formatShopDateTime(period.closedAt) }}</dd>
          </div>
          <div v-if="period.paidAt">
            <dt>Pago em</dt>
            <dd>
              {{ formatShopDateTime(period.paidAt) }}
              <template v-if="period.paymentMethod">
                · {{ PAYMENT_METHOD_LABELS[period.paymentMethod] }}
              </template>
            </dd>
          </div>
        </dl>
        <BText v-if="period.totalDueCents < 0" as="p" variant="body-3" class="statement__note">
          O barbeiro adiantou mais do que ganhou no período. O saldo negativo fica como informação;
          nada é transportado para o próximo fechamento.
        </BText>
      </SectionCard>

      <SectionCard title="Lançamentos" class="statement__section">
        <BEmptyState
          v-if="entries.length === 0"
          title="Sem lançamentos"
          subtitle="O período fechou só com vales."
        />
        <div v-else class="statement__table-wrap">
          <table class="statement__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Origem</th>
                <th>Taxa</th>
                <th>Base</th>
                <th>Valor base</th>
                <th>Comissão</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in entries" :key="entry.id">
                <td>{{ formatShopDateTime(entry.createdAt) }}</td>
                <td>
                  <RouterLink
                    v-if="entry.appointmentId"
                    :to="`/appointments/${entry.appointmentId}`"
                    class="statement__link"
                  >
                    Horário
                  </RouterLink>
                  <span v-else-if="entry.productSaleId">Venda de produto</span>
                  <span v-else>—</span>
                </td>
                <td>{{ formatRate(entry.rate) }}</td>
                <td>{{ COMMISSION_BASE_LABELS[entry.base] }}</td>
                <td>{{ formatMoney(entry.baseAmountCents) }}</td>
                <td>{{ formatMoney(entry.amountCents) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Vales" class="statement__section">
        <BEmptyState
          v-if="advances.length === 0"
          title="Sem vales"
          subtitle="Nenhum adiantamento entrou neste período."
        />
        <div v-else class="statement__table-wrap">
          <table class="statement__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Valor</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="advance in advances" :key="advance.id">
                <td>{{ formatShopDateTime(advance.createdAt) }}</td>
                <td>{{ formatMoney(advance.amountCents) }}</td>
                <td>{{ advance.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.statement__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.statement__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  margin-bottom: 1rem;
}

@media (min-width: 700px) {
  .statement__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.statement__stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.statement__negative {
  color: var(--b-fg-danger-hover, #b42318);
}

.statement__summary {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  margin: 0;
}

@media (min-width: 700px) {
  .statement__summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.statement__summary dt {
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
  margin-bottom: 0.15rem;
}

.statement__summary dd {
  margin: 0;
  font-size: 0.9375rem;
}

.statement__note {
  margin-top: 0.75rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.statement__section {
  margin-top: 1rem;
}

.statement__table-wrap {
  overflow-x: auto;
}

.statement__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.statement__table th,
.statement__table td {
  padding: 0.65rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.statement__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.statement__link {
  color: var(--b-fg-brand-default, #2563eb);
  text-decoration: underline;
}
</style>
