import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type Translations } from "../i18n/translations";

interface I18nContextValue {
  lang: Language;
  t: Translations[Language];
  setLang: (l: Language) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
}

const STORAGE_KEY = "pms_language";

function detectSystemLanguage(): Language {
  const nav = typeof navigator !== "undefined" ? navigator.language : "en";
  if (nav.startsWith("fa")) return "fa";
  if (nav.startsWith("ps")) return "ps";
  return "en";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem(STORAGE_KEY) as Language | null) || detectSystemLanguage();
  });

  const t = translations[lang];
  const dir = t.direction as "ltr" | "rtl";
  const isRTL = dir === "rtl";

  useEffect(() => {
    if (typeof document !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      document.body.style.fontFamily = t.fontFamily;
    }
  }, [lang, dir, t.fontFamily]);

  const setLang = (l: Language) => {
    setLangState(l);
  };

  return (
    <I18nContext.Provider value={{ lang, t, setLang, dir, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
