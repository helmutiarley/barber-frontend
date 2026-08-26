<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: '20px' });
</script>

<template>
  <span
    class="b-circle-loader"
    role="status"
    aria-label="Carregando"
    :style="{ width: size, height: size }"
  >
    <span class="b-circle-loader__spinner" />
  </span>
</template>

<style scoped>
.b-circle-loader {
  position: relative;
  display: inline-block;
  flex: none;
  border-radius: 50%;
}

.b-circle-loader__spinner {
  display: block;
  width: 100%;
  height: 100%;
  border: var(--b-circle-loader-border-size, 3px) solid var(--b-circle-loader-border-color);
  border-top: var(--b-circle-loader-border-size, 3px) solid var(--b-circle-loader-color);
  border-radius: 50%;
  animation: b-circle-loader-spin 1s linear infinite;
}

@keyframes b-circle-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .b-circle-loader__spinner {
    animation-duration: 2.5s;
  }
}
</style>
