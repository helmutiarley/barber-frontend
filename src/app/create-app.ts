import { vSafeHtml, vTooltip } from '@barber/bcomponents';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp, type App as VueApp } from 'vue';
import App from '@/App.vue';
import { createAppQueryClient } from '@/app/query-client';

/**
 * Shared between `main.ts` and the boot test so that the test exercises the real
 * plugin/directive registration rather than a parallel copy of it.
 */
export function createBarberApp(): VueApp<Element> {
  const app = createApp(App);

  // bComponents' own components use these directives internally, so they have to
  // be registered globally even where app code never references them.
  app.directive('tooltip', vTooltip);
  app.directive('safe-html', vSafeHtml);

  app.use(createPinia());
  app.use(VueQueryPlugin, { queryClient: createAppQueryClient() });

  return app;
}
