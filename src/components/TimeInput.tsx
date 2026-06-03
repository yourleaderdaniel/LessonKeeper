import type { TimeFormat } from "../data/types";

type Props = {
  /** Canonical "HH:mm" in 24-hour format. Always how we store the value. */
  value: string;
  onChange: (v: string) => void;
  format: TimeFormat;
};

function parseHHMM(v: string): { h: number; m: number } {
  const re = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v);
  if (!re) return { h: 0, m: 0 };
  return { h: Number(re[1]), m: Number(re[2]) };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function TimeInput({ value, onChange, format }: Props) {
  const { h, m } = parseHHMM(value);
  const isPM = h >= 12;
  const displayHour =
    format === "24h" ? h : h % 12 === 0 ? 12 : h % 12;

  const hourOptions =
    format === "24h"
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i + 1);

  function emit(h24: number, min: number) {
    onChange(`${pad2(h24)}:${pad2(min)}`);
  }

  function setHour(newHour: number) {
    if (format === "24h") {
      emit(newHour, m);
    } else {
      // newHour is 1..12 in 12-hour mode.
      const h24 = isPM
        ? newHour === 12
          ? 12
          : newHour + 12
        : newHour === 12
          ? 0
          : newHour;
      emit(h24, m);
    }
  }

  function setPeriod(target: "AM" | "PM") {
    const wantPM = target === "PM";
    if (wantPM === isPM) return;
    emit((h + 12) % 24, m);
  }

  return (
    <div className="time-input">
      <select
        className="input time-input-select"
        value={displayHour}
        onChange={(e) => setHour(Number(e.target.value))}
        aria-label="Часы"
      >
        {hourOptions.map((opt) => (
          <option key={opt} value={opt}>
            {format === "24h" ? pad2(opt) : String(opt)}
          </option>
        ))}
      </select>
      <span className="time-input-colon">:</span>
      <select
        className="input time-input-select"
        value={m}
        onChange={(e) => emit(h, Number(e.target.value))}
        aria-label="Минуты"
      >
        {Array.from({ length: 60 }, (_, i) => i).map((opt) => (
          <option key={opt} value={opt}>
            {pad2(opt)}
          </option>
        ))}
      </select>
      {format === "12h" && (
        <div className="time-input-period">
          <button
            type="button"
            className={`btn ${!isPM ? "btn-primary" : "btn-ghost"} time-input-period-btn`}
            onClick={() => setPeriod("AM")}
          >
            AM
          </button>
          <button
            type="button"
            className={`btn ${isPM ? "btn-primary" : "btn-ghost"} time-input-period-btn`}
            onClick={() => setPeriod("PM")}
          >
            PM
          </button>
        </div>
      )}
    </div>
  );
}
