"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Toasts ---------------- */
export type ToastTone = "success" | "error" | "info" | "warning";
export interface ToastItem { id: number; title: string; message?: string; tone: ToastTone }
interface ToastCtx { toast: (t: { title: string; message?: string; tone?: ToastTone }) => void }
const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const toneIcon: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-brand-500" />,
  error: <XCircle className="h-5 w-5 text-rose-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-sun-500" />,
};

function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((t: { title: string; message?: string; tone?: ToastTone }) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-4), { id, title: t.title, message: t.message, tone: t.tone ?? "info" }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 5000);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-96 sm:items-end">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl border border-ink-200/60 bg-white/95 p-3.5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-ink-900/95">
            <div className="mt-0.5">{toneIcon[t.tone]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">{t.message}</p>}
            </div>
            <button onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------------- Online status ---------------- */
const OnlineContext = createContext(true);
export const useOnline = () => useContext(OnlineContext);
function OnlineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return (
    <OnlineContext.Provider value={online}>
      {children}
    </OnlineContext.Provider>
  );
}

/* ---------------- Cart ---------------- */
export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  cashPrice: number;
  qty: number;
  color?: string;
  branchId: number;
  branchName: string;
  installmentType: "daily" | "weekly" | "monthly";
  downPayment: number;
  installmentAmount: number;
  installmentCount: number;
  stock: number;
}
interface CartCtx {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: number, color?: string) => void;
  setQty: (productId: number, qty: number, color?: string) => void;
  clear: () => void;
  count: number;
}
const CartContext = createContext<CartCtx>({ items: [], add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {}, count: 0 });
export const useCart = () => useContext(CartContext);
function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("ss_cart") ?? "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("ss_cart", JSON.stringify(items)); }, [items, ready]);
  const value = useMemo<CartCtx>(() => ({
    items,
    add: (item) => setItems((s) => {
      const i = s.findIndex((x) => x.productId === item.productId && x.color === item.color);
      if (i >= 0) { const c = [...s]; c[i] = { ...c[i], qty: Math.min(c[i].stock, c[i].qty + item.qty) }; return c; }
      return [...s, item];
    }),
    remove: (productId, color) => setItems((s) => s.filter((x) => !(x.productId === productId && x.color === color))),
    setQty: (productId, qty, color) => setItems((s) => s.map((x) => (x.productId === productId && x.color === color ? { ...x, qty: Math.max(1, Math.min(x.stock, qty)) } : x))),
    clear: () => setItems([]),
    count: items.reduce((a, b) => a + b.qty, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ---------------- Service worker ---------------- */
function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>
        <OnlineProvider>
          <CartProvider>
            <ServiceWorkerRegistrar />
            {children}
          </CartProvider>
        </OnlineProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink-200/60 dark:bg-white/10", className)} />;
}
