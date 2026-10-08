/** Required contract members must belong to this object, including null-prototype objects. */
export function ownRecord(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    fields.every(field => Object.hasOwn(value, field));
}
