"use client";

import { useMemo, useState } from "react";
import { Search, Minus, Plus, PackagePlus, Undo2, Lock, ShoppingBag, UserPlus, UserCheck, Wallet, CalendarClock, CheckCircle2, AlertTriangle, FileDown, CloudUpload , Sparkles} from "lucide-react";
import { Badge, Modal, Field, Empty, Tabs } from "@/components/ui";
import { savePackageAction, sellPackageAction, assignUniqueIdAction } from "@/actions/extra";
import { Package, IdCard } from "lucide-react";
import { useToast } from "@/components/providers";
import { LocationPicker } from "@/components/location-picker";
import { exportPdf } from "@/lib/pdf";
import { cn, formatMoney, formatDate, INSTALLMENT_LABEL, ORDER_TYPE_LABEL, areaLabel } from "@/lib/utils";
import type { EmployeeSnapshot } from "@/lib/queries";
import type { EmpState, TodayView, ActionInput } from "@/lib/offline";

type Enqueue = (a: ActionInput) => void;

function QtyPicker({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-ink-200 dark:border-white/10">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="p-1.5"><Minus className="h-3.5 w-3.5" /></button>
      <input type="number" min={0} max={max} value={value} onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value))))} className="w-10 bg-transparent text-center text-sm font-bold outline-none" />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="p-1.5"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ---------------- Godown ---------------- */
export function GodownPanel({ snap, today, enqueue }: { snap: EmployeeSnapshot; today: TodayView; enqueue: Enqueue }) {
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Record<number, number>>({});
  const [ret, setRet] = useState<Record<number, number>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const [note, setNote] = useState("");
  const [op, setOp] = useState<"return" | "claim">("return");
  const { toast } = useToast();
  const products = snap.products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku?.toLowerCase().includes(q.toLowerCase()));
  const pickItems = Object.entries(pick).filter(([, v]) => v > 0).map(([k, v]) => ({ productId: Number(k), qty: v }));
  const pickValue = pickItems.reduce((a, i) => a + (snap.products.find((p) => p.id === i.productId)?.cashPrice ?? 0) * i.qty, 0);
  const retItems = Object.entries(ret).filter(([, v]) => v > 0).map(([k, v]) => ({ productId: Number(k), qty: v }));
  const isClaim = today.started;
  const submitTake = () => { if (!pickItems.length) return; enqueue({ kind: isClaim ? "claim" : "take", items: pickItems }); setPick({}); toast({ title: isClaim ? "অতিরিক্ত পণ্য ক্লেইম করা হয়েছে" : "গোডাউন থেকে পণ্য নেওয়া হয়েছে", message: `${pickItems.length} ধরনের পণ্য • ${formatMoney(pickValue)}`, tone: "success" }); };
  const submitReturn = () => { if (!retItems.length) return; enqueue({ kind: "return", items: retItems }); setRet({}); toast({ title: "পণ্য গোডাউনে ফেরত দেওয়া হয়েছে", tone: "success" }); };
  const submitClose = () => { enqueue({ kind: "close", note }); setConfirmClose(false); toast({ title: "আজকের হিসাব চূড়ান্ত জমা হয়েছে", message: "এডমিনের কাছে রিপোর্ট পাঠানো হয়েছে", tone: "success" }); };

  if (today.closed) {
    return (
      <div className="card p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-brand-500" />
        <h2 className="mt-3 text-xl font-extrabold">আজকের গোডাউন হিসাব ক্লোজ করা হয়েছে</h2>
        <p className="mt-1 text-sm text-ink-500">আজ আর পণ্য নেওয়া বা বিক্রয় এন্ট্রি দেওয়া যাবে না। আগামীকাল নতুন সেশন শুরু হবে।</p>
        <div className="mx-auto mt-5 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">{[["নেওয়া", today.totals.takenQty], ["বিক্রি", today.totals.soldQty], ["ফেরত", today.totals.returnedQty], ["নগদ", formatMoney(today.totals.cash)]].map(([k, v]) => <div key={String(k)} className="rounded-xl bg-ink-50 p-3 dark:bg-white/5"><p className="text-lg font-extrabold">{v}</p><p className="text-[10px] text-ink-400">{k}</p></div>)}</div>
      </div>
    );
  }

  return (
    <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 p-4 dark:border-white/10">
          <div><p className="font-bold">গোডাউন থেকে পণ্য নিন</p><p className="text-xs text-ink-500">আজ মাঠে নেওয়ার জন্য পণ্য ও পরিমাণ নির্বাচন করুন — গোডাউন স্টক থেকে কাটা হবে, মূল প্রোডাক্ট স্টক অপরিবর্তিত থাকবে</p></div>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="পণ্য খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className={cn("flex items-center gap-3 rounded-2xl border p-2.5", pick[p.id] ? "border-brand-400 bg-brand-50/60 dark:bg-brand-500/10" : "border-ink-100 dark:border-white/10")}>
              <img src={p.images[0] ?? "/logo.png"} className="h-14 w-14 rounded-xl object-cover" alt="" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="text-[10px] leading-relaxed text-ink-500">বিক্রয় {formatMoney(p.price)} • নগদ {formatMoney(p.cashPrice)} • সর্বনিম্ন {formatMoney(p.minSellPrice ?? p.cashPrice)} • কিস্তি {formatMoney(p.installmentAmount)}×{p.installmentCount}</p><p className="text-[11px]"><span className={cn("font-semibold", p.godownStock <= 0 ? "text-rose-500" : "text-brand-600")}>গোডাউনে {p.godownStock}</span> • মূল স্টক {p.stock}</p></div>
              <QtyPicker value={pick[p.id] ?? 0} max={p.godownStock} onChange={(v) => setPick({ ...pick, [p.id]: v })} />
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-ink-900/95">
          <p className="text-sm"><b>{pickItems.reduce((a, i) => a + i.qty, 0)}</b> টি পণ্য • মোট মূল্য <b>{formatMoney(pickValue)}</b></p>
          <button disabled={!pickItems.length} onClick={submitTake} className="btn-primary"><PackagePlus className="h-4 w-4" /> গোডাউন থেকে নিন</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <p className="font-bold">আমার কাছে আজ যা আছে</p>
          {today.lines.length === 0 ? <p className="mt-2 text-xs text-ink-400">এখনো কিছু নেওয়া হয়নি</p> : (
            <div className="mt-2 divide-y divide-ink-100 dark:divide-white/5">
              {today.lines.map((l) => (
                <div key={l.productId} className="flex min-w-0 items-center gap-2 py-2">
                  <img src={l.image} className="h-9 w-9 rounded-lg object-cover" alt="" />
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{l.name}</p><p className="text-[10px] text-ink-500">নেওয়া {l.taken + l.claimed} • বিক্রি {l.sold} • ফেরত {l.returned}</p></div>
                  <Badge tone={l.remaining > 0 ? "amber" : "emerald"}>হাতে {l.remaining}</Badge>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px]"><div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><p className="font-extrabold">{formatMoney(today.totals.takenValue)}</p><p className="text-ink-400">নেওয়া পণ্যের মূল্য</p></div><div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><p className="font-extrabold">{formatMoney(today.totals.soldValue)}</p><p className="text-ink-400">বিক্রয়</p></div></div>
        </div>

        <div className="card p-3">
          <Tabs value={op} onChange={setOp} tabs={[{ key: "return", label: "গোডাউন ফেরত", icon: <Undo2 className="h-4 w-4" /> }, { key: "claim", label: "ক্লেইম", icon: <PackagePlus className="h-4 w-4" /> }]} />
        </div>

        {op === "claim" && (
          <div className="card p-4">
            <p className="flex items-center gap-2 font-bold"><PackagePlus className="h-4 w-4 text-brand-600" /> অতিরিক্ত পণ্য ক্লেইম</p>
            <p className="text-xs text-ink-500">কাস্টমার অন্য পণ্য চাইলে আগে ক্লেইম করুন, তারপর বিক্রয় এন্ট্রি দিন</p>
            <div className="mt-2 space-y-2">
              {products.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold">{p.name} <span className="text-ink-400">(গোডাউনে {p.godownStock})</span></p><QtyPicker value={pick[p.id] ?? 0} max={p.godownStock} onChange={(v) => setPick({ ...pick, [p.id]: v })} /></div>
              ))}
            </div>
            <button disabled={!pickItems.length} onClick={() => { enqueue({ kind: "claim", items: pickItems }); setPick({}); toast({ title: "ক্লেইম নিশ্চিত হয়েছে", tone: "success" }); }} className="btn-outline mt-3 w-full !py-2 text-xs"><PackagePlus className="h-3.5 w-3.5" /> ক্লেইম নিশ্চিত করুন</button>
          </div>
        )}

        {op === "return" && today.lines.some((l) => l.remaining > 0) && (
          <div className="card p-4">
            <p className="flex items-center gap-2 font-bold"><Undo2 className="h-4 w-4 text-sky-500" /> গোডাউনে ফেরত দিন</p>
            <p className="text-xs text-ink-500">বিক্রি না হওয়া পণ্য ফেরত দিন</p>
            <div className="mt-2 space-y-2">
              {today.lines.filter((l) => l.remaining > 0).map((l) => (
                <div key={l.productId} className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold">{l.name} <span className="text-ink-400">(হাতে {l.remaining})</span></p><QtyPicker value={ret[l.productId] ?? 0} max={l.remaining} onChange={(v) => setRet({ ...ret, [l.productId]: v })} /></div>
              ))}
            </div>
            <div className="mt-3 flex gap-2"><button onClick={() => { const all: Record<number, number> = {}; today.lines.forEach((l) => { if (l.remaining > 0) all[l.productId] = l.remaining; }); setRet(all); }} className="btn-ghost flex-1 !py-2 text-xs">সব ফেরত</button><button disabled={!retItems.length} onClick={submitReturn} className="btn-outline flex-1 !py-2 text-xs"><Undo2 className="h-3.5 w-3.5" /> ফেরত নিশ্চিত</button></div>
          </div>
        )}
        {op === "return" && !today.lines.some((l) => l.remaining > 0) && <div className="card p-4 text-center text-xs text-ink-400">ফেরত দেওয়ার মতো কোনো পণ্য হাতে নেই</div>}

        {today.started && (
          <div className="card border-brand-200 p-4 dark:border-brand-500/30">
            <p className="flex items-center gap-2 font-bold"><Lock className="h-4 w-4 text-brand-600" /> দিনের চূড়ান্ত জমা</p>
            <p className="text-xs text-ink-500">সব বিক্রয় এন্ট্রি ও ফেরত শেষ হলে চূড়ান্ত জমা দিন। এরপর আজ আর কিছু করা যাবে না এবং এডমিনের কাছে সম্পূর্ণ রিপোর্ট চলে যাবে।</p>
            {today.totals.remainingQty > 0 && <p className="mt-2 flex items-center gap-1 rounded-xl bg-sun-50 p-2 text-[11px] font-semibold text-sun-800 dark:bg-sun-500/10 dark:text-sun-200"><AlertTriangle className="h-3.5 w-3.5" /> {today.totals.remainingQty} টি পণ্য এখনো হাতে আছে — আগে ফেরত দিন</p>}
            <button disabled={today.totals.remainingQty > 0} onClick={() => setConfirmClose(true)} className="btn-sun mt-3 w-full disabled:cursor-not-allowed"><CheckCircle2 className="h-4 w-4" /> হিসাব ক্লোজ ও চূড়ান্ত জমা</button>
          </div>
        )}
      </div>

      <Modal open={confirmClose} onClose={() => setConfirmClose(false)} title="চূড়ান্ত জমা নিশ্চিত করুন" size="sm">
        <div className="grid grid-cols-2 gap-2 text-center">{[["নেওয়া", today.totals.takenQty], ["বিক্রি", today.totals.soldQty], ["ফেরত", today.totals.returnedQty], ["হাতে বাকি", today.totals.remainingQty], ["বিক্রয় মূল্য", formatMoney(today.totals.soldValue)], ["নগদ আদায়", formatMoney(today.totals.cash)]].map(([k, v]) => <div key={String(k)} className="rounded-xl bg-ink-50 p-3 dark:bg-white/5"><p className="text-base font-extrabold">{v}</p><p className="text-[10px] text-ink-400">{k}</p></div>)}</div>
        {today.totals.remainingQty > 0 && <p className="mt-3 rounded-xl bg-rose-50 p-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">সতর্কতা: {today.totals.remainingQty} টি পণ্য ফেরত/বিক্রি হয়নি। এটি রিপোর্টে অমিল হিসেবে দেখাবে।</p>}
        <div className="mt-3"><Field label="নোট (ঐচ্ছিক)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
        <button onClick={submitClose} className="btn-primary mt-4 w-full"><Lock className="h-4 w-4" /> নিশ্চিত করে জমা দিন</button>
      </Modal>
    </div>
  );
}

/* ---------------- Sell ---------------- */
export function SellPanel({ snap, today, enqueue, goGodown }: { snap: EmployeeSnapshot; today: TodayView; enqueue: Enqueue; goGodown: () => void }) {
  const [mode, setMode] = useState<"registered" | "new">("registered");
  const [phone, setPhone] = useState("");
  const [cust, setCust] = useState({ name: "", phone: "", district: "", upazila: "", union: "", village: "" });
  const [items, setItems] = useState<Record<number, { qty: number; unitPrice: number; color?: string; discount?: number }>>({});
  const [payment, setPayment] = useState<"cash" | "installment">("installment");
  const [note, setNote] = useState("");
  const [customDown, setCustomDown] = useState<number | null>(null);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const { toast } = useToast();
  const found = useMemo(() => (phone.length >= 4 ? snap.customers.filter((c) => c.phone.includes(phone) || (c.uniqueId ?? "").toLowerCase().includes(phone.toLowerCase()) || c.name.toLowerCase().includes(phone.toLowerCase())).slice(0, 6) : []), [phone, snap.customers]);
  const selected = snap.customers.find((c) => c.phone === cust.phone);
  const available = today.lines.filter((l) => l.remaining > 0);
  const lines = Object.entries(items).filter(([, v]) => v.qty > 0).map(([k, v]) => { const p = snap.products.find((x) => x.id === Number(k))!; return { p, ...v }; });
  const gross = lines.reduce((a, l) => a + (payment === "installment" ? l.p.price : l.unitPrice) * l.qty, 0);
  const itemDiscount = lines.reduce((a, l) => a + Math.max(0, l.discount ?? 0) * l.qty, 0);
  const total = Math.max(0, gross - itemDiscount - Math.max(0, orderDiscount));
  const suggestedDown = lines.reduce((a, l) => a + l.p.downPayment * l.qty, 0);
  const down = payment === "installment" ? (customDown ?? suggestedDown) : total;
  const priceError = payment === "cash" ? lines.find((l) => Math.max(0, (l.unitPrice - (l.discount ?? 0))) < (l.p.minSellPrice ?? l.p.cashPrice)) : undefined;
  const submit = () => {
    if (!/^01\d{9}$/.test(cust.phone)) return toast({ title: "সঠিক মোবাইল নম্বর দিন", tone: "warning" });
    if (mode === "new" && (!cust.name || !cust.district)) return toast({ title: "কাস্টমারের নাম ও ঠিকানা দিন", tone: "warning" });
    if (!lines.length) return toast({ title: "কমপক্ষে একটি পণ্য নির্বাচন করুন", tone: "warning" });
    if (priceError) return toast({ title: `${priceError.p.name}: ছাড়ের পর মূল্য সর্বনিম্ন ${formatMoney(priceError.p.minSellPrice ?? priceError.p.cashPrice)} এর নিচে`, tone: "error" });
    if (payment === "installment" && down > total) return toast({ title: "ডাউন পেমেন্ট মোট মূল্যের বেশি হতে পারবে না", tone: "error" });
    enqueue({ kind: "sale", customer: { id: selected?.id, name: cust.name || selected?.name || "", phone: cust.phone, district: cust.district || selected?.district || undefined, upazila: cust.upazila || selected?.upazila || undefined, union: cust.union || selected?.union || undefined, village: cust.village || selected?.village || undefined }, items: lines.map((l) => ({ productId: l.p.id, qty: l.qty, unitPrice: payment === "cash" ? l.unitPrice : l.p.price, color: l.color, discount: Math.max(0, l.discount ?? 0) })), paymentType: payment, note: note || undefined, downPayment: payment === "installment" ? down : undefined, discount: Math.max(0, orderDiscount) });
    toast({ title: "বিক্রয় এন্ট্রি সংরক্ষিত", message: `${cust.name || selected?.name} • ${formatMoney(total)} • ${payment === "cash" ? "নগদ" : "কিস্তি"}`, tone: "success" });
    setItems({}); setCust({ name: "", phone: "", district: "", upazila: "", union: "", village: "" }); setPhone(""); setNote(""); setCustomDown(null); setOrderDiscount(0);
  };
  if (today.closed) return <Empty title="আজকের হিসাব ক্লোজ হয়েছে" hint="চূড়ান্ত জমার পরে আর বিক্রয় এন্ট্রি দেওয়া যায় না" />;
  if (!today.started) return <Empty title="আগে গোডাউন থেকে পণ্য নিন" hint="বিক্রয় এন্ট্রি দিতে হলে প্রথমে আজকের জন্য পণ্য নিতে হবে" action={<button onClick={goGodown} className="btn-primary">গোডাউনে যান</button>} />;
  return (
    <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-4">
        <div className="card p-4">
          <p className="font-bold">১. কাস্টমার</p>
          <div className="mt-2"><Tabs value={mode} onChange={(m) => { setMode(m); setCust({ name: "", phone: "", district: "", upazila: "", union: "", village: "" }); setPhone(""); }} tabs={[{ key: "registered", label: "নিবন্ধিত কাস্টমার", icon: <UserCheck className="h-4 w-4" /> }, { key: "new", label: "নতুন কাস্টমার", icon: <UserPlus className="h-4 w-4" /> }]} /></div>
          {mode === "registered" ? (
            <div className="mt-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="ফোন নম্বর / ইউনিক আইডি / নাম দিয়ে খুঁজুন" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              {found.length > 0 && !selected && <div className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 dark:divide-white/5 dark:border-white/10">{found.map((c) => <button key={c.id} onClick={() => { setCust({ name: c.name, phone: c.phone, district: c.district ?? "", upazila: c.upazila ?? "", union: c.union ?? "", village: c.village ?? "" }); setPhone(c.phone); }} className="flex w-full items-center justify-between p-2.5 text-left text-sm hover:bg-ink-50 dark:hover:bg-white/5"><span><b>{c.name}</b> <span className="text-xs text-ink-500">{c.phone}{c.uniqueId ? ` • ${c.uniqueId}` : " • আইডি নেই"}</span></span><span className="text-[11px] text-ink-400">{[c.village, areaLabel(c)].filter(Boolean).join(", ")}</span></button>)}</div>}
              {phone.length >= 4 && found.length === 0 && !selected && <p className="mt-2 text-xs text-ink-500">কেউ পাওয়া যায়নি — <button onClick={() => { setMode("new"); setCust({ ...cust, phone }); }} className="font-semibold text-brand-600 underline">নতুন কাস্টমার হিসেবে যোগ করুন</button></p>}
              {selected && <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-50 p-3 text-sm dark:bg-brand-500/10"><span><b>{selected.name}</b> • {selected.phone}<br /><span className="text-xs text-ink-500">{[selected.village, areaLabel(selected)].filter(Boolean).join(", ")}</span></span><Badge tone="emerald">নিবন্ধিত</Badge></div>}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2"><Field label="নাম *"><input className="input" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} /></Field><Field label="মোবাইল * (ইউনিক)"><input className="input" placeholder="01XXXXXXXXX" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} /></Field></div>
              {snap.customers.some((c) => c.phone === cust.phone) && <p className="text-xs font-semibold text-sun-700">এই নম্বরে ইতোমধ্যে কাস্টমার আছে — নিবন্ধিত হিসেবে বিক্রয় হবে</p>}
              <p className="rounded-xl bg-sky-50 p-2 text-[11px] font-semibold text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">নতুন কাস্টমারের ডিফল্ট পাসওয়ার্ড: <b>customer123</b> — কাস্টমার পরে প্রোফাইল থেকে বদলাতে পারবেন</p>
              <LocationPicker value={cust} onChange={(v) => setCust({ ...cust, ...v, village: v.village ?? "" })} />
            </div>
          )}
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between"><p className="font-bold">২. পণ্য (আপনার কাছে যা আছে)</p><button onClick={goGodown} className="text-xs font-semibold text-brand-600">অন্য পণ্য লাগবে? ক্লেইম করুন →</button></div>
          {available.length === 0 ? <p className="mt-2 text-xs text-ink-500">হাতে কোনো পণ্য নেই। গোডাউন থেকে নিন বা ক্লেইম করুন।</p> : (
            <div className="mt-2 space-y-2">
              {available.map((l) => {
                const p = snap.products.find((x) => x.id === l.productId)!;
                const cur = items[l.productId] ?? { qty: 0, unitPrice: p.cashPrice, color: p.colors[0] };
                return (
                  <div key={l.productId} className={cn("rounded-2xl border p-3", cur.qty > 0 ? "border-brand-400 bg-brand-50/50 dark:bg-brand-500/10" : "border-ink-100 dark:border-white/10")}>
                    <div className="flex items-center gap-3">
                      <img src={l.image} className="h-12 w-12 rounded-xl object-cover" alt="" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{l.name}</p><p className="text-[11px] text-ink-500">হাতে {l.remaining} • বিক্রয় মূল্য {formatMoney(p.price)} • নগদ {formatMoney(p.cashPrice)} • সর্বনিম্ন {formatMoney(p.minSellPrice ?? p.cashPrice)} • কিস্তি {formatMoney(p.installmentAmount)}×{p.installmentCount} {INSTALLMENT_LABEL[p.installmentType].bn}</p></div>
                      <QtyPicker value={cur.qty} max={l.remaining} onChange={(v) => setItems({ ...items, [l.productId]: { ...cur, qty: v } })} />
                    </div>
                    {cur.qty > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {payment === "cash" && <Field label={`একক মূল্য (সর্বনিম্ন ${formatMoney(p.minSellPrice ?? p.cashPrice)})`}><input type="number" className={cn("input", Math.max(0, cur.unitPrice - (cur.discount ?? 0)) < (p.minSellPrice ?? p.cashPrice) && "border-rose-500")} value={cur.unitPrice} onChange={(e) => setItems({ ...items, [l.productId]: { ...cur, unitPrice: Number(e.target.value) } })} /></Field>}
                        <Field label={`ছাড় (প্রতি ইউনিট ৳)`} hint={cur.discount ? `ছাড়ের পর: ${formatMoney(Math.max(0, (payment === "installment" ? p.price : cur.unitPrice) - cur.discount))}` : undefined}>
                          <input type="number" min={0} className="input" value={cur.discount ?? 0} onChange={(e) => setItems({ ...items, [l.productId]: { ...cur, discount: Math.max(0, Number(e.target.value)) } })} />
                        </Field>
                        {p.colors.length > 0 && <Field label="রং"><select className="input" value={cur.color} onChange={(e) => setItems({ ...items, [l.productId]: { ...cur, color: e.target.value } })}>{p.colors.map((c) => <option key={c}>{c}</option>)}</select></Field>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="card h-fit p-4 xl:sticky xl:top-36">
        <p className="font-bold">৩. পেমেন্ট ও জমা</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([["installment", "ডাউন পেমেন্ট / কিস্তি", <CalendarClock key="i" className="h-5 w-5" />], ["cash", "নগদ (Cash)", <Wallet key="c" className="h-5 w-5" />]] as const).map(([k, l, icon]) => (
            <button key={k} onClick={() => setPayment(k)} className={cn("rounded-2xl border-2 p-3 text-left", payment === k ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-ink-200 dark:border-white/10")}><div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", payment === k ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-white/10")}>{icon}</div><p className="mt-2 text-xs font-bold">{l}</p></button>
          ))}
        </div>
        <div className="mt-3 divide-y divide-ink-100 text-sm dark:divide-white/5">
          {lines.map((l) => <div key={l.p.id} className="flex justify-between py-1.5"><span className="truncate pr-2">{l.p.name} ×{l.qty}</span><b>{formatMoney((payment === "installment" ? l.p.price : l.unitPrice) * l.qty)}</b></div>)}
        </div>
        <div className="mt-3 space-y-2 rounded-2xl bg-ink-50 p-3 text-sm dark:bg-white/5">
          <div className="flex justify-between"><span className="text-ink-500">সাবটোটাল</span><b>{formatMoney(gross)}</b></div>
          {itemDiscount > 0 && <div className="flex justify-between text-rose-600"><span>পণ্যভিত্তিক ছাড়</span><b>− {formatMoney(itemDiscount)}</b></div>}
          <Field label="অতিরিক্ত ছাড় (পুরো অর্ডারে ৳)">
            <input type="number" min={0} max={Math.max(0, gross - itemDiscount)} className="input" value={orderDiscount} onChange={(e) => setOrderDiscount(Math.max(0, Math.min(gross - itemDiscount, Number(e.target.value))))} />
          </Field>
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base dark:border-white/10"><span className="font-bold">মোট</span><b>{formatMoney(total)}</b></div>
          {payment === "installment" && (
            <>
              <Field label="ডাউন পেমেন্ট (কম/বেশি করা যাবে)" hint={`প্রস্তাবিত: ${formatMoney(suggestedDown)}`}>
                <input type="number" min={0} max={total} className={cn("input", down > total && "border-rose-500")} value={down} onChange={(e) => setCustomDown(Math.max(0, Number(e.target.value)))} />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setCustomDown(suggestedDown)} className="chip !py-1 text-[11px]">প্রস্তাবিত</button>
                {[0.1, 0.25, 0.5].map((pc) => <button key={pc} onClick={() => setCustomDown(Math.round(total * pc))} className="chip !py-1 text-[11px]">{Math.round(pc * 100)}%</button>)}
                <button onClick={() => setCustomDown(total)} className="chip !py-1 text-[11px]">সম্পূর্ণ</button>
              </div>
              <div className="flex justify-between text-brand-700 dark:text-brand-300"><span>এখন নিচ্ছেন</span><b>{formatMoney(down)}</b></div>
              <div className="flex justify-between text-xs text-ink-500"><span>বাকি থাকবে</span><span>{formatMoney(Math.max(0, total - down))}</span></div>
            </>
          )}
        </div>
        <div className="mt-3"><Field label="নোট"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
        <button onClick={submit} disabled={!lines.length} className="btn-sun mt-3 w-full !py-3"><ShoppingBag className="h-4 w-4" /> বিক্রয় এন্ট্রি জমা দিন</button>
        <p className="mt-2 text-center text-[10px] text-ink-400">অফলাইনে থাকলে এন্ট্রি ফোনে সংরক্ষিত হবে এবং ইন্টারনেট এলে নিজে থেকেই জমা হবে</p>
      </div>
    </div>
  );
}

/* ---------------- History ---------------- */
export function HistoryPanel({ state, today }: { state: EmpState; today: TodayView }) {
  const dayTaken = today.lines.filter((l) => l.taken + l.claimed > 0);
  const daySold = today.lines.filter((l) => l.sold > 0);
  const dayBack = today.lines.filter((l) => l.returned > 0);
  const snap = state.snapshot!;
  const [tab, setTab] = useState<"today" | "sales" | "sessions" | "queue">("today");
  const pdf = () => exportPdf({ title: `Employee Report — ${snap.employee.name}`, subtitle: snap.employee.designation ?? "", filename: `my-report-${snap.employee.name}`, tables: [
    { title: "Godown sessions", columns: ["Date", "Taken", "Sold", "Returned", "Sold value", "Cash", "Status"], rows: snap.sessions.map((s) => [s.date, s.takenQty, s.soldQty, s.returnedQty, s.soldValue, s.cashCollected, s.status]) },
    { title: "Sales", columns: ["Order #", "Date", "Customer", "Phone", "Type", "Items", "Total", "Paid"], rows: snap.orders.map((o) => [o.orderNumber, formatDate(o.createdAt, true), o.customerName, o.customerPhone, o.type, o.items.map((i) => `${i.productName} x${i.quantity}`).join(", "), o.total, o.paidAmount]) },
  ] });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["নেওয়া", dayTaken.reduce((a, l) => a + l.taken + l.claimed, 0), dayTaken], ["বিক্রি", daySold.reduce((a, l) => a + l.sold, 0), daySold], ["ফেরত", dayBack.reduce((a, l) => a + l.returned, 0), dayBack], ["হাতে", today.totals.remainingQty, today.lines.filter((l) => l.remaining > 0)]].map(([label, qty, list]) => (
          <div key={String(label)} className="card p-3">
            <p className="text-lg font-extrabold">{String(qty)} টি</p>
            <p className="text-[11px] text-ink-500">আজ {String(label)}</p>
            <p className="mt-1 line-clamp-2 text-[10px] text-ink-400">{(list as TodayView["lines"]).map((l) => l.name).join(", ") || "—"}</p>
          </div>
        ))}
      </div>

    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><Tabs value={tab} onChange={setTab} tabs={[{ key: "today", label: "আজকের এন্ট্রি" }, { key: "sales", label: `আমার বিক্রয় (${snap.orders.length})` }, { key: "sessions", label: `গোডাউন সেশন (${snap.sessions.length})` }, { key: "queue", label: `অপেক্ষমাণ (${state.queue.length})` }]} /><button onClick={pdf} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> আমার রিপোর্ট PDF</button></div>
      {tab === "today" && (
        <div className="card divide-y divide-ink-100 dark:divide-white/5">
          {today.pendingSales.length === 0 && today.serverSales.length === 0 && <div className="p-6"><Empty title="আজ এখনো কোনো বিক্রয় নেই" /></div>}
          {today.pendingSales.map((s) => <div key={s.clientId} className="flex items-center justify-between p-3"><div><p className="text-sm font-bold">{s.customer.name} <span className="text-xs text-ink-400">{s.customer.phone}</span></p><p className="text-xs text-ink-500">{s.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p></div><div className="text-right"><p className="font-bold">{formatMoney(s.total)}</p><Badge tone="amber"><CloudUpload className="h-3 w-3" /> সিঙ্ক বাকি</Badge></div></div>)}
          {today.serverSales.map((o) => <div key={o.id} className="flex items-center justify-between p-3"><div><p className="text-sm font-bold">{o.customerName} <span className="text-xs text-ink-400">{o.customerPhone}</span></p><p className="text-xs text-ink-500">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")} • {formatDate(o.createdAt, true)}</p></div><div className="text-right"><p className="font-bold">{formatMoney(o.total)}</p><Badge tone="emerald">{ORDER_TYPE_LABEL[o.type].bn}</Badge></div></div>)}
        </div>
      )}
      {tab === "sales" && (
        <div className="card overflow-x-auto"><table className="table-base"><thead><tr><th>অর্ডার</th><th>তারিখ</th><th>কাস্টমার</th><th>পণ্য</th><th>পদ্ধতি</th><th>মোট</th><th>আদায়</th></tr></thead><tbody>{snap.orders.map((o) => <tr key={o.id}><td className="font-mono text-xs font-bold">{o.orderNumber}</td><td className="text-xs">{formatDate(o.createdAt, true)}</td><td><p className="font-semibold">{o.customerName}</p><p className="text-[10px] text-ink-400">{o.customerPhone}</p></td><td className="text-xs">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</td><td><Badge tone="sky">{ORDER_TYPE_LABEL[o.type].bn}</Badge></td><td className="font-bold">{formatMoney(o.total)}</td><td>{formatMoney(o.paidAmount)}</td></tr>)}</tbody></table></div>
      )}
      {tab === "sessions" && (
        <div className="card overflow-x-auto"><table className="table-base"><thead><tr><th>তারিখ</th><th>নেওয়া</th><th>বিক্রি</th><th>ফেরত</th><th>বিক্রয় মূল্য</th><th>নগদ আদায়</th><th>স্ট্যাটাস</th><th>নোট</th></tr></thead><tbody>{snap.sessions.map((s) => <tr key={s.id}><td className="font-semibold">{s.date}</td><td>{s.takenQty} <span className="text-[10px] text-ink-400">({formatMoney(s.takenValue + s.claimedValue)})</span></td><td>{s.soldQty}</td><td>{s.returnedQty}</td><td className="font-bold">{formatMoney(s.soldValue)}</td><td>{formatMoney(s.cashCollected)}</td><td>{s.status === "open" ? <Badge tone="amber">খোলা</Badge> : <Badge tone="emerald">ক্লোজড</Badge>}</td><td className="text-xs text-ink-500">{s.note}</td></tr>)}</tbody></table></div>
      )}
      {tab === "queue" && (
        <div className="space-y-3">
          <div className="card divide-y divide-ink-100 dark:divide-white/5">
            {state.queue.length === 0 && <p className="p-6 text-center text-sm text-ink-500">সব এন্ট্রি সার্ভারে জমা হয়েছে ✅</p>}
            {state.queue.map((a) => <div key={a.clientId} className="flex items-center justify-between p-3 text-sm"><div><Badge tone="amber">{a.kind}</Badge> <span className="text-xs text-ink-500">{new Date(a.at).toLocaleString("en-GB")}</span>{"items" in a && <p className="text-xs text-ink-500">{a.items.map((i) => `#${i.productId} ×${i.qty}`).join(", ")}</p>}{a.kind === "sale" && <p className="text-xs">{a.customer.name} • {a.customer.phone}</p>}</div><CloudUpload className="h-4 w-4 text-sun-500" /></div>)}
          </div>
          {state.failed.length > 0 && <div className="card divide-y divide-ink-100 border-rose-200 dark:divide-white/5 dark:border-rose-500/30"><p className="p-3 text-sm font-bold text-rose-600">গৃহীত হয়নি</p>{state.failed.map((f) => <div key={f.action.clientId} className="p-3 text-xs"><Badge tone="rose">{f.action.kind}</Badge> {f.error} <span className="text-ink-400">• {new Date(f.at).toLocaleString("en-GB")}</span></div>)}</div>}
        </div>
      )}
    </div>
    </div>
  );
}

/* ---------------- Packages + Customer Unique ID ---------------- */
export function PackagePanel({ snap }: { snap: EmployeeSnapshot; onSellSaved?: (id: number) => void }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Record<number, number>>({});
  const [price, setPrice] = useState(0);
  const [q, setQ] = useState("");
  const [sellFor, setSellFor] = useState<{ id?: number; name: string; items: { productId: number; qty: number; unitPrice: number }[]; price: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const lines = Object.entries(items).filter(([, qty]) => qty > 0).map(([id, qty]) => {
    const p = snap.products.find((x) => x.id === Number(id))!;
    return { p, qty, unitPrice: p.cashPrice };
  });
  const auto = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const finalPrice = price || auto;
  const list = snap.products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const saved = (snap.packages ?? []).filter((x) => x.status === "saved");
  const sold = (snap.packages ?? []).filter((x) => x.status !== "saved");
  const pName = (id: number) => snap.products.find((x) => x.id === id)?.name ?? `পণ্য #${id}`;

  const doSave = async () => {
    if (!lines.length) return toast({ title: "প্যাকেজে পণ্য যোগ করুন", tone: "warning" });
    setBusy(true);
    const r = await savePackageAction({ name: name || `প্যাকেজ-${lines.length}টি`, items: lines.map((l) => ({ productId: l.p.id, qty: l.qty, unitPrice: l.unitPrice })), price: finalPrice });
    setBusy(false);
    if (!r.ok) return toast({ title: r.error ?? "ব্যর্থ", tone: "error" });
    toast({ title: "প্যাকেজ সেভ হয়েছে", message: "যেকোনো সময় কাস্টমারের কাছে বিক্রি করতে পারবেন", tone: "success" });
    setItems({}); setName(""); setPrice(0);
  };

  return (
    <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="card min-w-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-2 font-bold"><Package className="h-4 w-4 text-brand-600" /> প্যাকেজ তৈরি করুন</p>
            <p className="text-xs text-ink-500">একাধিক পণ্য বেছে প্যাকেজ বানান — সেভ করুন অথবা সরাসরি কাস্টমারের কাছে বিক্রি করুন</p>
          </div>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="পণ্য খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className={cn("flex min-w-0 items-center gap-2 rounded-2xl border p-2", items[p.id] ? "border-brand-400 bg-brand-50/60 dark:bg-brand-500/10" : "border-ink-100 dark:border-white/10")}>
              <img src={p.images[0] ?? "/logo.png"} className="h-11 w-11 shrink-0 rounded-lg object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{p.name}</p>
                <p className="text-[10px] text-ink-500">স্টক {p.stock} • নগদ {formatMoney(p.cashPrice)} • কিস্তি {formatMoney(p.price)}</p>
              </div>
              <QtyPicker value={items[p.id] ?? 0} max={p.stock} onChange={(v) => setItems({ ...items, [p.id]: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="card min-w-0 space-y-3 p-4">
          <p className="text-sm font-bold">নতুন প্যাকেজ</p>
          <Field label="প্যাকেজের নাম"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: ঘর-সাজানো প্যাকেজ" /></Field>
          {lines.length === 0 ? <p className="rounded-xl border border-dashed border-ink-200 p-3 text-center text-xs text-ink-400 dark:border-white/10">বাম পাশ থেকে পণ্য বাছুন</p> : (
            <div className="divide-y divide-ink-100 rounded-xl border border-ink-100 text-sm dark:divide-white/5 dark:border-white/10">
              {lines.map((l) => (
                <div key={l.p.id} className="flex items-center gap-2 p-2">
                  <img src={l.p.images[0] ?? "/logo.png"} className="h-8 w-8 shrink-0 rounded-lg object-cover" alt="" />
                  <span className="min-w-0 flex-1 truncate text-xs">{l.p.name} <b>×{l.qty}</b></span>
                  <b className="shrink-0 text-xs">{formatMoney(l.unitPrice * l.qty)}</b>
                </div>
              ))}
            </div>
          )}
          <Field label={`প্যাকেজ মূল্য (অটো: ${formatMoney(auto)})`}><input type="number" className="input" value={price || auto} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy || !lines.length} onClick={doSave} className="btn-ghost">সেভ করুন</button>
            <button disabled={busy || !lines.length} onClick={() => setSellFor({ name: name || `প্যাকেজ-${lines.length}টি`, items: lines.map((l) => ({ productId: l.p.id, qty: l.qty, unitPrice: l.unitPrice })), price: finalPrice })} className="btn-primary">বিক্রি করুন</button>
          </div>
        </div>

        <div className="card min-w-0 p-4">
          <p className="text-sm font-bold">সেভ করা প্যাকেজ ({saved.length})</p>
          <div className="mt-2 space-y-2">
            {saved.length === 0 && <p className="text-xs text-ink-400">কোনো সেভ করা প্যাকেজ নেই</p>}
            {saved.map((pk) => (
              <div key={pk.id} className="rounded-xl border border-ink-100 p-2.5 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs font-bold">{pk.name}</p>
                  <b className="shrink-0 text-xs">{formatMoney(pk.price)}</b>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {(pk.items ?? []).map((it) => <li key={it.productId} className="truncate text-[10px] text-ink-500">• {pName(it.productId)} ×{it.qty} — {formatMoney(it.unitPrice * it.qty)}</li>)}
                </ul>
                <button onClick={() => setSellFor({ id: pk.id, name: pk.name, items: pk.items ?? [], price: pk.price })} className="btn-primary mt-2 w-full !py-1.5 text-[11px]">কাস্টমারের কাছে বিক্রি</button>
              </div>
            ))}
          </div>
        </div>

        {sold.length > 0 && (
          <div className="card min-w-0 p-4">
            <p className="text-sm font-bold">বিক্রি হওয়া প্যাকেজ ({sold.length})</p>
            <div className="mt-2 space-y-1.5">
              {sold.slice(0, 6).map((pk) => (
                <div key={pk.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 p-2 dark:bg-white/5">
                  <span className="min-w-0 truncate text-[11px]">{pk.name} <span className="text-ink-400">({(pk.items ?? []).length} পণ্য)</span></span>
                  <Badge tone={pk.status === "accepted" ? "emerald" : pk.status === "rejected" ? "rose" : "sky"}>{pk.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PackageSellModal pkg={sellFor} snap={snap} onClose={() => setSellFor(null)} onDone={() => { setSellFor(null); setItems({}); setName(""); setPrice(0); }} />
    </div>
  );
}

/** প্যাকেজ বিক্রয় মডাল — কাস্টমার রেজিস্ট্রেশন বাধ্যতামূলক */
function PackageSellModal({ pkg, snap, onClose, onDone }: { pkg: { id?: number; name: string; items: { productId: number; qty: number; unitPrice: number }[]; price: number } | null; snap: EmployeeSnapshot; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"registered" | "new">("registered");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<EmployeeSnapshot["customers"][number] | null>(null);
  const [c, setC] = useState({ name: "", phone: "", village: "", union: "", upazila: "", district: "", nid: "" });
  const [payment, setPayment] = useState<"cash" | "installment">("cash");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const found = useMemo(() => (search.length >= 3 ? snap.customers.filter((x) => x.phone.includes(search) || (x.uniqueId ?? "").toLowerCase().includes(search.toLowerCase()) || x.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6) : []), [search, snap.customers]);
  const pName = (id: number) => snap.products.find((x) => x.id === id)?.name ?? `পণ্য #${id}`;
  const pImg = (id: number) => snap.products.find((x) => x.id === id)?.images?.[0] ?? "/logo.png";

  const submit = async () => {
    if (!pkg) return;
    if (mode === "registered" && !picked) return toast({ title: "নিবন্ধিত কাস্টমার বাছুন", tone: "warning" });
    if (mode === "new") {
      if (!c.name.trim()) return toast({ title: "কাস্টমারের নাম দিন", tone: "warning" });
      if (!/^01\d{9}$/.test(c.phone)) return toast({ title: "সঠিক মোবাইল নম্বর দিন", tone: "warning" });
      if (!c.village.trim() || !c.upazila.trim() || !c.district.trim()) return toast({ title: "গ্রাম, উপজেলা ও জেলা আবশ্যক", message: "নতুন কাস্টমার রেজিস্ট্রেশনের জন্য প্রয়োজন", tone: "warning" });
    }
    setBusy(true);
    const r = await sellPackageAction({
      packageId: pkg.id, name: pkg.name, items: pkg.items, price: pkg.price,
      customerId: mode === "registered" ? picked!.id : undefined,
      customer: mode === "new" ? c : undefined,
      paymentType: payment,
    });
    setBusy(false);
    if (!r.ok) return toast({ title: r.error ?? "বিক্রি ব্যর্থ", tone: "error" });
    toast({ title: "প্যাকেজ বিক্রয় সম্পন্ন", message: r.created ? "নতুন কাস্টমার রেজিস্টার হয়েছে (পাসওয়ার্ড: customer123)" : "এডমিনের কাছে নোটিফিকেশন পাঠানো হয়েছে", tone: "success" });
    onDone();
  };

  return (
    <Modal open={!!pkg} onClose={onClose} title={`প্যাকেজ বিক্রয়: ${pkg?.name ?? ""}`} size="lg">
      {pkg && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold">প্যাকেজের পণ্যসমূহ ({pkg.items.length})</p>
            <div className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 dark:divide-white/5 dark:border-white/10">
              {pkg.items.map((it) => (
                <div key={it.productId} className="flex items-center gap-3 p-2.5">
                  <img src={pImg(it.productId)} className="h-10 w-10 shrink-0 rounded-lg object-cover" alt="" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pName(it.productId)}</p><p className="text-[11px] text-ink-500">{it.qty} × {formatMoney(it.unitPrice)}</p></div>
                  <b className="shrink-0 text-sm">{formatMoney(it.qty * it.unitPrice)}</b>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right text-sm">প্যাকেজ মূল্য: <b>{formatMoney(pkg.price)}</b></p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">কাস্টমার (রেজিস্ট্রেশন বাধ্যতামূলক)</p>
            <Tabs value={mode} onChange={(m) => { setMode(m); setPicked(null); }} tabs={[{ key: "registered", label: "নিবন্ধিত", icon: <UserCheck className="h-4 w-4" /> }, { key: "new", label: "নতুন রেজিস্ট্রেশন", icon: <UserPlus className="h-4 w-4" /> }]} />
            {mode === "registered" ? (
              <div className="mt-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="ফোন / ইউনিক আইডি / নাম" value={search} onChange={(e) => { setSearch(e.target.value); setPicked(null); }} /></div>
                {found.length > 0 && !picked && (
                  <div className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100 dark:divide-white/5 dark:border-white/10">
                    {found.map((x) => (
                      <button key={x.id} onClick={() => { setPicked(x); setSearch(x.phone); }} className="flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm hover:bg-ink-50 dark:hover:bg-white/5">
                        <span className="min-w-0 truncate"><b>{x.name}</b> <span className="text-xs text-ink-500">{x.phone}</span></span>
                        <span className="shrink-0 text-[11px] text-ink-400">{x.uniqueId ?? "আইডি নেই"}</span>
                      </button>
                    ))}
                  </div>
                )}
                {picked && <div className="mt-2 rounded-xl bg-brand-50 p-3 text-sm dark:bg-brand-500/10"><b>{picked.name}</b> • {picked.phone}<br /><span className="text-xs text-ink-500">{[picked.village, areaLabel(picked)].filter(Boolean).join(", ")}</span></div>}
                {search.length >= 3 && !found.length && !picked && <p className="mt-2 text-xs text-ink-500">পাওয়া যায়নি — <button onClick={() => { setMode("new"); setC({ ...c, phone: search }); }} className="font-semibold text-brand-600 underline">নতুন রেজিস্ট্রেশন করুন</button></p>}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="নাম *"><input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
                  <Field label="মোবাইল *"><input className="input" placeholder="01XXXXXXXXX" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field>
                </div>
                <LocationPicker value={c} onChange={(v) => setC({ ...c, ...v, village: v.village ?? "" })} />
                <Field label="জাতীয় পরিচয়পত্র (ঐচ্ছিক)"><input className="input" value={c.nid} onChange={(e) => setC({ ...c, nid: e.target.value })} /></Field>
                <p className="rounded-xl bg-sky-50 p-2 text-[11px] font-semibold text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">রেজিস্ট্রেশনের পর ডিফল্ট পাসওয়ার্ড: <b>customer123</b></p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">পেমেন্ট</p>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "installment"] as const).map((k) => (
                <button key={k} onClick={() => setPayment(k)} className={cn("rounded-2xl border-2 p-3 text-left", payment === k ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-ink-200 dark:border-white/10")}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", payment === k ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-white/10")}>{k === "cash" ? <Wallet className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}</div>
                  <p className="mt-2 text-xs font-bold">{k === "cash" ? "নগদ" : "কিস্তি (ডাউন পেমেন্ট)"}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={submit} disabled={busy} className="btn-primary w-full !py-3">{busy ? "প্রসেস হচ্ছে…" : "বিক্রয় নিশ্চিত করুন"}</button>
        </div>
      )}
    </Modal>
  );
}

export function UniqueIdPanel({ snap }: { snap: EmployeeSnapshot }) {
  const [q, setQ] = useState("");
  const [assign, setAssign] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const list = snap.customers.filter((c) => !q || c.phone.includes(q) || (c.uniqueId ?? "").toLowerCase().includes(q.toLowerCase()) || c.name.toLowerCase().includes(q.toLowerCase()));
  const without = snap.customers.filter((c) => !c.uniqueId);
  const doAssign = async (id: number) => {
    const r = await assignUniqueIdAction(id, assign[id] ?? "");
    toast({ title: r.ok ? "ইউনিক আইডি সেট হয়েছে" : r.error ?? "ব্যর্থ", tone: r.ok ? "success" : "error" });
  };
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="card p-4">
        <p className="flex items-center gap-2 font-bold"><IdCard className="h-4 w-4 text-brand-600" /> কাস্টমার ইউনিক আইডি</p>
        <p className="text-xs text-ink-500">ফোন নম্বর / ইউনিক আইডি / নাম দিয়ে খুঁজুন এবং আইডি সেট করুন</p>
        <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="খুঁজুন..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="mt-3 max-h-96 divide-y divide-ink-100 overflow-y-auto dark:divide-white/5">
          {list.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 py-2">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{c.name} <span className="text-xs font-normal text-ink-500">{c.phone}</span></p><p className="text-[11px] text-ink-400">{c.uniqueId ? <Badge tone="emerald">{c.uniqueId}</Badge> : "আইডি সেট করা হয়নি"}</p></div>
              <input className="input !w-32 !py-1.5 text-xs" placeholder="যেমন: CUS-1045" value={assign[c.id] ?? c.uniqueId ?? ""} onChange={(e) => setAssign({ ...assign, [c.id]: e.target.value })} />
              <button onClick={() => doAssign(c.id)} className="btn-outline !px-3 !py-1.5 text-xs">সেট</button>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-4">
        <p className="font-bold">যাদের ইউনিক আইডি নেই ({without.length})</p>
        <div className="mt-2 max-h-96 divide-y divide-ink-100 overflow-y-auto dark:divide-white/5">
          {without.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 py-2"><p className="truncate text-sm">{c.name} • {c.phone}</p><button onClick={() => { setQ(c.phone); }} className="text-xs font-semibold text-brand-600 underline">আইডি দিন</button></div>
          ))}
          {without.length === 0 && <p className="py-3 text-xs text-ink-400">সব কাস্টমারের আইডি সেট করা আছে 🎉</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- প্রি-স্টক পণ্যের চাহিদা (এডমিনকে সাজেশন) ---------------- */
export function ProductRequestPanel({ snap, enqueue }: { snap: EmployeeSnapshot; enqueue: Enqueue }) {
  const [f, setF] = useState({ name: "", brand: "", categoryId: "" as string, qty: 1, expectedPrice: 0, customerName: "", customerPhone: "", note: "" });
  const { toast } = useToast();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  // ইতোমধ্যে তালিকায় আছে কিনা — ডুপ্লিকেট অনুরোধ এড়াতে
  const existing = f.name.trim().length > 1
    ? snap.products.filter((p) => p.name.toLowerCase().includes(f.name.trim().toLowerCase())).slice(0, 3)
    : [];

  const submit = () => {
    if (!f.name.trim()) return toast({ title: "পণ্যের নাম দিন", tone: "warning" });
    if (f.customerPhone && !/^01\d{9}$/.test(f.customerPhone)) return toast({ title: "কাস্টমারের সঠিক মোবাইল নম্বর দিন", tone: "warning" });
    enqueue({
      kind: "product-request",
      request: {
        name: f.name.trim(), brand: f.brand.trim() || undefined,
        categoryId: f.categoryId ? Number(f.categoryId) : null,
        qty: Math.max(1, f.qty), expectedPrice: Math.max(0, f.expectedPrice),
        customerName: f.customerName.trim() || undefined, customerPhone: f.customerPhone.trim() || undefined,
        note: f.note.trim() || undefined,
      },
    });
    toast({ title: "চাহিদা এডমিনের কাছে পাঠানো হয়েছে", message: "অনুমোদিত হলে নোটিফিকেশন পাবেন", tone: "success" });
    setF({ name: "", brand: "", categoryId: "", qty: 1, expectedPrice: 0, customerName: "", customerPhone: "", note: "" });
  };

  return (
    <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card min-w-0 p-4">
        <p className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-brand-600" /> নতুন পণ্যের চাহিদা পাঠান</p>
        <p className="text-xs text-ink-500">কাস্টমার এমন পণ্য চেয়েছেন যা স্টকে, গোডাউনে বা তালিকায় নেই? এখান থেকে এডমিনকে জানান।</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="পণ্যের নাম *" className="sm:col-span-2"><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="যেমন: Walton LED TV 43 inch" /></Field>
          {existing.length > 0 && (
            <div className="sm:col-span-2 rounded-xl bg-sun-50 p-2.5 text-[11px] text-sun-800 dark:bg-sun-500/10 dark:text-sun-200">
              এই নামের পণ্য ইতোমধ্যে তালিকায় আছে: {existing.map((p) => `${p.name} (স্টক ${p.stock})`).join(", ")} — নিশ্চিত হয়ে অনুরোধ পাঠান।
            </div>
          )}
          <Field label="ব্র্যান্ড"><input className="input" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
          <Field label="পরিমাণ"><input type="number" min={1} className="input" value={f.qty} onChange={(e) => set("qty", Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="আনুমানিক মূল্য (৳)"><input type="number" min={0} className="input" value={f.expectedPrice} onChange={(e) => set("expectedPrice", Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="কাস্টমারের নাম"><input className="input" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} /></Field>
          <Field label="কাস্টমারের মোবাইল"><input className="input" placeholder="01XXXXXXXXX" value={f.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} /></Field>
          <Field label="বিস্তারিত / কারণ" className="sm:col-span-2"><textarea className="input" rows={3} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="কাস্টমার কেন চাইছেন, কোন মডেল/রং ইত্যাদি" /></Field>
        </div>
        <button onClick={submit} disabled={!f.name.trim()} className="btn-primary mt-4 w-full !py-3"><Sparkles className="h-4 w-4" /> এডমিনকে পাঠান</button>
        <p className="mt-2 text-center text-[11px] text-ink-400">অফলাইনে থাকলে ডিভাইসে সেভ হবে, ইন্টারনেট এলে নিজে থেকেই পাঠানো হবে</p>
      </div>

      <div className="card h-fit min-w-0 p-4">
        <p className="text-sm font-bold">কিভাবে কাজ করে</p>
        <ol className="mt-2 space-y-2 text-xs text-ink-500">
          <li><b className="text-ink-700 dark:text-ink-200">১.</b> কাস্টমারের চাহিদা অনুযায়ী পণ্যের তথ্য দিন</li>
          <li><b className="text-ink-700 dark:text-ink-200">২.</b> এডমিনের কাছে সাথে সাথে নোটিফিকেশন যাবে</li>
          <li><b className="text-ink-700 dark:text-ink-200">৩.</b> এডমিন গ্রহণ করলে পণ্যটি তালিকায় যুক্ত হবে</li>
          <li><b className="text-ink-700 dark:text-ink-200">৪.</b> আপনি নোটিফিকেশন পাবেন, তারপর গোডাউন থেকে নিয়ে বিক্রি করতে পারবেন</li>
        </ol>
      </div>
    </div>
  );
}
