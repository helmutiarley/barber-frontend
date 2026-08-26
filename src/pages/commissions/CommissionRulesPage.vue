<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BInput,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref } from 'vue';
import { listBarbers } from '@/api/barbers';
import {
  createCommissionRule,
  listCommissionRules,
  updateCommissionRule,
} from '@/api/commissions';
import { listServices } from '@/api/services';
import type { CommissionAppliesTo, CommissionBase, CommissionRuleDto } from '@/api/types';
import CommissionsTabs from '@/components/commissions/CommissionsTabs.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { usePermission } from '@/composables/usePermission';
import {
  COMMISSION_APPLIES_TO_FORM_OPTIONS,
  COMMISSION_APPLIES_TO_LABELS,
  COMMISSION_BASE_FORM_OPTIONS,
  COMMISSION_BASE_LABELS,
  isShopDefault,
  PRECEDENCE_HINT,
  specificity,
} from '@/features/commissions/labels';
import { formatRate, rateToPercent } from '@/features/commissions/rate';
import {
  createRuleSchema,
  fieldErrorsFromZod,
  updateRuleSchema,
} from '@/features/commissions/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const toast = useBToast();
const queryClient = useQueryClient();
const { hasRole } = usePermission();

const isAdmin = computed(() => hasRole('ADMIN'));

const rulesQuery = useQuery({
  queryKey: ['commission-rules'] as const,
  queryFn: () => listCommissionRules(),
});

const { isPending: rulesPending, isError: rulesFailed } = rulesQuery;

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: true }] as const,
  queryFn: () => listServices({ includeInactive: true }),
});

const rules = computed(() =>
  [...(rulesQuery.data.value ?? [])].sort(
    (a, b) => specificity(b) - specificity(a) || a.appliesTo.localeCompare(b.appliesTo),
  ),
);

const barberOptions = computed(() => [
  { label: 'Todos os barbeiros', value: '' },
  ...(barbersQuery.data.value ?? []).map((barber) => ({
    label: barber.displayName,
    value: barber.id,
  })),
]);

const serviceOptions = computed(() => [
  { label: 'Todos os serviços', value: '' },
  ...(servicesQuery.data.value ?? []).map((service) => ({
    label: service.name,
    value: service.id,
  })),
]);

function barberLabel(id: string | null): string {
  if (!id) return 'Todos';
  const found = (barbersQuery.data.value ?? []).find((barber) => barber.id === id);
  return found?.displayName ?? `${id.slice(0, 8)}…`;
}

function serviceLabel(id: string | null): string {
  if (!id) return 'Todos';
  const found = (servicesQuery.data.value ?? []).find((service) => service.id === id);
  return found?.name ?? `${id.slice(0, 8)}…`;
}

/** Without an active `(*, *)` services rule, completing an appointment can 409. */
const missingShopDefault = computed(
  () =>
    rulesQuery.isSuccess.value &&
    !rules.value.some(
      (rule) => rule.active && rule.appliesTo === 'services' && isShopDefault(rule),
    ),
);

const form = reactive({
  barberId: '',
  serviceId: '',
  ratePercent: '',
  base: 'gross' as string,
  appliesTo: 'services' as string,
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onCreate(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = createRuleSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await createCommissionRule({
      barberId: parsed.data.barberId === '' ? null : parsed.data.barberId,
      serviceId: parsed.data.serviceId === '' ? null : parsed.data.serviceId,
      rate: parsed.data.ratePercent,
      base: parsed.data.base as CommissionBase,
      appliesTo: parsed.data.appliesTo as CommissionAppliesTo,
    });
    await queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    toast.add({ message: 'Regra criada.', severity: 'success' });
    form.ratePercent = '';
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível criar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}

const editing = ref<CommissionRuleDto | null>(null);
const editForm = reactive({ ratePercent: '', base: 'gross' as string });
const editErrors = ref<Record<string, string>>({});
const editPending = ref(false);

function startEdit(rule: CommissionRuleDto): void {
  editing.value = rule;
  editForm.ratePercent = String(rateToPercent(rule.rate));
  editForm.base = rule.base;
  editErrors.value = {};
}

async function saveEdit(): Promise<void> {
  if (!editing.value) return;
  editErrors.value = {};

  const parsed = updateRuleSchema.safeParse(editForm);
  if (!parsed.success) {
    editErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  editPending.value = true;
  try {
    await updateCommissionRule(editing.value.id, {
      rate: parsed.data.ratePercent,
      base: parsed.data.base as CommissionBase,
    });
    await queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    toast.add({ message: 'Regra atualizada. Vale para lançamentos futuros.', severity: 'success' });
    editing.value = null;
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.',
      severity: 'failure',
    });
  } finally {
    editPending.value = false;
  }
}

const togglingId = ref<string | null>(null);

async function toggleActive(rule: CommissionRuleDto): Promise<void> {
  togglingId.value = rule.id;
  try {
    await updateCommissionRule(rule.id, { active: !rule.active });
    await queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    toast.add({
      message: rule.active ? 'Regra desativada.' : 'Regra reativada.',
      severity: 'success',
    });
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Não foi possível alterar.',
      severity: 'failure',
    });
  } finally {
    togglingId.value = null;
  }
}
</script>

<template>
  <PageLayout title="Comissões" subtitle="Regras decidem quanto cada barbeiro ganha.">
    <CommissionsTabs />

    <BCard class="rules__hint">
      <BText as="p" variant="body-3" color="b-fg-neutral-secondary">{{ PRECEDENCE_HINT }}</BText>
    </BCard>

    <BCard v-if="missingShopDefault" class="rules__warning">
      <BText as="p" variant="body-2">
        Não há regra padrão da loja (todos os barbeiros, todos os serviços). Sem ela, concluir um
        horário é bloqueado quando nenhuma outra regra se aplica.
      </BText>
    </BCard>

    <BSkeletonLoader v-if="rulesPending" height="200px" />

    <BEmptyState
      v-else-if="rulesFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rules.length === 0"
      title="Nenhuma regra"
      subtitle="Comece pela regra padrão da loja."
    />

    <BCard v-else padding="0" class="rules__table-card">
      <div class="rules__table-wrap">
        <table class="rules__table">
          <thead>
            <tr>
              <th>Barbeiro</th>
              <th>Serviço</th>
              <th>Alvo</th>
              <th>Percentual</th>
              <th>Base</th>
              <th>Situação</th>
              <th v-if="isAdmin" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id" :class="{ 'rules__row--off': !rule.active }">
              <td>{{ barberLabel(rule.barberId) }}</td>
              <td>{{ serviceLabel(rule.serviceId) }}</td>
              <td>{{ COMMISSION_APPLIES_TO_LABELS[rule.appliesTo] }}</td>
              <td>{{ formatRate(rule.rate) }}</td>
              <td>{{ COMMISSION_BASE_LABELS[rule.base] }}</td>
              <td>
                <BLabel v-if="rule.active" color="success">Ativa</BLabel>
                <BLabel v-else color="grayLight">Inativa</BLabel>
              </td>
              <td v-if="isAdmin" class="rules__actions">
                <BButton size="small" variant="outline" color="neutral" @click="startEdit(rule)">
                  Editar
                </BButton>
                <BButton
                  size="small"
                  variant="outline"
                  :color="rule.active ? 'danger' : 'neutral'"
                  :is-loading="togglingId === rule.id"
                  @click="toggleActive(rule)"
                >
                  {{ rule.active ? 'Desativar' : 'Reativar' }}
                </BButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BCard>

    <form v-if="isAdmin && editing" class="rules__form" @submit.prevent="saveEdit">
      <SectionCard
        title="Editar regra"
        subtitle="O escopo não muda: para trocar barbeiro ou serviço, desative e crie outra."
      >
        <div class="rules__fields">
          <div class="rules__row">
            <BInput
              v-model="editForm.ratePercent"
              label="Percentual (%)"
              label-prepend-asterisk
              placeholder="40"
              :helper-text="editErrors.ratePercent"
            />
            <BSelect
              v-model="editForm.base"
              label="Base"
              :options="COMMISSION_BASE_FORM_OPTIONS"
              :helper-text="editErrors.base"
            />
          </div>
        </div>
        <div class="rules__form-actions">
          <BButton type="submit" color="neutral" variant="contain" :is-loading="editPending">
            Salvar
          </BButton>
          <BButton variant="outline" color="neutral" @click="editing = null">Cancelar</BButton>
        </div>
      </SectionCard>
    </form>

    <form v-if="isAdmin && !editing" class="rules__form" @submit.prevent="onCreate">
      <SectionCard title="Nova regra" subtitle="Deixe barbeiro ou serviço em “Todos” para o curinga.">
        <div class="rules__fields">
          <div class="rules__row">
            <BSelect
              v-model="form.barberId"
              label="Barbeiro"
              :options="barberOptions"
              :helper-text="fieldErrors.barberId"
            />
            <BSelect
              v-model="form.serviceId"
              label="Serviço"
              :options="serviceOptions"
              :is-disabled="form.appliesTo === 'products'"
              :helper-text="fieldErrors.serviceId"
            />
          </div>
          <div class="rules__row">
            <BInput
              v-model="form.ratePercent"
              label="Percentual (%)"
              label-prepend-asterisk
              placeholder="40"
              :helper-text="fieldErrors.ratePercent"
            />
            <BSelect
              v-model="form.base"
              label="Base"
              :options="COMMISSION_BASE_FORM_OPTIONS"
              :helper-text="fieldErrors.base"
            />
            <BSelect
              v-model="form.appliesTo"
              label="Alvo"
              :options="COMMISSION_APPLIES_TO_FORM_OPTIONS"
              :helper-text="fieldErrors.appliesTo"
            />
          </div>
        </div>
        <BText v-if="formError" as="p" variant="body-2" class="rules__error">
          {{ formError }}
        </BText>
        <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
          Criar regra
        </BButton>
      </SectionCard>
    </form>
  </PageLayout>
</template>

<style scoped>
.rules__hint,
.rules__warning {
  margin-bottom: 1rem;
}

.rules__warning {
  border-left: 3px solid var(--b-fg-danger-hover, #b42318);
}

.rules__table-card {
  overflow: hidden;
}

.rules__table-wrap {
  overflow-x: auto;
}

.rules__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.rules__table th,
.rules__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.rules__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.rules__row--off {
  opacity: 0.6;
}

.rules__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.rules__form {
  margin-top: 1rem;
}

.rules__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.rules__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .rules__row {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    align-items: start;
  }
}

.rules__form-actions {
  display: flex;
  gap: 0.5rem;
}

.rules__error {
  color: var(--b-fg-danger-hover, #b42318);
  margin-bottom: 0.75rem;
}
</style>
