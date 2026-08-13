export const CLIENT_FINISH_REASONS = [
  'stop',
  'length',
  'content-filter',
  'tool-calls',
  'error',
  'unknown',
] as const;

export type ClientFinishReason = (typeof CLIENT_FINISH_REASONS)[number];

export function normalizeClientFinishReason(
  value: unknown
): ClientFinishReason | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replaceAll('_', '-');
  return CLIENT_FINISH_REASONS.includes(normalized as ClientFinishReason)
    ? (normalized as ClientFinishReason)
    : 'unknown';
}
