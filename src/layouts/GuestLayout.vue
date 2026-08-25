<script setup lang="ts">
import { BIcon, BText } from '@barber/bcomponents';
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="guest">
    <div class="guest__card">
      <div class="guest__brand">
        <BIcon name="ic-shop-24" dimensions="28px" />
        <BText as="span" variant="heading-1">Barber</BText>
      </div>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.guest {
  height: 100dvh;
  overflow: auto;
  display: grid;
  place-items: center;
  padding: var(--b-spacing-md);
  background: var(--b-bg-neutral-secondary);
}

.guest__card {
  width: 100%;
  max-width: 400px;
  padding: var(--b-spacing-lg);
  border: 1px solid var(--b-stroke-default);
  border-radius: var(--b-border-radius-lg);
  background: var(--b-bg-neutral-default);
  box-shadow: var(--b-shadow-1-bottom);
}

.guest__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--b-spacing-2xs);
  margin-bottom: var(--b-spacing-md);
  letter-spacing: -0.02em;
}
</style>
