/** Datas civis não representam instantes e não devem sofrer conversão de fuso. */
function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

export function formatCalendarDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit", month: "2-digit", year: "numeric",
  },
): string {
  const date = parseCalendarDate(value);
  return date
    ? date.toLocaleDateString("pt-BR", { ...options, timeZone: "UTC" })
    : "—";
}

export function localDateString(date: Date = new Date()): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isCalendarDatePast(
  value: string,
  today: Date | string = new Date(),
): boolean {
  const todayValue = typeof today === "string" ? today : localDateString(today);
  return (
    parseCalendarDate(value) !== null &&
    parseCalendarDate(todayValue) !== null &&
    value < todayValue
  );
}

/** Competências são ancoradas no dia 1 para impedir overflow de dias 29–31. */
export function shiftMonth(date: Date, direction: number): Date {
  const shifted = new Date(date.getTime());
  shifted.setDate(1);
  shifted.setMonth(shifted.getMonth() + direction);
  shifted.setHours(0, 0, 0, 0);
  return shifted;
}
