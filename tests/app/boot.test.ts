import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBarberApp } from '@/app/create-app';
import { router } from '@/app/router';

/**
 * bComponents is a vendored, minified bundle that we rewrite identifiers in, so a
 * bad rewrite can produce a bundle that imports and type-checks but throws on
 * render (leaving a blank page). Mounting the real app guards against that.
 */
describe('app boot', () => {
  let warnings: string[] = [];
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnings = [];
    warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders the login screen without runtime errors', async () => {
    const errors: unknown[] = [];

    const app = createBarberApp();
    app.config.errorHandler = (error) => errors.push(error);
    app.use(router);

    await router.push('/');
    await router.isReady();

    const host = document.createElement('div');
    document.body.appendChild(host);
    app.mount(host);
    await vi.waitFor(() => expect(host.querySelector('form')).not.toBeNull());

    expect(errors).toEqual([]);
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/');
    expect(host.textContent).toContain('Entrar');

    app.unmount();
  });

  it('registers the directives bComponents renders with', async () => {
    const app = createBarberApp();
    app.use(router);

    await router.push('/login');
    await router.isReady();

    const host = document.createElement('div');
    document.body.appendChild(host);
    app.mount(host);
    await vi.waitFor(() => expect(host.querySelector('form')).not.toBeNull());

    expect(warnings.filter((line) => line.includes('Failed to resolve directive'))).toEqual([]);

    app.unmount();
  });
});
