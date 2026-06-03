// Domain types for LessonKeeper.
// Bumping `version` when changing the schema lets us add migrations in `store.ts`.

export type Language = "ru" | "uk" | "en";
export type Currency = "UAH" | "RUB" | "USD" | "EUR";

export type StudentsView = "table" | "cards";
export type TimeFormat = "24h" | "12h";

export type AppSettings = {
  language: Language;
  currency: Currency;
  /** Default lesson price applied to new students (can be overridden per student). */
  defaultPrice: number;
  /** Whether to show the phone column on the Home screen. */
  showPhoneColumn: boolean;
  /** Layout of the students list on Home. */
  studentsView: StudentsView;
  /** Time display and input format. Storage is always 24h "HH:mm" internally. */
  timeFormat: TimeFormat;
};

export type Student = {
  id: string;
  name: string;
  /** If null, use settings.defaultPrice. */
  customPrice: number | null;
  /** Prepaid balance. Can go negative — that's the student's debt. */
  prepaidBalance: number;
  phone: string | null;
  createdAt: string; // ISO 8601
};

/** 0 = Monday … 6 = Sunday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Lesson = {
  id: string;
  studentId: string;
  weekday: Weekday;
  /** "HH:mm" in 24h format. */
  time: string;
};

/** A specific occurrence of a recurring lesson on a given date. */
export type LessonRecord = {
  id: string;
  lessonId: string;
  studentId: string;
  /** "YYYY-MM-DD" */
  date: string;
  status: "completed" | "cancelled";
  /** Amount removed from balance when completed; refunded on cancellation. */
  amountDeducted: number;
};

export type AppData = {
  version: 1;
  settings: AppSettings;
  students: Student[];
  lessons: Lesson[];
  records: LessonRecord[];
  /** ISO timestamp of the last balance auto-processing pass. */
  lastProcessedAt: string | null;
};

export const DEFAULT_APP_DATA: AppData = {
  version: 1,
  settings: {
    language: "ru",
    currency: "UAH",
    defaultPrice: 250,
    showPhoneColumn: false,
    studentsView: "table",
    timeFormat: "24h",
  },
  students: [],
  lessons: [],
  records: [],
  lastProcessedAt: null,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: "₴",
  RUB: "₽",
  USD: "$",
  EUR: "€",
};
