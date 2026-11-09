/**
 * Rivulent: whether an interview's window has closed. The Network writes
 * `expiresAt` when it creates the interview; a null value never expires.
 */
export function isInterviewExpired(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return expiresAt != null && expiresAt.getTime() <= now.getTime();
}
