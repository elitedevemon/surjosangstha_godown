import { hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { godownMovements, godownSessions, orderItems, orders, productRequests, products, users } from "@/db/schema";
import { and, eq, inArray, like } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { notify, checkLowStock } from "@/lib/notify";
import { getEmployeeSnapshot } from "@/lib/queries";
import { formatMoney, orderNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export interface SyncItem { productId: number; qty: number; unitPrice?: number; color?: string; discount?: number }
export interface SyncCustomer { id?: number; name: string; phone: string; village?: string; union?: string; upazila?: string; district?: string }
export type SyncAction =
  | { kind: "take" | "claim" | "return"; clientId: string; date: string; at: string; items: SyncItem[] }
  | { kind: "sale"; clientId: string; date: string; at: string; customer: SyncCustomer; items: SyncItem[]; paymentType: "cash" | "installment"; note?: string; downPayment?: number; discount?: number }
  | { kind: "product-request"; clientId: string; date: string; at: string; request: { name: string; brand?: string; categoryId?: number | null; qty: number; expectedPrice: number; customerName?: string; customerPhone?: string; note?: string } }
  | { kind: "close"; clientId: string; date: string; at: string; note?: string };

async function getOrCreateSession(employeeId: number, branchId: number, date: string) {
  const [existing] = await db.select().from(godownSessions).where(and(eq(godownSessions.employeeId, employeeId), eq(godownSessions.date, date))).limit(1);
  if (existing) return existing;
  const [{ id: cid }] = await db.insert(godownSessions).values({ employeeId, branchId, date, status: "open" }).$returningId();
  const [created] = await db.select().from(godownSessions).where(eq(godownSessions.id, cid)).limit(1);
  return created;
}

async function sessionAvailability(sessionId: number) {
  const mv = await db.select().from(godownMovements).where(eq(godownMovements.sessionId, sessionId));
  const sold = await db
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.sessionId, sessionId));
  const avail = new Map<number, number>();
  for (const m of mv) avail.set(m.productId, (avail.get(m.productId) ?? 0) + (m.type === "return" ? -m.quantity : m.quantity));
  for (const s of sold) if (s.productId) avail.set(s.productId, (avail.get(s.productId) ?? 0) - s.quantity);
  return avail;
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "employee" || !s.branchId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { actions: SyncAction[] };
  const results: { clientId: string; ok: boolean; error?: string }[] = [];
  const [emp] = await db.select().from(users).where(eq(users.id, s.id));

  for (const a of body.actions ?? []) {
    try {
      const session = await getOrCreateSession(s.id, s.branchId, a.date);
      if (a.kind === "close") {
        // হাতে পণ্য থাকলে ক্লোজ করা যাবে না — আগে বিক্রি বা ফেরত দিন
        if (session.status === "closed") { results.push({ clientId: a.clientId, ok: true }); continue; }
        const avail = await sessionAvailability(session.id);
        const unaccounted = [...avail.values()].reduce((x, y) => x + Math.max(0, y), 0);
        if (unaccounted > 0) throw new Error(`${unaccounted} টি পণ্য এখনো হাতে আছে — আগে বিক্রি দিন অথবা গোডাউনে ফেরত দিন`);
        await db.update(godownSessions).set({ status: "closed", closedAt: new Date(a.at), note: [a.note, unaccounted ? `${unaccounted} unit(s) not returned` : null].filter(Boolean).join(" • ") || null }).where(eq(godownSessions.id, session.id));
        const [closed] = await db.select().from(godownSessions).where(eq(godownSessions.id, session.id)).limit(1);
        await notify({
          branchId: s.branchId, type: "godown", title: `গোডাউন হিসাব চূড়ান্ত — ${emp.name}`,
          message: `নেওয়া ${closed.takenQty} • বিক্রি ${closed.soldQty} (${formatMoney(closed.soldValue)}) • ফেরত ${closed.returnedQty} • নগদ ${formatMoney(closed.cashCollected)}${unaccounted ? ` • অমিল ${unaccounted}` : ""}`,
          link: `/admin/godown?session=${session.id}`, data: { sessionId: session.id, sound: "godown" },
        });
        results.push({ clientId: a.clientId, ok: true });
        continue;
      }
      // ---------- প্রি-স্টক প্রোডাক্ট রিকোয়েস্ট (স্টক/গোডাউন/লিস্টিংয়ে নেই এমন পণ্য) ----------
      if (a.kind === "product-request") {
        const [dupReq] = await db.select({ id: productRequests.id }).from(productRequests).where(eq(productRequests.clientId, a.clientId)).limit(1);
        if (dupReq) { results.push({ clientId: a.clientId, ok: true }); continue; }
        const r = a.request;
        if (!r?.name?.trim()) throw new Error("পণ্যের নাম দিন");
        const [{ id: reqId }] = await db
          .insert(productRequests)
          .values({
            clientId: a.clientId, branchId: s.branchId, employeeId: s.id,
            name: r.name.trim(), brand: r.brand?.trim() || null, categoryId: r.categoryId ?? null,
            qty: Math.max(1, Number(r.qty || 1)), expectedPrice: Math.max(0, Math.round(Number(r.expectedPrice || 0))),
            customerName: r.customerName?.trim() || null, customerPhone: r.customerPhone?.trim() || null,
            note: r.note?.trim() || null, status: "pending",
          })
          .$returningId();
        await notify({
          branchId: s.branchId, type: "product-request",
          title: `নতুন পণ্যের চাহিদা — ${emp.name}`,
          message: `${r.name}${r.brand ? ` (${r.brand})` : ""} • ${r.qty} টি • আনুমানিক ${formatMoney(r.expectedPrice || 0)}${r.customerName ? ` • কাস্টমার: ${r.customerName}` : ""}`,
          link: `/admin/requests?focus=${reqId}`,
          data: { requestId: reqId, sound: "order" },
        });
        results.push({ clientId: a.clientId, ok: true });
        continue;
      }

      // Idempotency: an action that already reached the server is acknowledged even if the session closed since.
      if (a.kind === "sale") {
        const [dup] = await db.select({ id: orders.id }).from(orders).where(eq(orders.clientId, a.clientId));
        if (dup) { results.push({ clientId: a.clientId, ok: true }); continue; }
      } else {
        const [dupMv] = await db.select({ id: godownMovements.id }).from(godownMovements).where(like(godownMovements.clientId, `${a.clientId}:%`)).limit(1);
        if (dupMv) { results.push({ clientId: a.clientId, ok: true }); continue; }
      }
      if (session.status === "closed") throw new Error("আজকের হিসাব ইতোমধ্যে চূড়ান্ত জমা হয়েছে");
      const ids = a.items.map((i) => i.productId);
      const prods = ids.length ? await db.select().from(products).where(and(inArray(products.id, ids), eq(products.branchId, s.branchId))) : [];
      const pOf = (id: number) => { const p = prods.find((x) => x.id === id); if (!p) throw new Error(`Product #${id} not in your branch`); return p; };

      if (a.kind === "take" || a.kind === "claim") {
        const already = await db.select({ clientId: godownMovements.clientId }).from(godownMovements).where(eq(godownMovements.sessionId, session.id));
        const have = new Set(already.map((x) => x.clientId));
        let value = 0, qty = 0;
        const rows = a.items.filter((i) => !have.has(`${a.clientId}:${i.productId}`)).map((i) => {
          const p = pOf(i.productId);
          if (i.qty > p.godownStock) throw new Error(`${p.name}: গোডাউনে মাত্র ${p.godownStock} টি আছে`);
          value += p.cashPrice * i.qty; qty += i.qty;
          return { clientId: `${a.clientId}:${i.productId}`, sessionId: session.id, productId: p.id, productName: p.name, type: a.kind, quantity: i.qty, unitPrice: p.cashPrice, createdAt: new Date(a.at) };
        });
        if (rows.length) {
          await db.insert(godownMovements).values(rows.map((r) => ({ ...r })));
          // গোডাউন স্টক থেকে নামবে — মূল প্রোডাক্ট স্টকে প্রভাব নেই
          for (const r of rows) { const pr = pOf(r.productId); await db.update(products).set({ godownStock: Math.max(0, pr.godownStock - r.quantity) }).where(eq(products.id, r.productId)); }
          await db.update(godownSessions).set(a.kind === "take" ? { takenValue: session.takenValue + value, takenQty: session.takenQty + qty } : { claimedValue: session.claimedValue + value, takenQty: session.takenQty + qty }).where(eq(godownSessions.id, session.id));
          await notify({
            branchId: s.branchId, type: "godown", title: a.kind === "take" ? `গোডাউন থেকে পণ্য নেওয়া — ${emp.name}` : `অতিরিক্ত পণ্য ক্লেইম — ${emp.name}`,
            message: `${rows.map((r) => `${r.productName} ×${r.quantity}`).join(", ")} • মোট ${formatMoney(value)}`,
            link: `/admin/godown?session=${session.id}`, data: { sessionId: session.id, sound: "godown" },
          });
        }
        results.push({ clientId: a.clientId, ok: true });
        continue;
      }

      if (a.kind === "return") {
        const already = await db.select({ clientId: godownMovements.clientId }).from(godownMovements).where(eq(godownMovements.sessionId, session.id));
        const have = new Set(already.map((x) => x.clientId));
        const avail = await sessionAvailability(session.id);
        let value = 0, qty = 0;
        const rows = a.items.filter((i) => !have.has(`${a.clientId}:${i.productId}`)).map((i) => {
          const p = pOf(i.productId);
          const can = avail.get(p.id) ?? 0;
          if (i.qty > can) throw new Error(`${p.name}: ফেরত দেওয়ার মতো ${can} টির বেশি নেই`);
          value += p.cashPrice * i.qty; qty += i.qty;
          return { clientId: `${a.clientId}:${i.productId}`, sessionId: session.id, productId: p.id, productName: p.name, type: "return" as const, quantity: i.qty, unitPrice: p.cashPrice, createdAt: new Date(a.at) };
        });
        if (rows.length) {
          await db.insert(godownMovements).values(rows.map((r) => ({ ...r })));
          // ফেরত দিলে গোডাউন স্টক বাড়বে — মূল স্টকে প্রভাব নেই
          for (const r of rows) { const pr = pOf(r.productId); await db.update(products).set({ godownStock: pr.godownStock + r.quantity }).where(eq(products.id, r.productId)); }
          await db.update(godownSessions).set({ returnedValue: session.returnedValue + value, returnedQty: session.returnedQty + qty }).where(eq(godownSessions.id, session.id));
        }
        results.push({ clientId: a.clientId, ok: true });
        continue;
      }

      if (a.kind === "sale") {
        const avail = await sessionAvailability(session.id);
        const phone = a.customer.phone.trim();
        if (!/^01\d{9}$/.test(phone)) throw new Error("কাস্টমারের সঠিক মোবাইল নম্বর দিন");
        let subtotal = 0, down = 0, instAmt = 0, instCount = 0, itemDiscount = 0;
        let instType: "daily" | "weekly" | "monthly" | null = null;
        const lines = a.items.map((i) => {
          const p = pOf(i.productId);
          const can = avail.get(p.id) ?? 0;
          if (i.qty > can) throw new Error(`${p.name}: আপনার কাছে ${can} টি আছে, আগে গোডাউন থেকে ক্লেইম করুন`);
          const base = a.paymentType === "installment" ? p.price : Number(i.unitPrice ?? p.cashPrice);
          // পণ্যভিত্তিক ডিসকাউন্ট (প্রতি ইউনিট)
          const disc = Math.max(0, Math.round(Number(i.discount ?? 0)));
          let unit = Math.max(0, base - disc);
          itemDiscount += disc * i.qty;
          const floor = p.minSellPrice ?? p.cashPrice;
          if (a.paymentType === "cash" && unit < floor) throw new Error(`${p.name}: ছাড়ের পর মূল্য ${formatMoney(unit)} — সর্বনিম্ন ${formatMoney(floor)} এর নিচে বিক্রি করা যাবে না`);
          if (a.paymentType === "installment") { down += p.downPayment * i.qty; instAmt += p.installmentAmount * i.qty; instCount = Math.max(instCount, p.installmentCount); instType = p.installmentType; }
          subtotal += unit * i.qty;
          return { productId: p.id, productName: p.name, image: p.images[0], color: i.color, quantity: i.qty, unitPrice: unit, lineTotal: unit * i.qty };
        });
        let [cust] = await db.select().from(users).where(eq(users.phone, phone));
        if (cust?.blocked) {
          await notify({ branchId: s.branchId, recipientRole: "employee", recipientId: s.id, type: "blocked", title: "ব্লক করা কাস্টমার", message: `${cust.name} (${cust.phone}) ব্লক করা আছে — এই কাস্টমারের কাছে বিক্রি করা যাবে না`, link: "/employee" });
          throw new Error(` ${cust.name} ব্লক করা কাস্টমার — বিক্রি সম্পন্ন করা যায়নি`);
        }
        if (!cust) {
          const [{ id: cuid }] = await db.insert(users).values({ name: a.customer.name.trim() || "Customer", phone, role: "customer", passwordHash: await hashPassword("customer123"), village: a.customer.village, union: a.customer.union, upazila: a.customer.upazila, district: a.customer.district }).$returningId();
          [cust] = await db.select().from(users).where(eq(users.id, cuid)).limit(1);
          await notify({ branchId: s.branchId, type: "customer", title: "নতুন কাস্টমার (মাঠ থেকে)", message: `${cust.name} (${cust.phone}) — ${emp.name} যুক্ত করেছেন`, link: "/admin/customers" });
        }
        // অর্ডার-লেভেল অতিরিক্ত ছাড়
        const orderDiscount = Math.max(0, Math.min(subtotal, Math.round(Number(a.discount ?? 0))));
        subtotal = Math.max(0, subtotal - orderDiscount);
        const totalDiscount = itemDiscount + orderDiscount;
        // কর্মী কাস্টম ডাউন পেমেন্ট দিতে পারে (কম/বেশি) — সর্বোচ্চ মোট মূল্য পর্যন্ত
        if (a.paymentType === "installment" && a.downPayment != null) {
          const custom = Math.round(Number(a.downPayment));
          if (!Number.isFinite(custom) || custom < 0) throw new Error("ডাউন পেমেন্ট সঠিক নয়");
          if (custom > subtotal) throw new Error(`ডাউন পেমেন্ট মোট মূল্যের (${formatMoney(subtotal)}) বেশি হতে পারবে না`);
          down = custom;
        }
        const paid = a.paymentType === "cash" ? subtotal : down;
        const [{ id: oId }] = await db.insert(orders).values({
          orderNumber: orderNumber(), clientId: a.clientId, branchId: s.branchId, customerId: cust.id, employeeId: s.id, sessionId: session.id,
          type: a.paymentType, status: "accepted", source: "employee", subtotal, total: subtotal, discount: totalDiscount, downPayment: down, paidAmount: paid,
          installmentType: instType, installmentAmount: instAmt, installmentCount: instCount,
          customerName: cust.name, customerPhone: cust.phone, village: a.customer.village ?? cust.village, union: a.customer.union ?? cust.union, upazila: a.customer.upazila ?? cust.upazila, district: a.customer.district ?? cust.district,
          notes: a.note, createdAt: new Date(a.at), updatedAt: new Date(a.at),
        }).$returningId();
        await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: oId })));
        for (const l of lines) {
          await db.update(products).set({ stock: Math.max(0, pOf(l.productId).stock - l.quantity), soldCount: pOf(l.productId).soldCount + l.quantity }).where(eq(products.id, l.productId));
          await checkLowStock(l.productId);
        }
        const qty = lines.reduce((x, l) => x + l.quantity, 0);
        await db.update(godownSessions).set({ soldValue: session.soldValue + subtotal, soldQty: session.soldQty + qty, cashCollected: session.cashCollected + paid }).where(eq(godownSessions.id, session.id));
        await notify({
          branchId: s.branchId, type: "sale", title: `মাঠ বিক্রয় (${a.paymentType === "cash" ? "নগদ" : "কিস্তি"}) — ${emp.name}`,
          message: `${cust.name} • ${lines.map((l) => `${l.productName} ×${l.quantity}`).join(", ")} • ${formatMoney(subtotal)}${totalDiscount ? ` • ছাড় ${formatMoney(totalDiscount)}` : ""}${a.paymentType === "installment" ? ` • ডাউন ${formatMoney(down)}` : ""}`,
          link: `/admin/orders?focus=${oId}`, data: { orderId: oId, sound: "order" },
        });
        results.push({ clientId: a.clientId, ok: true });
        continue;
      }
      results.push({ clientId: (a as SyncAction).clientId, ok: false, error: "Unknown action" });
    } catch (e) {
      results.push({ clientId: a.clientId, ok: false, error: (e as Error).message });
    }
  }
  const snapshot = await getEmployeeSnapshot(s.id);
  return Response.json({ results, snapshot });
}
