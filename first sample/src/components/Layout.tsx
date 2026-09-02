import { useState, type ReactNode } from "react";
import { useApp } from "../contexts/AppContext";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "../utils/cn";

export type PageKey =
  | "dashboard"
  | "companies"
  | "contracts"
  | "orders"
  | "inventory"
  | "vendors"
  | "reports"
  | "users"
  | "audit"
  | "backup"
  | "settings";

interface NavItem {
  key: PageKey;
  icon: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { key: "dashboard", icon: "📊" },
  { key: "companies", icon: "🏢" },
  { key: "contracts", icon: "📑" },
  { key: "orders", icon: "📦" },
  { key: "inventory", icon: "📋" },
  { key: "vendors", icon: "🤝" },
  { key: "reports", icon: "📈" },
  { key: "users", icon: "👥", adminOnly: true },
  { key: "audit", icon: "📜", adminOnly: true },
  { key: "backup", icon: "💾" },
  { key: "settings", icon: "⚙️" },
];

export default function Layout({
  current,
  onNavigate,
  children,
}: {
  current: PageKey;
  onNavigate: (k: PageKey) => void;
  children: ReactNode;
}) {
  const { currentUser, logout } = useApp();
  const { t, lang, setLang, isRTL } = useI18n();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const visibleNav = NAV.filter((n) => !n.adminOnly || currentUser?.role === "admin");

  const pageTitle = (t as Record<string, string>)[current] || current;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900" dir={isRTL ? "rtl" : "ltr"}>
      <a href="#main" className="skip-link">{isRTL ? "پرېښدنه څخه ولاړ شه" : "Skip to main content"}</a>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen w-72 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300",
          isRTL ? "right-0" : "left-0",
          mobileOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center text-lg shadow-sm">
            📋
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{t.appName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.appNameShort}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleNav.map((item) => {
            const active = current === item.key;
            const label = (t as Record<string, string>)[item.key] || item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setMobileOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-base",
                  isRTL ? "text-right flex-row-reverse" : "text-left",
                  active
                    ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <span className={cn("text-lg leading-none w-6 text-center", active && "scale-110")} aria-hidden>{item.icon}</span>
                <span className="flex-1">{label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400" aria-hidden />}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-base text-sm"
          >
            <span className="text-lg">{resolvedTheme === "dark" ? "🌙" : "☀️"}</span>
            <span className="flex-1 text-slate-700 dark:text-slate-300">
              {resolvedTheme === "dark" ? (lang === "en" ? "Dark Mode" : lang === "ps" ? "تاریک حالت" : "حالت تاریک") : (lang === "en" ? "Light Mode" : lang === "ps" ? "روښانه حالت" : "حالت روشن")}
            </span>
            <span className={cn("w-10 h-5 rounded-full relative transition-colors", resolvedTheme === "dark" ? "bg-brand-600" : "bg-slate-300")}>
              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", resolvedTheme === "dark" ? (isRTL ? "right-0.5" : "left-5") : (isRTL ? "left-0.5" : "right-5"))} />
            </span>
          </button>
        </div>

        {/* Language Switcher */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((v) => !v)}
              className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-base text-sm"
              aria-haspopup="menu"
              aria-expanded={langMenuOpen}
            >
              <span className="text-lg">🌐</span>
              <span className="flex-1 text-slate-700 dark:text-slate-300">{t.language}: {(t as Record<string, string>)[lang] || lang}</span>
              <span className="text-slate-400 dark:text-slate-500 text-xs">{langMenuOpen ? "▲" : "▼"}</span>
            </button>
            {langMenuOpen && (
              <div className={cn("absolute bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-fade-in z-50", isRTL ? "left-0 right-0" : "left-0 right-0")} role="menu">
                <button onClick={() => { setLang("en"); setLangMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" role="menuitem">🇬🇧 {t.english}</button>
                <button onClick={() => { setLang("ps"); setLangMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" role="menuitem">🇦🇫 {t.pashto}</button>
                <button onClick={() => { setLang("fa"); setLangMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" role="menuitem">🇦🇫 {t.dari}</button>
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className={cn("w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-base text-sm", isRTL ? "text-right flex-row-reverse" : "text-left")}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-semibold uppercase shrink-0">
                {currentUser?.username.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{currentUser?.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{currentUser?.username} · {currentUser?.role}</p>
              </div>
              <span className="text-slate-400 dark:text-slate-500 text-xs" aria-hidden>{userMenuOpen ? "▲" : "▼"}</span>
            </button>

            {userMenuOpen && (
              <div className={cn("absolute bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-fade-in z-50", isRTL ? "left-0 right-0" : "left-0 right-0")} role="menu">
                <button
                  onClick={() => { onNavigate("settings"); setUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  role="menuitem"
                >
                  <span>⚙️</span> {t.settings}
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700"
                  role="menuitem"
                >
                  <span>🚪</span> {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 z-30"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>{t.appName}</span>
                <span aria-hidden>/</span>
                <span>{pageTitle}</span>
              </div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle for topbar */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="text-xl">{resolvedTheme === "dark" ? "🌙" : "☀️"}</span>
            </button>
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{new Date().toLocaleDateString(lang === "en" ? "en-US" : lang === "ps" ? "ps-AF" : "fa-AF", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
              <span>{isRTL ? "آنلاین" : "Online"}</span>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-700 px-4 lg:px-8 py-4 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>© 2026 {t.appName}</span>
          <span>v1.0.0 · {t.user}: <strong>{currentUser?.username}</strong></span>
        </footer>
      </div>
    </div>
  );
}
