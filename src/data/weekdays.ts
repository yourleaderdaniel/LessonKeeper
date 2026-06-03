import type { Weekday } from "./types";

/** Weekday IDs in our internal order: 0=Monday … 6=Sunday. */
export const WEEKDAY_IDS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Format a weekday name using Intl, so each language gets its own names
 * automatically — no need to translate by hand.
 *
 * The trick: 2024-01-01 was a Monday. Add `weekday` days to get a Date
 * whose weekday matches our id.
 */
export function weekdayName(
  weekday: Weekday,
  locale: string,
  style: "long" | "short" = "long",
): string {
  const d = new Date(2024, 0, 1 + weekday); // Jan 1 2024 = Mon
  const name = new Intl.DateTimeFormat(locale, { weekday: style }).format(d);
  // Capitalize first letter so Russian/Ukrainian look nicer ("Понедельник" not "понедельник")
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** JS Date.getDay(): 0=Sunday … 6=Saturday. Our schema: 0=Monday … 6=Sunday. */
export function jsDayToWeekday(jsDay: number): Weekday {
  return ((jsDay + 6) % 7) as Weekday;
}
