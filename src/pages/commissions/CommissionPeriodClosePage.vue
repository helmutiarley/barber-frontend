<script setup lang="ts">
import { BButton, BSelect, BText, useBToast } from '@/ui';
import { useQueryClient } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { closeCommissionPeriod } from '@/api/commissions';
import type { CommissionPeriodDto } from '@/api/types';
import CommissionsTabs from '@/components/commissions/CommissionsTabs.vue';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { closePeriodSchema, fieldErrorsFromZod } from '@/features/commissions/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { shopToday } from '@/lib/shop-time';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const { barberName, barberOptions } = useBarberNames();

const allBarbersOptions = computed(() => [
  { label: 'Todos os barbeiros', value: '' },
  ...barberOptions.value,
]);

/** Last full fortnight, the most common payroll run. */
function defaultStart(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 15 }).toISODate()!;
}

function defaultEnd(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 1 }).toISODate()!;
}

const form = reactive({
  barberId: '',
  startsOn: defaultStart(),
  endsOn: defaultEnd(),
});

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const closed = ref<CommissionPeriodDto[] | null>(null);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};
  closed.value = null;

  const parsed = closePeriodSchema.safeParse({ ...form, today: shopToday() });
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const periods = await closeCommissionPeriod({
      startsOn: parsed.data.startsOn,
      endsOn: parsed.data.endsOn,
      barberId: parsed.data.barberId === '' ? undefined : parsed.data.barberId,
    });
    closed.value = periods;
    await queryClient.invalidateQueries({ queryKey: ['commission-periods'] });
    await queryClient.invalidateQueries({ queryKey: ['commission-entries'] });
    await queryClient.invalidateQueries({ queryKey: ['commission-advances'] });
    toast.add({
      message:
        periods.length === 0
          ? 'Nada a acertar neste intervalo.'
          : `${periods.length} período(s) fechado(s).`,
      severity: 'success',
    });
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
  <PageLayout subtitle="O intervalo é inclusivo nas duas pontas e precisa já ter terminado.">
    <template #title>
      <div class="close__title">
        <PageBackLink to="/commissions/periods" label="Períodos" />
        <BText as="h1" variant="heading-1">Fechar período</BText>
      </div>
    </template>

    <CommissionsTabs />

    <form @submit.prevent="onSubmit">
      <SectionCard
        title="Intervalo"
        subtitle="Sem barbeiro, fecha todo mundo que tem algo a acertar — e um conflito recusa a leva inteira."
      >
        <div class="close__fields">
          <div class="close__row">
            <label class="close__field">
              <span>Início</span>
              <input v-model="form.startsOn" type="date" class="close__date" />
              <span v-if="fieldErrors.startsOn" class="close__field-error">
                {{ fieldErrors.startsOn }}
              </span>
            </label>
            <label class="close__field">
              <span>Fim</span>
              <input v-model="form.endsOn" type="date" class="close__date" />
              <span v-if="fieldErrors.endsOn" class="close__field-error">
                {{ fieldErrors.endsOn }}
              </span>
            </label>
            <BSelect
              v-model="form.barberId"
              label="Barbeiro"
              :options="allBarbersOptions"
              :helper-text="fieldErrors.barberId"
            />
          </div>
        </div>

        <BText v-if="formError" as="p" variant="body-2" class="close__error">
          {{ formError }}
        </BText>

        <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
          Fechar período
        </BButton>
      </SectionCard>
    </form>

    <SectionCard v-if="closed" title="Resultado" class="close__result">
      <BText v-if="closed.length === 0" as="p" variant="body-2">
        Ninguém tinha lançamentos ou vales em aberto neste intervalo, então nenhum período foi
        criado.
      </BText>
      <ul v-else class="close__list">
        <li v-for="period in closed" :key="period.id">
          <RouterLink :to="`/commissions/periods/${period.id}`" class="close__link">
            {{ barberName(period.barberId) }} — {{ formatMoney(period.totalDueCents) }}
          </RouterLink>
        </li>
      </ul>
      <BButton variant="outline" color="neutral" @click="router.push('/commissions/periods')">
        Ver períodos
      </BButton>
    </SectionCard>
  </PageLayout>
</template>

<style scoped>
.close__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.close__fields {
  margin-bottom: 0.75rem;
}

.close__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .close__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}

.close__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.close__date {
  min-height: 2.75rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-stroke-neutral-mid, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-default, #fff);
  color: inherit;
  font: inherit;
}

.close__field-error,
.close__error {
  color: var(--b-fg-danger-hover, #b42318);
}

.close__error {
  margin-bottom: 0.75rem;
}

.close__result {
  margin-top: 1rem;
}

.close__list {
  margin: 0 0 0.75rem;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.close__link {
  color: var(--b-fg-brand-default, #2563eb);
  text-decoration: underline;
}
</style>
