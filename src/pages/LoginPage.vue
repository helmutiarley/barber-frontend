<script setup lang="ts">
import { BButton, BInput, useBToast } from '@barber/bcomponents';
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ApiError, messageForApiError } from '@/lib/errors';
import { homePathForRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useBToast();

const email = ref('');
const password = ref('');
const pending = ref(false);
const formError = ref<string | null>(null);

async function onSubmit(): Promise<void> {
  formError.value = null;
  pending.value = true;
  try {
    await auth.login(email.value, password.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    const target =
      redirect && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : homePathForRole(auth.role!);
    await router.replace(target);
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível entrar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <form class="login" @submit.prevent="onSubmit">
    <h1 class="login__title">Entrar</h1>
    <p class="login__hint">Use sua conta da barbearia.</p>

    <BInput
      v-model="email"
      type="email"
      label="Email"
      placeholder="voce@email.com"
      autocomplete="username"
      label-prepend-asterisk
    />
    <BInput
      v-model="password"
      type="password"
      label="Senha"
      placeholder="••••••••"
      autocomplete="current-password"
      label-prepend-asterisk
    />

    <p v-if="formError" class="login__error" role="alert">{{ formError }}</p>

    <BButton type="submit" color="primary" full-width :is-loading="pending" :is-disabled="pending">
      Entrar
    </BButton>

    <p class="login__footer">
      Ainda não tem conta?
      <RouterLink to="/register" class="login__link">Criar conta</RouterLink>
    </p>
  </form>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.login__title {
  font-size: 1.25rem;
  font-weight: 650;
  margin-bottom: 0.25rem;
}

.login__hint {
  font-size: 0.875rem;
  color: var(--b-fg-neutral-secondary, #666);
  margin-bottom: 1rem;
}

.login__error {
  color: #b91c1c;
  font-size: 0.875rem;
  margin: 0.5rem 0 0.75rem;
}

.login__footer {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--b-fg-neutral-secondary, #666);
}

.login__link {
  color: var(--b-fg-brand-primary, #1d4ed8);
  font-weight: 600;
  text-decoration: underline;
}
</style>
