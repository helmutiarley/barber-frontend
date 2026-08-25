import type { PaymentMethod } from '@/api/types';

function rateFromEnv(key: 'VITE_CARD_FEE_RATE_DEBIT' | 'VITE_CARD_FEE_RATE_CREDIT', fallback: number): number {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

/** Matches backend defaults (`CARD_FEE_RATE_*`). Preview only — server snapshots win. */
export function cardFeeRate(method: PaymentMethod): number {
  if (method === 'debit') return rateFromEnv('VITE_CARD_FEE_RATE_DEBIT', 0.015);
  if (method === 'credit') return rateFromEnv('VITE_CARD_FEE_RATE_CREDIT', 0.035);
  return 0;
}

export function previewCardFeeCents(method: PaymentMethod, amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents <= 0) return 0;
  return Math.round(amountCents * cardFeeRate(method));
}

export function previewNetCents(method: PaymentMethod, amountCents: number): number {
  return amountCents - previewCardFeeCents(method, amountCents);
}
