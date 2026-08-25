<script setup lang="ts">
import {
  BButton,
  BCard,
  BCheckbox,
  BEmptyState,
  BInput,
  BInputArea,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listCommissionAdvances, recordCommissionAdvance } from '@/api/commissions';
import type { PaymentMethod } from '@/api/types';
import CommissionsTabs from '@/components/commissions/CommissionsTabs.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { usePermission } from '@/composables/usePermission';
import { fieldErrorsFromZod, recordAdvanceSchema } from '@/features/commissions/schemas';
import { PAYMENT_METHOD_FORM_OPTIONS } from '@/features/payments/method-labels';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import {
  formatShopDateTime,
  shopDayEndUtcIso,
  shopDayStartUtcIso,
  shopToday,
} from '@/lib/shop-time';
import { useCashRegisterStore } from '@/stores/cash-register';

const PAGE_SIZE = 50;

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();
const { hasRole } = usePermission();
const { barberName, barberOptions, barberFilterOptions } = useBarberNames();

const isStaff = computed(() => hasRole('ADMIN', 'MANAGER'));
const isBarber = computed(() => hasRole('BARBER'));

onMounted(() => {
  void cash.refresh();
});

function defaultFrom(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 30 }).toISODate()!;
}

const from = computed({
  get: () => (typeof route.query.from === 'string' ? route.query.from : defaultFrom()),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, from: value || undefined, offset: undefined } });
  },
});

const to = computed({
  get: () => (typeof route.query.to === 'string' ? route.query.to : shopToday()),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, to: value || undefined, offset: undefined } });
  },
});

const barberId = computed({
  get: () => (typeof route.query.barberId === 'string' ? route.query.barberId : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, barberId: value ? String(value) : undefined, offset: undefined },
    });
  },
});

const unassignedOnly = computed({
  get: () => route.query.unassigned === 'true',
  set: (value: boolean) => {
    void router.replace({
      query: { ...route.query, unassigned: value ? 'true' : undefined, offset: undefined },
    });
  },
});

const offset = computed(() => {
  const raw = typeof route.query.offset === 'string' ? Number(route.query.offset) : 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const rangeError = computed(() => {
  const start = DateTime.fromISO(from.value);
  const end = DateTime.fromISO(to.value);
  if (!start.isValid || !end.isValid) return 'Informe datas válidas.';
  if (end < start) return 'A data final deve ser depois da inicial.';
  return null;
});

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'commission-advances',
        {
          from: from.value,
          to: to.value,
          barberId: barberId.value || undefined,
          unassigned: unassignedOnly.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listCommissionAdvances({
      from: shopDayStartUtcIso(from.value),
      to: shopDayEndUtcIso(to.value),
      barberId: barberId.value || undefined,
      unassigned: unassignedOnly.value ? true : undefined,
      limit: PAGE_SIZE,
      offset: offset.value,
    }),
  enabled: computed(() => !rangeError.value),
});

// `isLoading`, not `isPending`: the query is disabled while the range is invalid,
// and a disabled query stays pending forever, so the skeleton would never leave.
const { isLoading: listLoading, isError: listFailed } = listQuery;

const rows = computed(() => listQuery.data.value?.data ?? []);
const total = computed(() => listQuery.data.value?.meta.total ?? 0);
const canPrev = computed(() => offset.value > 0);
const canNext = computed(() => offset.value + PAGE_SIZE < total.value);

function setOffset(next: number): void {
  void router.replace({
    query: { ...route.query, offset: next > 0 ? String(next) : undefined },
  });
}

const form = reactive({
  barberId: '',
  amountText: '',
  paymentMethod: 'cash' as string,
  notes: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

const cashBlocked = computed(
  () => form.paymentMethod === 'cash' && cash.status === 'closed',
);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  if (cashBlocked.value) {
    formError.value = 'Abra o caixa para adiantar em dinheiro.';
    return;
  }

  const parsed = recordAdvanceSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await recordCommissionAdvance({
      barberId: parsed.data.barberId,
      amountCents: parsed.data.amountText,
      paymentMethod: parsed.data.paymentMethod as PaymentMethod,
      notes: parsed.data.notes === '' ? null : parsed.data.notes,
    });
    toast.add({ message: 'Vale registrado.', severity: 'success' });
    form.amountText = '';
    form.notes = '';
    await queryClient.invalidateQueries({ queryKey: ['commission-advances'] });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await cash.refresh();
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
    title="Comissões"
    subtitle="Vales são descontados no fechamento do período. Adiantar mais do que o barbeiro ganhou é permitido."
  >
    <CommissionsTabs />

    <BCard class="advances__filters">
      <div class="advances__filters-row">
        <label class="advances__field">
          <span>De</span>
          <input v-model="from" type="date" class="advances__date" />
        </label>
        <label class="advances__field">
          <span>Até</span>
          <input v-model="to" type="date" class="advances__date" />
        </label>
        <BSelect
          v-if="isStaff"
          v-model="barberId"
          label="Barbeiro"
          :options="barberFilterOptions"
        />
        <BCheckbox v-model="unassignedOnly" label="Só não fechados" />
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="advances__error">
        {{ rangeError }}
      </BText>
    </BCard>

    <BSkeletonLoader v-if="!rangeError && listLoading" height="200px" />

    <BEmptyState v-else-if="rangeError" title="Ajuste o período" :subtitle="rangeError" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum vale"
      subtitle="Não há adiantamentos neste filtro."
    />

    <template v-else>
      <BCard padding="0" class="advances__table-card">
        <div class="advances__table-wrap">
          <table class="advances__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th v-if="!isBarber">Barbeiro</th>
                <th>Valor</th>
                <th>Observação</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatShopDateTime(row.createdAt) }}</td>
                <td v-if="!isBarber">{{ barberName(row.barberId) }}</td>
                <td>{{ formatMoney(row.amountCents) }}</td>
                <td>{{ row.notes || '—' }}</td>
                <td>
                  <RouterLink v-if="row.periodId" :to="`/commissions/periods/${row.periodId}`">
                    <BLabel color="success">Fechado</BLabel>
                  </RouterLink>
                  <BLabel v-else color="warning">Em aberto</BLabel>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="advances__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="advances__pager-actions">
          <BButton
            size="small"
            variant="outline"
            color="neutral"
            :is-disabled="!canPrev"
            @click="setOffset(Math.max(0, offset - PAGE_SIZE))"
          >
            Anterior
          </BButton>
          <BButton
            size="small"
            variant="outline"
            color="neutral"
            :is-disabled="!canNext"
            @click="setOffset(offset + PAGE_SIZE)"
          >
            Próxima
          </BButton>
        </div>
      </div>
    </template>

    <form v-if="isStaff" class="advances__form" @submit.prevent="onSubmit">
      <SectionCard title="Novo vale" subtitle="Em dinheiro, sai do caixa na hora.">
        <div class="advances__fields">
          <div class="advances__row">
            <BSelect
              v-model="form.barberId"
              label="Barbeiro"
              label-prepend-asterisk
              :options="barberOptions"
              :helper-text="fieldErrors.barberId"
            />
            <BInput
              v-model="form.amountText"
              label="Valor"
              label-prepend-asterisk
              placeholder="0,00"
              :helper-text="fieldErrors.amountText"
            />
            <BSelect
              v-model="form.paymentMethod"
              label="Forma"
              :options="PAYMENT_METHOD_FORM_OPTIONS"
              :helper-text="fieldErrors.paymentMethod"
            />
          </div>
          <BInputArea
            v-model="form.notes"
            label="Observação"
            rows="2"
            :helper-text="fieldErrors.notes"
          />
        </div>
        <BText v-if="cashBlocked" as="p" variant="body-3" class="advances__error">
          Abra o caixa para adiantar em dinheiro.
        </BText>
        <BText v-if="formError" as="p" variant="body-2" class="advances__error">
          {{ formError }}
        </BText>
        <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
          Registrar vale
        </BButton>
      </SectionCard>
    </form>
  </PageLayout>
</template>

<style scoped>
.advances__filters {
  margin-bottom: 1rem;
}

.advances__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .advances__filters-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: end;
  }
}

.advances__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.advances__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-border-neutral-primary, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-primary, #fff);
  color: inherit;
  font: inherit;
}

.advances__error {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  color: var(--b-fg-danger-primary, #b42318);
}

.advances__table-card {
  overflow: hidden;
}

.advances__table-wrap {
  overflow-x: auto;
}

.advances__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.advances__table th,
.advances__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.advances__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.advances__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.advances__pager-actions {
  display: flex;
  gap: 0.5rem;
}

.advances__form {
  margin-top: 1rem;
}

.advances__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.advances__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .advances__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}
</style>
