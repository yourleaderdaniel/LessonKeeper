import { useState, useEffect } from "react";
import Modal from "./Modal";
import TimeInput from "./TimeInput";
import { useT } from "../i18n/useT";
import { WEEKDAY_IDS, weekdayName } from "../data/weekdays";
import type {
  AppSettings,
  Lesson,
  Student,
  Weekday,
} from "../data/types";

type Props = {
  open: boolean;
  lesson: Lesson | null;
  defaultWeekday?: Weekday;
  students: Student[];
  settings: AppSettings;
  onClose: () => void;
  onSubmit: (data: {
    studentId: string;
    weekday: Weekday;
    time: string;
  }) => void;
};

export default function LessonDialog({
  open,
  lesson,
  defaultWeekday,
  students,
  settings,
  onClose,
  onSubmit,
}: Props) {
  const { t, locale } = useT();
  const isEdit = lesson !== null;
  const noStudents = students.length === 0;

  const [studentId, setStudentId] = useState<string>("");
  const [weekday, setWeekday] = useState<Weekday>(0);
  const [time, setTime] = useState<string>("17:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (lesson) {
      setStudentId(lesson.studentId);
      setWeekday(lesson.weekday);
      setTime(lesson.time);
    } else {
      setStudentId(students[0]?.id ?? "");
      setWeekday(defaultWeekday ?? 0);
      setTime("17:00");
    }
    setError(null);
  }, [open, lesson, defaultWeekday, students]);

  function handleSubmit() {
    if (!studentId) {
      setError(t("studentDialog.error.name"));
      return;
    }
    onSubmit({ studentId, weekday, time });
  }

  return (
    <Modal
      open={open}
      title={t(isEdit ? "lessonDialog.titleEdit" : "lessonDialog.titleNew")}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={noStudents}
          >
            {t(isEdit ? "common.save" : "common.add")}
          </button>
        </>
      }
    >
      {noStudents ? (
        <div className="form-error">{t("lessonDialog.noStudents")}</div>
      ) : (
        <div className="form">
          <label className="field">
            <span className="field-label">{t("lessonDialog.field.student")}</span>
            <select
              className="input"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">{t("lessonDialog.field.weekday")}</span>
            <select
              className="input"
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}
            >
              {WEEKDAY_IDS.map((id) => (
                <option key={id} value={id}>
                  {weekdayName(id, locale)}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span className="field-label">
              {t("lessonDialog.field.time", {
                format: t(
                  settings.timeFormat === "24h"
                    ? "lessonDialog.format.24h"
                    : "lessonDialog.format.12h",
                ),
              })}
            </span>
            <TimeInput
              value={time}
              onChange={setTime}
              format={settings.timeFormat}
            />
            <p className="muted">{t("lessonDialog.timeNote")}</p>
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>
      )}
    </Modal>
  );
}
