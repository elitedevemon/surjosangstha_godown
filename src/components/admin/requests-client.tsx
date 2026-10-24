"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackagePlus, CheckCircle2, XCircle, Trash2, Search, Sparkles, User, Phone } from "lucide-react";
import { PageTitle } from "./shell";
import { Badge, Empty, Field, Modal, Spinner, Tabs } from "@/components/ui";
import { useToast } from "@/components/providers";
import { setRequestStatusAction, listRequestAsProductAction, deleteRequestAction } from "@/actions/extra";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import type { Category, ProductRequest } from "@/db/schema";

type Row = ProductRequest & { employeeName: string | null; branchName: string | null; categoryName: string | null };

const STATUS: Record<string, { bn: string; tone: string }> = {
  pending: { bn: "অপেক্ষমাণ", tone: "amber" },
  approved: { bn: "গৃহীত", tone: "sky" },
  rejected: { bn: "বাতিল", tone: "rose" },
  listed: { bn: "তালিকাভুক্ত", tone: "emerald" },
};

export function RequestsClient({ rows, categories }: { rows: Row[]; categories: Category[] }) {
  const sp = useSearchParams();
  const focusId = Number(sp.get("focus") ?? 0) || undefined;
  const [tab, setTab] = useState<"pending" | "approved" | "listed" | "rejected" | "all">("pending");
  const [q, setQ] = useState("");
  const [listFor, setListFor] = useState<Row | null>(null);
  const [rejectFor, setRejectFor] = useState<Row | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!focusId) return;
    const r = rows.find((x) => x.id === focusId);
    if (r) { setTab("all"); setQ(r.name); }
  }, [focusId, rows]);

  const list = useMemo(
    () => rows.filter((r) => (tab === "all" || r.status === tab) && (!q || [r.name, r.brand, r.employeeName, r.customerName, r.customerPhone].some((x) => x?.toLowerCase().includes(q.toLowerCase())))),
    [rows, tab, q],
  );
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  const approve = (r: Row) =>
    start(async () => {
      const res = await setRequestStatusAction(r.id, "approved");
      toast({ title: res.ok ? "চাহিদা গৃহীত হয়েছে" : res.error!, message: res.ok ? "এখন পণ্য তালিকায় যোগ করতে পারেন" : undefined, tone: res.ok ? "success" : "error" });
      if (res.ok) router.refresh();
    });

  return (
    <div>
      <PageTitle
        title="পণ্যের চাহিদা (প্রি-স্টক)"
        subtitle="কর্মীরা যেসব পণ্য কাস্টমারের চাহিদা অনুযায়ী সাজেস্ট করেছেন — গ্রহণ করে সরাসরি তালিকায় যোগ করুন"
        action={<Badge tone="amber">{count("pending")} টি অপেক্ষমাণ</Badge>}
      />
      <div className="mb-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "pending", label: `অপেক্ষমাণ (${count("pending")})` },
            { key: "approved", label: `গৃহীত (${count("approved")})` },
            { key: "listed", label: `তালিকাভুক্ত (${count("listed")})` },
            { key: "rejected", label: `বাতিল (${count("rejected")})` },
            { key: "all", label: `সব (${rows.length})` },
          ]}
        />
      </div>

      <div className="card">
        <div className="border-b border-ink-100 p-3 dark:border-white/10">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="পণ্য, ব্র্যান্ড, কর্মী বা কাস্টমার খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {list.length === 0 ? (
          <div className="p-6"><Empty title="কোনো চাহিদা নেই" hint="কর্মী প্যানেল থেকে পাঠানো নতুন পণ্যের অনুরোধ এখানে দেখা যাবে" /></div>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-white/5">
            {list.map((r) => (
              <div key={r.id} className={cn("p-4", r.id === focusId && "bg-brand-50/60 dark:bg-brand-500/5")}>
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-sun-400 text-white"><Sparkles className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {r.name} {r.brand && <span className="text-xs font-normal text-ink-500">({r.brand})</span>}
                      <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].bn}</Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      পরিমাণ <b>{r.qty}</b> টি • আনুমানিক মূল্য <b>{formatMoney(r.expectedPrice)}</b>
                      {r.categoryName && <> • ক্যাটাগরি {r.categoryName}</>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      কর্মী: {r.employeeName ?? "—"} • {r.branchName ?? "—"} • {formatDate(r.createdAt, true)}
                    </p>
                    {(r.customerName || r.customerPhone) && (
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {r.customerName ?? "কাস্টমার"}</span>
                        {r.customerPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {r.customerPhone}</span>}
                      </p>
                    )}
                    {r.note && <p className="mt-1 rounded-lg bg-ink-50 p-2 text-[11px] italic text-ink-600 dark:bg-white/5 dark:text-ink-300">“{r.note}”</p>}
                    {r.adminNote && <p className="mt-1 text-[11px] text-rose-600">এডমিন নোট: {r.adminNote}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {r.status === "pending" && (
                      <>
                        <button disabled={pending} onClick={() => approve(r)} className="btn-primary !px-3 !py-1.5 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> গ্রহণ</button>
                        <button disabled={pending} onClick={() => { setRejectFor(r); setNote(""); }} className="btn-ghost !px-3 !py-1.5 text-xs text-rose-500"><XCircle className="h-3.5 w-3.5" /> বাতিল</button>
                      </>
                    )}
                    {(r.status === "approved" || r.status === "pending") && (
                      <button disabled={pending} onClick={() => setListFor(r)} className="btn-outline !px-3 !py-1.5 text-xs"><PackagePlus className="h-3.5 w-3.5" /> তালিকায় যোগ</button>
                    )}
                    <button disabled={pending} onClick={() => start(async () => { const res = await deleteRequestAction(r.id); toast({ title: res.ok ? "মুছে ফেলা হয়েছে" : res.error!, tone: res.ok ? "success" : "error" }); router.refresh(); })} className="btn-ghost !px-2 !py-1.5 text-xs text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RejectModal r={rejectFor} note={note} setNote={setNote} onClose={() => setRejectFor(null)} />
      <ListModal r={listFor} categories={categories} onClose={() => setListFor(null)} />
    </div>
  );
}

function RejectModal({ r, note, setNote, onClose }: { r: Row | null; note: string; setNote: (v: string) => void; onClose: () => void }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  if (!r) return null;
  return (
    <Modal open onClose={onClose} title="চাহিদা বাতিল করবেন?" size="sm">
      <p className="text-sm text-ink-500">{r.name} — কর্মীকে কারণ জানাতে পারেন (ঐচ্ছিক)।</p>
      <div className="mt-3"><Field label="কারণ"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: এই মুহূর্তে সরবরাহ নেই" /></Field></div>
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1">ফিরে যান</button>
        <button disabled={pending} onClick={() => start(async () => { const res = await setRequestStatusAction(r.id, "rejected", note || undefined); toast({ title: res.ok ? "বাতিল করা হয়েছে" : res.error!, tone: res.ok ? "success" : "error" }); onClose(); router.refresh(); })} className="btn-danger flex-1">{pending && <Spinner />} হ্যাঁ, বাতিল</button>
      </div>
    </Modal>
  );
}

function ListModal({ r, categories, onClose }: { r: Row | null; categories: Category[]; onClose: () => void }) {
  const [f, setF] = useState({ name: "", brand: "", categoryId: null as number | null, price: 0, cashPrice: 0, minSellPrice: 0, installmentType: "monthly" as "daily" | "weekly" | "monthly", downPayment: 0, installmentAmount: 0, installmentCount: 12, stock: 0, godownStock: 0 });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!r) return;
    const est = r.expectedPrice || 0;
    setF({
      name: r.name, brand: r.brand ?? "", categoryId: r.categoryId ?? null,
      price: Math.round(est * 1.2), cashPrice: est, minSellPrice: Math.round(est * 0.95),
      installmentType: "monthly", downPayment: Math.round(est * 0.2),
      installmentAmount: Math.max(1, Math.round((est * 1.2 - est * 0.2) / 12)), installmentCount: 12,
      stock: r.qty, godownStock: r.qty,
    });
  }, [r]);

  if (!r) return null;
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  const planTotal = f.downPayment + f.installmentAmount * f.installmentCount;

  return (
    <Modal open onClose={onClose} title={`পণ্য তালিকায় যোগ — ${r.name}`} size="lg">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="পণ্যের নাম *" className="sm:col-span-2"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="ব্র্যান্ড"><input className="input" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
        <Field label="ক্যাটাগরি"><select className="input" value={f.categoryId ?? ""} onChange={(e) => setF({ ...f, categoryId: e.target.value ? Number(e.target.value) : null })}><option value="">— নির্বাচন —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="নগদ মূল্য"><input type="number" className="input" value={f.cashPrice} onChange={num("cashPrice")} /></Field>
        <Field label="কিস্তিতে মোট মূল্য"><input type="number" className="input" value={f.price} onChange={num("price")} /></Field>
        <Field label="সর্বনিম্ন বিক্রয় মূল্য"><input type="number" className="input" value={f.minSellPrice} onChange={num("minSellPrice")} /></Field>
        <Field label="কিস্তির ধরন"><select className="input" value={f.installmentType} onChange={(e) => setF({ ...f, installmentType: e.target.value as typeof f.installmentType })}><option value="daily">দৈনিক</option><option value="weekly">সাপ্তাহিক</option><option value="monthly">মাসিক</option></select></Field>
        <Field label="ডাউন পেমেন্ট"><input type="number" className="input" value={f.downPayment} onChange={num("downPayment")} /></Field>
        <Field label="প্রতি কিস্তি"><input type="number" className="input" value={f.installmentAmount} onChange={num("installmentAmount")} /></Field>
        <Field label="কিস্তির সংখ্যা"><input type="number" className="input" value={f.installmentCount} onChange={num("installmentCount")} /></Field>
        <Field label="মূল স্টক"><input type="number" className="input" value={f.stock} onChange={num("stock")} /></Field>
        <Field label="গোডাউন স্টক"><input type="number" className="input" value={f.godownStock} onChange={num("godownStock")} /></Field>
      </div>
      <p className={cn("mt-2 text-xs font-semibold", planTotal === f.price ? "text-brand-700" : "text-sun-700")}>
        ডাউন + কিস্তি = {formatMoney(planTotal)} {planTotal !== f.price && `(কিস্তির মোট মূল্য ${formatMoney(f.price)} এর সাথে মিলছে না)`}
      </p>
      <button
        disabled={pending || !f.name.trim()}
        onClick={() => start(async () => {
          const res = await listRequestAsProductAction({ id: r.id, ...f, minSellPrice: f.minSellPrice || null });
          toast({ title: res.ok ? "পণ্য তালিকায় যুক্ত হয়েছে" : res.error!, message: res.ok ? "কর্মীকে নোটিফিকেশন পাঠানো হয়েছে" : undefined, tone: res.ok ? "success" : "error" });
          if (res.ok) { onClose(); router.refresh(); }
        })}
        className="btn-primary mt-4 w-full !py-3"
      >
        {pending ? <Spinner /> : <PackagePlus className="h-4 w-4" />} পণ্য তালিকায় যোগ করুন
      </button>
    </Modal>
  );
}
