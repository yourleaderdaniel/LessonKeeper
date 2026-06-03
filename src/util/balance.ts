import type { AppData, LessonRecord } from "../data/types";
import { effectivePrice } from "./format";
import { occurrencesInRange, ymd, parseHHMM } from "./dates";

/**
 * Process all lesson occurrences that have happened since `data.lastProcessedAt`
 * up to `now`. For each new occurrence with no existing record, create a
 * "completed" record and deduct the student's effective price from their
 * prepaid balance (balance can go negative — that's the student's debt).
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

  // First pass: figure out whether there are any new occurrences to process.
  // If not, return the SAME data reference so React/save don't see a change.
  let workToDo = false;
  outer: for (const lesson of data.lessons) {
    const student = data.students.find((s) => s.id === lesson.studentId);
    if (!student) continue;
    for (const moment of occurrencesInRange(
      lesson.weekday,
      lesson.time,
      since,
      now,
    )) {
      const dateStr = ymd(moment);
      const existing = data.records.find(
        (r) => r.lessonId === lesson.id && r.date === dateStr,
      );
      if (!existing) {
        workToDo = true;
        break outer;
      }
    }
  }

  if (!workToDo) return data;

  // We have at least one new occurrence. Clone and apply.
  const next = structuredClone(data);

  for (const lesson of next.lessons) {
    const student = next.students.find((s) => s.id === lesson.studentId);
    if (!student) continue;

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
      if (existing) continue; // already accounted for (completed or cancelled)

      const price = effectivePrice(student, next.settings);
      student.prepaidBalance -= price;
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
 * Toggle an occurrence's status between "completed" and "cancelled".
 * - completed → cancelled: refund the deducted amount.
 * - cancelled (past) → completed: deduct again with the current effective price.
 * - cancelled (future) → undo cancellation: delete the record entirely so
 *   future auto-processing handles it normally.
 * - no record + future: create a "cancelled" record (so auto-processing will
 *   skip this occurrence).
 * - no record + past: create a "cancelled" record with 0 deducted (treats as
 *   "the user is marking this past instance as not having happened").
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
      // Past pending → mark as completed and deduct now.
      const price = effectivePrice(student, next.settings);
      student.prepaidBalance -= price;
      next.records.push({
        id: crypto.randomUUID(),
        lessonId,
        studentId: student.id,
        date: dateStr,
        status: "completed",
        amountDeducted: price,
      });
    } else {
      // Future → cancel this occurrence so auto-processing skips it.
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
    // Refund and mark cancelled.
    student.prepaidBalance += existing.amountDeducted;
    existing.amountDeducted = 0;
    existing.status = "cancelled";
  } else {
    // status === "cancelled" → restore.
    if (occurrence <= now) {
      // Past occurrence: re-deduct at the current effective price.
      const price = effectivePrice(student, next.settings);
      student.prepaidBalance -= price;
      existing.amountDeducted = price;
      existing.status = "completed";
    } else {
      // Future occurrence: just remove the cancellation record entirely.
      next.records = next.records.filter((r) => r.id !== existing.id);
    }
  }
  return next;
}

/** Find the record (if any) for a specific lesson + occurrence date. */
export function findRecord(
  records: LessonRecord[],
  lessonId: string,
  occurrence: Date,
): LessonRecord | undefined {
  const dateStr = ymd(occurrence);
  return records.find((r) => r.lessonId === lessonId && r.date === dateStr);
}

/**
 * Compute the canonical Date moment for a (weekday, time) recurring lesson
 * on the same week as `now` (used by UI to highlight "this week's instance").
 */
export function thisWeeksMoment(
  weekday: number,
  time: string,
  now: Date = new Date(),
): Date {
  const [h, m] = parseHHMM(time);
  const cur = new Date(now);
  const todayWeekday = (cur.getDay() + 6) % 7; // 0=Mon
  cur.setDate(cur.getDate() + (weekday - todayWeekday));
  cur.setHours(h, m, 0, 0);
  return cur;
}
