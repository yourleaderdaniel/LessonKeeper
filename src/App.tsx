import { useState } from "react";
import Sidebar, { type ScreenId } from "./components/Sidebar";
import Home from "./screens/Home";
import Calendar from "./screens/Calendar";
import Profit from "./screens/Profit";
import Notes from "./screens/Notes";
import Settings from "./screens/Settings";
import { useAppData } from "./data/AppDataContext";
import { useT } from "./i18n/useT";
import "./App.css";

function App() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const { loadState } = useAppData();
  const { t } = useT();

  return (
    <div className="app">
      <Sidebar active={screen} onChange={setScreen} />
      <main className="main">
        {loadState === "failed" && (
          <div className="alert alert-danger">
            <strong>{t("alert.loadFailed.title")}</strong>
            <div>
              {t("alert.loadFailed.body", {
                path: "%APPDATA%\\com.lessonkeeper.app\\lessonkeeper.json",
              })}
            </div>
          </div>
        )}
        {screen === "home" && <Home />}
        {screen === "calendar" && <Calendar />}
        {screen === "profit" && <Profit />}
        {screen === "notes" && <Notes />}
        {screen === "settings" && <Settings />}
      </main>
    </div>
  );
}

export default App;
