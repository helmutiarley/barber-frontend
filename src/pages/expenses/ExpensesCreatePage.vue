<script setup lang="ts">
import {
  BButton,
  BCheckbox,
  BInput,
  BSelect,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQueryClient } from '@tanstack/vue-query';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createExpense } from '@/api/expenses';
import type { ExpenseCategory, ExpenseKind, PaymentMethod } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  EXPENSE_CATEGORY_FORM_OPTIONS,
  EXPENSE_KIND_FORM_OPTIONS,
} from '@/features/expenses/labels';
import { createExpenseSchema, fieldErrorsFromZod } from '@/features/expenses/schemas';
import { PAYMENT_METHOD_FORM_OPTIONS } from '@/features/payments/method-labels';
import { ApiError, messageForApiError } from '@/lib/errors';
import { useCashRegisterStore } from '@/stores/cash-register';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();

onMounted(() => {
  void cash.refresh();
});

const form = reactive({
  description: '',
  category: 'other' as string,
  kind: 'variable' as string,
  amountText: '',
  dueDate: '',
  recurring: false,
  payNow: false,
  paymentMethod: 'pix' as string,
});

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

const cashBlocked = computed(
  () => form.payNow && form.paymentMethod === 'cash' && cash.status === 'closed',
);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  if (cashBlocked.value) {
    formError.value = 'Abra o caixa para pagar em dinheiro.';
    return;
  }

  const parsed = createExpenseSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const created = await createExpense({
      description: parsed.data.description,
      category: parsed.data.category as ExpenseCategory,
      kind: parsed.data.kind as ExpenseKind,
      amountCents: parsed.data.amountText,
      dueDate: parsed.data.dueDate === '' ? null : parsed.data.dueDate,
      recurring: parsed.data.recurring,
      ...(parsed.data.payNow
        ? { paymentMethod: parsed.data.paymentMethod as PaymentMethod }
        : {}),
    });
    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    if (parsed.data.payNow) {
      await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      await cash.refresh();
    }
    toast.add({
      message: parsed.data.payNow ? 'Despesa criada e paga.' : 'Despesa criada.',
      severity: 'success',
    });
    await router.push(`/expenses/${created.id}`);
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível criar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Crie pendente para pagar depois, ou pague na hora.">
    <template #title>
      <div class="expense-new__title">
        <PageBackLink to="/expenses" label="Despesas" />
        <BText as="h1" variant="heading-1">Nova despesa</BText>
      </div>
    </template>

    <form @submit.prevent="onSubmit">
      <SectionCard title="Dados da despesa">
        <div class="expense-new__fields">
          <BInput
            v-model="form.description"
            label="Descrição"
            label-prepend-asterisk
            placeholder="Aluguel de agosto"
            :helper-text="fieldErrors.description"
          />
          <div class="expense-new__row">
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
              :helper-text="fieldErrors.kind"
            />
          </div>
          <div class="expense-new__row">
            <BInput
              v-model="form.amountText"
              label="Valor"
              label-prepend-asterisk
              placeholder="0,00"
              :helper-text="fieldErrors.amountText"
            />
            <label class="expense-new__field">
              <span>Vencimento</span>
              <input v-model="form.dueDate" type="date" class="expense-new__date" />
              <span v-if="fieldErrors.dueDate" class="expense-new__field-error">
                {{ fieldErrors.dueDate }}
              </span>
            </label>
          </div>
          <BCheckbox v-model="form.recurring" label="Recorrente (só marcação, nada é gerado)" />
        </div>
      </SectionCard>

      <SectionCard
        title="Pagar agora"
        subtitle="Sem marcar, a despesa fica pendente em contas a pagar."
        class="expense-new__pay"
      >
        <div class="expense-new__fields">
          <BCheckbox v-model="form.payNow" label="Marcar como paga" />
          <BSelect
            v-if="form.payNow"
            v-model="form.paymentMethod"
            label="Forma"
            :options="PAYMENT_METHOD_FORM_OPTIONS"
            :helper-text="fieldErrors.paymentMethod"
          />
          <BText v-if="cashBlocked" as="p" variant="body-3" class="expense-new__error">
            Abra o caixa para pagar em dinheiro.
          </BText>
        </div>
      </SectionCard>

      <BText v-if="formError" as="p" variant="body-2" class="expense-new__error">
        {{ formError }}
      </BText>

      <div class="expense-new__actions">
        <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
          Criar despesa
        </BButton>
        <BButton variant="outline" color="neutral" @click="router.push('/expenses')">
          Cancelar
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.expense-new__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.expense-new__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.expense-new__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .expense-new__row {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.expense-new__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.expense-new__date {
  min-height: 2.75rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-border-neutral-primary, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-primary, #fff);
  color: inherit;
  font: inherit;
}

.expense-new__field-error,
.expense-new__error {
  color: var(--b-fg-danger-primary, #b42318);
}

.expense-new__pay {
  margin-top: 1rem;
}

.expense-new__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
