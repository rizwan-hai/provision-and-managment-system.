import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

/* -------------------- Button -------------------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm dark:bg-brand-500 dark:hover:bg-brand-600",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm dark:bg-red-500 dark:hover:bg-red-600",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-600",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-10 px-4 text-sm gap-2 rounded-lg",
    lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-base select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/* -------------------- Field wrappers -------------------- */
interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}
export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-600 dark:text-red-400 mx-1" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}
export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      aria-invalid={invalid}
      className={cn(
        "h-10 px-3 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400",
        "transition-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500",
        invalid ? "border-red-400 focus:ring-red-500 focus:border-red-500 dark:border-red-500" : "border-slate-300 dark:border-slate-600",
        className
      )}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        "min-h-20 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400",
        "transition-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y",
        "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500",
        className
      )}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(
        "h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900",
        "transition-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600",
        className
      )}
    >
      {children}
    </select>
  );
}

/* -------------------- Card -------------------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-2xl shadow-sm",
      "dark:bg-slate-800 dark:border-slate-700",
      className
    )}>
      {children}
    </div>
  );
}

/* -------------------- Badge -------------------- */
type BadgeTone = "blue" | "green" | "amber" | "red" | "slate" | "violet";
export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: BadgeTone }) {
  const lightTones: Record<BadgeTone, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-red-100 text-red-800 border-red-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    violet: "bg-violet-100 text-violet-800 border-violet-200",
  };
  const darkTones: Record<BadgeTone, string> = {
    blue: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    green: "dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    amber: "dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    red: "dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    slate: "dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    violet: "dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
      lightTones[tone],
      darkTones[tone]
    )}>
      {children}
    </span>
  );
}

/* -------------------- Modal -------------------- */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}
export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full my-8",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-base"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 text-slate-900 dark:text-slate-100">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------- Confirm dialog -------------------- */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تایید / Confirm",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-6">{message}</p>
    </Modal>
  );
}

/* -------------------- Empty state -------------------- */
export function EmptyState({ icon = "📭", title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-5xl mb-3" aria-hidden>{icon}</div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

/* -------------------- Stat card -------------------- */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "violet";
}) {
  const tones = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    violet: "from-violet-500 to-violet-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">{value}</p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-lg shrink-0", tones[tone])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* -------------------- Progress bar -------------------- */
export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" | "red" }) {
  const tones = { 
    blue: "bg-brand-500 dark:bg-brand-400", 
    green: "bg-emerald-500 dark:bg-emerald-400", 
    amber: "bg-amber-500 dark:bg-amber-400", 
    red: "bg-red-500 dark:bg-red-400" 
  };
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full transition-all duration-500", tones[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
