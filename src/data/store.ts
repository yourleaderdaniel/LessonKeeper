import { load, type Store } from "@tauri-apps/plugin-store";
import { DEFAULT_APP_DATA, type AppData } from "./types";

// The plugin resolves this filename relative to the app's data directory,
// which on Windows is:
//   C:\Users\<user>\AppData\Roaming\com.lessonkeeper.app\lessonkeeper.json
const STORE_FILE = "lessonkeeper.json";
const DATA_KEY = "data";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (!storePromise) {
    // autoSave: false — we call save() explicitly after each mutation
    // so we control exactly when data hits disk. `defaults` is required by
    // the plugin's TypeScript API; we manage our own shape under DATA_KEY.
    storePromise = load(STORE_FILE, { autoSave: false, defaults: {} });
  }
  return storePromise;
}

export async function loadAppData(): Promise<AppData> {
  const store = await getStore();
  const raw = await store.get<unknown>(DATA_KEY);
  if (!raw || typeof raw !== "object") {
    return structuredClone(DEFAULT_APP_DATA);
  }
  // Defensive merge: validate each top-level field's shape and fall back to
  // defaults for anything missing or invalid. This ensures a partial / older /
  // slightly-corrupt file still produces a usable in-memory state.
  const data = raw as Partial<AppData>;
  const settings =
    data.settings && typeof data.settings === "object"
      ? data.settings
      : {};
  return {
    version: 1,
    settings: { ...DEFAULT_APP_DATA.settings, ...settings },
    // Backfill new fields for older saved students.
    students: Array.isArray(data.students)
      ? data.students.map((s) => ({
          ...s,
          paymentType: s.paymentType ?? ("prepaid" as const),
          pausedSince: s.pausedSince ?? null,
        }))
      : [],
    lessons: Array.isArray(data.lessons) ? data.lessons : [],
    records: Array.isArray(data.records) ? data.records : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
    lastProcessedAt:
      typeof data.lastProcessedAt === "string" ? data.lastProcessedAt : null,
  };
}

export async function saveAppData(data: AppData): Promise<void> {
  const store = await getStore();
  await store.set(DATA_KEY, data);
  await store.save();
}
