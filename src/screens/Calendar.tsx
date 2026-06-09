import { useState, useMemo } from "react";
import { useAppData } from "../data/AppDataContext";
import { useT } from "../i18n/useT";
import LessonDialog from "../components/LessonDialog";
import LessonHistoryDialog from "../components/LessonHistoryDialog";
import { WEEKDAY_IDS, weekdayName } from "../data/weekdays";
import { effectivePrice, formatMoney, formatTime, isPaused } from "../util/format";
import {
  findRecord,
  thisWeeksMoment,
  toggleOccurrence,
} from "../util/balance";
import type { Lesson, Weekday } from "../data/types";

export default function Calendar() {
  const { data, loaded, update } = useAppData();
  const { t, locale } = useT();
  const { settings, students, lessons, records } = data;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [defaultDay, setDefaultDay] = useState<Weekday>(0);

  const [historyLesson, setHistoryLesson] = useState<Lesson | null>(null);

  const byDay = useMemo(() => {
    const map: Record<Weekday, Lesson[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    for (const l of lessons) {
      map[l.weekday].push(l);
    }
    for (const day of Object.keys(map) as unknown as Weekday[]) {
      map[day].sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [lessons]);

  const studentById = useMemo(() => {
    const m = new Map<string, (typeof students)[number]>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  function openAdd(day: Weekday) {
    setEditing(null);
    setDefaultDay(day);
    setDialogOpen(true);
  }

  function openEdit(lesson: Lesson) {
    setEditing(lesson);
    setDialogOpen(true);
  }

  function deleteLesson(lesson: Lesson) {
    const student = studentById.get(lesson.studentId);
    const ok = window.confirm(
      t("calendar.deleteConfirm", {
        name: student?.name ?? "—",
        time: formatTime(lesson.time, settings.timeFormat),
      }),
    );
    if (!ok) return;
    update((d) => {
      d.lessons = d.lessons.filter((l) => l.id !== lesson.id);
    });
  }

  function handleSubmit(values: {
    studentId: string;
    weekday: Weekday;
    time: string;
  }) {
    if (editing) {
      const id = editing.id;
      update((d) => {
        const target = d.lessons.find((l) => l.id === id);
        if (target) {
          target.studentId = values.studentId;
          target.weekday = values.weekday;
          target.time = values.time;
        }
      });
    } else {
      const newLesson: Lesson = {
        id: crypto.randomUUID(),
        studentId: values.studentId,
        weekday: values.weekday,
        time: values.time,
      };
      update((d) => {
        d.lessons.push(newLesson);
      });
    }
    setDialogOpen(false);
  }

  function handleToggleOccurrence(occurrence: Date) {
    if (!historyLesson) return;
    const id = historyLesson.id;
    update((d) => {
      const next = toggleOccurrence(d, id, occurrence);
      d.students = next.students;
      d.records = next.records;
    });
  }

  if (!loaded) {
    return (
      <div className="screen">
        <p className="muted">{t("common.loading")}</p>
      </div>
    );
  }

  const totalLessons = lessons.length;
  const now = new Date();

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>{t("calendar.title")}</h1>
        <p className="screen-subtitle">
          {totalLessons === 0
            ? students.length === 0
              ? t("calendar.subtitle.empty.noStudents")
              : t("calendar.subtitle.empty.noLessons")
            : t("calendar.subtitle.count", { count: totalLessons })}
        </p>
      </header>

      <div className="week-grid">
        {WEEKDAY_IDS.map((id) => {
          const dayLessons = byDay[id];
          return (
            <div key={id} className="card day-card">
              <div className="day-card-header">
                <span className="day-card-name">{weekdayName(id, locale)}</span>
                <span className="day-card-count">{dayLessons.length}</span>
              </div>

              <div className="day-lessons">
                {dayLessons.length === 0 ? (
                  <div className="day-card-empty">{t("calendar.dayEmpty")}</div>
                ) : (
                  dayLessons.map((lesson) => {
                    const student = studentById.get(lesson.studentId);
                    const priceText = student
                      ? formatMoney(
                          effectivePrice(student, settings),
                          settings.currency,
                        )
                      : "";
                    const thisMoment = thisWeeksMoment(
                      lesson.weekday,
                      lesson.time,
                      now,
                    );
                    const thisWeekRecord = findRecord(
                      records,
                      lesson.id,
                      thisMoment,
                    );
                    const isCancelledThisWeek =
                      thisWeekRecord?.status === "cancelled";
                    const studentPaused = student && isPaused(student);
                    const dimmedClass = isCancelledThisWeek
                      ? "lesson-row-cancelled"
                      : studentPaused
                        ? "lesson-row-paused"
                        : "";
                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-row ${dimmedClass}`}
                      >
                        <div className="lesson-time">
                          {formatTime(lesson.time, settings.timeFormat)}
                        </div>
                        <div className="lesson-info">
                          <div className="lesson-student">
                            {student?.name ?? t("calendar.studentDeleted")}
                            {studentPaused && (
                              <span className="cell-tag cell-tag-paused lesson-row-tag">
                                {t("home.pausedTag")}
                              </span>
                            )}
                          </div>
                          {student && (
                            <div className="lesson-price">{priceText}</div>
                          )}
                        </div>
                        <div className="lesson-actions">
                          <button
                            className="icon-btn"
                            title={t("calendar.tooltip.history")}
                            onClick={() => setHistoryLesson(lesson)}
                            disabled={!student}
                          >
                            🚫
                          </button>
                          <button
                            className="icon-btn"
                            title={t("calendar.tooltip.edit")}
                            onClick={() => openEdit(lesson)}
                          >
                            ✏️
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            title={t("calendar.tooltip.delete")}
                            onClick={() => deleteLesson(lesson)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                className="btn btn-ghost btn-block"
                onClick={() => openAdd(id)}
                disabled={students.length === 0}
              >
                {t("calendar.addLesson")}
              </button>
            </div>
          );
        })}
      </div>

      <LessonDialog
        open={dialogOpen}
        lesson={editing}
        defaultWeekday={defaultDay}
        students={students}
        settings={settings}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <LessonHistoryDialog
        open={historyLesson !== null}
        lesson={historyLesson}
        student={
          historyLesson
            ? (studentById.get(historyLesson.studentId) ?? null)
            : null
        }
        records={records}
        settings={settings}
        onClose={() => setHistoryLesson(null)}
        onToggle={handleToggleOccurrence}
      />
    </div>
  );
}
