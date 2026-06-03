import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadAppData, saveAppData } from "./store";
import { DEFAULT_APP_DATA, type AppData } from "./types";
import { processElapsedLessons } from "../util/balance";

type LoadState = "loading" | "ready" | "failed";

type AppDataContextValue = {
  data: AppData;
  loaded: boolean;
  /** True only when the initial load from disk succeeded. */
  loadState: LoadState;
  /**
   * Mutate a copy of the current state. The new state is set; a separate
   * effect persists it to disk after the initial load completes successfully.
   */
  update: (mutator: (draft: AppData) => void) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  // Load data from disk exactly once on mount.
  useEffect(() => {
    let cancelled = false;
    loadAppData()
      .then((loadedData) => {
        if (cancelled) return;
        // Catch up: deduct balances for any lesson occurrences that elapsed
        // while the app was closed (or initialize lastProcessedAt on first run).
        const processed = processElapsedLessons(loadedData);
        setData(processed);
        setLoadState("ready");
      })
      .catch((err) => {
        console.error("Failed to load app data:", err);
        if (!cancelled) setLoadState("failed");
        // Note: we intentionally do NOT set data here. We leave it as the
        // in-memory DEFAULT, but we will NOT save to disk (see effect below),
        // so the existing on-disk file is preserved untouched.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save whenever `data` changes — but ONLY if the initial load fully
  // succeeded. This prevents overwriting a good file with in-memory defaults
  // if the initial load failed for any reason.
  useEffect(() => {
    if (loadState !== "ready") return;
    saveAppData(data).catch((err) =>
      console.error("Failed to save app data:", err),
    );
  }, [data, loadState]);

  // Periodically re-run auto-deduction while the app is open so lessons get
  // processed in real time without requiring a restart. processElapsedLessons
  // returns the same `prev` reference if nothing changed, so React skips the
  // re-render and we don't write to disk needlessly.
  useEffect(() => {
    if (loadState !== "ready") return;
    const tick = () => {
      setData((prev) => processElapsedLessons(prev));
    };
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [loadState]);

  const update: AppDataContextValue["update"] = (mutator) => {
    setData((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  };

  return (
    <AppDataContext.Provider
      value={{ data, loaded: loadState !== "loading", loadState, update }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used inside <AppDataProvider>");
  }
  return ctx;
}
