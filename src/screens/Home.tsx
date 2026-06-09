import { useState } from "react";
import { useAppData } from "../data/AppDataContext";
import { useT } from "../i18n/useT";
import StudentDialog from "../components/StudentDialog";
import { effectivePrice, formatMoney, isPaused, isPostpaid } from "../util/format";
import type { PaymentType, Student } from "../data/types";

export default function Home() {
  const { data, loaded, update } = useAppData();
  const { t } = useT();
  const { settings, students } = data;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setDialogOpen(true);
  }

  function deleteStudent(student: Student) {
    const ok = window.confirm(t("home.deleteConfirm", { name: student.name }));
    if (!ok) return;
    update((d) => {
      d.students = d.students.filter((s) => s.id !== student.id);
      d.lessons = d.lessons.filter((l) => l.studentId !== student.id);
      d.records = d.records.filter((r) => r.studentId !== student.id);
    });
  }

  function togglePause(student: Student) {
    update((d) => {
      const target = d.students.find((s) => s.id === student.id);
      if (!target) return;
      target.pausedSince = target.pausedSince ? null : new Date().toISOString();
    });
  }

  function handleSubmit(values: {
    name: string;
    customPrice: number | null;
    prepaidBalance: number;
    phone: string | null;
    paymentType: PaymentType;
  }) {
    if (editing) {
      const id = editing.id;
      update((d) => {
        const target = d.students.find((s) => s.id === id);
        if (target) {
          target.name = values.name;
          target.customPrice = values.customPrice;
          target.prepaidBalance = values.prepaidBalance;
          target.phone = values.phone;
          target.paymentType = values.paymentType;
        }
      });
    } else {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        name: values.name,
        customPrice: values.customPrice,
        prepaidBalance: values.prepaidBalance,
        phone: values.phone,
        paymentType: values.paymentType,
        pausedSince: null,
        createdAt: new Date().toISOString(),
      };
      update((d) => {
        d.students.push(newStudent);
      });
    }
    setDialogOpen(false);
  }

  if (!loaded) {
    return (
      <div className="screen">
        <p className="muted">{t("common.loading")}</p>
      </div>
    );
  }

  const sharedProps = {
    showPhone: settings.showPhoneColumn,
    onEdit: openEdit,
    onDelete: deleteStudent,
    onTogglePause: togglePause,
    formatPrice: (s: Student) =>
      formatMoney(effectivePrice(s, settings), settings.currency),
    formatBalance: (s: Student) =>
      formatMoney(s.prepaidBalance, settings.currency),
    t,
  };

  return (
    <div className="screen">
      <header className="screen-header screen-header-row">
        <div>
          <h1>{t("home.title")}</h1>
          <p className="screen-subtitle">
            {students.length === 0
              ? t("home.subtitle.empty")
              : t("home.subtitle.count", { count: students.length })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          {t("home.addButton")}
        </button>
      </header>

      {students.length === 0 ? (
        <div className="card placeholder">
          <div className="placeholder-icon">👥</div>
          <h2>{t("home.empty.title")}</h2>
          <p>{t("home.empty.body")}</p>
        </div>
      ) : settings.studentsView === "table" ? (
        <StudentsTable students={students} {...sharedProps} />
      ) : (
        <StudentsCards students={students} {...sharedProps} />
      )}

      <StudentDialog
        open={dialogOpen}
        student={editing}
        settings={settings}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

type ListProps = {
  students: Student[];
  showPhone: boolean;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  onTogglePause: (s: Student) => void;
  formatPrice: (s: Student) => string;
  formatBalance: (s: Student) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

function balanceCell(s: Student, formatBalance: (s: Student) => string, t: ListProps["t"]) {
  if (isPostpaid(s)) {
    return <span className="badge badge-postpaid">{t("home.postpaidTag")}</span>;
  }
  return (
    <span
      className={`balance ${s.prepaidBalance < 0 ? "negative" : s.prepaidBalance === 0 ? "zero" : "positive"}`}
    >
      {formatBalance(s)}
    </span>
  );
}

function ActionButtons({
  student,
  onEdit,
  onDelete,
  onTogglePause,
  t,
}: {
  student: Student;
  onEdit: ListProps["onEdit"];
  onDelete: ListProps["onDelete"];
  onTogglePause: ListProps["onTogglePause"];
  t: ListProps["t"];
}) {
  const paused = isPaused(student);
  return (
    <div className="row-actions">
      <button
        className={`icon-btn ${paused ? "icon-btn-active" : ""}`}
        title={paused ? t("home.tooltip.resume") : t("home.tooltip.pause")}
        onClick={() => onTogglePause(student)}
      >
        {paused ? "▶" : "⏸"}
      </button>
      <button
        className="icon-btn"
        title={t("common.edit")}
        onClick={() => onEdit(student)}
      >
        ✏️
      </button>
      <button
        className="icon-btn icon-btn-danger"
        title={t("common.delete")}
        onClick={() => onDelete(student)}
      >
        🗑️
      </button>
    </div>
  );
}

function StudentsTable({
  students,
  showPhone,
  onEdit,
  onDelete,
  onTogglePause,
  formatPrice,
  formatBalance,
  t,
}: ListProps) {
  return (
    <div className="card table-card">
      <table className="students-table">
        <thead>
          <tr>
            <th>{t("home.col.name")}</th>
            <th>{t("home.col.price")}</th>
            <th>{t("home.col.balance")}</th>
            {showPhone && <th>{t("home.col.phone")}</th>}
            <th className="th-actions">{t("home.col.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className={isPaused(s) ? "row-paused" : ""}>
              <td>
                <div className="cell-name">
                  <div className="avatar">{initials(s.name)}</div>
                  <div>
                    <div className="cell-name-text">{s.name}</div>
                    <div className="cell-tags">
                      {s.customPrice !== null && (
                        <span className="cell-tag">{t("home.customPriceTag")}</span>
                      )}
                      {isPaused(s) && (
                        <span className="cell-tag cell-tag-paused">
                          {t("home.pausedTag")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td>{formatPrice(s)}</td>
              <td>{balanceCell(s, formatBalance, t)}</td>
              {showPhone && <td>{s.phone ?? <span className="muted-inline">—</span>}</td>}
              <td>
                <ActionButtons
                  student={s}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePause={onTogglePause}
                  t={t}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentsCards({
  students,
  showPhone,
  onEdit,
  onDelete,
  onTogglePause,
  formatPrice,
  formatBalance,
  t,
}: ListProps) {
  return (
    <div className="students-cards">
      {students.map((s) => (
        <article
          key={s.id}
          className={`card student-card ${isPaused(s) ? "row-paused" : ""}`}
        >
          <header className="student-card-head">
            <div className="cell-name">
              <div className="avatar avatar-lg">{initials(s.name)}</div>
              <div>
                <div className="student-card-name">{s.name}</div>
                <div className="cell-tags">
                  {s.customPrice !== null && (
                    <span className="cell-tag">{t("home.customPriceTag")}</span>
                  )}
                  {isPaused(s) && (
                    <span className="cell-tag cell-tag-paused">
                      {t("home.pausedTag")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ActionButtons
              student={s}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePause={onTogglePause}
              t={t}
            />
          </header>

          <dl className="student-card-fields">
            <div>
              <dt>{t("home.col.price")}</dt>
              <dd>{formatPrice(s)}</dd>
            </div>
            <div>
              <dt>{t("home.col.balance")}</dt>
              <dd>{balanceCell(s, formatBalance, t)}</dd>
            </div>
            {showPhone && (
              <div>
                <dt>{t("home.col.phone")}</dt>
                <dd>{s.phone ?? <span className="muted-inline">—</span>}</dd>
              </div>
            )}
          </dl>
        </article>
      ))}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
