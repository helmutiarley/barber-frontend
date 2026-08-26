<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: '20px' });
</script>

<template>
  <span
    class="b-circle-loader"
    role="status"
    aria-label="Carregando"
    :style="{ width: size, height: size }"
  />
</template>

<style scoped>
.b-circle-loader {
  display: inline-block;
  flex: none;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--b-border-radius-full);
  opacity: 0.85;
  animation: b-circle-loader-spin 0.7s linear infinite;
}

@keyframes b-circle-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .b-circle-loader {
    animation-duration: 2s;
  }
}
</style>
