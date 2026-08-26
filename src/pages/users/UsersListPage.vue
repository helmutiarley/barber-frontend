<script setup lang="ts">
import { BButton, BCard, BEmptyState, BLabel, BSelect, BSkeletonLoader } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listUsers } from '@/api/users';
import PageLayout from '@/components/layout/PageLayout.vue';
import {
  ACTIVE_FILTER_OPTIONS,
  ROLE_FILTER_OPTIONS,
  ROLE_LABELS,
  activeLabel,
} from '@/features/users/role-labels';
import type { UserRole } from '@/lib/roles';
import { usePermission } from '@/composables/usePermission';

const route = useRoute();
const router = useRouter();
const { hasRole } = usePermission();

const isAdmin = computed(() => hasRole('ADMIN'));

const roleFilter = computed({
  get: () => (typeof route.query.role === 'string' ? route.query.role : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, role: value === '' ? undefined : String(value) },
    });
  },
});

const activeFilter = computed({
  get: () => (typeof route.query.active === 'string' ? route.query.active : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, active: value === '' ? undefined : String(value) },
    });
  },
});

const filters = computed(() => ({
  role: (roleFilter.value || undefined) as UserRole | undefined,
  active: activeFilter.value === '' ? undefined : activeFilter.value === 'true',
}));

const { data, isPending, isError } = useQuery({
  queryKey: computed(() => ['users', filters.value] as const),
  queryFn: () => listUsers(filters.value),
});

const users = computed(() => data.value ?? []);
</script>

<template>
  <PageLayout title="Usuários" subtitle="Contas da equipe e clientes com login.">
    <template v-if="isAdmin" #header-actions>
      <RouterLink to="/users/new">
        <BButton color="neutral" variant="contain" icon-prepend="ic-add-16">Novo usuário</BButton>
      </RouterLink>
    </template>

    <BCard class="users__filters">
      <div class="users__filters-row">
        <BSelect v-model="roleFilter" label="Perfil" :options="ROLE_FILTER_OPTIONS" />
        <BSelect v-model="activeFilter" label="Status" :options="ACTIVE_FILTER_OPTIONS" />
      </div>
    </BCard>

    <BSkeletonLoader v-if="isPending" height="240px" />

    <BEmptyState
      v-else-if="isError"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="users.length === 0"
      title="Nenhum usuário"
      subtitle="Ajuste os filtros ou crie um usuário da equipe."
    />

    <BCard v-else padding="0" class="users__table-card">
      <div class="users__table-wrap">
        <table class="users__table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Perfil</th>
              <th>Status</th>
              <th v-if="isAdmin" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in users" :key="row.id">
              <td class="users__cell-strong">{{ row.name }}</td>
              <td>{{ row.email || '—' }}</td>
              <td>{{ row.phone || '—' }}</td>
              <td>
                <BLabel variant="outline" color="gray">{{ ROLE_LABELS[row.role] }}</BLabel>
              </td>
              <td>
                <BLabel :color="row.active ? 'success' : 'grayLight'">
                  {{ activeLabel(row.active) }}
                </BLabel>
              </td>
              <td v-if="isAdmin" class="users__actions">
                <RouterLink :to="`/users/${row.id}`">
                  <BButton size="small" variant="outline" color="neutral">Editar</BButton>
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BCard>
  </PageLayout>
</template>

<style scoped>
.users__filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 240px));
  gap: var(--b-spacing-sm);
}

/* Without this the wide table sets the flex item's min-content width and pushes
   the card past the viewport instead of scrolling inside it. */
.users__table-card {
  min-width: 0;
  overflow: hidden;
}

.users__table-wrap {
  overflow-x: auto;
}

.users__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.users__table th,
.users__table td {
  padding: var(--b-spacing-xs) var(--b-spacing-sm);
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--b-stroke-default);
}

.users__table th {
  font-weight: 700;
  color: var(--b-fg-neutral-secondary);
  background: var(--b-bg-neutral-surface);
  white-space: nowrap;
}

.users__table tbody tr:last-child td {
  border-bottom: none;
}

.users__table tbody tr:hover {
  background: var(--b-bg-neutral-hover);
}

.users__cell-strong {
  font-weight: 700;
}

.users__actions {
  text-align: right;
  white-space: nowrap;
}
</style>
