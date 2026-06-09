import { useT } from "../i18n/useT";

export type ScreenId = "home" | "calendar" | "profit" | "notes" | "settings";

type Props = {
  active: ScreenId;
  onChange: (id: ScreenId) => void;
};

const items: { id: ScreenId; icon: string; key: string }[] = [
  { id: "home", icon: "🏠", key: "nav.home" },
  { id: "calendar", icon: "📅", key: "nav.calendar" },
  { id: "profit", icon: "💰", key: "nav.profit" },
  { id: "notes", icon: "📝", key: "nav.notes" },
  { id: "settings", icon: "⚙️", key: "nav.settings" },
];

export default function Sidebar({ active, onChange }: Props) {
  const { t } = useT();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img
          src="/lessonkeeper-icon.png"
          className="sidebar-brand-mark sidebar-brand-mark-img"
          alt="LessonKeeper"
        />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">LessonKeeper</div>
          <div className="sidebar-brand-tagline">{t("app.tagline")}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${active === item.id ? "active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span>{t(item.key)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">v0.3.1</div>
    </aside>
  );
}
