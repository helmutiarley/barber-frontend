import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp, type App as VueApp } from 'vue';
import App from '@/App.vue';
import { createAppQueryClient } from '@/app/query-client';

export function createBarberApp(): VueApp<Element> {
  const app = createApp(App);

  app.use(createPinia());
  app.use(VueQueryPlugin, { queryClient: createAppQueryClient() });

  return app;
}
