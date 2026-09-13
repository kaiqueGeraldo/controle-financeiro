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

export const PRODUCT_TIME_ZONE = "America/Sao_Paulo";
const productDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRODUCT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export function productDateString(instant: Date): string {
  const parts = productDateFormatter.formatToParts(instant);
  return ["year", "month", "day"].map((type) =>
    parts.find((part) => part.type === type)!.value.padStart(type === "year" ? 4 : 2, "0"),
  ).join("-");
}

/** Busca o próximo limite na zona IANA, inclusive dias de 23/25 horas. */
export function delayUntilNextProductDay(now: Date): number {
  const today = productDateString(now);
  let low = now.getTime();
  let high = low + 36 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (productDateString(new Date(middle)) === today) low = middle;
    else high = middle;
  }
  return high - now.getTime();
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseCalendarDate(value);
  if (!date) throw new Error("Data civil inválida");
  date.setUTCDate(date.getUTCDate() + days);
  return [String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")].join("-");
}

/** Preserva a janela segunda–domingo existente; não define streak/recorrência. */
export function calendarWeekBounds(today: string): { monday: string; sunday: string } {
  const date = parseCalendarDate(today);
  if (!date) throw new Error("Data civil inválida");
  const day = date.getUTCDay();
  const monday = addCalendarDays(today, day === 0 ? -6 : 1 - day);
  return { monday, sunday: addCalendarDays(monday, 6) };
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
