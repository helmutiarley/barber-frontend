<script setup lang="ts">
import {
  BButton,
  BEmptyState,
  BInput,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { getAppointment } from '@/api/appointments';
import { activePaidCents, listAppointmentPayments, recordPayments } from '@/api/payments';
import type { PaymentMethod } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { previewCardFeeCents, previewNetCents } from '@/features/payments/fees';
import { PAYMENT_METHOD_FORM_OPTIONS } from '@/features/payments/method-labels';
import { fieldErrorsFromZod, recordPaymentsFormSchema } from '@/features/payments/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney, parseMoneyInput } from '@/lib/money';
import { useCashRegisterStore } from '@/stores/cash-register';

type Line = { method: PaymentMethod; amountText: string };

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();

const id = computed(() => String(route.params.id));

onMounted(() => {
  void cash.refresh();
});

const appointmentQuery = useQuery({
  queryKey: computed(() => ['appointments', id.value] as const),
  queryFn: () => getAppointment(id.value),
});

const { isPending: appointmentPending, isError: appointmentFailed } = appointmentQuery;

const paymentsQuery = useQuery({
  queryKey: computed(() => ['appointments', id.value, 'payments'] as const),
  queryFn: () => listAppointmentPayments(id.value),
});

const { isPending: paymentsPending } = paymentsQuery;

const appointment = computed(() => appointmentQuery.data.value);
const alreadyPaid = computed(() => activePaidCents(paymentsQuery.data.value ?? []));
const remaining = computed(() =>
  appointment.value ? Math.max(0, appointment.value.priceCents - alreadyPaid.value) : 0,
);

const canPayStatus = computed(() => {
  const status = appointment.value?.status;
  return status === 'confirmed' || status === 'completed';
});

const lines = ref<Line[]>([{ method: 'pix', amountText: '' }]);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});
const pending = ref(false);

function lineCents(line: Line): number | null {
  try {
    const cents = parseMoneyInput(line.amountText);
    return cents > 0 ? cents : null;
  } catch {
    return null;
  }
}

const previewTotalCents = computed(() => {
  let sum = 0;
  let any = false;
  for (const line of lines.value) {
    const cents = lineCents(line);
    if (cents == null) continue;
    any = true;
    sum += cents;
  }
  return any ? sum : null;
});

const drawerClosed = computed(() => cash.status === 'closed');

function addLine(): void {
  if (lines.value.length >= 4) return;
  lines.value.push({ method: 'pix', amountText: '' });
}

function removeLine(index: number): void {
  if (lines.value.length <= 1) return;
  lines.value.splice(index, 1);
}

function fillRemaining(index: number): void {
  let others = 0;
  lines.value.forEach((line, i) => {
    if (i === index) return;
    const cents = lineCents(line);
    if (cents != null) others += cents;
  });
  const left = Math.max(0, remaining.value - others);
  lines.value[index]!.amountText = (left / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  if (!canPayStatus.value) {
    formError.value = 'Só é possível receber horários confirmados ou concluídos.';
    return;
  }

  if (drawerClosed.value) {
    formError.value = 'Abra o caixa para receber pagamentos.';
    return;
  }

  const parsed = recordPaymentsFormSchema.safeParse({ lines: lines.value });
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'lines' && typeof issue.path[1] === 'number') {
        const key = `lines.${issue.path[1]}.${String(issue.path[2] ?? 'amountText')}`;
        if (!fieldErrors.value[key]) fieldErrors.value[key] = issue.message;
      }
    }
    return;
  }

  const batchCents = parsed.data.lines.reduce((sum, line) => sum + line.amountText, 0);
  if (batchCents > remaining.value) {
    formError.value = `O total (${formatMoney(batchCents)}) passa do saldo restante (${formatMoney(remaining.value)}).`;
    return;
  }

  pending.value = true;
  try {
    await recordPayments(
      id.value,
      parsed.data.lines.map((line) => ({
        amountCents: line.amountText,
        method: line.method,
      })),
    );
    toast.add({ message: 'Pagamento registrado.', severity: 'success' });
    await queryClient.invalidateQueries({ queryKey: ['appointments', id.value, 'payments'] });
    await queryClient.invalidateQueries({ queryKey: ['payments'] });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await cash.refresh();
    await router.push(`/appointments/${id.value}`);
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
  <PageLayout subtitle="Parcelas em até 4 formas. O total não pode passar do valor do horário.">
    <template #title>
      <div class="pay__title">
        <PageBackLink :to="`/appointments/${id}`" label="Horário" />
        <BText as="h1" variant="heading-1">Receber</BText>
      </div>
    </template>

    <BSkeletonLoader
      v-if="appointmentPending || paymentsPending"
      height="200px"
    />

    <BEmptyState
      v-else-if="appointmentFailed"
      title="Horário não encontrado"
      subtitle="Volte e tente de novo."
    />

    <template v-else-if="appointment">
      <SectionCard title="Saldo">
        <dl class="pay__balance">
          <div>
            <dt>Valor do horário</dt>
            <dd>{{ formatMoney(appointment.priceCents) }}</dd>
          </div>
          <div>
            <dt>Já pago</dt>
            <dd>{{ formatMoney(alreadyPaid) }}</dd>
          </div>
          <div>
            <dt>Restante</dt>
            <dd>
              <BText as="span" variant="body-2-bold">{{ formatMoney(remaining) }}</BText>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <BEmptyState
        v-if="!canPayStatus"
        title="Não dá para receber"
        subtitle="Confirme ou conclua o horário antes de registrar pagamento."
      />

      <BEmptyState
        v-else-if="remaining === 0"
        title="Já está quitado"
        subtitle="Não há saldo restante neste horário."
      />

      <BEmptyState
        v-else-if="drawerClosed"
        title="Caixa fechado"
        subtitle="Todo recebimento entra na sessão de caixa do dia. Abra o caixa para registrar."
      >
        <template #actions>
          <RouterLink to="/cash-register/open">
            <BButton color="neutral" variant="contain">Abrir caixa</BButton>
          </RouterLink>
        </template>
      </BEmptyState>

      <form v-else class="pay__form" @submit.prevent="onSubmit">
        <SectionCard title="Pagamentos">
          <div v-for="(line, index) in lines" :key="index" class="pay__line">
            <BSelect v-model="line.method" label="Forma" :options="PAYMENT_METHOD_FORM_OPTIONS" />
            <BInput
              v-model="line.amountText"
              label="Valor"
              placeholder="0,00"
              label-prepend-asterisk
              :helper-text="fieldErrors[`lines.${index}.amountText`]"
            />
            <div class="pay__line-actions">
              <BButton
                type="button"
                size="small"
                variant="outline"
                color="neutral"
                @click="fillRemaining(index)"
              >
                Restante
              </BButton>
              <BButton
                type="button"
                size="small"
                variant="outline"
                color="neutral"
                :is-disabled="lines.length <= 1"
                @click="removeLine(index)"
              >
                Remover
              </BButton>
            </div>
            <BText
              v-if="
                (line.method === 'debit' || line.method === 'credit') && lineCents(line) != null
              "
              as="p"
              variant="body-3"
              color="b-fg-neutral-secondary"
              class="pay__fee-hint"
            >
              Prévia taxa {{ formatMoney(previewCardFeeCents(line.method, lineCents(line)!)) }}
              · líquido {{ formatMoney(previewNetCents(line.method, lineCents(line)!)) }}
              (servidor confirma)
            </BText>
          </div>

          <BButton
            type="button"
            variant="outline"
            color="neutral"
            :is-disabled="lines.length >= 4"
            @click="addLine"
          >
            Adicionar forma
          </BButton>
        </SectionCard>

        <BText v-if="formError" as="p" variant="body-2" class="pay__error" role="alert">
          {{ formError }}
        </BText>

        <div class="pay__submit">
          <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
            Registrar
            <template v-if="previewTotalCents != null">
              · {{ formatMoney(previewTotalCents) }}
            </template>
          </BButton>
        </div>
      </form>
    </template>
  </PageLayout>
</template>

<style scoped>
.pay__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pay__balance {
  display: grid;
  gap: 1rem;
  margin: 0;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .pay__balance {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pay__balance dt {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.pay__balance dd {
  margin: 0;
}

.pay__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.pay__line {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
}

@media (min-width: 720px) {
  .pay__line {
    grid-template-columns: 1fr 1fr auto;
    align-items: end;
  }

  .pay__fee-hint {
    grid-column: 1 / -1;
  }
}

.pay__line-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pay__error {
  color: var(--b-fg-danger-hover, #b42318);
}

.pay__submit {
  display: flex;
}
</style>
