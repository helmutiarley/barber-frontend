<script setup lang="ts">
import {
  BButton,
  BEmptyState,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCommissionStatement, payCommissionPeriod } from '@/api/commissions';
import type { PaymentMethod } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { fieldErrorsFromZod, payPeriodSchema } from '@/features/commissions/schemas';
import { PAYMENT_METHOD_FORM_OPTIONS } from '@/features/payments/method-labels';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { useCashRegisterStore } from '@/stores/cash-register';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();
const { barberName } = useBarberNames();

const id = computed(() => String(route.params.id));

onMounted(() => {
  void cash.refresh();
});

const statementQuery = useQuery({
  queryKey: computed(() => ['commission-periods', id.value] as const),
  queryFn: () => getCommissionStatement(id.value),
});

const { isPending: statementPending, isError: statementFailed } = statementQuery;

const period = computed(() => statementQuery.data.value?.period ?? null);
const alreadyPaid = computed(() => period.value?.status === 'paid');

const form = reactive({ paymentMethod: 'cash' as string });
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

/**
 * Only cash touches the drawer, and only when there is something to hand over —
 * a zero or negative balance still marks the period paid.
 */
const movesCash = computed(
  () => form.paymentMethod === 'cash' && (period.value?.totalDueCents ?? 0) > 0,
);
const cashBlocked = computed(() => movesCash.value && cash.status === 'closed');

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  if (cashBlocked.value) {
    formError.value = 'Abra o caixa para pagar em dinheiro.';
    return;
  }

  const parsed = payPeriodSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await payCommissionPeriod(id.value, parsed.data.paymentMethod as PaymentMethod);
    toast.add({ message: 'Período pago.', severity: 'success' });
    await queryClient.invalidateQueries({ queryKey: ['commission-periods'] });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await cash.refresh();
    await router.push(`/commissions/periods/${id.value}`);
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível pagar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Só dinheiro mexe no caixa; as outras formas apenas registram o acerto.">
    <template #title>
      <div class="pay__title">
        <PageBackLink :to="`/commissions/periods/${id}`" label="Extrato" />
        <BText as="h1" variant="heading-1">Pagar período</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="statementPending" height="200px" />

    <BEmptyState
      v-else-if="statementFailed || !period"
      title="Período indisponível"
      subtitle="Ele não existe ou não pode ser pago."
    />

    <BEmptyState
      v-else-if="alreadyPaid"
      title="Período já pago"
      subtitle="Um acerto só acontece uma vez."
    >
      <template #actions>
        <BButton
          variant="outline"
          color="neutral"
          @click="router.push(`/commissions/periods/${id}`)"
        >
          Ver extrato
        </BButton>
      </template>
    </BEmptyState>

    <form v-else @submit.prevent="onSubmit">
      <SectionCard :title="barberName(period.barberId)">
        <BText as="p" variant="body-2" class="pay__due">
          A pagar: <strong>{{ formatMoney(period.totalDueCents) }}</strong>
        </BText>
        <BText
          v-if="period.totalDueCents <= 0"
          as="p"
          variant="body-3"
          color="b-fg-neutral-secondary"
          class="pay__hint"
        >
          Nada sai do caixa, mas o período precisa ser marcado como pago para não ficar aberto para
          sempre.
        </BText>

        <BSelect
          v-model="form.paymentMethod"
          label="Forma"
          :options="PAYMENT_METHOD_FORM_OPTIONS"
          :helper-text="fieldErrors.paymentMethod"
        />

        <BText v-if="cashBlocked" as="p" variant="body-3" class="pay__error">
          Abra o caixa para pagar em dinheiro.
        </BText>
        <BText v-if="formError" as="p" variant="body-2" class="pay__error">
          {{ formError }}
        </BText>

        <div class="pay__actions">
          <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
            Confirmar pagamento
          </BButton>
          <BButton
            variant="outline"
            color="neutral"
            @click="router.push(`/commissions/periods/${id}`)"
          >
            Cancelar
          </BButton>
        </div>
      </SectionCard>
    </form>
  </PageLayout>
</template>

<style scoped>
.pay__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pay__due {
  margin-bottom: 0.35rem;
}

.pay__hint {
  margin-bottom: 0.75rem;
}

.pay__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-primary, #b42318);
}

.pay__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
