import { useState, useMemo, useEffect } from "react";
import { useAppData } from "../data/AppDataContext";
import { useT } from "../i18n/useT";
import type { Note } from "../data/types";

const TITLE_MAX = 80;
const CONTENT_MAX = 20_000;

export default function Notes() {
  const { data, loaded, update } = useAppData();
  const { t, locale } = useT();

  // Sort notes by updatedAt (most recent first).
  const sortedNotes = useMemo(
    () =>
      [...data.notes].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [data.notes],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    sortedNotes[0]?.id ?? null,
  );

  // If the currently selected note disappears (deleted, imported new data),
  // fall back to the first note in the list.
  useEffect(() => {
    if (selectedId && !data.notes.find((n) => n.id === selectedId)) {
      setSelectedId(sortedNotes[0]?.id ?? null);
    }
  }, [data.notes, selectedId, sortedNotes]);

  const selected = data.notes.find((n) => n.id === selectedId) ?? null;

  function createNote() {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now,
    };
    update((d) => {
      d.notes.push(newNote);
    });
    setSelectedId(newNote.id);
  }

  function deleteNote(id: string) {
    const note = data.notes.find((n) => n.id === id);
    if (!note) return;
    const label = note.title.trim() || t("notes.untitled");
    if (!window.confirm(t("notes.deleteConfirm", { title: label }))) return;
    update((d) => {
      d.notes = d.notes.filter((n) => n.id !== id);
    });
    if (selectedId === id) setSelectedId(null);
  }

  function updateNote(id: string, fields: Partial<Pick<Note, "title" | "content">>) {
    update((d) => {
      const target = d.notes.find((n) => n.id === id);
      if (!target) return;
      if (fields.title !== undefined) {
        target.title = fields.title.slice(0, TITLE_MAX);
      }
      if (fields.content !== undefined) {
        target.content = fields.content.slice(0, CONTENT_MAX);
      }
      target.updatedAt = new Date().toISOString();
    });
  }

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
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="screen notes-screen">
      <header className="screen-header screen-header-row">
        <div>
          <h1>{t("notes.title")}</h1>
          <p className="screen-subtitle">{t("notes.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={createNote}>
          {t("notes.addButton")}
        </button>
      </header>

      <div className="notes-layout card">
        <aside className="notes-list">
          {sortedNotes.length === 0 ? (
            <div className="notes-list-empty">{t("notes.listEmpty")}</div>
          ) : (
            sortedNotes.map((note) => {
              const preview = note.content
                .split("\n")
                .find((l) => l.trim().length > 0) ?? "";
              return (
                <button
                  key={note.id}
                  className={`notes-list-item ${selectedId === note.id ? "active" : ""}`}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="notes-list-title">
                    {note.title.trim() || t("notes.untitled")}
                  </div>
                  <div className="notes-list-preview">
                    {preview || t("notes.noContent")}
                  </div>
                  <div className="notes-list-date">
                    {dateFormatter.format(new Date(note.updatedAt))}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        <main className="notes-editor">
          {!selected ? (
            <div className="notes-editor-empty">
              <div className="placeholder-icon">📝</div>
              <p>{t("notes.editorEmpty")}</p>
            </div>
          ) : (
            <>
              <div className="notes-editor-head">
                <input
                  className="notes-title-input"
                  type="text"
                  value={selected.title}
                  onChange={(e) =>
                    updateNote(selected.id, { title: e.target.value })
                  }
                  placeholder={t("notes.titlePlaceholder")}
                  maxLength={TITLE_MAX}
                />
                <button
                  className="icon-btn icon-btn-danger"
                  title={t("common.delete")}
                  onClick={() => deleteNote(selected.id)}
                >
                  🗑️
                </button>
              </div>
              <textarea
                className="notes-content-input"
                value={selected.content}
                onChange={(e) =>
                  updateNote(selected.id, { content: e.target.value })
                }
                placeholder={t("notes.contentPlaceholder")}
                maxLength={CONTENT_MAX}
                spellCheck={false}
              />
              <div className="notes-editor-foot">
                <span className="muted-inline">
                  {t("notes.charCount", {
                    count: selected.content.length,
                    max: CONTENT_MAX,
                  })}
                </span>
                <span className="muted-inline">
                  {t("notes.updatedAt", {
                    date: dateFormatter.format(new Date(selected.updatedAt)),
                  })}
                </span>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
