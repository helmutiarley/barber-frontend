<script setup lang="ts">
import { BButton, BIcon, BText } from '@/ui';
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useCashRegisterStore } from '@/stores/cash-register';

const cash = useCashRegisterStore();
const route = useRoute();

const showClosed = computed(() => cash.status === 'closed');
const showOvernight = computed(() => cash.isOvernightOpen);
const showCashRegisterLink = computed(() => !route.path.startsWith('/cash-register'));
</script>

<template>
  <div v-if="showClosed" class="banner banner--warning" role="status">
    <div class="banner__message">
      <BIcon name="ic-warning-circle-16" dimensions="16px" />
      <BText as="span" variant="body-2">
        O caixa está fechado. Abra o caixa para registrar pagamentos/recebimentos.
      </BText>
    </div>
    <RouterLink v-if="showCashRegisterLink" to="/cash-register">
      <BButton size="small" variant="outline" color="neutral">Ir para o caixa</BButton>
    </RouterLink>
  </div>

  <div v-else-if="showOvernight" class="banner banner--info" role="status">
    <div class="banner__message">
      <BIcon name="ic-info-16" dimensions="16px" />
      <BText as="span" variant="body-2">
        Há uma sessão de caixa aberta desde o dia anterior. Confira se precisa fechá-la.
      </BText>
    </div>
    <RouterLink to="/cash-register">
      <BButton size="small" variant="outline" color="neutral">Ver caixa</BButton>
    </RouterLink>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--b-spacing-2xs);
  min-height: 49px;
  padding: var(--b-spacing-2xs) var(--b-spacing-sm);
  border-bottom: 1px solid var(--b-stroke-default);
}

.banner__message {
  display: flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
}

.banner--warning {
  background: var(--b-bg-warning-tint-default);
  color: var(--b-fg-warning-default);
}

.banner--info {
  background: var(--b-bg-brand-tint-default);
  color: var(--b-fg-brand-default);
}
</style>
