<script setup lang="ts">
import { BCard, BIcon, BText } from '@barber/bcomponents';
import { RouterLink } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { REPORT_CARDS } from '@/features/reports/labels';

const RANGE_NOTE =
  'Todo relatório abre no mês corrente e conta o dinheiro pela data em que foi pago.';
</script>

<template>
  <PageLayout title="Relatórios" :subtitle="RANGE_NOTE">
    <div class="hub__grid">
      <RouterLink
        v-for="card in REPORT_CARDS"
        :key="card.path"
        :to="card.path"
        class="hub__link"
      >
        <BCard class="hub__card">
          <BIcon :name="card.icon" dimensions="24px" />
          <BText as="h2" variant="heading-3">{{ card.title }}</BText>
          <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
            {{ card.description }}
          </BText>
        </BCard>
      </RouterLink>
    </div>

    <BText as="p" variant="body-3" color="b-fg-neutral-secondary" class="hub__note">
      Os números de um barbeiro estão nas tabelas de ocupação e faltas — clique no nome para abrir o
      resumo dele.
    </BText>
  </PageLayout>
</template>

<style scoped>
.hub__grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .hub__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .hub__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.hub__link {
  display: block;
  color: inherit;
}

.hub__card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.hub__link:hover .hub__card,
.hub__link:focus-visible .hub__card {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 24, 40, 0.08);
}

.hub__note {
  margin-top: 1rem;
}
</style>
