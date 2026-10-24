"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Search, FileDown, CheckCircle2, XCircle, Truck, Eye, MapPin, Phone, User, Warehouse, PackageSearch, Lock, Undo2 } from "lucide-react";
import { Modal, Badge, Field, Spinner, Tabs, Stat, Empty } from "@/components/ui";
import { useToast } from "@/components/providers";
import { setOrderStatus, forceCloseSession } from "@/actions/admin";
import { restoreOrderAction, setPackageStatusAction } from "@/actions/extra";
import type { Package } from "@/db/schema";
import { PageTitle } from "./shell";
import { exportPdf } from "@/lib/pdf";
import { cn, formatDate, formatMoney, ORDER_TYPE_LABEL, STATUS_LABEL, INSTALLMENT_LABEL, areaLabel } from "@/lib/utils";
import type { Order, OrderItem, GodownSession, GodownMovement, Product } from "@/db/schema";

export type OrderRow = Order & { items: OrderItem[]; branchName: string; employeeName: string | null };

export function OrdersManager({ orders, focus, packages }: { orders: OrderRow[]; focus?: number; packages?: Package[] }) {
  const sp = useSearchParams();
  const focusId = Number(sp.get("focus") ?? focus ?? 0) || undefined;
  const [tab, setTab] = useState<"all" | "pending" | "accepted" | "delivered" | "rejected" | "cancelled">("all");
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<OrderRow | null>(orders.find((o) => o.id === focusId) ?? null);
  // নোটিফিকেশনে ক্লিক করলে (একই পেজে থাকলেও) সংশ্লিষ্ট অর্ডারের পপআপ খুলবে
  useEffect(() => {
    if (!focusId) return;
    const found = orders.find((o) => o.id === focusId);
    if (found) setSel(found);
  }, [focusId, orders]);
  const list = useMemo(() => orders.filter((o) => (tab === "all" || o.status === tab) && (!type || o.type === type) && (!source || o.source === source) && (!q || [o.orderNumber, o.customerName, o.customerPhone, o.employeeName].some((x) => x?.toLowerCase().includes(q.toLowerCase())))), [orders, tab, type, source, q]);
  const counts = (s: string) => orders.filter((o) => o.status === s).length;
  const pdf = () => exportPdf({ title: "Order History", subtitle: `${list.length} orders`, filename: "orders", tables: [{ title: "Orders", columns: ["Order #", "Date", "Customer", "Phone", "Branch", "Type", "Source", "Employee", "Total", "Paid", "Status"], rows: list.map((o) => [o.orderNumber, formatDate(o.createdAt, true), o.customerName, o.customerPhone, o.branchName, o.type, o.source, o.employeeName ?? "-", o.total, o.paidAmount, o.status]) }] });
  return (
    <div>
      <PageTitle title="অর্ডার ও বিক্রয় ইতিহাস" subtitle={`${orders.length} টি অর্ডার • পেন্ডিং ${counts("pending")}`} action={<button onClick={pdf} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> PDF রিপোর্ট</button>} />
      <div className="mb-3"><Tabs value={tab} onChange={setTab} tabs={[{ key: "all", label: `সব (${orders.length})` }, { key: "pending", label: `পেন্ডিং (${counts("pending")})` }, { key: "accepted", label: `গৃহীত (${counts("accepted")})` }, { key: "delivered", label: `ডেলিভারড (${counts("delivered")})` }, { key: "rejected", label: `বাতিল (${counts("rejected")})` }, { key: "cancelled", label: `ক্যানসেল (${counts("cancelled")})` }]} /></div>
      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-ink-100 p-3 dark:border-white/10">
          <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="অর্ডার নম্বর, নাম, ফোন..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}><option value="">সব পদ্ধতি</option><option value="installment">কিস্তি</option><option value="cash">নগদ</option><option value="cod">COD</option></select>
          <select className="input w-auto" value={source} onChange={(e) => setSource(e.target.value)}><option value="">সব উৎস</option><option value="online">অনলাইন</option><option value="employee">মাঠকর্মী</option></select>
        </div>
        {list.length === 0 ? <div className="p-6"><Empty title="কোনো অর্ডার নেই" /></div> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>অর্ডার</th><th>কাস্টমার</th><th>শাখা</th><th>পণ্য</th><th>পদ্ধতি</th><th>মোট / পরিশোধ</th><th>উৎস</th><th>স্ট্যাটাস</th><th>সময়</th><th></th></tr></thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className={cn(o.id === focusId && "bg-brand-50/60 dark:bg-brand-500/5")}>
                    <td className="font-mono text-xs font-bold">{o.orderNumber}</td>
                    <td><p className="font-semibold">{o.customerName}</p><p className="text-[10px] text-ink-400">{o.customerPhone} • {areaLabel(o)}</p></td>
                    <td className="text-xs">{o.branchName}</td>
                    <td className="text-xs">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</td>
                    <td><Badge tone="sky">{ORDER_TYPE_LABEL[o.type].bn}</Badge></td>
                    <td><p className="font-bold">{formatMoney(o.total)}</p><p className="text-[10px] text-ink-400">পরিশোধ {formatMoney(o.paidAmount)}</p></td>
                    <td className="text-xs">{o.source === "employee" ? <span>👤 {o.employeeName}</span> : "🌐 অনলাইন"}</td>
                    <td><Badge tone={STATUS_LABEL[o.status].tone}>{STATUS_LABEL[o.status].bn}</Badge></td>
                    <td className="text-xs text-ink-500">{formatDate(o.createdAt, true)}</td>
                    <td><button onClick={() => setSel(o)} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> বিস্তারিত</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <OrderModal o={sel} onClose={() => setSel(null)} packages={packages} />
    </div>
  );
}

function OrderModal({ o, onClose, packages }: { o: OrderRow | null; onClose: () => void; packages?: Package[] }) {
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<null | "accepted" | "rejected" | "cancelled" | "delivered">(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const act = (status: "accepted" | "rejected" | "delivered" | "cancelled") => start(async () => {
    const r = await setOrderStatus(o!.id, status, note || undefined);
    toast({ title: r.ok ? `অর্ডার ${STATUS_LABEL[status].bn}` : r.error!, tone: r.ok ? "success" : "error" });
    setConfirm(null);
    if (r.ok) { router.refresh(); onClose(); }
  });
  const pkg = o?.packageId ? packages?.find((x) => x.id === o.packageId) : undefined;
  if (!o) return null;
  return (
    <Modal open onClose={onClose} title={<span className="font-mono">{o.orderNumber}</span>} size="lg">
      <div className="flex flex-wrap gap-1.5"><Badge tone={STATUS_LABEL[o.status].tone}>{STATUS_LABEL[o.status].bn}</Badge><Badge tone="sky">{ORDER_TYPE_LABEL[o.type].bn}</Badge><Badge tone="slate">{o.source === "employee" ? `মাঠকর্মী: ${o.employeeName}` : "অনলাইন অর্ডার"}</Badge><Badge tone="slate">{o.branchName}</Badge></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-ink-50 p-4 text-sm dark:bg-white/5">
          <p className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-brand-600" /> {o.customerName}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-ink-500"><Phone className="h-3.5 w-3.5" /> {o.customerPhone}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-ink-500"><MapPin className="h-3.5 w-3.5" /> {[o.village, areaLabel(o)].filter(Boolean).join(", ")}</p>
          {o.address && <p className="mt-1 text-xs text-ink-500">{o.address}</p>}
          {o.notes && <p className="mt-2 rounded-lg bg-white p-2 text-xs italic dark:bg-ink-900">“{o.notes}”</p>}
        </div>
        <div className="rounded-2xl bg-ink-50 p-4 text-sm dark:bg-white/5">
          <div className="flex justify-between"><span className="text-ink-500">মোট</span><b>{formatMoney(o.total)}</b></div>
          <div className="flex justify-between"><span className="text-ink-500">পরিশোধিত</span><b>{formatMoney(o.paidAmount)}</b></div>
          {o.discount > 0 && <div className="flex justify-between text-rose-600"><span>ছাড়</span><b>− {formatMoney(o.discount)}</b></div>}
          {o.type === "installment" && o.installmentType && (
            <>
              <div className="flex justify-between"><span className="text-ink-500">ডাউন পেমেন্ট</span><b>{formatMoney(o.downPayment)}</b></div>
              <div className="flex justify-between"><span className="text-ink-500">কিস্তি</span><b>{formatMoney(o.installmentAmount)} × {o.installmentCount} ({INSTALLMENT_LABEL[o.installmentType].bn})</b></div>
            </>
          )}
          <div className="flex justify-between"><span className="text-ink-500">তারিখ</span><b>{formatDate(o.createdAt, true)}</b></div>
          {o.adminNote && <p className="mt-2 text-xs text-ink-500">এডমিন নোট: {o.adminNote}</p>}
        </div>
      </div>
      <div className="mt-4 divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-white/5 dark:border-white/10">
        {o.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 p-3">
            <img src={i.image ?? "/logo.png"} className="h-12 w-12 rounded-xl object-cover" alt="" />
            <div className="flex-1"><p className="text-sm font-semibold">{i.productName}</p><p className="text-[11px] text-ink-500">{i.quantity} × {formatMoney(i.unitPrice)}{i.color && ` • ${i.color}`}</p></div>
            <b className="text-sm">{formatMoney(i.lineTotal)}</b>
          </div>
        ))}
      </div>
      {pkg && (
        <div className="mt-4 rounded-2xl border-2 border-brand-300 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
          <p className="flex items-center justify-between font-bold"><span>📦 প্যাকেজ: {pkg.name}</span><Badge tone={pkg.status === "sold" ? "sky" : pkg.status === "accepted" ? "emerald" : pkg.status === "rejected" ? "rose" : "slate"}>{pkg.status}</Badge></p>
          <div className="mt-2 divide-y divide-white/40 text-sm dark:divide-white/10">
            {(pkg.items ?? []).map((it) => {
              const li = o.items.find((x) => x.productId === it.productId);
              return (
                <div key={it.productId} className="flex items-center gap-3 py-2">
                  <img src={li?.image ?? "/logo.png"} className="h-10 w-10 shrink-0 rounded-lg object-cover" alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{li?.productName ?? `পণ্য #${it.productId}`}</p>
                    <p className="text-[11px] text-ink-500">{it.qty} × {formatMoney(it.unitPrice)}</p>
                  </div>
                  <b className="shrink-0">{formatMoney(it.unitPrice * it.qty)}</b>
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-white/60 p-2 dark:bg-white/5"><p className="font-extrabold">{(pkg.items ?? []).length}</p><p className="text-ink-500">ধরনের পণ্য</p></div>
            <div className="rounded-lg bg-white/60 p-2 dark:bg-white/5"><p className="font-extrabold">{(pkg.items ?? []).reduce((a, i) => a + i.qty, 0)}</p><p className="text-ink-500">মোট ইউনিট</p></div>
            <div className="rounded-lg bg-white/60 p-2 dark:bg-white/5"><p className="font-extrabold">{formatMoney(pkg.price)}</p><p className="text-ink-500">প্যাকেজ মূল্য</p></div>
          </div>
          <p className="mt-2 text-[11px] text-ink-500">বিক্রয়কারী: {o.employeeName ?? "—"} • কাস্টমার: {o.customerName} ({o.customerPhone}) • পদ্ধতি: {ORDER_TYPE_LABEL[o.type].bn}</p>
          {pkg.status === "sold" && (
            <div className="mt-3 flex gap-2">
              <button onClick={async () => { await setPackageStatusAction(pkg.id, "accepted"); router.refresh(); }} className="btn-primary !py-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> প্যাকেজ গ্রহণ</button>
              <button onClick={async () => { await setPackageStatusAction(pkg.id, "rejected"); router.refresh(); }} className="btn-danger !py-2 text-xs"><XCircle className="h-3.5 w-3.5" /> প্যাকেজ বাতিল</button>
            </div>
          )}
        </div>
      )}
      {(o.status === "cancelled" || o.status === "rejected") && (
        <button onClick={async () => { const r = await restoreOrderAction(o.id); toast({ title: r.ok ? "অর্ডার রিস্টোর হয়েছে (পেন্ডিং)" : r.error!, tone: r.ok ? "success" : "error" }); if (r.ok) { router.refresh(); onClose(); } }} className="btn-outline mt-4"><Undo2 className="h-4 w-4" /> ভুলে বাতিল হয়ে গেছে? রিস্টোর করুন</button>
      )}
      {(o.status === "pending" || o.status === "accepted") && (
        <div className="mt-4 space-y-3">
          <Field label="এডমিন নোট (ঐচ্ছিক)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="কাস্টমারকে জানানোর মতো নোট" /></Field>
          <div className="flex flex-wrap gap-2">
            {o.status === "pending" && <button disabled={pending} onClick={() => setConfirm("accepted")} className="btn-primary"><CheckCircle2 className="h-4 w-4" /> গ্রহণ করুন</button>}
            {o.status === "accepted" && <button disabled={pending} onClick={() => setConfirm("delivered")} className="btn-primary"><Truck className="h-4 w-4" /> ডেলিভারড</button>}
            <button disabled={pending} onClick={() => setConfirm(o.status === "pending" ? "rejected" : "cancelled")} className="btn-danger"><XCircle className="h-4 w-4" /> {o.status === "pending" ? "বাতিল করুন" : "ক্যানসেল"}</button>
            {pending && <Spinner className="self-center" />}
          </div>
        </div>
      )}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="নিশ্চিত করুন" size="sm">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {confirm === "accepted" && "অর্ডারটি গ্রহণ করবেন? স্টক কেটে যাবে এবং কাস্টমারকে জানানো হবে।"}
          {confirm === "delivered" && "অর্ডারটি ডেলিভারড হিসেবে চিহ্নিত করবেন?"}
          {(confirm === "rejected" || confirm === "cancelled") && "অর্ডারটি বাতিল করবেন? পরে চাইলে রিস্টোর করা যাবে।"}
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setConfirm(null)} className="btn-ghost flex-1">না</button>
          <button disabled={pending} onClick={() => confirm && act(confirm)} className="btn-primary flex-1">হ্যাঁ, নিশ্চিত</button>
        </div>
      </Modal>
    </Modal>
  );
}

/* ---------------- Godown ---------------- */
export type SessionRow = GodownSession & { employeeName: string; branchName: string };
export type StockRow = Product & { branchName: string; categoryName: string | null; outInField: number };

export function GodownView({ stock, sessions, movements, sessionOrders, focusSession }: { stock: StockRow[]; sessions: SessionRow[]; movements: GodownMovement[]; sessionOrders: OrderRow[]; focusSession?: number }) {
  const sp = useSearchParams();
  const focusId = Number(sp.get("session") ?? focusSession ?? 0) || undefined;
  const focusProduct = Number(sp.get("product") ?? 0) || undefined;
  const [tab, setTab] = useState<"stock" | "sessions">(focusId ? "sessions" : "stock");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<SessionRow | null>(sessions.find((s) => s.id === focusId) ?? null);
  const [stockFocus, setStockFocus] = useState<StockRow | null>(null);
  // গোডাউন নোটিফিকেশনে ক্লিক → সেশনের হিসাব পপআপ
  useEffect(() => {
    if (!focusId) return;
    const f = sessions.find((s) => s.id === focusId);
    if (f) { setTab("sessions"); setSel(f); }
  }, [focusId, sessions]);
  // পণ্য-ভিত্তিক গোডাউন নোটিফিকেশন → সেই পণ্যের গোডাউন হিসাব পপআপ
  useEffect(() => {
    if (!focusProduct) return;
    const p = stock.find((x) => x.id === focusProduct);
    if (p) { setTab("stock"); setStockFocus(p); }
  }, [focusProduct, stock]);
  const totalStock = stock.reduce((a, p) => a + p.stock, 0);
  const value = stock.reduce((a, p) => a + p.stock * p.cashPrice, 0);
  const out = stock.reduce((a, p) => a + p.outInField, 0);
  const open = sessions.filter((s) => s.status === "open").length;
  const filtered = stock.filter((p) => !q || [p.name, p.sku, p.branchName, p.categoryName].some((x) => x?.toLowerCase().includes(q.toLowerCase())));
  const pdfStock = () => exportPdf({ title: "Godown Stock Report", subtitle: `${filtered.length} products`, filename: "godown-stock", tables: [{ title: "Stock", columns: ["SKU", "Product", "Branch", "Category", "In godown", "Out in field", "Unit price", "Stock value"], rows: filtered.map((p) => [p.sku ?? "", p.name, p.branchName, p.categoryName ?? "", p.stock, p.outInField, p.cashPrice, p.stock * p.cashPrice]) }] });
  const pdfSessions = () => exportPdf({ title: "Godown Session Report", subtitle: `${sessions.length} sessions`, filename: "godown-sessions", tables: [{ title: "Sessions", columns: ["Date", "Employee", "Branch", "Taken qty", "Taken value", "Sold qty", "Sold value", "Returned qty", "Cash collected", "Status"], rows: sessions.map((s) => [s.date, s.employeeName, s.branchName, s.takenQty, s.takenValue + s.claimedValue, s.soldQty, s.soldValue, s.returnedQty, s.cashCollected, s.status]) }] });
  return (
    <div>
      <PageTitle title="গোডাউন তথ্য" subtitle="স্টক, মাঠে থাকা পণ্য ও কর্মীদের দৈনিক হিসাব" action={<div className="flex gap-2"><button onClick={pdfStock} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> স্টক PDF</button><button onClick={pdfSessions} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> সেশন PDF</button></div>} />
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="গোডাউনে মোট" value={totalStock} sub={`${stock.length} পণ্য`} icon={<Warehouse className="h-5 w-5" />} />
        <Stat label="স্টক মূল্য" value={formatMoney(value)} icon={<PackageSearch className="h-5 w-5" />} tone="violet" />
        <Stat label="মাঠে আছে" value={out} sub="কর্মীদের কাছে (খোলা সেশন)" icon={<Truck className="h-5 w-5" />} tone="sun" />
        <Stat label="খোলা সেশন" value={open} sub={`মোট ${sessions.length} সেশন`} icon={<Lock className="h-5 w-5" />} tone="sky" />
      </div>
      <div className="mb-3"><Tabs value={tab} onChange={setTab} tabs={[{ key: "stock", label: "পণ্য স্টক" }, { key: "sessions", label: "কর্মী সেশন / হিসাব" }]} /></div>
      {tab === "stock" ? (
        <div className="card">
          <div className="border-b border-ink-100 p-3 dark:border-white/10"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="পণ্য খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>পণ্য</th><th>শাখা</th><th>ক্যাটাগরি</th><th>গোডাউনে</th><th>মাঠে</th><th>একক মূল্য</th><th>স্টক মূল্য</th><th>অবস্থা</th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => setStockFocus(p)} className={cn("cursor-pointer transition hover:bg-ink-50 dark:hover:bg-white/5", stockFocus?.id === p.id && "bg-brand-50/60 dark:bg-brand-500/5")}>
                    <td><div className="flex items-center gap-2"><img src={p.images[0] ?? "/logo.png"} className="h-9 w-9 rounded-lg object-cover" alt="" /><div><p className="font-semibold">{p.name}</p><p className="text-[10px] text-ink-400">{p.sku}</p></div></div></td>
                    <td className="text-xs">{p.branchName}</td><td className="text-xs">{p.categoryName}</td>
                    <td className="font-bold">{p.stock}</td><td className={cn("font-bold", p.outInField > 0 && "text-sun-600")}>{p.outInField}</td>
                    <td>{formatMoney(p.cashPrice)}</td><td className="font-semibold">{formatMoney(p.stock * p.cashPrice)}</td>
                    <td>{p.stock === 0 ? <Badge tone="rose">স্টক শেষ</Badge> : p.stock <= p.lowStockAt ? <Badge tone="amber">কম স্টক</Badge> : <Badge tone="emerald">ঠিক আছে</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>তারিখ</th><th>কর্মী</th><th>শাখা</th><th>নেওয়া</th><th>বিক্রি</th><th>ফেরত</th><th>নগদ আদায়</th><th>স্ট্যাটাস</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className={cn(s.id === focusId && "bg-brand-50/60 dark:bg-brand-500/5")}>
                  <td className="font-semibold">{s.date}</td><td>{s.employeeName}</td><td className="text-xs">{s.branchName}</td>
                  <td>{s.takenQty} <span className="text-[10px] text-ink-400">({formatMoney(s.takenValue + s.claimedValue)})</span></td>
                  <td>{s.soldQty} <span className="text-[10px] text-ink-400">({formatMoney(s.soldValue)})</span></td>
                  <td>{s.returnedQty}</td><td className="font-bold">{formatMoney(s.cashCollected)}</td>
                  <td>{s.status === "open" ? <Badge tone="amber">খোলা</Badge> : <Badge tone="emerald">ক্লোজড</Badge>}</td>
                  <td><button onClick={() => setSel(s)} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> বিস্তারিত</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <StockModal p={stockFocus} onClose={() => setStockFocus(null)} sessions={sessions} movements={movements} />
      <SessionModal s={sel} onClose={() => setSel(null)} movements={movements.filter((m) => m.sessionId === sel?.id)} orders={sessionOrders.filter((o) => o.sessionId === sel?.id)} />
    </div>
  );
}

/** পণ্য-ভিত্তিক গোডাউন হিসাব পপআপ — স্টক, মাঠে থাকা, চলাচলের ইতিহাস */
function StockModal({ p, onClose, sessions, movements }: { p: StockRow | null; onClose: () => void; sessions: SessionRow[]; movements: GodownMovement[] }) {
  if (!p) return null;
  const mv = movements.filter((m) => m.productId === p.id).slice(-40).reverse();
  const nameOf = (sid: number) => sessions.find((x) => x.id === sid);
  const sum = (t: string) => mv.filter((m) => m.type === t).reduce((a, m) => a + m.quantity, 0);
  const label: Record<string, string> = { take: "গোডাউন থেকে নেওয়া", claim: "অতিরিক্ত ক্লেইম", return: "গোডাউনে ফেরত" };
  return (
    <Modal open onClose={onClose} title={`গোডাউন হিসাব — ${p.name}`} size="lg">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="slate">{p.branchName}</Badge>
        {p.categoryName && <Badge tone="slate">{p.categoryName}</Badge>}
        {p.stock === 0 ? <Badge tone="rose">স্টক শেষ</Badge> : p.stock <= p.lowStockAt ? <Badge tone="amber">কম স্টক</Badge> : <Badge tone="emerald">স্টক ঠিক আছে</Badge>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["গোডাউনে", `${p.godownStock}`], ["মূল স্টক", `${p.stock}`], ["মাঠে আছে", `${p.outInField}`], ["স্টক মূল্য", formatMoney(p.stock * p.cashPrice)]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-ink-50 p-3 text-center dark:bg-white/5">
            <p className="text-lg font-extrabold">{v}</p>
            <p className="text-[10px] text-ink-400">{k}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-xl border border-ink-100 p-2 dark:border-white/10"><p className="font-bold">{sum("take")}</p><p className="text-ink-400">মোট নেওয়া</p></div>
        <div className="rounded-xl border border-ink-100 p-2 dark:border-white/10"><p className="font-bold">{sum("claim")}</p><p className="text-ink-400">মোট ক্লেইম</p></div>
        <div className="rounded-xl border border-ink-100 p-2 dark:border-white/10"><p className="font-bold">{sum("return")}</p><p className="text-ink-400">মোট ফেরত</p></div>
      </div>
      <p className="mt-4 text-sm font-bold">সাম্প্রতিক চলাচল ({mv.length})</p>
      <div className="mt-1 max-h-72 divide-y divide-ink-100 overflow-y-auto rounded-2xl border border-ink-100 text-sm dark:divide-white/5 dark:border-white/10">
        {mv.length === 0 && <p className="p-3 text-xs text-ink-400">এই পণ্যের কোনো গোডাউন চলাচল নেই</p>}
        {mv.map((m) => {
          const sess = nameOf(m.sessionId);
          return (
            <div key={m.id} className="flex items-center justify-between gap-2 p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold">{sess?.employeeName ?? "কর্মী"} • {sess?.date ?? ""}</p>
                <p className="text-[10px] text-ink-400">{formatDate(m.createdAt, true)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <b className="text-sm">{m.quantity} টি</b>
                <Badge tone={m.type === "return" ? "sky" : m.type === "claim" ? "violet" : "emerald"}>{label[m.type]}</Badge>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-ink-500">দাম: বিক্রয় {formatMoney(p.price)} • নগদ {formatMoney(p.cashPrice)} • সর্বনিম্ন {formatMoney(p.minSellPrice ?? p.cashPrice)}</p>
    </Modal>
  );
}

function SessionModal({ s, onClose, movements, orders }: { s: SessionRow | null; onClose: () => void; movements: GodownMovement[]; orders: OrderRow[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  if (!s) return null;
  const pdf = () => exportPdf({ title: `Godown Session — ${s.employeeName} (${s.date})`, subtitle: `${s.branchName} • ${s.status}`, filename: `session-${s.date}-${s.employeeName}`, tables: [
    { title: "Movements", columns: ["Time", "Type", "Product", "Qty", "Unit price", "Value"], rows: movements.map((m) => [formatDate(m.createdAt, true), m.type, m.productName, m.quantity, m.unitPrice, m.quantity * m.unitPrice]) },
    { title: "Sales", columns: ["Order #", "Customer", "Phone", "Type", "Items", "Total", "Paid"], rows: orders.map((o) => [o.orderNumber, o.customerName, o.customerPhone, o.type, o.items.map((i) => `${i.productName} x${i.quantity}`).join(", "), o.total, o.paidAmount]) },
    { title: "Summary", columns: ["Taken qty", "Taken value", "Sold qty", "Sold value", "Returned qty", "Cash collected"], rows: [[s.takenQty, s.takenValue + s.claimedValue, s.soldQty, s.soldValue, s.returnedQty, s.cashCollected]] },
  ] });
  const label: Record<string, string> = { take: "গোডাউন থেকে নেওয়া", claim: "অতিরিক্ত ক্লেইম", return: "গোডাউনে ফেরত" };
  return (
    <Modal open onClose={onClose} title={`${s.employeeName} — ${s.date}`} size="lg">
      <div className="flex flex-wrap items-center gap-2"><Badge tone="slate">{s.branchName}</Badge>{s.status === "open" ? <Badge tone="amber">খোলা</Badge> : <Badge tone="emerald">ক্লোজড {s.closedAt && formatDate(s.closedAt, true)}</Badge>}{s.note && <span className="text-xs text-ink-500">• {s.note}</span>}<button onClick={pdf} className="btn-outline ml-auto !px-3 !py-1.5 text-xs"><FileDown className="h-3.5 w-3.5" /> PDF</button></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["নেওয়া", `${s.takenQty} (${formatMoney(s.takenValue + s.claimedValue)})`], ["বিক্রি", `${s.soldQty} (${formatMoney(s.soldValue)})`], ["ফেরত", `${s.returnedQty} (${formatMoney(s.returnedValue)})`], ["নগদ আদায়", formatMoney(s.cashCollected)]].map(([k, v]) => <div key={k} className="rounded-xl bg-ink-50 p-3 dark:bg-white/5"><p className="text-[10px] font-bold uppercase text-ink-400">{k}</p><p className="text-sm font-extrabold">{v}</p></div>)}
      </div>
      <p className="mt-4 text-sm font-bold">পণ্য চলাচল</p>
      <div className="mt-1 divide-y divide-ink-100 rounded-2xl border border-ink-100 text-sm dark:divide-white/5 dark:border-white/10">
        {movements.length === 0 && <p className="p-3 text-xs text-ink-400">কোনো চলাচল নেই</p>}
        {movements.map((m) => <div key={m.id} className="flex items-center justify-between p-2.5"><div><p className="font-semibold">{m.productName} ×{m.quantity}</p><p className="text-[10px] text-ink-400">{formatDate(m.createdAt, true)}</p></div><Badge tone={m.type === "return" ? "sky" : m.type === "claim" ? "violet" : "emerald"}>{label[m.type]}</Badge></div>)}
      </div>
      <p className="mt-4 text-sm font-bold">বিক্রয় ({orders.length})</p>
      <div className="mt-1 divide-y divide-ink-100 rounded-2xl border border-ink-100 text-sm dark:divide-white/5 dark:border-white/10">
        {orders.length === 0 && <p className="p-3 text-xs text-ink-400">কোনো বিক্রয় নেই</p>}
        {orders.map((o) => <div key={o.id} className="flex items-center justify-between p-2.5"><div><p className="font-semibold">{o.customerName} <span className="text-[10px] text-ink-400">{o.customerPhone}</span></p><p className="text-[11px] text-ink-500">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</p></div><div className="text-right"><p className="font-bold">{formatMoney(o.total)}</p><Badge tone="sky">{ORDER_TYPE_LABEL[o.type].bn}</Badge></div></div>)}
      </div>
      {s.status === "open" && <button disabled={pending} onClick={() => start(async () => { const r = await forceCloseSession(s.id); toast({ title: r.ok ? "সেশন ক্লোজ করা হয়েছে" : r.error!, tone: r.ok ? "success" : "error" }); router.refresh(); onClose(); })} className="btn-danger mt-4"><Lock className="h-4 w-4" /> জোরপূর্বক ক্লোজ</button>}
    </Modal>
  );
}
