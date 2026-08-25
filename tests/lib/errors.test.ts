import { describe, expect, it } from 'vitest';
import {
  blockingAppointmentsFromDetails,
  parseErrorBody,
} from '@/lib/errors';

describe('parseErrorBody', () => {
  it('preserves CONFLICT details', () => {
    const error = parseErrorBody(
      {
        error: {
          code: 'CONFLICT',
          message: 'This barber has 2 upcoming appointment(s)',
          details: [
            { id: 'a1', startsAt: '2024-06-01T12:00:00.000Z' },
            { id: 'a2', startsAt: '2024-06-02T12:00:00.000Z' },
          ],
        },
      },
      409,
    );

    expect(error.code).toBe('CONFLICT');
    expect(error.status).toBe(409);
    expect(blockingAppointmentsFromDetails(error.details)).toHaveLength(2);
  });

  it('ignores malformed details', () => {
    expect(blockingAppointmentsFromDetails({ foo: 1 })).toEqual([]);
    expect(blockingAppointmentsFromDetails([{ id: 1 }])).toEqual([]);
  });
});
