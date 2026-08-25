import { setupBComponents } from '@barber/bcomponents';
import { sprites } from '@barber/bcomponents-icons';
import { configureApiClient } from '@/api/client';
import { createBarberApp } from '@/app/create-app';
import { router } from '@/app/router';
import { useAuthStore } from '@/stores/auth';
import '@/styles/reset.css';
import '@/styles/app.css';

setupBComponents({
  theme: { mode: 'light', theme: 'base' },
  iconSprites: sprites,
});

async function bootstrap(): Promise<void> {
  const app = createBarberApp();
  const auth = useAuthStore();

  configureApiClient({
    tokens: {
      getAccessToken: () => auth.getAccessToken(),
      getRefreshToken: () => auth.getRefreshToken(),
      setTokens: (accessToken, refreshToken) => auth.setTokens(accessToken, refreshToken),
      clearSession: () => auth.clearSession(),
    },
    onAuthFailure: () => {
      const redirect = router.currentRoute.value.fullPath;
      void router.replace({
        path: '/login',
        query: redirect && redirect !== '/login' ? { redirect } : undefined,
      });
    },
  });

  await auth.bootstrap();

  app.use(router);
  await router.isReady();
  app.mount('#app');
}

void bootstrap();
