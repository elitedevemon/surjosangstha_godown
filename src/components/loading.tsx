"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />
  );
}

export function PageLoader({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink-50/95 backdrop-blur dark:bg-ink-950/95">
      <div className="relative">
        <div className="absolute inset-0 -z-10 h-20 w-20 rounded-full bg-brand-500/20 animate-ring" />
        <svg viewBox="0 0 100 100" className="h-20 w-20 animate-[spin_1.4s_linear_infinite]">
          <defs>
            <linearGradient id="loadG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b98a" />
              <stop offset="100%" stopColor="#f5900b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#loadG)" strokeWidth="8" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="60" />
        </svg>
      </div>
      <p className="mt-5 text-sm font-bold text-ink-700 dark:text-ink-200">লোড হচ্ছে…</p>
      <p className="mt-1 text-xs text-ink-400">SurjoSangstha</p>
    </div>
  );
}

export function LoadingBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(96, (elapsed / 200) * 100);
      setProgress(p);
      setVisible(true);
      if (p < 96) raf = requestAnimationFrame(tick);
      else { setProgress(100); setTimeout(() => setVisible(false), 220); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[200] h-1 bg-ink-100 dark:bg-white/10">
      <div className="h-full bg-gradient-to-r from-brand-500 to-sun-400 transition-all duration-200" style={{ width: `${progress}%` }} />
    </div>
  );
}
