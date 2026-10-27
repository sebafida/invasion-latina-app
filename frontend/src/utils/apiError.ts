/** FastAPI may return a string or a list of validation errors. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.flatMap(item =>
      item && typeof item.msg === 'string' ? [item.msg] : []
    );
    if (messages.length) return messages.join('\n');
  }
  return fallback;
}
