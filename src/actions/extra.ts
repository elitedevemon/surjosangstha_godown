"use server";

import { db } from "@/db";
import {
  users, reviews, settings, packages, orders, orderItems, products,
  helpdeskThreads, helpdeskMessages, helpdeskKb, notifications,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { formatMoney, orderNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type R = { ok: boolean; error?: string };
const need = async (role: "admin" | "employee" | "customer") => {
  const s = await getSession();
  if (!s) return { s: null, err: { ok: false, error: "লগইন প্রয়োজন" } as R };
  if (role !== "customer" && s.role !== role && s.role !== "admin") return { s: null, err: { ok: false, error: "অনুমতি নেই" } as R };
  return { s, err: null };
};

/* ------------------------------ customer ------------------------------ */
export async function uploadAvatarAction(dataUrl: string): Promise<R> {
  const { s, err } = await need("customer");
  if (err) return err;
  if (!dataUrl.startsWith("data:image/")) return { ok: false, error: "সঠিক ছবি দিন" };
  if (dataUrl.length > 900_000) return { ok: false, error: "ছবি অনেক বড় (সর্বোচ্চ ~৬০০KB)" };
  await db.update(users).set({ avatar: dataUrl }).where(eq(users.id, s!.id));
  revalidatePath("/account");
  return { ok: true };
}

export async function resetPasswordAction(input: { current: string; next: string }): Promise<R> {
  const { s, err } = await need("customer");
  if (err) return err;
  const [u] = await db.select().from(users).where(eq(users.id, s!.id));
  if (!u.passwordHash || !(await import("bcryptjs")).default.compareSync(input.current, u.passwordHash))
    return { ok: false, error: "বর্তমান পাসওয়ার্ড ভুল" };
  if (input.next.length < 6) return { ok: false, error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" };
  await db.update(users).set({ passwordHash: await hashPassword(input.next) }).where(eq(users.id, s!.id));
  return { ok: true };
}

export async function submitReviewAction(input: { orderId: number; productId: number; rating: number; comment: string }): Promise<R> {
  const { s, err } = await need("customer");
  if (err) return err;
  const [o] = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.customerId, s!.id)));
  if (!o) return { ok: false, error: "অর্ডার পাওয়া যায়নি" };
  if (o.status !== "delivered") return { ok: false, error: "ডেলিভারির পর রিভিউ দেওয়া যায়" };
  const [dup] = await db.select().from(reviews).where(and(eq(reviews.orderId, o.id), eq(reviews.productId, input.productId)));
  if (dup) return { ok: false, error: "এই পণ্যে ইতোমধ্যে রিভিউ দিয়েছেন" };
  const st = (await getSettings()).reviewsAutoShow ? "approved" : "pending";
  await db.insert(reviews).values({ orderId: o.id, productId: input.productId, customerId: s!.id, customerName: s!.name, rating: input.rating, comment: input.comment.trim(), status: st });
  await notify({ branchId: o.branchId, type: "review", title: "নতুন কাস্টমার রিভিউ", message: `${s!.name}: ${input.comment.slice(0, 60)}`, link: "/admin/settings" });
  revalidatePath(`/products`);
  return { ok: true };
}

/* -------------------------------- admin -------------------------------- */
export async function getSettings() {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  return row ?? { id: 1, siteName: "SurjoSangstha", logoUrl: null, faviconUrl: null, bannerUrl: null, heroTitle: null, pusherAppId: null, pusherKey: null, pusherSecret: null, pusherCluster: null, deliveryFeeIn: 0, deliveryFeeOut: 60, reviewsAutoShow: false, updatedAt: new Date() };
}

export async function saveSettingsAction(input: Partial<{
  siteName: string; logoUrl: string | null; faviconUrl: string | null; bannerUrl: string | null; heroTitle: string | null;
  pusherAppId: string; pusherKey: string; pusherSecret: string; pusherCluster: string;
  deliveryFeeIn: number; deliveryFeeOut: number; reviewsAutoShow: boolean;
  openrouterKey: string; openrouterModel: string; aiHelpdesk: boolean;
}>): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  const cur = await getSettings();
  await db.insert(settings).values({ ...cur, ...input, id: 1, updatedAt: new Date() } as typeof settings.$inferInsert)
    .onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } as Record<string, unknown> });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setReviewStatusAction(id: number, status: "approved" | "hidden" | "pending"): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleBlockCustomerAction(id: number, blocked: boolean): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.update(users).set({ blocked }).where(eq(users.id, id));
  await notify({ recipientRole: "admin", type: "blocked", title: blocked ? "কাস্টমার ব্লক করা হয়েছে" : "কাস্টমার আনব্লক করা হয়েছে", message: `#${id}`, link: "/admin/customers" });
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function restoreOrderAction(id: number): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.update(orders).set({ status: "pending", adminNote: null, updatedAt: new Date() }).where(eq(orders.id, id));
  await notify({ recipientRole: "admin", type: "order", title: "অর্ডার রিস্টোর করা হয়েছে", message: `অর্ডার #${id} আবার পেন্ডিং তালিকায়`, link: `/admin/orders?focus=${id}` });
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function setPackageStatusAction(id: number, status: "accepted" | "rejected"): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.update(packages).set({ status }).where(eq(packages.id, id));
  const [pkg] = await db.select().from(packages).where(eq(packages.id, id));
  if (pkg?.orderId) await db.update(orders).set({ status: status === "accepted" ? "accepted" : "rejected", updatedAt: new Date() }).where(eq(orders.id, pkg.orderId));
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function updateProductQuickAction(id: number, input: { stock?: number; godownStock?: number; price?: number; cashPrice?: number; minSellPrice?: number }): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.update(products).set(input).where(eq(products.id, id));
  revalidatePath("/admin/products");
  return { ok: true };
}

/* ------------------------------- employee ------------------------------- */
export async function assignUniqueIdAction(customerId: number, uniqueId: string): Promise<R> {
  const { err } = await need("employee");
  if (err) return err;
  const clean = uniqueId.trim().toUpperCase();
  if (!clean) return { ok: false, error: "আইডি লিখুন" };
  const [dup] = await db.select().from(users).where(eq(users.uniqueId, clean));
  if (dup && dup.id !== customerId) return { ok: false, error: "এই আইডি আগেই ব্যবহৃত" };
  await db.update(users).set({ uniqueId: clean }).where(eq(users.id, customerId));
  revalidatePath("/employee");
  return { ok: true };
}

export interface PackageCustomerInput {
  name: string; phone: string; fatherName?: string;
  village?: string; union?: string; upazila?: string; district?: string;
  nid?: string;
}

/** প্যাকেজ শুধু সেভ করা (বিক্রি নয়) */
export async function savePackageAction(input: { name: string; items: { productId: number; qty: number; unitPrice: number }[]; price: number }): Promise<R & { packageId?: number }> {
  const { s, err } = await need("employee");
  if (err) return err;
  if (!input.items.length) return { ok: false, error: "প্যাকেজে অন্তত একটি পণ্য যোগ করুন" };
  const branchId = s!.branchId ?? 1;
  // স্টক যাচাই
  for (const i of input.items) {
    const [p] = await db.select().from(products).where(eq(products.id, i.productId));
    if (!p) return { ok: false, error: `পণ্য #${i.productId} পাওয়া যায়নি` };
    if (p.branchId !== branchId) return { ok: false, error: `${p.name} আপনার শাখার পণ্য নয়` };
  }
  const [{ id: pkgId }] = await db
    .insert(packages)
    .values({ branchId, employeeId: s!.id, name: input.name?.trim() || `প্যাকেজ-${Date.now() % 1000}`, items: input.items, price: input.price, status: "saved" })
    .$returningId();
  await notify({ branchId, type: "package", title: `নতুন প্যাকেজ তৈরি — ${input.name}`, message: `${input.items.length} ধরনের পণ্য • মূল্য ${formatMoney(input.price)}`, link: "/admin/orders?tab=packages", data: { packageId: pkgId } });
  revalidatePath("/employee");
  return { ok: true, packageId: pkgId };
}

/**
 * প্যাকেজ বিক্রি — কাস্টমার রেজিস্ট্রেশন বাধ্যতামূলক।
 * নতুন কাস্টমার হলে সম্পূর্ণ তথ্য (নাম, ফোন, ঠিকানা) ছাড়া বিক্রি হবে না।
 */
export async function sellPackageAction(input: {
  packageId?: number;
  name?: string;
  items?: { productId: number; qty: number; unitPrice: number }[];
  price?: number;
  customerId?: number;
  customer?: PackageCustomerInput;
  paymentType: "cash" | "installment";
  downPayment?: number;
}): Promise<R & { orderId?: number; created?: boolean }> {
  const { s, err } = await need("employee");
  if (err) return err;
  const branchId = s!.branchId ?? 1;

  // ---- প্যাকেজ রেজলভ ----
  let pkgId = input.packageId;
  let pkgName = input.name ?? "";
  let items = input.items ?? [];
  let price = input.price ?? 0;
  if (pkgId) {
    const [pk] = await db.select().from(packages).where(eq(packages.id, pkgId));
    if (!pk) return { ok: false, error: "প্যাকেজ পাওয়া যায়নি" };
    if (pk.status === "sold") return { ok: false, error: "এই প্যাকেজ ইতোমধ্যে বিক্রি হয়েছে" };
    pkgName = pk.name; items = pk.items ?? []; price = pk.price;
  }
  if (!items.length) return { ok: false, error: "প্যাকেজে পণ্য নেই" };

  // ---- কাস্টমার রেজিস্ট্রেশন (বাধ্যতামূলক) ----
  let cust: typeof users.$inferSelect | undefined;
  let created = false;
  if (input.customerId) {
    [cust] = await db.select().from(users).where(eq(users.id, input.customerId));
    if (!cust) return { ok: false, error: "নিবন্ধিত কাস্টমার পাওয়া যায়নি" };
  } else {
    const c = input.customer;
    const phone = c?.phone?.trim() ?? "";
    if (!/^01\d{9}$/.test(phone)) return { ok: false, error: "কাস্টমারের সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন" };
    [cust] = await db.select().from(users).where(eq(users.phone, phone));
    if (!cust) {
      // নতুন কাস্টমার — সম্পূর্ণ তথ্য আবশ্যক
      if (!c?.name?.trim()) return { ok: false, error: "নতুন কাস্টমারের নাম দিন" };
      if (!c?.village?.trim() || !c?.district?.trim() || !c?.upazila?.trim()) return { ok: false, error: "নতুন কাস্টমারের গ্রাম, উপজেলা ও জেলা দিন (রেজিস্ট্রেশন বাধ্যতামূলক)" };
      const [{ id: cid }] = await db
        .insert(users)
        .values({ name: c.name.trim(), phone, role: "customer", passwordHash: await hashPassword("customer123"), village: c.village, union: c.union, upazila: c.upazila, district: c.district, nid: c.nid })
        .$returningId();
      [cust] = await db.select().from(users).where(eq(users.id, cid));
      created = true;
      await notify({ branchId, type: "customer", title: "নতুন কাস্টমার রেজিস্ট্রেশন (প্যাকেজ বিক্রয়)", message: `${cust.name} (${cust.phone}) — ডিফল্ট পাসওয়ার্ড customer123`, link: "/admin/customers" });
    }
  }
  if (!cust) return { ok: false, error: "কাস্টমার পাওয়া যায়নি" };
  if (cust.blocked) return { ok: false, error: `${cust.name} ব্লক করা কাস্টমার — বিক্রি করা যাবে না` };

  // ---- স্টক যাচাই ----
  const prodMap = new Map<number, typeof products.$inferSelect>();
  for (const i of items) {
    const [p] = await db.select().from(products).where(eq(products.id, i.productId));
    if (!p) return { ok: false, error: `পণ্য #${i.productId} পাওয়া যায়নি` };
    if (p.stock < i.qty) return { ok: false, error: `${p.name}: স্টকে মাত্র ${p.stock} টি আছে` };
    prodMap.set(p.id, p);
  }

  // ---- প্যাকেজ না থাকলে তাৎক্ষণিক তৈরি ----
  if (!pkgId) {
    const [{ id }] = await db.insert(packages).values({ branchId, employeeId: s!.id, name: pkgName || `প্যাকেজ-${Date.now() % 1000}`, items, price, status: "saved" }).$returningId();
    pkgId = id;
  }

  const down = input.paymentType === "installment" ? (input.downPayment ?? Math.round(price * 0.25)) : price;
  const [{ id: oId }] = await db
    .insert(orders)
    .values({
      orderNumber: orderNumber(), packageId: pkgId, branchId, customerId: cust.id, employeeId: s!.id,
      type: input.paymentType, status: "accepted", source: "employee", subtotal: price, total: price,
      downPayment: input.paymentType === "installment" ? down : 0, paidAmount: down,
      customerName: cust.name, customerPhone: cust.phone, district: cust.district, upazila: cust.upazila, union: cust.union, village: cust.village,
      notes: `প্যাকেজ বিক্রয়: ${pkgName}`,
    })
    .$returningId();

  // প্যাকেজের প্রতিটি পণ্য আলাদা লাইন — এডমিন প্যানেলে বিস্তারিত দেখা যাবে
  await db.insert(orderItems).values(
    items.map((i) => {
      const p = prodMap.get(i.productId)!;
      return { orderId: oId, productId: p.id, productName: p.name, image: p.images?.[0], quantity: i.qty, unitPrice: i.unitPrice, lineTotal: i.qty * i.unitPrice };
    }),
  );
  for (const i of items) {
    const p = prodMap.get(i.productId)!;
    await db.update(products).set({ stock: Math.max(0, p.stock - i.qty), godownStock: Math.max(0, p.godownStock - i.qty), soldCount: p.soldCount + i.qty }).where(eq(products.id, p.id));
  }
  await db.update(packages).set({ status: "sold", orderId: oId }).where(eq(packages.id, pkgId));

  const detail = items.map((i) => `${prodMap.get(i.productId)!.name} ×${i.qty}`).join(", ");
  await notify({
    branchId, type: "package", title: `প্যাকেজ বিক্রয় — ${pkgName}`,
    message: `${cust.name} (${cust.phone}) • ${detail} • ${formatMoney(price)} • ${input.paymentType === "cash" ? "নগদ" : "কিস্তি"}`,
    link: `/admin/orders?focus=${oId}`, data: { orderId: oId, packageId: pkgId, sound: "order" },
  });
  revalidatePath("/employee");
  revalidatePath("/admin/orders");
  return { ok: true, orderId: oId, created };
}

/* ------------------------------- helpdesk ------------------------------- */
export async function helpdeskReplyAction(threadId: number, text: string, saveToKb?: { question: string }): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.insert(helpdeskMessages).values({ threadId, sender: "admin", text: text.trim() });
  // অটো-লার্নিং: কাস্টমারের শেষ প্রশ্নটি + এই উত্তর নলেজ বেসে সংরক্ষণ (ডুপ্লিকেট এড়িয়ে)
  try {
    const msgs = await db.select().from(helpdeskMessages).where(eq(helpdeskMessages.threadId, threadId)).orderBy(helpdeskMessages.id);
    const lastQ = [...msgs].reverse().find((m) => m.sender === "customer")?.text?.trim();
    const question = saveToKb?.question?.trim() || lastQ;
    if (question) {
      const existing = await db.select().from(helpdeskKb);
      const dup = existing.find((k) => k.question.trim().toLowerCase() === question.toLowerCase());
      if (dup) await db.update(helpdeskKb).set({ answer: text.trim(), updatedAt: new Date() }).where(eq(helpdeskKb.id, dup.id));
      else await db.insert(helpdeskKb).values({ question, answer: text.trim() });
    }
  } catch { /* ignore */ }
  await db.update(helpdeskThreads).set({ status: "answered", updatedAt: new Date() }).where(eq(helpdeskThreads.id, threadId));
  const [th] = await db.select().from(helpdeskThreads).where(eq(helpdeskThreads.id, threadId)).limit(1);
  if (th?.customerId) {
    await notify({ recipientRole: "customer", recipientId: th.customerId, type: "helpdesk", title: "হেল্পডেস্ক থেকে উত্তর এসেছে", message: text.trim().slice(0, 90), link: "/account" });
  }
  return { ok: true };
}

export async function helpdeskKbSaveAction(input: { id?: number; question: string; answer: string }): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  if (input.id) await db.update(helpdeskKb).set({ question: input.question, answer: input.answer, updatedAt: new Date() }).where(eq(helpdeskKb.id, input.id));
  else await db.insert(helpdeskKb).values({ question: input.question, answer: input.answer });
  return { ok: true };
}

export async function helpdeskKbDeleteAction(id: number): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  await db.delete(helpdeskKb).where(eq(helpdeskKb.id, id));
  return { ok: true };
}

export { sql };

/* --------------------------- প্রি-স্টক প্রোডাক্ট রিকোয়েস্ট --------------------------- */
export async function listProductRequests() {
  const { err } = await need("admin");
  if (err) return [];
  const { productRequests, users: u, branches, categories } = await import("@/db/schema");
  const { desc: d } = await import("drizzle-orm");
  const rows = await db
    .select({ r: productRequests, employeeName: u.name, branchName: branches.name, categoryName: categories.name })
    .from(productRequests)
    .leftJoin(u, eq(productRequests.employeeId, u.id))
    .leftJoin(branches, eq(productRequests.branchId, branches.id))
    .leftJoin(categories, eq(productRequests.categoryId, categories.id))
    .orderBy(d(productRequests.id))
    .limit(200);
  return rows.map((x) => ({ ...x.r, employeeName: x.employeeName, branchName: x.branchName, categoryName: x.categoryName }));
}

/** রিকোয়েস্ট গ্রহণ/বাতিল — গ্রহণ করলে কর্মীকে নোটিফিকেশন যায় */
export async function setRequestStatusAction(id: number, status: "approved" | "rejected", adminNote?: string): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  const { productRequests } = await import("@/db/schema");
  const [req] = await db.select().from(productRequests).where(eq(productRequests.id, id));
  if (!req) return { ok: false, error: "রিকোয়েস্ট পাওয়া যায়নি" };
  await db.update(productRequests).set({ status, adminNote: adminNote ?? null }).where(eq(productRequests.id, id));
  await notify({
    recipientRole: "employee", recipientId: req.employeeId, branchId: req.branchId, type: "product-request",
    title: status === "approved" ? `পণ্যের চাহিদা গৃহীত — ${req.name}` : `পণ্যের চাহিদা বাতিল — ${req.name}`,
    message: status === "approved" ? "এডমিন অনুমোদন করেছেন, শীঘ্রই তালিকায় যুক্ত হবে" : adminNote || "এডমিন এই মুহূর্তে যুক্ত করছেন না",
    link: "/employee",
  });
  revalidatePath("/admin/requests");
  return { ok: true };
}

/** গৃহীত রিকোয়েস্ট থেকে সরাসরি পণ্য তালিকায় যোগ */
export async function listRequestAsProductAction(input: {
  id: number; name: string; categoryId: number | null; brand?: string;
  price: number; cashPrice: number; minSellPrice?: number | null;
  installmentType: "daily" | "weekly" | "monthly"; downPayment: number; installmentAmount: number; installmentCount: number;
  stock: number; godownStock: number;
}): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  const { productRequests, products: prod } = await import("@/db/schema");
  const [req] = await db.select().from(productRequests).where(eq(productRequests.id, input.id));
  if (!req) return { ok: false, error: "রিকোয়েস্ট পাওয়া যায়নি" };
  const base = input.name.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-").replace(/(^-|-$)/g, "") || "product";
  const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(prod).where(sql`${prod.slug} like ${base + "%"}`);
  const slug = Number(c) ? `${base}-${Number(c) + 1}` : base;
  const [{ id: pid }] = await db
    .insert(prod)
    .values({
      branchId: req.branchId, categoryId: input.categoryId, name: input.name.trim(), slug, brand: input.brand ?? null,
      description: req.note ?? null, price: input.price, cashPrice: input.cashPrice, minSellPrice: input.minSellPrice ?? null,
      installmentType: input.installmentType, downPayment: input.downPayment, installmentAmount: input.installmentAmount,
      installmentCount: input.installmentCount, stock: input.stock, godownStock: input.godownStock,
      images: [], colors: [], specs: [], isActive: true, isNew: true,
    })
    .$returningId();
  await db.update(productRequests).set({ status: "listed", productId: pid }).where(eq(productRequests.id, input.id));
  await notify({
    recipientRole: "employee", recipientId: req.employeeId, branchId: req.branchId, type: "product-request",
    title: `পণ্য তালিকায় যুক্ত হয়েছে — ${input.name}`,
    message: `স্টক ${input.stock} • গোডাউন ${input.godownStock} • এখন বিক্রি করতে পারবেন`,
    link: "/employee",
  });
  revalidatePath("/admin/requests");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteRequestAction(id: number): Promise<R> {
  const { err } = await need("admin");
  if (err) return err;
  const { productRequests } = await import("@/db/schema");
  await db.delete(productRequests).where(eq(productRequests.id, id));
  revalidatePath("/admin/requests");
  return { ok: true };
}
