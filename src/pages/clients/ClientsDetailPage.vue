<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSkeletonLoader,
  BText,
} from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { getClient, getClientHistory, isBarberClient, isStaffClient } from '@/api/clients';
import { listBarbers } from '@/api/barbers';
import { listServices } from '@/api/services';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { usePermission } from '@/composables/usePermission';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/features/appointments/status-labels';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime } from '@/lib/shop-time';

const PAGE_SIZE = 20;
const route = useRoute();
const router = useRouter();
const { hasRole } = usePermission();

const id = computed(() => String(route.params.id));
const isStaff = computed(() => hasRole('ADMIN') || hasRole('MANAGER'));
const backTo = computed(() => (isStaff.value ? '/clients' : '/agenda'));

const offset = computed(() => {
  const raw = typeof route.query.offset === 'string' ? Number(route.query.offset) : 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const detailQuery = useQuery({
  queryKey: computed(() => ['clients', id.value] as const),
  queryFn: () => getClient(id.value),
});

const { isPending: detailPending, isError: detailFailed } = detailQuery;

const historyQuery = useQuery({
  queryKey: computed(() => ['clients', id.value, 'history', offset.value] as const),
  queryFn: () => getClientHistory(id.value, { limit: PAGE_SIZE, offset: offset.value }),
});

const { isPending: historyPending, isError: historyFailed } = historyQuery;

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: true }] as const,
  queryFn: () => listServices({ includeInactive: true }),
});

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const client = computed(() => detailQuery.data.value);
const staff = computed(() => (client.value && isStaffClient(client.value) ? client.value : null));
const barberView = computed(() =>
  client.value && isBarberClient(client.value) ? client.value : null,
);
const stats = computed(() => staff.value?.stats ?? barberView.value?.stats ?? null);

const history = computed(() => historyQuery.data.value?.data ?? []);
const total = computed(() => historyQuery.data.value?.meta.total ?? 0);

const serviceName = computed(() => {
  const map = new Map((servicesQuery.data.value ?? []).map((s) => [s.id, s.name]));
  return (sid: string) => map.get(sid) ?? 'Serviço';
});

const barberName = computed(() => {
  const map = new Map((barbersQuery.data.value ?? []).map((b) => [b.id, b.displayName]));
  return (bid: string) => map.get(bid) ?? 'Barbeiro';
});

const canPrev = computed(() => offset.value > 0);
const canNext = computed(() => offset.value + PAGE_SIZE < total.value);

function setOffset(next: number): void {
  void router.replace({
    query: {
      ...route.query,
      offset: next > 0 ? String(next) : undefined,
    },
  });
}

function formatBirthday(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
</script>

<template>
  <PageLayout>
    <template #title>
      <div class="detail__title">
        <PageBackLink :to="backTo" :label="isStaff ? 'Clientes' : 'Agenda'" />
        <BText as="h1" variant="heading-1">
          {{ client?.name ?? 'Cliente' }}
        </BText>
      </div>
    </template>

    <template v-if="isStaff && client" #header-actions>
      <RouterLink :to="`/clients/${id}/edit`">
        <BButton color="neutral" variant="contain">Editar</BButton>
      </RouterLink>
    </template>

    <BSkeletonLoader v-if="detailPending" height="200px" />

    <BEmptyState
      v-else-if="detailFailed"
      title="Cliente não encontrado"
      subtitle="Ele pode ter sido removido ou você não tem acesso."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push(backTo)">Voltar</BButton>
      </template>
    </BEmptyState>

    <template v-else-if="client">
      <SectionCard v-if="staff" title="Contato">
        <dl class="detail__grid">
          <div>
            <dt>Email</dt>
            <dd>{{ staff.email || '—' }}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{{ staff.phone || '—' }}</dd>
          </div>
          <div>
            <dt>Conta</dt>
            <dd>
              <BLabel :color="staff.active ? 'success' : 'grayLight'">
                {{ staff.active ? 'Ativa' : 'Inativa' }}
              </BLabel>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Preferências">
        <dl class="detail__grid">
          <div>
            <dt>Aniversário</dt>
            <dd>{{ formatBirthday(client.birthday) }}</dd>
          </div>
          <div class="detail__span">
            <dt>Como gosta do corte</dt>
            <dd>{{ client.preferences || '—' }}</dd>
          </div>
          <div v-if="staff" class="detail__span">
            <dt>Notas internas</dt>
            <dd>{{ staff.internalNotes || '—' }}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard v-if="stats" title="Estatísticas">
        <div class="detail__stats">
          <BCard class="detail__stat">
            <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Visitas</BText>
            <BText as="span" variant="heading-2">{{ stats.visits }}</BText>
          </BCard>
          <BCard class="detail__stat">
            <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
              Última visita
            </BText>
            <BText as="span" variant="heading-2">
              {{
                stats.lastVisitAt ? formatShopDateTime(stats.lastVisitAt, 'dd/MM/yyyy') : '—'
              }}
            </BText>
          </BCard>
          <BCard class="detail__stat">
            <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
              Ticket médio
            </BText>
            <BText as="span" variant="heading-2">
              {{
                stats.averageTicketCents != null
                  ? formatMoney(stats.averageTicketCents)
                  : '—'
              }}
            </BText>
          </BCard>
          <BCard class="detail__stat">
            <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Faltas</BText>
            <BText as="span" variant="heading-2">{{ stats.noShows }}</BText>
          </BCard>
        </div>
      </SectionCard>

      <SectionCard title="Histórico">
        <BSkeletonLoader v-if="historyPending" height="160px" />
        <BEmptyState
          v-else-if="historyFailed"
          title="Não foi possível carregar o histórico"
        />
        <BEmptyState
          v-else-if="history.length === 0"
          title="Sem horários"
          subtitle="Ainda não há atendimentos registrados."
        />
        <template v-else>
          <div class="detail__history-wrap">
            <table class="detail__history">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Serviço</th>
                  <th>Barbeiro</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in history" :key="row.id">
                  <td>{{ formatShopDateTime(row.startsAt) }}</td>
                  <td>{{ serviceName(row.serviceId) }}</td>
                  <td>{{ barberName(row.barberId) }}</td>
                  <td>{{ formatMoney(row.priceCents) }}</td>
                  <td>
                    <BLabel :color="APPOINTMENT_STATUS_COLORS[row.status]">
                      {{ APPOINTMENT_STATUS_LABELS[row.status] }}
                    </BLabel>
                  </td>
                  <td>
                    <RouterLink :to="`/appointments/${row.id}`">
                      <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="detail__pager">
            <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
              {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
            </BText>
            <div class="detail__pager-actions">
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

.detail__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr 1fr;
}

@media (min-width: 900px) {
  .detail__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.detail__stat {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detail__history-wrap {
  overflow-x: auto;
}

.detail__history {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.detail__history th,
.detail__history td {
  padding: 0.65rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.detail__history th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.detail__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.detail__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
