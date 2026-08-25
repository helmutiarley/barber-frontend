<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { homePathForRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (auth.role) {
    void router.replace(homePathForRole(auth.role));
  }
});
</script>

<template>
  <p>Redirecionando…</p>
</template>
