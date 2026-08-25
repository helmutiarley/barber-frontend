import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { rangeError, rangeFromQuery, type ReportRange } from '@/features/reports/range';

/**
 * Every report is a range and nothing else, and it lives in the URL so a number
 * someone is arguing about can be linked to. Defaults to the current month, which
 * is what the API would have answered with anyway.
 */
export function useReportRange() {
  const route = useRoute();
  const router = useRouter();

  const range = computed<ReportRange>(() => rangeFromQuery(route.query));

  function setRange(next: ReportRange): void {
    void router.replace({ query: { ...route.query, from: next.from, to: next.to } });
  }

  const error = computed(() => rangeError(range.value));

  /** Reports are only asked for a range they would not refuse. */
  const isValid = computed(() => error.value === null);

  return { range, setRange, error, isValid };
}
