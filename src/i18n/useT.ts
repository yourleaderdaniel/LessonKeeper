import { useAppData } from "../data/AppDataContext";
import { DICTIONARIES, localeFor } from "./dictionaries";
import type { Language } from "../data/types";

/**
 * Translation hook. Returns a tuple of `[t, language, locale]`.
 *   t("home.title")              → translated string
 *   t("home.count", {count: 3})  → with {placeholder} interpolation
 */
export function useT() {
  const { data } = useAppData();
  const language = data.settings.language;
  const locale = localeFor(language);

  function t(key: string, vars?: Record<string, string | number>): string {
    let value = DICTIONARIES[language][key];
    if (value === undefined) {
      // Fall back to Russian (the most complete dictionary).
      value = DICTIONARIES.ru[key];
    }
    if (value === undefined) {
      // Final fallback: return the key itself, so missing keys are obvious.
      return key;
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  }

  return { t, language, locale } as const;
}

/** Convenience for cases where you only need `t`. */
export type Translator = ReturnType<typeof useT>["t"];

export type { Language };
