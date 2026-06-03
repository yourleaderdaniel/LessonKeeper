import { jsDayToWeekday } from "../data/weekdays";
import type { Weekday } from "../data/types";

/** Format a Date as "YYYY-MM-DD" using local time. */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse "HH:mm" into [hours, minutes] (both 0 if invalid).
 */
export function parseHHMM(time: string): [number, number] {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!m) return [0, 0];
  return [Number(m[1]), Number(m[2])];
}

/**
 * Build a Date for a specific weekday/time combo in the calendar week of `relativeTo`.
 */
export function dateForWeekdayInWeekOf(
  weekday: Weekday,
  time: string,
  relativeTo: Date,
): Date {
  const todayWeekday = jsDayToWeekday(relativeTo.getDay());
  const offset = weekday - todayWeekday;
  const [h, m] = parseHHMM(time);
  const d = new Date(relativeTo);
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Generate all occurrence Date objects of a recurring (weekday, time) lesson
 * strictly after `since` and up to and including `until`.
 */
export function occurrencesInRange(
  weekday: Weekday,
  time: string,
  since: Date,
  until: Date,
): Date[] {
  const result: Date[] = [];
  const [h, m] = parseHHMM(time);

  const cur = new Date(since);
  cur.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    if (jsDayToWeekday(cur.getDay()) === weekday) break;
    cur.setDate(cur.getDate() + 1);
  }
  cur.setHours(h, m, 0, 0);

  while (cur <= until) {
    if (cur > since) result.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return result;
}

/**
 * Generate `pastCount` past + this-week-occurrence + `futureCount` future
 * occurrences around `now`.
 */
export function occurrencesAround(
  weekday: Weekday,
  time: string,
  now: Date,
  pastCount: number,
  futureCount: number,
): Date[] {
  const thisWeek = dateForWeekdayInWeekOf(weekday, time, now);
  const result: Date[] = [];
  for (let i = pastCount; i >= 1; i--) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - 7 * i);
    result.push(d);
  }
  result.push(thisWeek);
  for (let i = 1; i <= futureCount; i++) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() + 7 * i);
    result.push(d);
  }
  return result;
}

/**
 * Locale-aware short date like "Пн, 8 черв." or "Mon, Jun 8".
 * Uses Intl.DateTimeFormat so each language renders correctly.
 */
export function formatDateShort(d: Date, locale: string): string {
  const f = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  // Capitalize first letter so RU/UK look polished.
  const out = f.format(d);
  return out.charAt(0).toUpperCase() + out.slice(1);
}
