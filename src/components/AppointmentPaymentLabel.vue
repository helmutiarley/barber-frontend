<script setup lang="ts">
import { BLabel } from '@/ui';

defineProps<{
  isPaid: boolean;
}>();
</script>

<template>
  <BLabel :color="isPaid ? 'success' : 'warning'">
    {{ isPaid ? 'Pago' : 'Não pago' }}
  </BLabel>
</template>
