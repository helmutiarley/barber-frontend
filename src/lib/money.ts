const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Format integer cents as BRL. Never pass floats. */
export function formatMoney(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error('formatMoney expects integer cents');
  }

  return BRL.format(cents / 100);
}

/**
 * Parse a user money string (e.g. "12,50", "12.50", "R$ 1.234,56") into cents.
 * Rejects empty / non-numeric input.
 */
export function parseMoneyInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Valor vazio');
  }

  const cleaned = trimmed.replace(/[^\d,.-]/g, '');
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;
  if (hasComma && hasDot) {
    // pt-BR: 1.234,56 → remove thousands dots, comma → decimal
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    throw new Error('Valor inválido');
  }

  return Math.round(value * 100);
}
