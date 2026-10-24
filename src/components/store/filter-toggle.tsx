"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

/** Filter panel hidden behind a button — opens on click. */
export function FilterPanel({ children, activeCount = 0 }: { children: ReactNode; activeCount?: number }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline w-full !justify-start">
        <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
        {activeCount > 0 && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>}
      </button>
    );
  }
  return (
    <div className="card animate-fade-up p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal className="h-4 w-4" /> ফিল্টার</p>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" aria-label="বন্ধ করুন"><X className="h-4 w-4" /></button>
      </div>
      {children}
    </div>
  );
}
