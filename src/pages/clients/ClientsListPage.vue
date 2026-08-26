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
} from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listClients } from '@/api/clients';
import PageLayout from '@/components/layout/PageLayout.vue';
import {
  BIRTHDAY_MONTH_OPTIONS,
  INACTIVE_SINCE_OPTIONS,
} from '@/features/clients/filters';
import { shopTimezone } from '@/lib/shop-time';

const PAGE_SIZE = 50;
const route = useRoute();
const router = useRouter();

const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '');
let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchInput, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    void router.replace({
      query: {
        ...route.query,
        search: value.trim() || undefined,
        offset: undefined,
      },
    });
  }, 300);
});

const search = computed(() =>
  typeof route.query.search === 'string' ? route.query.search : '',
);

const birthdayMonth = computed({
  get: () => (typeof route.query.birthdayMonth === 'string' ? route.query.birthdayMonth : ''),
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        birthdayMonth: value ? String(value) : undefined,
        offset: undefined,
      },
    });
  },
});

const inactiveDays = computed({
  get: () => (typeof route.query.inactiveDays === 'string' ? route.query.inactiveDays : ''),
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        inactiveDays: value ? String(value) : undefined,
        offset: undefined,
      },
    });
  },
});

const offset = computed(() => {
  const raw = typeof route.query.offset === 'string' ? Number(route.query.offset) : 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const inactiveSince = computed(() => {
  const days = Number(inactiveDays.value);
  if (!Number.isFinite(days) || days <= 0) return undefined;
  return DateTime.now()
    .setZone(shopTimezone())
    .minus({ days })
    .startOf('day')
    .toUTC()
    .toISO()!;
});

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'clients',
        {
          search: search.value || undefined,
          birthdayMonth: birthdayMonth.value || undefined,
          inactiveDays: inactiveDays.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listClients({
      search: search.value || undefined,
      birthdayMonth: birthdayMonth.value ? Number(birthdayMonth.value) : undefined,
      inactiveSince: inactiveSince.value,
      limit: PAGE_SIZE,
      offset: offset.value,
    }),
});

const { isPending: listPending, isError: listFailed } = listQuery;

const rows = computed(() => listQuery.data.value?.data ?? []);
const total = computed(() => listQuery.data.value?.meta.total ?? 0);
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

function formatBirthday(value: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}
</script>

<template>
  <PageLayout
    title="Clientes"
    subtitle="CRM da recepção: busca, aniversários e inatividade."
  >
    <BCard class="clients__filters">
      <div class="clients__filters-row">
        <BInput
          v-model="searchInput"
          label="Buscar"
          placeholder="Nome, email ou telefone"
        />
        <BSelect
          v-model="birthdayMonth"
          label="Aniversário"
          :options="BIRTHDAY_MONTH_OPTIONS"
        />
        <BSelect
          v-model="inactiveDays"
          label="Inatividade"
          :options="INACTIVE_SINCE_OPTIONS"
        />
      </div>
    </BCard>

    <BSkeletonLoader v-if="listPending" height="240px" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum cliente"
      subtitle="Ajuste a busca ou os filtros."
    />

    <template v-else>
      <BCard padding="0" class="clients__table-card">
        <div class="clients__table-wrap">
          <table class="clients__table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Aniversário</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>
                  <BText as="span" variant="body-2-bold">{{ row.name }}</BText>
                  <BText
                    v-if="row.preferences"
                    as="span"
                    variant="body-3"
                    color="b-fg-neutral-secondary"
                    class="clients__prefs"
                  >
                    {{ row.preferences }}
                  </BText>
                </td>
                <td>
                  <div class="clients__contact">
                    <span>{{ row.phone || '—' }}</span>
                    <BText
                      v-if="row.email"
                      as="span"
                      variant="body-3"
                      color="b-fg-neutral-secondary"
                    >
                      {{ row.email }}
                    </BText>
                  </div>
                </td>
                <td>{{ formatBirthday(row.birthday) }}</td>
                <td>
                  <BLabel :color="row.active ? 'success' : 'grayLight'">
                    {{ row.active ? 'Ativo' : 'Inativo' }}
                  </BLabel>
                </td>
                <td>
                  <RouterLink :to="`/clients/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="clients__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="clients__pager-actions">
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
  </PageLayout>
</template>

<style scoped>
.clients__filters {
  margin-bottom: 1rem;
}

.clients__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .clients__filters-row {
    grid-template-columns: 1.4fr 1fr 1fr;
    align-items: end;
  }
}

.clients__table-card {
  overflow: hidden;
}

.clients__table-wrap {
  overflow-x: auto;
}

.clients__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.clients__table th,
.clients__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.clients__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.clients__prefs,
.clients__contact {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.clients__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.clients__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
