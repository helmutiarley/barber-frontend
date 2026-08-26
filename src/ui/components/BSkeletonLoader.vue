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
    class="b-skeleton-loader"
    role="status"
    aria-busy="true"
    :style="{ height, width, borderRadius: radius }"
  />
</template>

<style scoped>
.b-skeleton-loader {
  position: relative;
  background-color: var(--b-bg-neutral-surface);
  overflow: hidden;
}

.b-skeleton-loader::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--b-skeleton-gradient-start-end),
    var(--b-skeleton-gradient-middle),
    var(--b-skeleton-gradient-start-end)
  );
  transform: translate(-100%);
  animation: b-skeleton-loader-wave 1.6s linear 0.5s infinite;
}

@keyframes b-skeleton-loader-wave {
  0% {
    transform: translate(-100%);
  }

  60% {
    transform: translate(100%);
  }

  100% {
    transform: translate(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .b-skeleton-loader::after {
    animation: none;
  }
}
</style>
