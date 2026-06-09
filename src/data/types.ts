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

/**
 * How a student settles up.
 *  - "prepaid":  pays in advance; each completed lesson deducts from balance.
 *  - "postpaid": pays cash after each lesson; no balance is tracked, but
 *                completed lessons still count toward the Profit total.
 * Old saved students without this field are treated as "prepaid".
 */
export type PaymentType = "prepaid" | "postpaid";

export type Student = {
  id: string;
  name: string;
  /** If null, use settings.defaultPrice. */
  customPrice: number | null;
  /** Prepaid balance. Can go negative — that's the student's debt. Ignored for postpaid. */
  prepaidBalance: number;
  phone: string | null;
  paymentType: PaymentType;
  /**
   * If set (ISO timestamp), the student is on a break. Auto-processing skips
   * their lessons entirely while this is non-null — no deductions, no Profit
   * counting. Clearing it back to null resumes processing from that moment on
   * (the break period is NOT retroactively processed).
   */
  pausedSince: string | null;
  createdAt: string; // ISO 8601
};

/** A free-form note. Stored locally with the rest of the app data. */
export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
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
  notes: Note[];
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
  notes: [],
  lastProcessedAt: null,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UAH: "₴",
  RUB: "₽",
  USD: "$",
  EUR: "€",
};
