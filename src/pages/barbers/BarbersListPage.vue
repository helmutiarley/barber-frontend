<script setup lang="ts">
import { BButton, BCard, BEmptyState, BLabel, BSkeletonLoader, BText } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { listBarbers } from '@/api/barbers';
import PageLayout from '@/components/layout/PageLayout.vue';
import { usePermission } from '@/composables/usePermission';

const { hasRole } = usePermission();
const isAdmin = computed(() => hasRole('ADMIN'));

const { data, isPending, isError } = useQuery({
  queryKey: ['barbers'] as const,
  queryFn: () => listBarbers(),
});

const barbers = computed(() => data.value ?? []);
</script>

<template>
  <PageLayout
    title="Barbeiros"
    subtitle="Perfis ativos usados no agendamento e na agenda do dia."
  >
    <template v-if="isAdmin" #header-actions>
      <RouterLink to="/barbers/new">
        <BButton color="neutral" variant="contain" icon-prepend="ic-add-16">Novo barbeiro</BButton>
      </RouterLink>
    </template>

    <BSkeletonLoader v-if="isPending" height="240px" />

    <BEmptyState
      v-else-if="isError"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="barbers.length === 0"
      title="Nenhum barbeiro ativo"
      subtitle="Crie um perfil vinculado a um usuário com papel Barbeiro."
    />

    <div v-else class="barbers__grid">
      <BCard v-for="barber in barbers" :key="barber.id" class="barbers__card">
        <div class="barbers__card-body">
          <div class="barbers__avatar" aria-hidden="true">
            <img v-if="barber.photoUrl" :src="barber.photoUrl" :alt="barber.displayName" />
            <span v-else>{{ barber.displayName.slice(0, 1).toUpperCase() }}</span>
          </div>

          <div class="barbers__meta">
            <BText as="h2" variant="heading-2">{{ barber.displayName }}</BText>
            <div v-if="barber.specialties.length" class="barbers__tags">
              <BLabel
                v-for="tag in barber.specialties"
                :key="tag"
                variant="outline"
                color="gray"
              >
                {{ tag }}
              </BLabel>
            </div>
            <BText v-else as="p" variant="body-2" color="b-fg-neutral-secondary">
              Sem especialidades
            </BText>
          </div>

          <div class="barbers__actions">
            <RouterLink :to="`/barbers/${barber.id}`">
              <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
            </RouterLink>
          </div>
        </div>
      </BCard>
    </div>
  </PageLayout>
</template>

<style scoped>
.barbers__grid {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-sm);
}

.barbers__card-body {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--b-spacing-sm);
  align-items: center;
}

.barbers__avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--b-border-radius-sm);
  background: var(--b-bg-neutral-surface);
  color: var(--b-fg-neutral-default);
  font-weight: 700;
  overflow: hidden;
}

.barbers__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.barbers__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-3xs);
}

.barbers__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--b-spacing-3xs);
}

.barbers__actions {
  flex-shrink: 0;
}

@media (max-width: 599px) {
  .barbers__card-body {
    grid-template-columns: auto 1fr;
  }

  .barbers__actions {
    grid-column: 1 / -1;
  }
}
</style>
