import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';

/** Empty string clears; otherwise YYYY-MM-DD. */
const birthdayField = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
    { message: 'Use AAAA-MM-DD' },
  );

const textArea = z
  .string()
  .trim()
  .refine((value) => value === '' || value.length <= 2000, {
    message: 'Texto muito longo',
  });

export const updateClientSchema = z.object({
  birthday: birthdayField,
  preferences: textArea,
  internalNotes: textArea,
});

export const updateOwnClientSchema = z.object({
  birthday: birthdayField,
  preferences: textArea,
});

export type UpdateClientForm = z.infer<typeof updateClientSchema>;
export type UpdateOwnClientForm = z.infer<typeof updateOwnClientSchema>;

export { fieldErrorsFromZod };

/** Form empty → API `null`. */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
