export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.message === "string" && error.message
    ? error.message
    : fallback;
}
