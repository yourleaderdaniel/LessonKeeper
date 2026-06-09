import {
  CURRENCY_SYMBOLS,
  type Currency,
  type Student,
  type AppSettings,
  type TimeFormat,
} from "../data/types";

export function formatMoney(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  const formatted = isWhole
    ? rounded.toLocaleString("ru-RU")
    : rounded.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${formatted} ${symbol}`;
}

/** Effective lesson price for a student (custom override or default). */
export function effectivePrice(student: Student, settings: AppSettings): number {
  return student.customPrice ?? settings.defaultPrice;
}

/** True if this student pays cash after each lesson (no prepaid balance). */
export function isPostpaid(student: Student): boolean {
  return student.paymentType === "postpaid";
}

/** True if this student is currently on a break (vacation, illness, etc). */
export function isPaused(student: Student): boolean {
  return student.pausedSince !== null && student.pausedSince !== undefined;
}

/** Format a stored "HH:mm" (24h) time for display, honoring the user's setting. */
export function formatTime(time24: string, format: TimeFormat): string {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time24);
  if (!m) return time24;
  const h = Number(m[1]);
  const mm = m[2];
  if (format === "24h") return `${m[1]}:${mm}`;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${period}`;
}
