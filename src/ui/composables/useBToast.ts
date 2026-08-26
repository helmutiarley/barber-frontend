import { ref } from 'vue';
import type { BToastMessage, BToastSeverity } from '../types';

export interface BToastEntry {
  id: number;
  message: string;
  severity: BToastSeverity;
}

const DEFAULT_TIMEOUT = 5000;

const entries = ref<BToastEntry[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();

let nextId = 1;

function dismiss(id: number): void {
  const timer = timers.get(id);

  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }

  entries.value = entries.value.filter((entry) => entry.id !== id);
}

function add(toast: BToastMessage): number {
  const id = nextId;
  nextId += 1;

  entries.value = [...entries.value, { id, message: toast.message, severity: toast.severity ?? 'success' }];

  const timeout = toast.timeout ?? DEFAULT_TIMEOUT;

  if (timeout > 0) {
    timers.set(
      id,
      setTimeout(() => dismiss(id), timeout),
    );
  }

  return id;
}

function clear(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }

  timers.clear();
  entries.value = [];
}

export function useBToast(): {
  add: (toast: BToastMessage) => number;
  dismiss: (id: number) => void;
  clear: () => void;
} {
  return { add, dismiss, clear };
}

export function useBToastQueue(): {
  entries: typeof entries;
  dismiss: (id: number) => void;
} {
  return { entries, dismiss };
}
