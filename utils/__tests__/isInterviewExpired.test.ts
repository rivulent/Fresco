import { describe, expect, it } from 'vitest';

import { isInterviewExpired } from '~/utils/isInterviewExpired';

const now = new Date('2026-11-09T12:00:00.000Z');

describe('isInterviewExpired', () => {
  it('never expires an interview without a deadline', () => {
    expect(isInterviewExpired(null, now)).toBe(false);
    expect(isInterviewExpired(undefined, now)).toBe(false);
  });

  it('is open before the deadline', () => {
    expect(isInterviewExpired(new Date('2026-11-09T12:00:01.000Z'), now)).toBe(
      false,
    );
  });

  it('is closed at and after the deadline', () => {
    expect(isInterviewExpired(now, now)).toBe(true);
    expect(isInterviewExpired(new Date('2026-11-08T12:00:00.000Z'), now)).toBe(
      true,
    );
  });
});
