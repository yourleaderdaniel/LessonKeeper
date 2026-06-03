import Modal from "./Modal";
import { useT } from "../i18n/useT";
import { weekdayName } from "../data/weekdays";
import { formatTime, formatMoney, effectivePrice } from "../util/format";
import { occurrencesAround, formatDateShort, ymd } from "../util/dates";
import { findRecord } from "../util/balance";
import type {
  AppSettings,
  Lesson,
  LessonRecord,
  Student,
} from "../data/types";

type Props = {
  open: boolean;
  lesson: Lesson | null;
  student: Student | null;
  records: LessonRecord[];
  settings: AppSettings;
  onClose: () => void;
  onToggle: (occurrence: Date) => void;
};

type RowState =
  | { kind: "completed"; record: LessonRecord }
  | { kind: "cancelled"; record: LessonRecord }
  | { kind: "scheduled" }
  | { kind: "pending" };

export default function LessonHistoryDialog({
  open,
  lesson,
  student,
  records,
  settings,
  onClose,
  onToggle,
}: Props) {
  const { t, locale } = useT();
  if (!lesson || !student) return null;

  const now = new Date();
  const moments = occurrencesAround(lesson.weekday, lesson.time, now, 4, 4);
  const price = effectivePrice(student, settings);

  return (
    <Modal
      open={open}
      title={t("history.title", { name: student.name })}
      onClose={onClose}
      footer={
        <button className="btn btn-ghost" onClick={onClose}>
          {t("common.close")}
        </button>
      }
    >
      <p className="muted">
        {t("history.subtitle", {
          weekday: weekdayName(lesson.weekday, locale),
          time: formatTime(lesson.time, settings.timeFormat),
        })}
      </p>

      <ul className="history-list">
        {moments.map((moment) => {
          const record = findRecord(records, lesson.id, moment);
          const past = moment <= now;
          let state: RowState;
          if (record) {
            state =
              record.status === "completed"
                ? { kind: "completed", record }
                : { kind: "cancelled", record };
          } else {
            state = past ? { kind: "pending" } : { kind: "scheduled" };
          }

          return (
            <li key={ymd(moment)}>
              <button
                type="button"
                className={`history-row history-${state.kind}`}
                onClick={() => onToggle(moment)}
              >
                <div className="history-date">
                  <span className="history-date-main">
                    {formatDateShort(moment, locale)}
                  </span>
                  <span className="history-date-time">
                    {formatTime(lesson.time, settings.timeFormat)}
                  </span>
                </div>
                <div className="history-status">
                  <StatusBadge
                    state={state}
                    price={price}
                    currency={settings.currency}
                    t={t}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function StatusBadge({
  state,
  price,
  currency,
  t,
}: {
  state: RowState;
  price: number;
  currency: AppSettings["currency"];
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  switch (state.kind) {
    case "completed":
      return (
        <span className="badge badge-completed">
          {t("history.status.completed", {
            amount: formatMoney(state.record.amountDeducted, currency),
          })}
        </span>
      );
    case "cancelled":
      return (
        <span className="badge badge-cancelled">
          {t("history.status.cancelled")}
        </span>
      );
    case "scheduled":
      return (
        <span className="badge badge-scheduled">
          {t("history.status.scheduled", {
            amount: formatMoney(price, currency),
          })}
        </span>
      );
    case "pending":
      return (
        <span className="badge badge-pending">
          {t("history.status.pending")}
        </span>
      );
  }
}
