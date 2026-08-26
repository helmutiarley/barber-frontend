<script setup lang="ts">
import {
  BButton,
  BEmptyState,
  BInput,
  BInputArea,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { closeSession, getCurrentSession } from '@/api/cash-register';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { closeSessionFormSchema, fieldErrorsFromZod } from '@/features/cash-register/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney, parseMoneyInput } from '@/lib/money';
import { useCashRegisterStore } from '@/stores/cash-register';

const router = useRouter();
const toast = useBToast();
const cash = useCashRegisterStore();

const currentQuery = useQuery({
  queryKey: ['cash-register', 'current'] as const,
  queryFn: () => getCurrentSession(),
});

const { isPending: currentPending } = currentQuery;

const current = computed(() => currentQuery.data.value ?? null);
const expected = computed(() => current.value?.totals.expectedBalanceCents ?? 0);

const form = reactive({
  countedBalanceText: '',
  notes: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

watch(
  current,
  (value) => {
    if (value && !form.countedBalanceText) {
      form.countedBalanceText = (value.totals.expectedBalanceCents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  },
  { immediate: true },
);

const previewDifference = computed(() => {
  try {
    return parseMoneyInput(form.countedBalanceText) - expected.value;
  } catch {
    return null;
  }
});

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = closeSessionFormSchema.safeParse({
    ...form,
    expectedBalanceCents: expected.value,
  });
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await closeSession({
      countedBalanceCents: parsed.data.countedBalanceText,
      notes: parsed.data.notes.trim() || undefined,
    });
    toast.add({ message: 'Caixa fechado.', severity: 'success' });
    await cash.refresh();
    await router.push('/cash-register');
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível fechar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Conte a gaveta. Diferença exige justificativa.">
    <template #title>
      <div class="close__title">
        <PageBackLink to="/cash-register" label="Caixa" />
        <BText as="h1" variant="heading-1">Fechar caixa</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="currentPending" height="160px" />

    <BEmptyState
      v-else-if="!current"
      title="Nenhum caixa aberto"
      subtitle="Não há sessão para fechar."
    >
      <template #actions>
        <RouterLink to="/cash-register/open">
          <BButton color="neutral" variant="contain">Abrir caixa</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <form v-else class="close__form" @submit.prevent="onSubmit">
      <SectionCard title="Resumo">
        <dl class="close__grid">
          <div>
            <dt>Abertura</dt>
            <dd>{{ formatMoney(current.session.openingBalanceCents) }}</dd>
          </div>
          <div>
            <dt>Entradas</dt>
            <dd>{{ formatMoney(current.totals.inCents) }}</dd>
          </div>
          <div>
            <dt>Saídas</dt>
            <dd>{{ formatMoney(current.totals.outCents) }}</dd>
          </div>
          <div>
            <dt>Esperado</dt>
            <dd>
              <BText as="span" variant="body-2-bold">
                {{ formatMoney(current.totals.expectedBalanceCents) }}
              </BText>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Contagem">
        <div class="close__fields">
          <BInput
            v-model="form.countedBalanceText"
            label="Valor contado"
            placeholder="0,00"
            label-prepend-asterisk
            :helper-text="fieldErrors.countedBalanceText"
          />
          <BText
            v-if="previewDifference != null"
            as="p"
            variant="body-2"
            :class="{ 'close__diff--nonzero': previewDifference !== 0 }"
          >
            Diferença: {{ formatMoney(previewDifference) }}
            <template v-if="previewDifference !== 0"> (notas obrigatórias)</template>
          </BText>
          <BInputArea
            v-model="form.notes"
            label="Observações"
            rows="3"
            :label-prepend-asterisk="previewDifference != null && previewDifference !== 0"
            :helper-text="fieldErrors.notes"
          />
        </div>
      </SectionCard>

      <BText v-if="formError" as="p" variant="body-2" class="close__error" role="alert">
        {{ formError }}
      </BText>

      <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
        Fechar caixa
      </BButton>
    </form>
  </PageLayout>
</template>

<style scoped>
.close__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.close__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 36rem;
}

.close__grid {
  display: grid;
  gap: 1rem;
  margin: 0;
  grid-template-columns: 1fr 1fr;
}

.close__grid dt {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.close__grid dd {
  margin: 0;
}

.close__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.close__diff--nonzero {
  color: var(--b-fg-warning-default, #b54708);
  font-weight: 600;
}

.close__error {
  color: var(--b-fg-danger-primary, #b42318);
}
</style>
