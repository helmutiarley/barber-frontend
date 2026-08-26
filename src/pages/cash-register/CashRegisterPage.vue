<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BInput,
  BInputArea,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  createMovement,
  getCurrentSession,
  getSession,
} from '@/api/cash-register';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  MANUAL_MOVEMENT_OPTIONS,
  MOVEMENT_SOURCE_LABELS,
  MOVEMENT_TYPE_LABELS,
  resolveManualKind,
} from '@/features/cash-register/labels';
import { fieldErrorsFromZod, manualMovementSchema } from '@/features/cash-register/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime } from '@/lib/shop-time';
import { useCashRegisterStore } from '@/stores/cash-register';

const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();

const currentQuery = useQuery({
  queryKey: ['cash-register', 'current'] as const,
  queryFn: () => getCurrentSession(),
});

const { isPending: currentPending, isError: currentFailed } = currentQuery;

const current = computed(() => currentQuery.data.value ?? null);
const sessionId = computed(() => current.value?.session.id ?? null);

const detailQuery = useQuery({
  queryKey: computed(() => ['cash-register', 'sessions', sessionId.value] as const),
  queryFn: () => getSession(sessionId.value!),
  enabled: computed(() => Boolean(sessionId.value)),
});

// `isLoading`, not `isPending`: a disabled query stays pending forever, which
// would keep the skeleton up while we wait for the session id.
const { isLoading: detailLoading } = detailQuery;

watch(
  current,
  async (value) => {
    if (value) {
      cash.status = 'open';
      cash.openedAt = value.session.openedAt;
    } else if (currentQuery.isSuccess.value) {
      cash.status = 'closed';
      cash.openedAt = null;
    }
  },
);

const form = reactive({
  kind: 'withdrawal' as string,
  amountText: '',
  description: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

const movements = computed(() => detailQuery.data.value?.movements ?? []);

async function invalidate(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
  await cash.refresh();
}

async function onMovement(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = manualMovementSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  const { type, source } = resolveManualKind(parsed.data.kind);
  pending.value = true;
  try {
    await createMovement({
      type,
      source,
      amountCents: parsed.data.amountText,
      description: parsed.data.description,
    });
    toast.add({ message: 'Movimento registrado.', severity: 'success' });
    form.amountText = '';
    form.description = '';
    await invalidate();
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível registrar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout
    title="Caixa"
    subtitle="Uma gaveta aberta por vez. Pagamentos e despesas em dinheiro passam por aqui."
  >
    <template #header-actions>
      <RouterLink to="/cash-register/sessions">
        <BButton variant="outline" color="neutral">Histórico</BButton>
      </RouterLink>
    </template>

    <BSkeletonLoader v-if="currentPending" height="200px" />

    <BEmptyState
      v-else-if="currentFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="!current"
      title="Caixa fechado"
      subtitle="Abra o caixa para receber em dinheiro e registrar movimentos manuais."
    >
      <template #actions>
        <RouterLink to="/cash-register/open">
          <BButton color="neutral" variant="contain">Abrir caixa</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <template v-else>
      <div class="cash__stats">
        <BCard class="cash__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Abertura</BText>
          <BText as="span" variant="heading-2">
            {{ formatMoney(current.session.openingBalanceCents) }}
          </BText>
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
            {{ formatShopDateTime(current.session.openedAt) }}
          </BText>
        </BCard>
        <BCard class="cash__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Entradas</BText>
          <BText as="span" variant="heading-2">
            {{ formatMoney(current.totals.inCents) }}
          </BText>
        </BCard>
        <BCard class="cash__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Saídas</BText>
          <BText as="span" variant="heading-2">
            {{ formatMoney(current.totals.outCents) }}
          </BText>
        </BCard>
        <BCard class="cash__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Esperado</BText>
          <BText as="span" variant="heading-2">
            {{ formatMoney(current.totals.expectedBalanceCents) }}
          </BText>
        </BCard>
      </div>

      <div class="cash__toolbar">
        <RouterLink to="/cash-register/close">
          <BButton color="neutral" variant="contain">Fechar caixa</BButton>
        </RouterLink>
      </div>

      <form class="cash__movement" @submit.prevent="onMovement">
        <SectionCard title="Movimento manual" subtitle="Só sangria, suprimento e ajuste.">
          <div class="cash__fields">
            <BSelect
              v-model="form.kind"
              label="Tipo"
              :options="MANUAL_MOVEMENT_OPTIONS"
              :helper-text="fieldErrors.kind"
            />
            <BInput
              v-model="form.amountText"
              label="Valor"
              placeholder="0,00"
              label-prepend-asterisk
              :helper-text="fieldErrors.amountText"
            />
            <BInputArea
              v-model="form.description"
              label="Descrição"
              rows="2"
              label-prepend-asterisk
              :helper-text="fieldErrors.description"
            />
          </div>
          <BText v-if="formError" as="p" variant="body-2" class="cash__error">
            {{ formError }}
          </BText>
          <BButton type="submit" color="neutral" variant="outline" :is-loading="pending">
            Registrar movimento
          </BButton>
        </SectionCard>
      </form>

      <SectionCard title="Movimentos desta sessão">
        <BSkeletonLoader v-if="detailLoading" height="120px" />
        <BEmptyState
          v-else-if="movements.length === 0"
          title="Sem movimentos"
          subtitle="Pagamentos em dinheiro e movimentos manuais aparecem aqui."
        />
        <div v-else class="cash__ledger-wrap">
          <table class="cash__ledger">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Valor</th>
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
                <td>{{ formatMoney(row.amountCents) }}</td>
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
.cash__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 1rem;
}

@media (min-width: 900px) {
  .cash__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.cash__stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cash__toolbar {
  margin-bottom: 1rem;
}

.cash__movement {
  margin-bottom: 1rem;
}

.cash__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.cash__error {
  color: var(--b-fg-danger-hover, #b42318);
  margin-bottom: 0.75rem;
}

.cash__ledger-wrap {
  overflow-x: auto;
}

.cash__ledger {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.cash__ledger th,
.cash__ledger td {
  padding: 0.65rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.cash__ledger th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}
</style>
