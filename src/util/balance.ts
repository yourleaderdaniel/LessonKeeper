import type { AppData, LessonRecord } from "../data/types";
import { effectivePrice, isPaused, isPostpaid } from "./format";
import { occurrencesInRange, ymd, parseHHMM } from "./dates";

/**
 * Process all lesson occurrences that have happened since `data.lastProcessedAt`
 * up to `now`. For each new occurrence with no existing record, create a
 * "completed" record with `amountDeducted = effective price`.
 *
 * - Prepaid students: the price is also subtracted from `prepaidBalance`
 *   (balance can go negative — that's the student's debt).
 * - Postpaid students: balance is left untouched; the price is recorded so it
 *   still contributes to the teacher's Profit total.
 *
 * On the very first run (`lastProcessedAt === null`), we DO NOT retroactively
 * deduct anything. We only set `lastProcessedAt` to `now` and start tracking
 * from that point forward.
 */
export function processElapsedLessons(
  data: AppData,
  now: Date = new Date(),
): AppData {
  if (data.lastProcessedAt === null) {
    return { ...data, lastProcessedAt: now.toISOString() };
  }
  const since = new Date(data.lastProcessedAt);
  if (since >= now) return data;

  // Quick check: any lesson occurrences in the [since, now] window at all?
  // If so, we always advance `lastProcessedAt` past them, even if the only
  // occurrences belong to paused students. Otherwise, the next un-pause
  // would cause retroactive processing of the entire break period.
  let anyInRange = false;
  for (const lesson of data.lessons) {
    if (
      occurrencesInRange(lesson.weekday, lesson.time, since, now).length > 0
    ) {
      anyInRange = true;
      break;
    }
  }
  if (!anyInRange) return data;

  const next = structuredClone(data);

  for (const lesson of next.lessons) {
    const student = next.students.find((s) => s.id === lesson.studentId);
    if (!student || isPaused(student)) continue; // pause = skip entirely

    for (const moment of occurrencesInRange(
      lesson.weekday,
      lesson.time,
      since,
      now,
    )) {
      const dateStr = ymd(moment);
      const existing = next.records.find(
        (r) => r.lessonId === lesson.id && r.date === dateStr,
      );
      if (existing) continue;

      const price = effectivePrice(student, next.settings);
      if (!isPostpaid(student)) {
        student.prepaidBalance -= price;
      }
      next.records.push({
        id: crypto.randomUUID(),
        lessonId: lesson.id,
        studentId: student.id,
        date: dateStr,
        status: "completed",
        amountDeducted: price,
      });
    }
  }

  next.lastProcessedAt = now.toISOString();
  return next;
}

/**
 * Toggle an occurrence's status. Balance is only adjusted for prepaid
 * students — for postpaid students we just flip the record's status.
 * The `amountDeducted` field is left intact on cancel so historical earnings
 * can be restored or excluded from Profit by status filter.
 */
export function toggleOccurrence(
  data: AppData,
  lessonId: string,
  occurrence: Date,
  now: Date = new Date(),
): AppData {
  const next = structuredClone(data);
  const lesson = next.lessons.find((l) => l.id === lessonId);
  if (!lesson) return next;
  const student = next.students.find((s) => s.id === lesson.studentId);
  if (!student) return next;

  const dateStr = ymd(occurrence);
  const existing = next.records.find(
    (r) => r.lessonId === lessonId && r.date === dateStr,
  );

  if (!existing) {
    if (occurrence <= now) {
      // Past pending → mark as completed (and deduct now, for prepaid only).
      const price = effectivePrice(student, next.settings);
      if (!isPostpaid(student)) {
        student.prepaidBalance -= price;
      }
      next.records.push({
        id: crypto.randomUUID(),
        lessonId,
        studentId: student.id,
        date: dateStr,
        status: "completed",
        amountDeducted: price,
      });
    } else {
      // Future → cancel so auto-processing skips it.
      next.records.push({
        id: crypto.randomUUID(),
        lessonId,
        studentId: student.id,
        date: dateStr,
        status: "cancelled",
        amountDeducted: 0,
      });
    }
  } else if (existing.status === "completed") {
    // Refund (prepaid) and mark cancelled. Keep amountDeducted so we can
    // restore the same price if the user toggles it back.
    if (!isPostpaid(student)) {
      student.prepaidBalance += existing.amountDeducted;
    }
    existing.status = "cancelled";
  } else {
    // status === "cancelled" → restore.
    if (occurrence <= now) {
      // Past: re-deduct at current effective price (prepaid only).
      const price = effectivePrice(student, next.settings);
      if (!isPostpaid(student)) {
        student.prepaidBalance -= price;
      }
      existing.amountDeducted = price;
      existing.status = "completed";
    } else {
      // Future: remove the cancellation record entirely.
      next.records = next.records.filter((r) => r.id !== existing.id);
    }
  }
  return next;
}

export function findRecord(
  records: LessonRecord[],
  lessonId: string,
  occurrence: Date,
): LessonRecord | undefined {
  const dateStr = ymd(occurrence);
  return records.find((r) => r.lessonId === lessonId && r.date === dateStr);
}

export function thisWeeksMoment(
  weekday: number,
  time: string,
  now: Date = new Date(),
): Date {
  const [h, m] = parseHHMM(time);
  const cur = new Date(now);
  const todayWeekday = (cur.getDay() + 6) % 7;
  cur.setDate(cur.getDate() + (weekday - todayWeekday));
  cur.setHours(h, m, 0, 0);
  return cur;
}
