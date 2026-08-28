<script setup lang="ts">
import {
  BButton,
  BEmptyState,
  BLabel,
  BSkeletonLoader,
  BText,
} from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSession } from '@/api/cash-register';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  DISCOUNT_REASON_LABELS,
  MOVEMENT_SOURCE_LABELS,
  MOVEMENT_TYPE_LABELS,
} from '@/features/cash-register/labels';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/method-labels';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime } from '@/lib/shop-time';

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const detailQuery = useQuery({
  queryKey: computed(() => ['cash-register', 'sessions', id.value] as const),
  queryFn: () => getSession(id.value),
});

const { isPending: detailPending, isError: detailFailed } = detailQuery;

const session = computed(() => detailQuery.data.value?.session);
const movements = computed(() => detailQuery.data.value?.movements ?? []);
</script>

<template>
  <PageLayout>
    <template #title>
      <div class="detail__title">
        <PageBackLink to="/cash-register/sessions" label="Histórico" />
        <BText as="h1" variant="heading-1">Sessão de caixa</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="detailPending" height="200px" />

    <BEmptyState
      v-else-if="detailFailed || !session"
      title="Sessão não encontrada"
      subtitle="Volte ao histórico e tente de novo."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push('/cash-register/sessions')">
          Voltar
        </BButton>
      </template>
    </BEmptyState>

    <template v-else>
      <SectionCard title="Resumo">
        <dl class="detail__grid">
          <div>
            <dt>Status</dt>
            <dd>
              <BLabel :color="session.status === 'open' ? 'primary' : 'grayLight'">
                {{ session.status === 'open' ? 'Aberto' : 'Fechado' }}
              </BLabel>
            </dd>
          </div>
          <div>
            <dt>Aberto em</dt>
            <dd>{{ formatShopDateTime(session.openedAt) }}</dd>
          </div>
          <div v-if="session.closedAt">
            <dt>Fechado em</dt>
            <dd>{{ formatShopDateTime(session.closedAt) }}</dd>
          </div>
          <div>
            <dt>Abertura</dt>
            <dd>{{ formatMoney(session.openingBalanceCents) }}</dd>
          </div>
          <div v-if="session.expectedBalanceCents != null">
            <dt>Esperado</dt>
            <dd>{{ formatMoney(session.expectedBalanceCents) }}</dd>
          </div>
          <div v-if="session.countedBalanceCents != null">
            <dt>Contado</dt>
            <dd>{{ formatMoney(session.countedBalanceCents) }}</dd>
          </div>
          <div v-if="session.differenceCents != null">
            <dt>Diferença</dt>
            <dd>{{ formatMoney(session.differenceCents) }}</dd>
          </div>
          <div v-if="session.notes" class="detail__span">
            <dt>Observações</dt>
            <dd>{{ session.notes }}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Movimentos">
        <BEmptyState
          v-if="movements.length === 0"
          title="Sem movimentos"
          subtitle="Nada entrou ou saiu nesta sessão."
        />
        <div v-else class="detail__ledger-wrap">
          <table class="detail__ledger">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Forma</th>
                <th>Valor líquido</th>
                <th>Desconto</th>
                <th>Motivo</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in movements" :key="row.id">
                <td>{{ formatShopDateTime(row.createdAt) }}</td>
                <td>
                  <BLabel :color="row.type === 'in' ? 'success' : 'warning'">
                    {{ MOVEMENT_TYPE_LABELS[row.type] }}
                  </BLabel>
                </td>
                <td>{{ MOVEMENT_SOURCE_LABELS[row.source] }}</td>
                <td>{{ PAYMENT_METHOD_LABELS[row.method] }}</td>
                <td>{{ formatMoney(row.amountCents) }}</td>
                <td>{{ row.discountCents ? formatMoney(row.discountCents) : '—' }}</td>
                <td>
                  {{ row.discountReason ? DISCOUNT_REASON_LABELS[row.discountReason] : '—' }}
                </td>
                <td>{{ row.description || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.detail__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detail__grid {
  display: grid;
  gap: 1rem;
  margin: 0;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .detail__grid {
    grid-template-columns: 1fr 1fr;
  }

  .detail__span {
    grid-column: 1 / -1;
  }
}

.detail__grid dt {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.detail__grid dd {
  margin: 0;
  white-space: pre-wrap;
}

.detail__ledger-wrap {
  overflow-x: auto;
}

.detail__ledger {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.detail__ledger th,
.detail__ledger td {
  padding: 0.65rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.detail__ledger th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}
</style>
