"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun, X, Inbox, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn, initials } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("relative inline-flex h-9 w-16 items-center rounded-full border border-ink-200 bg-ink-100 p-1 transition dark:border-white/10 dark:bg-white/10", className)}
    >
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-transform dark:bg-ink-800", dark ? "translate-x-7" : "translate-x-0")}>
        {dark ? <Moon className="h-4 w-4 text-sun-300" /> : <Sun className="h-4 w-4 text-sun-500" />}
      </span>
    </button>
  );
}

const tones: Record<string, string> = {
  emerald: "bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300",
  amber: "bg-sun-100 text-sun-800 dark:bg-sun-500/15 dark:text-sun-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  slate: "bg-ink-100 text-ink-700 dark:bg-white/10 dark:text-ink-200",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};
export function Badge({ tone = "slate", children, className }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={cn("badge", tones[tone] ?? tones.slate, className)}>{children}</span>;
}

export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-fade-up sm:rounded-3xl sm:p-6 dark:bg-ink-900", w)} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="text-lg font-bold text-ink-900 dark:text-white">{title}</div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, icon, trend, tone = "brand" }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; trend?: number; tone?: "brand" | "sun" | "sky" | "rose" | "violet" }) {
  const bg = { brand: "from-brand-500 to-brand-700", sun: "from-sun-400 to-sun-600", sky: "from-sky-400 to-sky-600", rose: "from-rose-400 to-rose-600", violet: "from-violet-400 to-violet-600" }[tone];
  return (
    <div className="card card-hover relative overflow-hidden p-4 sm:p-5">
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10", bg)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-extrabold text-ink-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{sub}</p>}
        </div>
        {icon && <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", bg)}>{icon}</div>}
      </div>
      {trend !== undefined && (
        <div className={cn("mt-3 inline-flex items-center gap-1 text-xs font-semibold", trend >= 0 ? "text-brand-600" : "text-rose-500")}>
          {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(trend)}% vs আগের সময়
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = "brand", label, showValue = true }: { value: number; max?: number; tone?: string; label?: ReactNode; showValue?: boolean }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = { brand: "bg-brand-500", sun: "bg-sun-500", rose: "bg-rose-500", sky: "bg-sky-500", violet: "bg-violet-500" }[tone] ?? "bg-brand-500";
  return (
    <div>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-ink-600 dark:text-ink-300">{label}</span>
          {showValue && <span className="font-semibold text-ink-800 dark:text-ink-100">{pct}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Empty({ title = "কিছু পাওয়া যায়নি", hint, action }: { title?: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 px-6 py-12 text-center dark:border-white/10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-white/10"><Inbox className="h-6 w-6" /></div>
      <p className="mt-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-ink-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" }[size];
  if (src) return <img src={src} alt={name} className={cn("rounded-full object-cover", s)} />;
  return <div className={cn("flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sun-500 font-bold text-white", s)}>{initials(name)}</div>;
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold text-ink-900 dark:text-white sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400 sm:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: ReactNode; icon?: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-ink-100 p-1 dark:bg-white/5">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition", value === t.key ? "bg-white text-brand-700 shadow dark:bg-ink-800 dark:text-brand-300" : "text-ink-500 hover:text-ink-800 dark:hover:text-ink-100")}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}
