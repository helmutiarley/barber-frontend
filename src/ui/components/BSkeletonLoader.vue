<script setup lang="ts">
withDefaults(
  defineProps<{
    height?: string;
    width?: string;
    radius?: string;
  }>(),
  { height: '20px', width: '100%', radius: 'var(--b-border-radius-sm)' },
);
</script>

<template>
  <div
    class="b-skeleton"
    role="status"
    aria-busy="true"
    :style="{ height, width, borderRadius: radius }"
  />
</template>

<style scoped>
.b-skeleton {
  background: linear-gradient(
    90deg,
    var(--b-color-neutral-100) 25%,
    var(--b-color-neutral-200) 37%,
    var(--b-color-neutral-100) 63%
  );
  background-size: 400% 100%;
  animation: b-skeleton-shimmer 1.4s ease infinite;
}

@keyframes b-skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .b-skeleton {
    animation: none;
  }
}
</style>
