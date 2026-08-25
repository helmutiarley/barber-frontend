import { onScopeDispose, readonly, ref, type Ref } from 'vue';

/** Mirrors the breakpoints the shell CSS uses, so JS and SCSS agree on "mobile". */
export const BREAKPOINTS = {
  sm: 600,
  md: 960,
  lg: 1200,
} as const;

function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const matches = ref(false);

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const media = window.matchMedia(query);
    matches.value = media.matches;

    const onChange = (event: MediaQueryListEvent): void => {
      matches.value = event.matches;
    };

    media.addEventListener('change', onChange);
    onScopeDispose(() => media.removeEventListener('change', onChange));
  }

  return readonly(matches);
}

/** Below `md` the drawer becomes an overlay and the toolbar collapses. */
export function useViewport(): { isMobile: Readonly<Ref<boolean>> } {
  return { isMobile: useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`) };
}
