"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutDashboard, Warehouse, ShoppingBag, History, Wifi, WifiOff, RefreshCw, CloudUpload, CheckCircle2, LogOut, Banknote, Package, Undo2, Lock, IdCard , Sparkles} from "lucide-react";
import { Avatar, Badge, Stat, SectionHeader, Tabs, ProgressBar } from "@/components/ui";
import { NotificationCenter } from "@/components/notifications";
import { LiveRefresh } from "@/components/live-refresh";
import { SalesAreaChart, DonutChart, SimpleBarChart, RadarCompare } from "@/components/charts";
import { useOnline, useToast } from "@/components/providers";
import { logoutAction } from "@/actions/auth";
import { loadState, saveState, syncNow, deriveToday, emptyState, type EmpState, type SyncAction, type ActionInput } from "@/lib/offline";
import { GodownPanel, SellPanel, HistoryPanel, PackagePanel, UniqueIdPanel, ProductRequestPanel } from "./employee-ops";
import { Modal, Field } from "@/components/ui";
import { cn, formatMoney, todayKey, uid } from "@/lib/utils";
import type { EmployeeSnapshot } from "@/lib/queries";
import { SiteLogo } from "@/components/brand";

type Tab = "dashboard" | "godown" | "sell" | "packages" | "requests" | "ids" | "history";

export function EmployeeApp({ initial, userId }: { initial: EmployeeSnapshot | null; userId: number }) {
  const [state, setState] = useState<EmpState>(() => ({ ...emptyState, snapshot: initial }));
  const [tab, setTab] = useState<Tab>("dashboard");
  const [logoutAsk, setLogoutAsk] = useState(false);
  const [ready, setReady] = useState(false);
  const online = useOnline();
  const { toast } = useToast();
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load offline state, prefer fresh server snapshot when available
  useEffect(() => {
    const local = loadState(userId);
    const newer = initial && local.snapshot && new Date(local.snapshot.serverTime) > new Date(initial.serverTime) ? local.snapshot : initial ?? local.snapshot;
    const merged: EmpState = { ...local, snapshot: newer };
    setState(merged);
    saveState(userId, merged);
    setReady(true);
  }, [userId, initial]);

  const runSync = useCallback(async (silent = true) => {
    if (!navigator.onLine) return;
    setState((s) => ({ ...s, syncing: true }));
    const before = stateRef.current;
    const next = await syncNow(userId, before);
    setState({ ...next, syncing: false });
    if (!silent) toast({ title: "সিঙ্ক সম্পন্ন", message: `${before.queue.length} টি এন্ট্রি আপলোড হয়েছে`, tone: "success" });
    const newFails = next.failed.filter((f) => !before.failed.some((b) => b.action.clientId === f.action.clientId));
    newFails.forEach((f) => toast({ title: "একটি এন্ট্রি গৃহীত হয়নি", message: f.error, tone: "error" }));
    if (before.queue.length && next.queue.length === 0 && silent && newFails.length === 0) toast({ title: "অফলাইন ডাটা সিঙ্ক হয়েছে", message: `${before.queue.length} টি এন্ট্রি সার্ভারে জমা হয়েছে`, tone: "success" });
  }, [userId, toast]);

  useEffect(() => {
    if (!ready) return;
    runSync();
    const id = setInterval(() => runSync(), 20000);
    const on = () => { toast({ title: "অনলাইনে ফিরে এসেছেন", message: "অফলাইন এন্ট্রি স্বয়ংক্রিয়ভাবে সিঙ্ক হচ্ছে...", tone: "info" }); runSync(); };
    window.addEventListener("online", on);
    return () => { clearInterval(id); window.removeEventListener("online", on); };
  }, [ready, runSync, toast]);

  const enqueue = useCallback((partial: ActionInput) => {
    const action = { ...partial, clientId: uid("act"), at: new Date().toISOString(), date: todayKey() } as SyncAction;
    setState((s) => { const n = { ...s, queue: [...s.queue, action] }; saveState(userId, n); return n; });
    if (navigator.onLine) setTimeout(() => runSync(), 50);
    else toast({ title: "অফলাইনে সংরক্ষিত", message: "ইন্টারনেট এলে স্বয়ংক্রিয়ভাবে জমা হবে", tone: "warning" });
  }, [userId, runSync, toast]);

  const today = useMemo(() => deriveToday(state), [state]);
  const snap = state.snapshot;
  const emp = snap?.employee;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip">
      <header className="sticky top-0 z-30 glass border-b border-ink-200/60 dark:border-white/10">
        <div className="container-x flex h-16 min-w-0 items-center gap-2 sm:gap-3">
          <SiteLogo className="h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{emp?.name ?? "কর্মী"} <span className="hidden text-xs font-medium text-ink-400 sm:inline">• {emp?.designation}</span></p><p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Employee Panel</p></div>
          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <span className={cn("hidden items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold sm:flex", online ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-sun-100 text-sun-800 dark:bg-sun-500/15 dark:text-sun-200")}>{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{online ? "অনলাইন" : "অফলাইন"}</span>
            <button onClick={() => runSync(false)} disabled={!online || state.syncing} className={cn("relative flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold", state.queue.length ? "bg-sun-500 text-ink-950" : "bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200")} title="Sync now">
              {state.syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : state.queue.length ? <CloudUpload className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{state.queue.length ? `${state.queue.length} অপেক্ষমাণ` : "সিঙ্কড"}</span>
              {state.queue.length > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ring rounded-full bg-rose-500" />}
            </button>
            <LiveRefresh channels={[`user-${userId}`]} pollMs={20000} />
            <NotificationCenter userId={userId} role="employee" compact />
            <button onClick={() => setLogoutAsk(true)} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-white/10" title="Logout"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="container-x pb-3">
          <Tabs value={tab} onChange={setTab} tabs={[{ key: "dashboard", label: "ড্যাশবোর্ড", icon: <LayoutDashboard className="h-4 w-4" /> }, { key: "godown", label: "গোডাউন", icon: <Warehouse className="h-4 w-4" /> }, { key: "sell", label: "বিক্রয় এন্ট্রি", icon: <ShoppingBag className="h-4 w-4" /> }, { key: "packages", label: "প্যাকেজ", icon: <Package className="h-4 w-4" /> }, { key: "requests", label: "পণ্যের চাহিদা", icon: <Sparkles className="h-4 w-4" /> }, { key: "ids", label: "কাস্টমার আইডি", icon: <IdCard className="h-4 w-4" /> }, { key: "history", label: "ইতিহাস", icon: <History className="h-4 w-4" /> }]} />
        </div>
      </header>
      <main className="container-x py-5">
        {!snap ? (
          <div className="card p-10 text-center"><RefreshCw className="mx-auto h-8 w-8 animate-spin text-brand-500" /><p className="mt-3 text-sm text-ink-500">ডাটা লোড হচ্ছে... {!online && "(অফলাইন — আগে একবার অনলাইনে লগইন করুন)"}</p></div>
        ) : (
          <>
            {tab === "dashboard" && <EmployeeDashboard state={state} today={today} online={online} />}
            {tab === "godown" && <GodownPanel snap={snap} today={today} enqueue={enqueue} />}
            {tab === "sell" && <SellPanel snap={snap} today={today} enqueue={enqueue} goGodown={() => setTab("godown")} />}
            {tab === "packages" && <PackagePanel snap={snap} />}
            {tab === "requests" && <ProductRequestPanel snap={snap} enqueue={enqueue} />}
            {tab === "ids" && <UniqueIdPanel snap={snap} />}
            {tab === "history" && <HistoryPanel state={state} today={today} />}
          </>
        )}
      </main>
      <Modal open={logoutAsk} onClose={() => setLogoutAsk(false)} title="লগআউট করবেন?" size="sm">
        <p className="text-sm text-ink-500">আপনি কি নিশ্চিত? অপেক্ষমাণ এন্ট্রি থাকলে সেগুলো ডিভাইসে সেভ থাকবে।</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setLogoutAsk(false)} className="btn-ghost flex-1">না, থাকছি</button>
          <form action={logoutAction} className="flex-1"><button className="btn-primary w-full">হ্যাঁ, লগআউট</button></form>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeDashboard({ state, today, online }: { state: EmpState; today: ReturnType<typeof deriveToday>; online: boolean }) {
  const snap = state.snapshot!;
  const byDay = useMemo(() => {
    const out: { day: string; sales: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = todayKey(d);
      const os = snap.orders.filter((o) => todayKey(new Date(o.createdAt)) === k);
      out.push({ day: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), sales: os.reduce((a, o) => a + o.total, 0), orders: os.length });
    }
    return out;
  }, [snap.orders]);
  const monthOrders = snap.orders.filter((o) => new Date(o.createdAt).getMonth() === new Date().getMonth());
  const monthRevenue = monthOrders.reduce((a, o) => a + o.total, 0);
  const typeMix = [{ name: "Installment", value: snap.orders.filter((o) => o.type === "installment").length }, { name: "Cash", value: snap.orders.filter((o) => o.type === "cash").length }];
  const prodMap = new Map<string, number>();
  snap.orders.forEach((o) => o.items.forEach((i) => prodMap.set(i.productName, (prodMap.get(i.productName) ?? 0) + i.quantity)));
  const topProducts = [...prodMap.entries()].map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const closedSessions = snap.sessions.filter((s) => s.status === "closed");
  const conv = closedSessions.length ? Math.round((closedSessions.reduce((a, s) => a + s.soldQty, 0) / Math.max(1, closedSessions.reduce((a, s) => a + s.takenQty, 0))) * 100) : 0;
  const radar = [
    { metric: "Sales", me: Math.min(100, monthOrders.length * 10) },
    { metric: "Conversion", me: conv },
    { metric: "Cash", me: Math.min(100, Math.round(closedSessions.reduce((a, s) => a + s.cashCollected, 0) / 5000)) },
    { metric: "Sessions", me: Math.min(100, closedSessions.length * 8) },
    { metric: "Returns", me: Math.max(0, 100 - Math.round((closedSessions.reduce((a, s) => a + s.returnedQty, 0) / Math.max(1, closedSessions.reduce((a, s) => a + s.takenQty, 0))) * 100)) },
  ];
  const stockValue = snap.products.reduce((a, p) => a + p.stock * p.cashPrice, 0);
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 to-brand-900 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-brand-200">আজকের দিন • {todayKey()}</p><p className="mt-1 text-2xl font-extrabold">{today.closed ? "হিসাব চূড়ান্ত জমা হয়েছে ✅" : today.started ? "মাঠে কাজ চলছে" : "এখনো গোডাউন থেকে পণ্য নেওয়া হয়নি"}</p></div>
          <div className="flex gap-2 text-center">
            {[["নেওয়া", today.totals.takenQty], ["বিক্রি", today.totals.soldQty], ["ফেরত", today.totals.returnedQty], ["হাতে", today.totals.remainingQty]].map(([k, v]) => <div key={String(k)} className="rounded-2xl bg-white/10 px-3 py-2"><p className="text-lg font-extrabold">{v}</p><p className="text-[10px] text-brand-200">{k}</p></div>)}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-white/10 px-2.5 py-1">{online ? "🟢 অনলাইন" : "🟠 অফলাইন মোড"}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">অপেক্ষমাণ এন্ট্রি: {state.queue.length}</span>
          {state.lastSync && <span className="rounded-full bg-white/10 px-2.5 py-1">শেষ সিঙ্ক: {new Date(state.lastSync).toLocaleTimeString("en-GB")}</span>}
          {today.closed && <span className="rounded-full bg-white/10 px-2.5 py-1"><Lock className="mr-1 inline h-3 w-3" />আজ আর এন্ট্রি নেওয়া যাবে না</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="আজকের বিক্রয়" value={formatMoney(today.totals.soldValue)} sub={`${today.totals.salesCount} টি বিক্রয়`} icon={<Banknote className="h-5 w-5" />} />
        <Stat label="আজ নগদ আদায়" value={formatMoney(today.totals.cash)} sub="নগদ + ডাউন পেমেন্ট" icon={<Banknote className="h-5 w-5" />} tone="sun" />
        <Stat label="এই মাসে" value={formatMoney(monthRevenue)} sub={`${monthOrders.length} টি বিক্রয়`} icon={<ShoppingBag className="h-5 w-5" />} tone="sky" />
        <Stat label="গোডাউন স্টক" value={snap.products.reduce((a, p) => a + p.stock, 0)} sub={`${snap.products.length} পণ্য • ${formatMoney(stockValue)}`} icon={<Package className="h-5 w-5" />} tone="violet" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2"><SectionHeader title="আমার বিক্রয় ট্রেন্ড" subtitle="শেষ ১৪ দিন" /><SalesAreaChart data={byDay} height={240} /></div>
        <div className="card p-5"><SectionHeader title="কনভার্সন" subtitle="নেওয়া পণ্যের কত % বিক্রি হয়েছে" /><div className="space-y-3"><ProgressBar value={conv} label="সামগ্রিক কনভার্সন" /><ProgressBar value={today.totals.soldQty} max={Math.max(1, today.totals.takenQty)} label="আজকের কনভার্সন" tone="sun" /><ProgressBar value={today.totals.returnedQty} max={Math.max(1, today.totals.takenQty)} label="আজ ফেরত" tone="sky" /></div><div className="mt-3"><RadarCompare data={radar} series={["me"]} height={200} /></div></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5"><SectionHeader title="বিক্রয় পদ্ধতি" /><DonutChart data={typeMix} inner={50} height={220} /></div>
        <div className="card p-5 xl:col-span-2"><SectionHeader title="আমার সেরা বিক্রিত পণ্য" /><SimpleBarChart data={topProducts} color="#f5900b" height={220} /></div>
      </div>
      <div className="card p-5">
        <SectionHeader title="গোডাউন তথ্য (আমার শাখা)" subtitle="বর্তমান স্টক" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {snap.products.slice(0, 12).map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl border border-ink-100 p-2 dark:border-white/10"><img src={p.images[0] ?? "/logo.png"} className="h-10 w-10 rounded-lg object-cover" alt="" /><div className="min-w-0"><p className="truncate text-xs font-semibold">{p.name}</p><p className="text-[10px] text-ink-500">স্টক <b className={cn(p.stock <= p.lowStockAt && "text-rose-500")}>{p.stock}</b> • {formatMoney(p.cashPrice)}</p></div></div>
          ))}
        </div>
      </div>
      {state.failed.length > 0 && (
        <div className="card border-rose-200 p-4 dark:border-rose-500/30">
          <p className="flex items-center gap-2 text-sm font-bold text-rose-600"><Undo2 className="h-4 w-4" /> সার্ভার যে এন্ট্রিগুলো গ্রহণ করেনি</p>
          <ul className="mt-2 space-y-1 text-xs text-ink-500">{state.failed.slice(0, 5).map((f) => <li key={f.action.clientId}>• <Badge tone="rose">{f.action.kind}</Badge> {f.error} <span className="text-ink-400">({new Date(f.at).toLocaleTimeString("en-GB")})</span></li>)}</ul>
        </div>
      )}
    </div>
  );
}
