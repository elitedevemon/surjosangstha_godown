"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, AlertTriangle } from "lucide-react";
import { cn, formatMoney, INSTALLMENT_LABEL } from "@/lib/utils";

export function BudgetPlanner({ price, down, amt, count, itype }: { price: number; cash?: number; down: number; amt: number; count: number; itype: "daily" | "weekly" | "monthly" }) {
  const [budget, setBudget] = useState(Math.round(down));
  const canAfford = budget >= down;
  const duration = itype === "daily" ? `${count} দিন` : itype === "weekly" ? `${count} সপ্তাহ` : `${count} মাস`;
  const rows = useMemo(() => [
    { label: "ডাউন পেমেন্ট (প্রথম)", value: formatMoney(down), ok: canAfford },
    { label: `${INSTALLMENT_LABEL[itype].bn} কিস্তি`, value: `${formatMoney(amt)}/${INSTALLMENT_LABEL[itype].bn}`, ok: true },
    { label: "কিস্তির সংখ্যা", value: `${count} টি`, ok: true },
    { label: "মেয়াদ", value: duration, ok: true },
    { label: "মোট ব্যয়", value: formatMoney(price), ok: true },
  ], [down, amt, count, price, duration, canAfford, itype]);
  return (
    <div className="space-y-4">
      <div>
        <label className="label">আপনার কাছে আছে (ডাউন পেমেন্টের জন্য)</label>
        <input type="number" className="input" value={budget} onChange={(e) => setBudget(Number(e.target.value))} min={0} />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-sm dark:bg-white/5">
            <span className="text-ink-600 dark:text-ink-300">{r.label}</span>
            <span className={cn("font-bold", r.ok ? "text-ink-900 dark:text-white" : "text-rose-600")}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className={cn("flex items-start gap-2 rounded-2xl p-3 text-xs font-semibold", canAfford ? "bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200")}>
        {canAfford ? <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
        {canAfford
          ? <>আপনার বাজেট ডাউন পেমেন্ট ঢাকে। প্রতিনিধির কাছ থেকে পণ্য নিন, বাকি {count} কিস্তিতে দিন।</>
          : <>ডাউন পেমেন্ট {formatMoney(down)} এর জন্য বাজেট কম। ক্যাশ অন ডেলিভারিতে পুরো টাকা দিয়ে নিন।</>}
      </div>
    </div>
  );
}
