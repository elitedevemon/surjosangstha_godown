"use client";

import type { EmployeeSnapshot } from "@/lib/queries";
import type { SyncAction } from "@/app/api/sync/route";
import { todayKey } from "@/lib/utils";

export type { SyncAction };

export interface FailedAction { action: SyncAction; error: string; at: string }
export interface EmpState {
  snapshot: EmployeeSnapshot | null;
  queue: SyncAction[];
  failed: FailedAction[];
  lastSync: string | null;
  syncing: boolean;
}

export const emptyState: EmpState = { snapshot: null, queue: [], failed: [], lastSync: null, syncing: false };
const key = (id: number) => `ss_emp_${id}`;

export function loadState(id: number): EmpState {
  try {
    const raw = localStorage.getItem(key(id));
    if (raw) return { ...emptyState, ...(JSON.parse(raw) as Partial<EmpState>), syncing: false };
  } catch { /* ignore */ }
  return emptyState;
}
export function saveState(id: number, s: EmpState) {
  try { localStorage.setItem(key(id), JSON.stringify({ ...s, syncing: false })); } catch { /* ignore */ }
}

/** Process the offline queue and refresh the snapshot. Safe to call often. */
export async function syncNow(id: number, state: EmpState): Promise<EmpState> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return state;
  try {
    if (state.queue.length) {
      const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actions: state.queue }) });
      if (res.status === 401) { window.location.href = "/login?next=/employee"; return state; }
      if (!res.ok) return state;
      const data = (await res.json()) as { results: { clientId: string; ok: boolean; error?: string }[]; snapshot: EmployeeSnapshot };
      const okIds = new Set(data.results.filter((r) => r.ok).map((r) => r.clientId));
      const failed = data.results.filter((r) => !r.ok).map((r) => ({ action: state.queue.find((a) => a.clientId === r.clientId)!, error: r.error ?? "Failed", at: new Date().toISOString() })).filter((f) => f.action);
      const failedIds = new Set(failed.map((f) => f.action.clientId));
      const next: EmpState = { ...state, queue: state.queue.filter((a) => !okIds.has(a.clientId) && !failedIds.has(a.clientId)), failed: [...failed, ...state.failed].slice(0, 30), snapshot: data.snapshot, lastSync: new Date().toISOString() };
      saveState(id, next);
      return next;
    }
    const res = await fetch("/api/employee/bootstrap", { cache: "no-store" });
    if (res.status === 401) { window.location.href = "/login?next=/employee"; return state; }
    if (!res.ok) return state;
    const data = (await res.json()) as { snapshot: EmployeeSnapshot };
    const next: EmpState = { ...state, snapshot: data.snapshot, lastSync: new Date().toISOString() };
    saveState(id, next);
    return next;
  } catch {
    return state;
  }
}

export interface BagLine { productId: number; name: string; image: string; unitPrice: number; taken: number; claimed: number; sold: number; returned: number; remaining: number }
export interface PendingSale { clientId: string; at: string; customer: { name: string; phone: string }; items: { productId: number; name: string; qty: number; unitPrice: number }[]; paymentType: "cash" | "installment"; total: number; pending: true }

/** Derive today's effective godown state = server data + not-yet-synced queue actions. */
export function deriveToday(state: EmpState, date = todayKey()) {
  const snap = state.snapshot;
  const products = snap?.products ?? [];
  const session = snap?.sessions.find((s) => s.date === date) ?? null;
  const bag = new Map<number, BagLine>();
  const line = (pid: number, name?: string) => {
    if (!bag.has(pid)) {
      const p = products.find((x) => x.id === pid);
      bag.set(pid, { productId: pid, name: p?.name ?? name ?? `#${pid}`, image: p?.images[0] ?? "/logo.png", unitPrice: p?.cashPrice ?? 0, taken: 0, claimed: 0, sold: 0, returned: 0, remaining: 0 });
    }
    return bag.get(pid)!;
  };
  if (session) {
    snap!.movements.filter((m) => m.sessionId === session.id).forEach((m) => { const l = line(m.productId, m.productName); if (m.type === "take") l.taken += m.quantity; else if (m.type === "claim") l.claimed += m.quantity; else l.returned += m.quantity; });
    snap!.orders.filter((o) => o.sessionId === session.id).forEach((o) => o.items.forEach((i) => { if (i.productId) line(i.productId, i.productName).sold += i.quantity; }));
  }
  let closed = session?.status === "closed";
  const pendingSales: PendingSale[] = [];
  for (const a of state.queue.filter((x) => x.date === date)) {
    if (a.kind === "take") a.items.forEach((i) => { line(i.productId).taken += i.qty; });
    else if (a.kind === "claim") a.items.forEach((i) => { line(i.productId).claimed += i.qty; });
    else if (a.kind === "return") a.items.forEach((i) => { line(i.productId).returned += i.qty; });
    else if (a.kind === "sale") {
      a.items.forEach((i) => { line(i.productId).sold += i.qty; });
      pendingSales.push({ clientId: a.clientId, at: a.at, customer: { name: a.customer.name, phone: a.customer.phone }, items: a.items.map((i) => { const p = products.find((x) => x.id === i.productId); const unit = a.paymentType === "installment" ? (p?.price ?? 0) : (i.unitPrice ?? p?.cashPrice ?? 0); return { productId: i.productId, name: p?.name ?? "", qty: i.qty, unitPrice: unit }; }), paymentType: a.paymentType, total: 0, pending: true });
    } else if (a.kind === "close") closed = true;
  }
  pendingSales.forEach((s) => { s.total = s.items.reduce((x, i) => x + i.qty * i.unitPrice, 0); });
  const lines = [...bag.values()].map((l) => ({ ...l, remaining: l.taken + l.claimed - l.sold - l.returned }));
  const serverSales = session ? snap!.orders.filter((o) => o.sessionId === session.id) : [];
  const totals = {
    takenQty: lines.reduce((a, l) => a + l.taken + l.claimed, 0),
    takenValue: lines.reduce((a, l) => a + (l.taken + l.claimed) * l.unitPrice, 0),
    soldQty: lines.reduce((a, l) => a + l.sold, 0),
    soldValue: serverSales.reduce((a, o) => a + o.total, 0) + pendingSales.reduce((a, s) => a + s.total, 0),
    returnedQty: lines.reduce((a, l) => a + l.returned, 0),
    remainingQty: lines.reduce((a, l) => a + Math.max(0, l.remaining), 0),
    cash: serverSales.reduce((a, o) => a + o.paidAmount, 0) + pendingSales.reduce((a, s) => a + (s.paymentType === "cash" ? s.total : s.items.reduce((x, i) => { const p = products.find((y) => y.id === i.productId); return x + (p?.downPayment ?? 0) * i.qty; }, 0)), 0),
    salesCount: serverSales.length + pendingSales.length,
  };
  return { session, lines, closed, started: !!session || state.queue.some((a) => a.date === date), pendingSales, serverSales, totals };
}
export type TodayView = ReturnType<typeof deriveToday>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** A queued action before the client stamps id/time/date. */
export type ActionInput = DistributiveOmit<SyncAction, "clientId" | "at" | "date">;
