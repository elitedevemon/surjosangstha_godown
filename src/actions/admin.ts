"use server";

import { db } from "@/db";
import { branches, categories, notifications, orders, orderItems, products, serviceAreas, users, godownSessions } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { notify, checkLowStock } from "@/lib/notify";
import { formatMoney, slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { seedDemo, removeDemoData } from "@/db/seed";

type R = { ok: boolean; error?: string; id?: number };

async function admin() {
  const s = await getSession();
  if (!s || s.role !== "admin") throw new Error("Unauthorized");
  return s;
}
function fail(e: unknown): R {
  return { ok: false, error: (e as Error).message ?? "Something went wrong" };
}
function refresh() {
  revalidatePath("/", "layout");
}

/* ---------- Products ---------- */
export interface ProductInput {
  id?: number; branchId: number; categoryId: number | null; name: string; sku?: string; brand?: string; description?: string;
  price: number; cashPrice: number; minSellPrice?: number | null; installmentType: "daily" | "weekly" | "monthly"; downPayment: number; installmentAmount: number;
  installmentCount: number; firstInstallmentAfterDays: number; stock: number; lowStockAt: number; images: string[]; colors: string[];
  specs: { key: string; value: string }[]; warranty?: string; isFeatured: boolean; isHot: boolean; isBestSeller: boolean; isNew: boolean; isActive: boolean;
}
export async function saveProduct(input: ProductInput): Promise<R> {
  try {
    await admin();
    const { id, ...rest } = input;
    if (!rest.name || !rest.branchId) return { ok: false, error: "নাম ও শাখা আবশ্যক" };
    if (id) {
      await db.update(products).set({ ...rest }).where(eq(products.id, id));
      refresh();
      return { ok: true, id };
    }
    const base = slugify(rest.name);
    const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(products).where(sql`${products.slug} like ${base + "%"}`);
    const slug = Number(c) ? `${base}-${Number(c) + 1}` : base;
    const [{ id: rowId }] = await db.insert(products).values({ ...rest, slug }).$returningId();
    await notify({ branchId: rest.branchId, type: "product", title: "নতুন পণ্য যুক্ত হয়েছে", message: `${rest.name} • স্টক ${rest.stock}`, link: `/admin/products?focus=${rowId}` });
    refresh();
    return { ok: true, id: rowId };
  } catch (e) { return fail(e); }
}
export async function deleteProduct(id: number): Promise<R> {
  try { await admin(); await db.delete(products).where(eq(products.id, id)); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
export async function adjustStock(id: number, delta: number, reason: string): Promise<R> {
  try {
    await admin();
    await db.update(products).set({ stock: sql`greatest(0, ${products.stock} + ${delta})` }).where(eq(products.id, id));
    const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    await notify({ branchId: p.branchId, type: "stock", title: "স্টক আপডেট", message: `${p.name}: ${delta > 0 ? "+" : ""}${delta} (${reason || "manual"}) → এখন ${p.stock}`, link: `/admin/godown?product=${id}` });
    await checkLowStock(id);
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

/* ---------- Categories ---------- */
export async function saveCategory(input: { id?: number; name: string; icon?: string; image?: string; description?: string; sortOrder?: number; isActive?: boolean }): Promise<R> {
  try {
    await admin();
    const { id, ...rest } = input;
    if (id) await db.update(categories).set(rest).where(eq(categories.id, id));
    else await db.insert(categories).values({ ...rest, slug: slugify(rest.name) + "-" + Math.random().toString(36).slice(2, 5) });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteCategory(id: number): Promise<R> {
  try { await admin(); await db.delete(categories).where(eq(categories.id, id)); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

/* ---------- Branches ---------- */
export async function saveBranch(input: { id?: number; name: string; code: string; address?: string; district?: string; upazila?: string; phone?: string; manager?: string; isActive?: boolean }): Promise<R> {
  try {
    await admin();
    const { id, ...rest } = input;
    if (id) await db.update(branches).set(rest).where(eq(branches.id, id));
    else await db.insert(branches).values({ ...rest, code: rest.code.toUpperCase() });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

/* ---------- Service areas ---------- */
export async function saveArea(input: { branchId: number; district: string; upazila?: string; union?: string; village?: string; lat?: number; lng?: number }): Promise<R> {
  try {
    await admin();
    await db.insert(serviceAreas).values({ ...input, upazila: input.upazila || null, union: input.union || null });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
export async function deleteArea(id: number): Promise<R> {
  try { await admin(); await db.delete(serviceAreas).where(eq(serviceAreas.id, id)); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

/* ---------- Employees & customers ---------- */
export interface EmployeeInput { id?: number; name: string; phone: string; password?: string; branchId: number; designation?: string; email?: string; nid?: string; salary?: number; village?: string; union?: string; upazila?: string; district?: string; address?: string; isActive?: boolean; joinedAt?: string }
export async function saveEmployee(input: EmployeeInput): Promise<R> {
  try {
    await admin();
    const { id, password, joinedAt, ...rest } = input;
    if (!/^01\d{9}$/.test(rest.phone)) return { ok: false, error: "সঠিক মোবাইল নম্বর দিন" };
    const patch: Partial<typeof users.$inferInsert> = { ...rest, role: "employee", joinedAt: joinedAt ? new Date(joinedAt) : undefined };
    if (password) patch.passwordHash = await hashPassword(password);
    if (id) {
      await db.update(users).set(patch).where(eq(users.id, id));
    } else {
      if (!password) return { ok: false, error: "পাসওয়ার্ড দিন" };
      const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.phone, rest.phone));
      if (dup) return { ok: false, error: "এই ফোন নম্বরে ইতোমধ্যে অ্যাকাউন্ট আছে" };
      await db.insert(users).values({ ...(patch as typeof users.$inferInsert), name: rest.name, phone: rest.phone });
    }
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
export async function toggleUserActive(id: number, active: boolean): Promise<R> {
  try { await admin(); await db.update(users).set({ isActive: active }).where(eq(users.id, id)); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}
export async function deleteUser(id: number): Promise<R> {
  try { await admin(); await db.delete(users).where(and(eq(users.id, id), sql`${users.role} <> 'admin'`)); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

/* ---------- Orders ---------- */
export async function setOrderStatus(id: number, status: "accepted" | "rejected" | "delivered" | "cancelled", adminNote?: string): Promise<R> {
  try {
    await admin();
    const [o] = await db.select().from(orders).where(eq(orders.id, id));
    if (!o) return { ok: false, error: "Order not found" };
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const wasCounted = o.status === "accepted" || o.status === "delivered";
    const willCount = status === "accepted" || status === "delivered";
    if (!wasCounted && willCount) {
      for (const it of items) {
        if (!it.productId) continue;
        const [p] = await db.select({ stock: products.stock, name: products.name }).from(products).where(eq(products.id, it.productId));
        if (p && p.stock < it.quantity) return { ok: false, error: `${p.name} এর স্টক পর্যাপ্ত নেই (${p.stock})` };
      }
      for (const it of items) if (it.productId) { await db.update(products).set({ stock: sql`${products.stock} - ${it.quantity}`, soldCount: sql`${products.soldCount} + ${it.quantity}` }).where(eq(products.id, it.productId)); await checkLowStock(it.productId); }
    } else if (wasCounted && !willCount) {
      for (const it of items) if (it.productId) await db.update(products).set({ stock: sql`${products.stock} + ${it.quantity}`, soldCount: sql`greatest(0, ${products.soldCount} - ${it.quantity})` }).where(eq(products.id, it.productId));
    }
    const paid = status === "delivered" ? (o.type === "installment" ? o.downPayment : o.total) : o.paidAmount;
    await db.update(orders).set({ status, adminNote, updatedAt: new Date(), paidAmount: paid }).where(eq(orders.id, id));
    if (o.customerId) {
      const msg = { accepted: "আপনার অর্ডারটি গ্রহণ করা হয়েছে", rejected: "দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে", delivered: "আপনার অর্ডারটি ডেলিভারি সম্পন্ন হয়েছে", cancelled: "অর্ডারটি ক্যানসেল করা হয়েছে" }[status];
      await notify({ recipientRole: "customer", recipientId: o.customerId, branchId: o.branchId, type: "order", title: `অর্ডার ${o.orderNumber}`, message: `${msg} • ${formatMoney(o.total)}`, link: "/account" });
    }
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

/* ---------- Notifications ---------- */
export async function markNotificationsRead(ids?: number[]): Promise<R> {
  try {
    const s = await getSession();
    if (!s) return { ok: false };
    if (ids?.length) await db.update(notifications).set({ isRead: true }).where(inArray(notifications.id, ids));
    else if (s.role === "admin") await db.update(notifications).set({ isRead: true }).where(eq(notifications.recipientRole, "admin"));
    else await db.update(notifications).set({ isRead: true }).where(eq(notifications.recipientId, s.id));
    return { ok: true };
  } catch (e) { return fail(e); }
}

/* ---------- Godown sessions (admin) ---------- */
export async function forceCloseSession(id: number): Promise<R> {
  try {
    await admin();
    await db.update(godownSessions).set({ status: "closed", closedAt: new Date(), note: "Closed by admin" }).where(eq(godownSessions.id, id));
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

/* ---------- Demo data ---------- */
export async function resetDemoData(mode: "reseed" | "remove"): Promise<R> {
  try {
    await admin();
    if (mode === "reseed") await seedDemo();
    else await removeDemoData();
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
