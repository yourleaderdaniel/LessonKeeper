import { useMemo } from "react";
import { useAppData } from "../data/AppDataContext";
import { useT } from "../i18n/useT";
import { formatMoney } from "../util/format";
import type { LessonRecord, Student } from "../data/types";

type MonthRow = {
  /** "YYYY-MM" */
  key: string;
  /** Localized label like "Июнь 2026" or "June 2026". */
  label: string;
  count: number;
  total: number;
};

type LessonRow = {
  record: LessonRecord;
  student: Student | undefined;
  /** Date object for the lesson date. */
  date: Date;
};

export default function Profit() {
  const { data, loaded } = useAppData();
  const { t, locale } = useT();

  const studentById = useMemo(() => {
    const m = new Map<string, Student>();
    for (const s of data.students) m.set(s.id, s);
    return m;
  }, [data.students]);

  // Only completed records count as earnings.
  const completed = useMemo(
    () => data.records.filter((r) => r.status === "completed"),
    [data.records],
  );

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Monthly aggregation.
  const monthly = useMemo<MonthRow[]>(() => {
    const buckets = new Map<string, { count: number; total: number }>();
    for (const r of completed) {
      const key = r.date.slice(0, 7); // "YYYY-MM"
      const b = buckets.get(key) ?? { count: 0, total: 0 };
      b.count += 1;
      b.total += r.amountDeducted;
      buckets.set(key, b);
    }
    const rows: MonthRow[] = [];
    for (const [key, val] of buckets.entries()) {
      const [y, m] = key.split("-").map(Number);
      const label = new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(y, m - 1, 1));
      rows.push({
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count: val.count,
        total: val.total,
      });
    }
    rows.sort((a, b) => (a.key < b.key ? 1 : -1)); // newest first
    return rows;
  }, [completed, locale]);

  const thisMonthTotal = useMemo(() => {
    const row = monthly.find((m) => m.key === thisMonthKey);
    return { count: row?.count ?? 0, total: row?.total ?? 0 };
  }, [monthly, thisMonthKey]);

  const last30 = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const r of completed) {
      const d = new Date(r.date + "T00:00:00");
      if (d >= thirtyDaysAgo && d <= now) {
        total += r.amountDeducted;
        count += 1;
      }
    }
    return { count, total };
  }, [completed, thirtyDaysAgo, now]);

  const allTime = useMemo(() => {
    let total = 0;
    for (const r of completed) total += r.amountDeducted;
    return { count: completed.length, total };
  }, [completed]);

  const recent = useMemo<LessonRow[]>(() => {
    const rows: LessonRow[] = completed.map((r) => ({
      record: r,
      student: studentById.get(r.studentId),
      date: new Date(r.date + "T00:00:00"),
    }));
    rows.sort((a, b) => b.date.getTime() - a.date.getTime());
    return rows.slice(0, 25);
  }, [completed, studentById]);

  if (!loaded) {
    return (
      <div className="screen">
        <p className="muted">{t("common.loading")}</p>
      </div>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>{t("profit.title")}</h1>
        <p className="screen-subtitle">{t("profit.subtitle")}</p>
      </header>

      <div className="stats-grid">
        <StatCard
          title={t("profit.stat.thisMonth")}
          amount={formatMoney(thisMonthTotal.total, data.settings.currency)}
          sub={t("profit.lessonsCount", { count: thisMonthTotal.count })}
          tone="primary"
        />
        <StatCard
          title={t("profit.stat.last30")}
          amount={formatMoney(last30.total, data.settings.currency)}
          sub={t("profit.lessonsCount", { count: last30.count })}
        />
        <StatCard
          title={t("profit.stat.allTime")}
          amount={formatMoney(allTime.total, data.settings.currency)}
          sub={t("profit.lessonsCount", { count: allTime.count })}
        />
      </div>

      <section className="card">
        <h2>{t("profit.monthly.title")}</h2>
        {monthly.length === 0 ? (
          <p className="muted">{t("profit.monthly.empty")}</p>
        ) : (
          <table className="profit-table">
            <thead>
              <tr>
                <th>{t("profit.monthly.col.month")}</th>
                <th className="num">{t("profit.monthly.col.lessons")}</th>
                <th className="num">{t("profit.monthly.col.earnings")}</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.key} className={m.key === thisMonthKey ? "row-highlight" : ""}>
                  <td>{m.label}</td>
                  <td className="num">{m.count}</td>
                  <td className="num">
                    {formatMoney(m.total, data.settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>{t("profit.recent.title")}</h2>
        {recent.length === 0 ? (
          <p className="muted">{t("profit.recent.empty")}</p>
        ) : (
          <table className="profit-table">
            <thead>
              <tr>
                <th>{t("profit.recent.col.date")}</th>
                <th>{t("profit.recent.col.student")}</th>
                <th className="num">{t("profit.recent.col.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.record.id}>
                  <td>{dateFormatter.format(row.date)}</td>
                  <td>{row.student?.name ?? t("calendar.studentDeleted")}</td>
                  <td className="num">
                    {formatMoney(row.record.amountDeducted, data.settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  amount,
  sub,
  tone,
}: {
  title: string;
  amount: string;
  sub: string;
  tone?: "primary";
}) {
  return (
    <div className={`card stat-card ${tone === "primary" ? "stat-card-primary" : ""}`}>
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-amount">{amount}</div>
      <div className="stat-card-sub">{sub}</div>
    </div>
  );
}
