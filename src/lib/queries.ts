import { db } from "@/db";
import { branches, categories, godownMovements, godownSessions, orderItems, orders, packages, products, serviceAreas, users } from "@/db/schema";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { todayKey } from "./utils";

const SOLD_STATUSES = ["accepted", "delivered"] as const;

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export async function getBranches() {
  return db.select().from(branches).orderBy(branches.id);
}

export async function getDashboardData(branchId: number | null, days = 14) {
  const since = new Date(Date.now() - 90 * 86400000);
  const branchFilter = branchId ? eq(orders.branchId, branchId) : undefined;
  const [allOrders, allProducts, allBranches, employees, customersCount, sessions, items] = await Promise.all([
    db.select().from(orders).where(branchFilter ? and(branchFilter, gte(orders.createdAt, since)) : gte(orders.createdAt, since)).orderBy(desc(orders.createdAt)),
    db.select({ p: products, categoryName: categories.name }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(branchId ? eq(products.branchId, branchId) : undefined),
    db.select().from(branches).orderBy(branches.id),
    db.select().from(users).where(branchId ? and(eq(users.role, "employee"), eq(users.branchId, branchId)) : eq(users.role, "employee")),
    db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.role, "customer")),
    db.select().from(godownSessions).where(branchId ? eq(godownSessions.branchId, branchId) : undefined).orderBy(desc(godownSessions.createdAt)).limit(300),
    db
      .select({ productId: orderItems.productId, productName: orderItems.productName, quantity: orderItems.quantity, lineTotal: orderItems.lineTotal, orderId: orderItems.orderId, branchId: orders.branchId, status: orders.status, createdAt: orders.createdAt, categoryName: categories.name, price: products.cashPrice })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(branchFilter ? and(branchFilter, gte(orders.createdAt, since)) : gte(orders.createdAt, since)),
  ]);

  const sold = allOrders.filter((o) => (SOLD_STATUSES as readonly string[]).includes(o.status));
  const revenue = sold.reduce((a, o) => a + o.total, 0);
  const collected = sold.reduce((a, o) => a + o.paidAmount, 0);
  const pending = allOrders.filter((o) => o.status === "pending");
  const today = todayKey();
  const todaysOrders = allOrders.filter((o) => todayKey(new Date(o.createdAt)) === today);
  const todaysSales = todaysOrders.filter((o) => (SOLD_STATUSES as readonly string[]).includes(o.status)).reduce((a, o) => a + o.total, 0);

  // Sales by day
  const byDay: { day: string; sales: number; orders: number; installment: number; cash: number; cod: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const dayOrders = allOrders.filter((o) => todayKey(new Date(o.createdAt)) === key);
    const daySold = dayOrders.filter((o) => (SOLD_STATUSES as readonly string[]).includes(o.status));
    byDay.push({
      day: dayLabel(d),
      sales: daySold.reduce((a, o) => a + o.total, 0),
      orders: dayOrders.length,
      installment: dayOrders.filter((o) => o.type === "installment").length,
      cash: dayOrders.filter((o) => o.type === "cash").length,
      cod: dayOrders.filter((o) => o.type === "cod").length,
    });
  }

  const prevWindow = allOrders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t < Date.now() - days * 86400000 && t >= Date.now() - 2 * days * 86400000 && (SOLD_STATUSES as readonly string[]).includes(o.status);
  });
  const currWindow = sold.filter((o) => new Date(o.createdAt).getTime() >= Date.now() - days * 86400000);
  const prevRev = prevWindow.reduce((a, o) => a + o.total, 0);
  const currRev = currWindow.reduce((a, o) => a + o.total, 0);
  const trend = prevRev ? Math.round(((currRev - prevRev) / prevRev) * 100) : 100;

  const typeMix = (["installment", "cash", "cod"] as const).map((t) => ({ name: t === "cod" ? "COD" : t === "cash" ? "Cash" : "Installment", value: allOrders.filter((o) => o.type === t).length }));
  const revenueByType = (["installment", "cash", "cod"] as const).map((t) => ({ name: t === "cod" ? "COD" : t === "cash" ? "Cash" : "Installment", value: sold.filter((o) => o.type === t).reduce((a, o) => a + o.total, 0) }));
  const statusMix = ["pending", "accepted", "delivered", "rejected", "cancelled"].map((s) => ({ name: s, value: allOrders.filter((o) => o.status === s).length }));
  const sourceMix = [
    { name: "Online", value: allOrders.filter((o) => o.source === "online").length },
    { name: "Employee", value: allOrders.filter((o) => o.source === "employee").length },
  ];

  const soldItems = items.filter((i) => (SOLD_STATUSES as readonly string[]).includes(i.status));
  const catMap = new Map<string, number>();
  const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const it of soldItems) {
    const c = it.categoryName ?? "Other";
    catMap.set(c, (catMap.get(c) ?? 0) + it.lineTotal);
    const key = it.productName;
    const cur = prodMap.get(key) ?? { name: key, qty: 0, revenue: 0 };
    cur.qty += it.quantity;
    cur.revenue += it.lineTotal;
    prodMap.set(key, cur);
  }
  const salesByCategory = [...catMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const topProducts = [...prodMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);

  const stockBuckets = [
    { range: "0", min: 0, max: 0 }, { range: "1-5", min: 1, max: 5 }, { range: "6-10", min: 6, max: 10 },
    { range: "11-20", min: 11, max: 20 }, { range: "21-30", min: 21, max: 30 }, { range: "31+", min: 31, max: 1e9 },
  ].map((b) => ({ range: b.range, count: allProducts.filter(({ p }) => p.stock >= b.min && p.stock <= b.max).length }));
  const stockValue = allProducts.reduce((a, { p }) => a + p.stock * p.cashPrice, 0);
  const totalStock = allProducts.reduce((a, { p }) => a + p.stock, 0);
  const lowStock = allProducts.filter(({ p }) => p.stock <= p.lowStockAt).map(({ p, categoryName }) => ({ ...p, categoryName }));

  const priceVsSold = allProducts.map(({ p }) => ({ name: p.name, price: p.cashPrice, sold: p.soldCount }));

  // Employee performance
  const employeePerf = employees.map((e) => {
    const eo = allOrders.filter((o) => o.employeeId === e.id);
    const es = sessions.filter((s) => s.employeeId === e.id);
    return {
      id: e.id,
      name: e.name,
      branchId: e.branchId,
      orders: eo.length,
      revenue: eo.reduce((a, o) => a + o.total, 0),
      customers: new Set(eo.map((o) => o.customerPhone)).size,
      sessions: es.length,
      returned: es.reduce((a, s) => a + s.returnedQty, 0),
      taken: es.reduce((a, s) => a + s.takenQty, 0),
      soldQty: es.reduce((a, s) => a + s.soldQty, 0),
      cash: es.reduce((a, s) => a + s.cashCollected, 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);
  const topEmp = employeePerf.slice(0, 4);
  const maxOf = (k: "orders" | "revenue" | "customers" | "sessions" | "soldQty") => Math.max(1, ...topEmp.map((e) => e[k]));
  const radar = (["orders", "revenue", "customers", "sessions", "soldQty"] as const).map((k) => {
    const row: Record<string, string | number> = { metric: k === "soldQty" ? "Units sold" : k[0].toUpperCase() + k.slice(1) };
    topEmp.forEach((e) => { row[e.name] = Math.round((e[k] / maxOf(k)) * 100); });
    return row;
  });

  // Branch comparison (universal)
  const branchStats = allBranches.map((b) => {
    const bo = allOrders.filter((o) => o.branchId === b.id);
    const bs = bo.filter((o) => (SOLD_STATUSES as readonly string[]).includes(o.status));
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      orders: bo.length,
      revenue: bs.reduce((a, o) => a + o.total, 0),
      customers: new Set(bo.map((o) => o.customerPhone)).size,
      pending: bo.filter((o) => o.status === "pending").length,
      products: allProducts.filter(({ p }) => p.branchId === b.id).length,
      stock: allProducts.filter(({ p }) => p.branchId === b.id).reduce((a, { p }) => a + p.stock, 0),
      employees: employees.filter((e) => e.branchId === b.id).length,
    };
  });

  const installmentMix = (["daily", "weekly", "monthly"] as const).map((t) => ({ name: t[0].toUpperCase() + t.slice(1), value: allProducts.filter(({ p }) => p.installmentType === t).length }));

  // Godown: currently out with employees
  const openSessions = sessions.filter((s) => s.status === "open");
  let outWithEmployees = 0;
  if (openSessions.length) {
    const mv = await db.select().from(godownMovements).where(inArray(godownMovements.sessionId, openSessions.map((s) => s.id)));
    const soldByOpen = allOrders.filter((o) => o.sessionId && openSessions.some((s) => s.id === o.sessionId));
    const soldQty = items.filter((i) => soldByOpen.some((o) => o.id === i.orderId)).reduce((a, i) => a + i.quantity, 0);
    outWithEmployees = mv.reduce((a, m) => a + (m.type === "return" ? -m.quantity : m.quantity), 0) - soldQty;
  }

  return {
    totals: {
      revenue, collected, orders: allOrders.length, pending: pending.length, todaysOrders: todaysOrders.length, todaysSales,
      products: allProducts.length, totalStock, stockValue, employees: employees.length, customers: Number(customersCount[0]?.c ?? 0),
      trend, lowStock: lowStock.length, outWithEmployees, openSessions: openSessions.length,
      avgOrder: sold.length ? Math.round(revenue / sold.length) : 0,
    },
    byDay, typeMix, revenueByType, statusMix, sourceMix, salesByCategory, topProducts, stockBuckets, priceVsSold, radar,
    employeePerf, branchStats, installmentMix, lowStock: lowStock.slice(0, 8),
    recentOrders: allOrders.slice(0, 8),
    recentSessions: sessions.slice(0, 6),
    branches: allBranches,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getEmployeeSnapshot(employeeId: number) {
  const [emp] = await db.select().from(users).where(eq(users.id, employeeId));
  if (!emp) return null;
  const [sessions, myOrders] = await Promise.all([
    db.select().from(godownSessions).where(eq(godownSessions.employeeId, employeeId)).orderBy(desc(godownSessions.createdAt)).limit(60),
    db.select().from(orders).where(eq(orders.employeeId, employeeId)).orderBy(desc(orders.createdAt)).limit(200),
  ]);
  const myPackages = await db.select().from(packages).where(eq(packages.employeeId, employeeId)).orderBy(desc(packages.id)).limit(50);
  const sessionIds = sessions.map((s) => s.id);
  const movements = sessionIds.length ? await db.select().from(godownMovements).where(inArray(godownMovements.sessionId, sessionIds)).orderBy(desc(godownMovements.createdAt)) : [];
  const orderIds = myOrders.map((o) => o.id);
  const items = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];
  const branchProducts = emp.branchId ? await db.select().from(products).where(and(eq(products.branchId, emp.branchId), eq(products.isActive, true))).orderBy(products.name) : [];
  const customers = await db.select({ id: users.id, name: users.name, phone: users.phone, village: users.village, union: users.union, upazila: users.upazila, district: users.district, uniqueId: users.uniqueId, blocked: users.blocked }).from(users).where(eq(users.role, "customer")).orderBy(desc(users.createdAt)).limit(500);
  const today = todayKey();
  const todaySession = sessions.find((s) => s.date === today) ?? null;
  return {
    employee: { id: emp.id, name: emp.name, phone: emp.phone, branchId: emp.branchId, designation: emp.designation, district: emp.district },
    products: branchProducts,
    customers,
    todaySession,
    todayMovements: todaySession ? movements.filter((m) => m.sessionId === todaySession.id) : [],
    todayOrders: todaySession ? myOrders.filter((o) => o.sessionId === todaySession.id).map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })) : [],
    sessions,
    packages: myPackages,
    movements,
    orders: myOrders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })),
    serverTime: new Date().toISOString(),
  };
}

export type EmployeeSnapshot = NonNullable<Awaited<ReturnType<typeof getEmployeeSnapshot>>>;

export async function getStorefront() {
  const [cats, prods, brs, areas] = await Promise.all([
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
    db.select({ p: products, branchName: branches.name, categoryName: categories.name, categorySlug: categories.slug }).from(products).innerJoin(branches, eq(products.branchId, branches.id)).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.isActive, true)).orderBy(desc(products.createdAt)),
    db.select().from(branches).where(eq(branches.isActive, true)).orderBy(branches.id),
    db.select().from(serviceAreas),
  ]);
  const list = prods.map(({ p, branchName, categoryName, categorySlug }) => ({ ...p, branchName, categoryName, categorySlug }));
  const catCounts = new Map<number, number>();
  list.forEach((p) => p.categoryId && catCounts.set(p.categoryId, (catCounts.get(p.categoryId) ?? 0) + 1));
  return {
    categories: cats.map((c) => ({ ...c, count: catCounts.get(c.id) ?? 0 })),
    products: list,
    branches: brs,
    areas,
    featured: list.filter((p) => p.isFeatured).slice(0, 8),
    hot: list.filter((p) => p.isHot).slice(0, 8),
    best: [...list].sort((a, b) => b.soldCount - a.soldCount).slice(0, 8),
    newest: [...new Map(list.filter((p) => p.isNew).concat(list).map((p) => [p.id, p])).values()].slice(0, 8),
  };
}

export type StoreProduct = Awaited<ReturnType<typeof getStorefront>>["products"][number];
