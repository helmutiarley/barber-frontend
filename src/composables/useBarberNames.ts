import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { listBarbers } from '@/api/barbers';

/**
 * Commission rows name a barber by id. The public list is the only place a
 * display name lives, so five pages would otherwise repeat this join.
 */
export function useBarberNames() {
  const query = useQuery({
    queryKey: ['barbers', 'public'] as const,
    queryFn: () => listBarbers(),
  });

  const barbers = computed(() => query.data.value ?? []);

  const nameById = computed(() => {
    const map = new Map<string, string>();
    for (const barber of barbers.value) {
      map.set(barber.id, barber.displayName);
    }
    return map;
  });

  /** Falls back to a short id: a deactivated barber still owns past entries. */
  function barberName(id: string): string {
    return nameById.value.get(id) ?? `${id.slice(0, 8)}…`;
  }

  const barberOptions = computed(() =>
    barbers.value.map((barber) => ({ label: barber.displayName, value: barber.id })),
  );

  const barberFilterOptions = computed(() => [
    { label: 'Todos', value: '' },
    ...barberOptions.value,
  ]);

  return { barbers, barberName, barberOptions, barberFilterOptions };
}
