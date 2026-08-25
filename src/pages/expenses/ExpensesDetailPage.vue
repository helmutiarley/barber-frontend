<script setup lang="ts">
import {
  BButton,
  BCheckbox,
  BDialog,
  BEmptyState,
  BInput,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deleteExpense, getExpense, payExpense, updateExpense } from '@/api/expenses';
import type { ExpenseCategory, ExpenseKind, PaymentMethod } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { usePermission } from '@/composables/usePermission';
import {
  EXPENSE_CATEGORY_FORM_OPTIONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_KIND_FORM_OPTIONS,
  EXPENSE_KIND_LABELS,
} from '@/features/expenses/labels';
import {
  centsToMoneyInput,
  fieldErrorsFromZod,
  payExpenseSchema,
  updateExpenseSchema,
  updatePaidExpenseSchema,
} from '@/features/expenses/schemas';
import {
  PAYMENT_METHOD_FORM_OPTIONS,
  PAYMENT_METHOD_LABELS,
} from '@/features/payments/method-labels';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime } from '@/lib/shop-time';
import { useCashRegisterStore } from '@/stores/cash-register';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();
const { hasRole } = usePermission();

const id = computed(() => String(route.params.id));
const isAdmin = computed(() => hasRole('ADMIN'));

onMounted(() => {
  void cash.refresh();
});

const expenseQuery = useQuery({
  queryKey: computed(() => ['expenses', id.value] as const),
  queryFn: () => getExpense(id.value),
});

const { isPending: expensePending, isError: expenseFailed } = expenseQuery;

const expense = computed(() => expenseQuery.data.value ?? null);
const isPaid = computed(() => Boolean(expense.value?.paidAt));

const form = reactive({
  description: '',
  category: 'other' as string,
  kind: 'variable' as string,
  amountText: '',
  dueDate: '',
  recurring: false,
});

watch(
  expense,
  (next) => {
    if (!next) return;
    form.description = next.description;
    form.category = next.category;
    form.kind = next.kind;
    form.amountText = centsToMoneyInput(next.amountCents);
    form.dueDate = next.dueDate ?? '';
    form.recurring = next.recurring;
  },
  { immediate: true },
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  // A paid expense is financial history: the API answers CONFLICT for anything
  // beyond description and category, so the form never offers to send it.
  if (isPaid.value) {
    const parsed = updatePaidExpenseSchema.safeParse(form);
    if (!parsed.success) {
      fieldErrors.value = fieldErrorsFromZod(parsed.error);
      return;
    }
    await save({
      description: parsed.data.description,
      category: parsed.data.category as ExpenseCategory,
    });
    return;
  }

  const parsed = updateExpenseSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  await save({
    description: parsed.data.description,
    category: parsed.data.category as ExpenseCategory,
    kind: parsed.data.kind as ExpenseKind,
    amountCents: parsed.data.amountText,
    dueDate: parsed.data.dueDate === '' ? null : parsed.data.dueDate,
    recurring: parsed.data.recurring,
  });
}

async function save(body: Parameters<typeof updateExpense>[1]): Promise<void> {
  pending.value = true;
  try {
    await updateExpense(id.value, body);
    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    toast.add({ message: 'Despesa atualizada.', severity: 'success' });
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}

const payOpen = ref(false);
const payForm = reactive({ paymentMethod: 'pix' as string });
const payErrors = ref<Record<string, string>>({});
const payPending = ref(false);

const payCashBlocked = computed(
  () => payForm.paymentMethod === 'cash' && cash.status === 'closed',
);

function openPay(): void {
  payForm.paymentMethod = 'pix';
  payErrors.value = {};
  payOpen.value = true;
}

async function submitPay(): Promise<void> {
  payErrors.value = {};
  if (payCashBlocked.value) {
    payErrors.value = { paymentMethod: 'Abra o caixa para pagar em dinheiro.' };
    return;
  }

  const parsed = payExpenseSchema.safeParse(payForm);
  if (!parsed.success) {
    payErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  payPending.value = true;
  try {
    await payExpense(id.value, { paymentMethod: parsed.data.paymentMethod as PaymentMethod });
    toast.add({ message: 'Despesa paga.', severity: 'success' });
    payOpen.value = false;
    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await cash.refresh();
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Não foi possível pagar.',
      severity: 'failure',
    });
  } finally {
    payPending.value = false;
  }
}

const deleteOpen = ref(false);
const deletePending = ref(false);

async function confirmDelete(): Promise<void> {
  deletePending.value = true;
  try {
    await deleteExpense(id.value);
    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    toast.add({ message: 'Despesa excluída.', severity: 'success' });
    await router.push('/expenses');
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Não foi possível excluir.',
      severity: 'failure',
    });
  } finally {
    deletePending.value = false;
    deleteOpen.value = false;
  }
}

function formatDueDate(value: string | null): string {
  if (!value) return '—';
  const date = DateTime.fromISO(value);
  return date.isValid ? date.toFormat('dd/MM/yyyy') : value;
}
</script>

<template>
  <PageLayout>
    <template #title>
      <div class="expense__title">
        <PageBackLink to="/expenses" label="Despesas" />
        <BText as="h1" variant="heading-1">
          {{ expense?.description ?? 'Despesa' }}
        </BText>
      </div>
    </template>

    <template v-if="expense" #header-actions>
      <BButton v-if="!isPaid" color="neutral" variant="contain" @click="openPay">Pagar</BButton>
      <BButton
        v-if="!isPaid && isAdmin"
        color="danger"
        variant="outline"
        @click="deleteOpen = true"
      >
        Excluir
      </BButton>
    </template>

    <BSkeletonLoader v-if="expensePending" height="280px" />

    <BEmptyState
      v-else-if="expenseFailed || !expense"
      title="Despesa não encontrada"
      subtitle="Ela pode ter sido excluída."
    />

    <template v-else>
      <SectionCard title="Resumo">
        <dl class="expense__summary">
          <div>
            <dt>Valor</dt>
            <dd>{{ formatMoney(expense.amountCents) }}</dd>
          </div>
          <div>
            <dt>Categoria</dt>
            <dd>{{ EXPENSE_CATEGORY_LABELS[expense.category] }}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{{ EXPENSE_KIND_LABELS[expense.kind] }}</dd>
          </div>
          <div>
            <dt>Vencimento</dt>
            <dd>{{ formatDueDate(expense.dueDate) }}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd class="expense__status">
              <BLabel v-if="expense.paidAt" color="success">Paga</BLabel>
              <BLabel v-else-if="expense.overdue" color="danger">Vencida</BLabel>
              <BLabel v-else color="warning">Pendente</BLabel>
              <BLabel v-if="expense.recurring" color="grayLight">Recorrente</BLabel>
            </dd>
          </div>
          <div v-if="expense.paidAt">
            <dt>Pago em</dt>
            <dd>
              {{ formatShopDateTime(expense.paidAt) }}
              <template v-if="expense.paymentMethod">
                · {{ PAYMENT_METHOD_LABELS[expense.paymentMethod] }}
              </template>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <form class="expense__form" @submit.prevent="onSubmit">
        <SectionCard
          title="Editar"
          :subtitle="
            isPaid
              ? 'Despesa paga é histórico financeiro: só descrição e categoria mudam.'
              : 'Enquanto pendente, tudo pode ser corrigido.'
          "
        >
          <div class="expense__fields">
            <BInput
              v-model="form.description"
              label="Descrição"
              label-prepend-asterisk
              :helper-text="fieldErrors.description"
            />
            <div class="expense__row">
              <BSelect
                v-model="form.category"
                label="Categoria"
                :options="EXPENSE_CATEGORY_FORM_OPTIONS"
                :helper-text="fieldErrors.category"
              />
              <BSelect
                v-model="form.kind"
                label="Tipo"
                :options="EXPENSE_KIND_FORM_OPTIONS"
                :is-disabled="isPaid"
                :helper-text="fieldErrors.kind"
              />
            </div>
            <div class="expense__row">
              <BInput
                v-model="form.amountText"
                label="Valor"
                label-prepend-asterisk
                :is-disabled="isPaid"
                :helper-text="fieldErrors.amountText"
              />
              <label class="expense__field">
                <span>Vencimento</span>
                <input
                  v-model="form.dueDate"
                  type="date"
                  class="expense__date"
                  :disabled="isPaid"
                />
              </label>
            </div>
            <BCheckbox v-model="form.recurring" label="Recorrente" :disabled="isPaid" />
          </div>

          <BText v-if="formError" as="p" variant="body-2" class="expense__error">
            {{ formError }}
          </BText>

          <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
            Salvar
          </BButton>
        </SectionCard>
      </form>
    </template>

    <BDialog
      :is-open="payOpen"
      title-text="Pagar despesa?"
      width="420px"
      @update:is-open="(open: boolean) => (payOpen = open)"
    >
      <p v-if="expense">
        Registrar o pagamento de {{ formatMoney(expense.amountCents) }}.
      </p>
      <BSelect
        v-model="payForm.paymentMethod"
        label="Forma"
        :options="PAYMENT_METHOD_FORM_OPTIONS"
        :helper-text="payErrors.paymentMethod"
      />
      <BText v-if="payCashBlocked" as="p" variant="body-3" class="expense__error">
        Abra o caixa para pagar em dinheiro.
      </BText>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="payOpen = false">Fechar</BButton>
        <BButton
          color="neutral"
          variant="contain"
          :is-loading="payPending"
          @click="submitPay"
        >
          Confirmar pagamento
        </BButton>
      </template>
    </BDialog>

    <BDialog
      :is-open="deleteOpen"
      title-text="Excluir despesa?"
      width="420px"
      @update:is-open="(open: boolean) => (deleteOpen = open)"
    >
      <p>Só despesas pendentes podem ser excluídas. A ação não tem volta.</p>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="deleteOpen = false">Cancelar</BButton>
        <BButton
          color="danger"
          variant="contain"
          :is-loading="deletePending"
          @click="confirmDelete"
        >
          Excluir
        </BButton>
      </template>
    </BDialog>
  </PageLayout>
</template>

<style scoped>
.expense__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.expense__summary {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  margin: 0;
}

@media (min-width: 700px) {
  .expense__summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.expense__summary dt {
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
  margin-bottom: 0.15rem;
}

.expense__summary dd {
  margin: 0;
  font-size: 0.9375rem;
}

.expense__status {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.expense__form {
  margin-top: 1rem;
}

.expense__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.expense__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .expense__row {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.expense__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.expense__date {
  min-height: 2.75rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-border-neutral-primary, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-primary, #fff);
  color: inherit;
  font: inherit;
}

.expense__date:disabled {
  opacity: 0.6;
}

.expense__error {
  color: var(--b-fg-danger-primary, #b42318);
  margin-bottom: 0.75rem;
}
</style>
