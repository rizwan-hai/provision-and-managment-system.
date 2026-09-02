import { useState, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useI18n } from "../contexts/I18nContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Input, Field } from "../components/ui";

export default function Login() {
  const { login } = useApp();
  const { t, lang, setLang, isRTL } = useI18n();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && lockedUntil > Date.now();

  // Get error messages based on language
  const getErrorMessage = (key: string): string => {
    const messages: Record<string, Record<string, string>> = {
      en: {
        usernameRequired: "Username is required",
        passwordRequired: "Password is required",
        passwordLength: "Password must be at least 6 characters",
        locked: "Too many attempts. Wait {secs}s",
        securityLock: "Locked for 30 seconds for security",
        attemptsLeft: "attempts left",
        invalid: "Invalid username or password",
      },
      ps: {
        usernameRequired: "د کارن نوم اړین دی",
        passwordRequired: "پټنوم اړین دی",
        passwordLength: "پټنوم باید لږ تر لږه ۶ توري وي",
        locked: "د ډېرو نا کامو هڅو له امله بند دی. {secs} ثانیې انتظار وکړئ",
        securityLock: "د خوندیتوب لپاره ۳۰ ثانیې بند شو",
        attemptsLeft: "هڅې پاتې",
        invalid: "د کارن نوم یا پټنوم تېروتی دی",
      },
      fa: {
        usernameRequired: "نام کاربری الزامی است",
        passwordRequired: "رمز عبور الزامی است",
        passwordLength: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        locked: "به دلیل تلاش‌های ناموفق زیاد قفل شده. {secs} ثانیه صبر کنید",
        securityLock: "به دلایل امنیتی برای ۳۰ ثانیه قفل شد",
        attemptsLeft: "تلاش باقی مانده",
        invalid: "نام کاربری یا رمز عبور اشتباه است",
      },
    };
    return messages[lang]?.[key] || messages.en[key];
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    if (isLocked) {
      const secs = Math.ceil((lockedUntil! - Date.now()) / 1000);
      setErrors({ general: getErrorMessage("locked").replace("{secs}", String(secs)) });
      return;
    }

    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = getErrorMessage("usernameRequired");
    if (!password) newErrors.password = getErrorMessage("passwordRequired");
    else if (password.length < 6) newErrors.password = getErrorMessage("passwordLength");

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const res = await login(username.trim(), password);
    setLoading(false);

    if (!res.ok) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 30_000);
        setAttempts(0);
        setErrors({ general: getErrorMessage("securityLock") });
      } else {
        setErrors({ general: `${res.error} (${5 - newAttempts} ${getErrorMessage("attemptsLeft")})` });
      }
      toast(res.error || getErrorMessage("invalid"), "error");
    } else {
      toast(t.welcome, "success");
    }
  }

  const features = {
    en: [
      "Company registration & blacklist management",
      "Contract tiering by amount",
      "Procurement priority workflow",
      "Full database backup & reports",
    ],
    ps: [
      "د شرکتونو راجستر او د بلاک لست مدیریت",
      "د قراردادونو وېشل پر اساس د پیسو مقدار",
      "د تدارکاتو د سپارښتنو لومړیتوب بندي",
      "د بشپړ ډېټابیس بیک اپ او راپورونه",
    ],
    fa: [
      "ثبت شرکت‌ها و مدیریت لیست سیاه",
      "طبقه‌بندی قراردادها بر اساس مبلغ",
      "اولویت‌بندی سفارشات تدارکاتی",
      "پشتیبان‌گیری و گزارشات کامل",
    ],
  };

  const descriptions = {
    en: "An advanced and secure system for company registration, contract tracking, blacklist management, and procurement order processing.",
    ps: "یو پر مختللی او خوندي سیستم چې د شرکتونو راجستر، د قراردادونو تعقیب، د بلاک لست مدیریت، او د تدارکاتو د سپارښتنو پروسس په اسانۍ سره ترسره کوي.",
    fa: "یک سیستم پیشرفته و امن برای ثبت شرکت‌ها، پیگیری قراردادها، مدیریت لیست سیاه و پردازش سفارشات تدارکاتی.",
  };

  const titles = {
    en: "Comprehensive Management of Contracts & Companies",
    ps: "د قراردادونو او شرکتونو جامع مدیریت",
    fa: "مدیریت جامع قراردادها و شرکت‌ها",
  };

  return (
    <div className="min-h-screen flex items-stretch dark:bg-slate-900" dir={isRTL ? "rtl" : "ltr"}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-between w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">📋</div>
            <div>
              <h1 className="text-lg font-bold">{t.appName}</h1>
              <p className="text-xs text-white/70">{t.appNameShort}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              {titles[lang].split(isRTL ? " " : " ").slice(0, -1).join(" ")}
              <br />
              <span className="text-brand-300">{titles[lang].split(isRTL ? " " : " ").pop()}</span>
            </h2>
            <p className="text-white/80 leading-7">{descriptions[lang]}</p>
            <ul className="space-y-3 text-sm text-white/90">
              {features[lang].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-400/30 border border-brand-300 flex items-center justify-center text-xs">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">© 2026 {t.appName} · v1.0</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xl">📋</div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.appName}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.appNameShort}</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === "en" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>🇬🇧 English</button>
            <button onClick={() => setLang("ps")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === "ps" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>🇦🇫 پښتو</button>
            <button onClick={() => setLang("fa")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === "fa" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>🇦🇫 دری</button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.welcome}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.login}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm rounded-lg px-4 py-3" role="alert">
                {errors.general}
              </div>
            )}

            <Field label={t.username} htmlFor="username" error={errors.username} required>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                invalid={!!errors.username}
                disabled={isLocked || loading}
              />
            </Field>

            <Field label={t.password} htmlFor="password" error={errors.password} required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  invalid={!!errors.password}
                  disabled={isLocked || loading}
                  className={isRTL ? "pl-20" : "pr-20"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className={`absolute ${isRTL ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-slate-500 hover:text-slate-700`}
                >
                  {showPass ? (isRTL ? "پټ" : "Hide") : (isRTL ? "ښکاره" : "Show")}
                </button>
              </div>
            </Field>

            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={isLocked}>
              {t.login}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1.5">{lang === "en" ? "Demo accounts:" : lang === "ps" ? "د ازموینې لپاره:" : "حساب‌های آزمایشی:"}</p>
            <div className="space-y-1 font-mono">
              <div>👤 <strong>admin</strong> / Admin@123</div>
              <div>👤 <strong>manager</strong> / Manager@123</div>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center">
            🔒 {lang === "en" ? "Passwords are hashed with SHA-256" : lang === "ps" ? "ستاسو پټنومونه د SHA-256 سره هیش شوي" : "رمزهای عبور با SHA-256 هش شده‌اند"}
          </p>
        </div>
      </div>
    </div>
  );
}
