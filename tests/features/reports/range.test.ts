import { describe, expect, it } from 'vitest';
import {
  currentMonthRange,
  formatCalendarDate,
  formatRange,
  presetForRange,
  rangeError,
  rangeForPreset,
  rangeFromQuery,
} from '@/features/reports/range';

const TODAY = '2026-08-07';

describe('report range presets', () => {
  it('opens on the current month, like the API would', () => {
    expect(currentMonthRange(TODAY)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('walks back a whole calendar month, not thirty days', () => {
    expect(rangeForPreset('last-month', TODAY)).toEqual({ from: '2026-07-01', to: '2026-07-31' });
  });

  it('counts today inside the last seven days', () => {
    expect(rangeForPreset('last-7', TODAY)).toEqual({ from: '2026-08-01', to: TODAY });
  });

  it('spans thirty days back to back', () => {
    expect(rangeForPreset('last-30', TODAY)).toEqual({ from: '2026-07-09', to: TODAY });
  });

  it('covers the whole year, including the months not lived yet', () => {
    expect(rangeForPreset('this-year', TODAY)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('handles a month shorter than thirty-one days', () => {
    expect(currentMonthRange('2026-02-14')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('recognises which preset a range is, so a button can look selected', () => {
    expect(presetForRange({ from: '2026-08-01', to: '2026-08-31' }, TODAY)).toBe('this-month');
    expect(presetForRange({ from: '2026-07-01', to: '2026-07-31' }, TODAY)).toBe('last-month');
  });

  it('calls a hand-picked range no preset at all', () => {
    expect(presetForRange({ from: '2026-08-03', to: '2026-08-09' }, TODAY)).toBeNull();
  });
});

describe('range from the URL', () => {
  it('reads a linkable range', () => {
    expect(rangeFromQuery({ from: '2026-03-01', to: '2026-03-31' }, TODAY)).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });

  it('falls back to the current month when an end is missing', () => {
    expect(rangeFromQuery({ from: '2026-03-01' }, TODAY)).toEqual({
      from: '2026-03-01',
      to: '2026-08-31',
    });
  });

  it('ignores a malformed date rather than passing it to the API', () => {
    expect(rangeFromQuery({ from: '01/03/2026', to: '2026-03-31' }, TODAY).from).toBe('2026-08-01');
  });

  it('ignores a repeated query parameter, which arrives as an array', () => {
    expect(rangeFromQuery({ from: ['2026-03-01', '2026-04-01'] }, TODAY).from).toBe('2026-08-01');
  });
});

describe('range validation', () => {
  it('accepts a single day', () => {
    expect(rangeError({ from: TODAY, to: TODAY })).toBeNull();
  });

  it('refuses an end before the start, as the API does', () => {
    expect(rangeError({ from: '2026-08-10', to: '2026-08-01' })).not.toBeNull();
  });

  it('refuses a malformed date', () => {
    expect(rangeError({ from: '2026-8-1', to: TODAY })).not.toBeNull();
  });

  it('refuses a date that does not exist', () => {
    expect(rangeError({ from: '2026-02-30', to: '2026-03-01' })).not.toBeNull();
  });
});

describe('range display', () => {
  it('reads dates the way the shop writes them', () => {
    expect(formatCalendarDate('2026-08-07')).toBe('07/08/2026');
  });

  it('spells the range out', () => {
    expect(formatRange({ from: '2026-08-01', to: '2026-08-31' })).toBe('01/08/2026 – 31/08/2026');
  });
});
