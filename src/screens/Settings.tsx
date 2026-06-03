import { useState, useEffect } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useAppData } from "../data/AppDataContext";
import { useT } from "../i18n/useT";
import type {
  Language,
  Currency,
  StudentsView,
  TimeFormat,
  AppData,
} from "../data/types";

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "ru", label: "Русский" },
  { id: "uk", label: "Українська" },
  { id: "en", label: "English" },
];

const CURRENCY_IDS: Currency[] = ["UAH", "RUB", "USD", "EUR"];

export default function Settings() {
  const { data, loaded, update } = useAppData();
  const { t } = useT();
  const { settings } = data;

  const [priceInput, setPriceInput] = useState(String(settings.defaultPrice));
  useEffect(() => {
    setPriceInput(String(settings.defaultPrice));
  }, [settings.defaultPrice]);

  const [busy, setBusy] = useState<null | "export" | "import">(null);

  function setLanguage(id: Language) {
    update((d) => {
      d.settings.language = id;
    });
  }

  function setCurrency(id: Currency) {
    update((d) => {
      d.settings.currency = id;
    });
  }

  function savePrice() {
    const value = Number(priceInput);
    if (!Number.isFinite(value) || value < 0) return;
    update((d) => {
      d.settings.defaultPrice = value;
    });
  }

  function toggleShowPhone() {
    update((d) => {
      d.settings.showPhoneColumn = !d.settings.showPhoneColumn;
    });
  }

  function setStudentsView(view: StudentsView) {
    update((d) => {
      d.settings.studentsView = view;
    });
  }

  function setTimeFormat(format: TimeFormat) {
    update((d) => {
      d.settings.timeFormat = format;
    });
  }

  async function handleExport() {
    if (busy) return;
    setBusy("export");
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const path = await save({
        defaultPath: `lessonkeeper-${today}.json`,
        filters: [{ name: "LessonKeeper", extensions: ["json"] }],
      });
      if (!path) return; // user cancelled
      const json = JSON.stringify(data, null, 2);
      await invoke("write_text_file", { path, contents: json });
      window.alert(t("settings.backup.exportSuccess"));
    } catch (e) {
      window.alert(
        t("settings.backup.exportError", { error: errorMessage(e) }),
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    if (busy) return;
    setBusy("import");
    try {
      const picked = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "LessonKeeper", extensions: ["json"] }],
      });
      if (!picked) return;
      // `open` with multiple:false returns a string in Tauri 2.
      const path = typeof picked === "string" ? picked : picked[0];
      const text = await invoke<string>("read_text_file", { path });
      const parsed = JSON.parse(text) as Partial<AppData>;
      validateImported(parsed);

      if (!window.confirm(t("settings.backup.importConfirm"))) return;

      update((d) => {
        d.version = 1;
        d.settings = { ...d.settings, ...(parsed.settings ?? {}) };
        d.students = parsed.students ?? [];
        d.lessons = parsed.lessons ?? [];
        d.records = parsed.records ?? [];
        d.lastProcessedAt = parsed.lastProcessedAt ?? null;
      });
      window.alert(t("settings.backup.importSuccess"));
    } catch (e) {
      window.alert(
        t("settings.backup.importError", { error: errorMessage(e) }),
      );
    } finally {
      setBusy(null);
    }
  }

  if (!loaded) {
    return (
      <div className="screen">
        <p className="muted">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>{t("settings.title")}</h1>
        <p className="screen-subtitle">{t("settings.subtitle")}</p>
      </header>

      <div className="settings-grid">
        <section className="card">
          <h2>{t("settings.language.title")}</h2>
          <p className="muted">{t("settings.language.body")}</p>
          <div className="row">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                className={`btn ${settings.language === lang.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setLanguage(lang.id)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>{t("settings.currency.title")}</h2>
          <p className="muted">{t("settings.currency.body")}</p>
          <div className="row">
            {CURRENCY_IDS.map((id) => (
              <button
                key={id}
                className={`btn ${settings.currency === id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setCurrency(id)}
              >
                {t(`settings.currency.${id}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>{t("settings.timeFormat.title")}</h2>
          <p className="muted">{t("settings.timeFormat.body")}</p>
          <div className="row">
            <button
              className={`btn ${settings.timeFormat === "24h" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTimeFormat("24h")}
            >
              {t("settings.timeFormat.24h")}
            </button>
            <button
              className={`btn ${settings.timeFormat === "12h" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTimeFormat("12h")}
            >
              {t("settings.timeFormat.12h")}
            </button>
          </div>
        </section>

        <section className="card">
          <h2>{t("settings.studentsView.title")}</h2>
          <p className="muted">{t("settings.studentsView.body")}</p>
          <div className="row">
            <button
              className={`btn ${settings.studentsView === "table" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setStudentsView("table")}
            >
              {t("settings.studentsView.table")}
            </button>
            <button
              className={`btn ${settings.studentsView === "cards" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setStudentsView("cards")}
            >
              {t("settings.studentsView.cards")}
            </button>
          </div>
        </section>

        <section className="card">
          <h2>{t("settings.defaultPrice.title")}</h2>
          <p className="muted">{t("settings.defaultPrice.body")}</p>
          <div className="row">
            <input
              className="input"
              type="number"
              min={0}
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder={t("settings.defaultPrice.placeholder")}
            />
            <button className="btn btn-primary" onClick={savePrice}>
              {t("common.save")}
            </button>
          </div>
        </section>

        <section className="card">
          <h2>{t("settings.phoneColumn.title")}</h2>
          <p className="muted">{t("settings.phoneColumn.body")}</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.showPhoneColumn}
              onChange={toggleShowPhone}
            />
            <span>{t("settings.phoneColumn.toggle")}</span>
          </label>
        </section>

        <section className="card">
          <h2>{t("settings.backup.title")}</h2>
          <p className="muted">{t("settings.backup.body")}</p>
          <div className="row">
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={busy !== null}
            >
              {busy === "export"
                ? t("settings.backup.exporting")
                : t("settings.backup.export")}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleImport}
              disabled={busy !== null}
            >
              {busy === "import"
                ? t("settings.backup.importing")
                : t("settings.backup.import")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function validateImported(parsed: Partial<AppData>): void {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Файл не похож на резервную копию LessonKeeper");
  }
  if (!Array.isArray(parsed.students)) {
    throw new Error("В файле нет массива students");
  }
  if (parsed.lessons !== undefined && !Array.isArray(parsed.lessons)) {
    throw new Error("Поле lessons должно быть массивом");
  }
  if (parsed.records !== undefined && !Array.isArray(parsed.records)) {
    throw new Error("Поле records должно быть массивом");
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
