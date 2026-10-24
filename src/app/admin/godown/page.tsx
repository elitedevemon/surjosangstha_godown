import { db } from "@/db";
import { products, categories, branches, godownSessions, godownMovements, orders, orderItems, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { currentBranchId } from "@/lib/branch-scope";
import { GodownView } from "@/components/admin/orders-godown";

export const dynamic = "force-dynamic";

export default async function GodownAdmin({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  const branchId = await currentBranchId();
  const [prodRows, sessRows] = await Promise.all([
    db.select({ p: products, branchName: branches.name, categoryName: categories.name }).from(products).innerJoin(branches, eq(products.branchId, branches.id)).leftJoin(categories, eq(products.categoryId, categories.id)).where(branchId ? eq(products.branchId, branchId) : undefined).orderBy(products.name),
    db.select({ s: godownSessions, employeeName: users.name, branchName: branches.name }).from(godownSessions).innerJoin(users, eq(godownSessions.employeeId, users.id)).innerJoin(branches, eq(godownSessions.branchId, branches.id)).where(branchId ? eq(godownSessions.branchId, branchId) : undefined).orderBy(desc(godownSessions.createdAt)).limit(200),
  ]);
  const sessionIds = sessRows.map((r) => r.s.id);
  const [movements, sessOrders] = await Promise.all([
    sessionIds.length ? db.select().from(godownMovements).where(inArray(godownMovements.sessionId, sessionIds)).orderBy(godownMovements.createdAt) : Promise.resolve([]),
    sessionIds.length ? db.select({ o: orders, branchName: branches.name, employeeName: users.name }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id)).leftJoin(users, eq(orders.employeeId, users.id)).where(inArray(orders.sessionId, sessionIds)).orderBy(desc(orders.createdAt)) : Promise.resolve([]),
  ]);
  const oIds = sessOrders.map((r) => r.o.id);
  const items = oIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, oIds)) : [];
  const openIds = new Set(sessRows.filter((r) => r.s.status === "open").map((r) => r.s.id));
  const out = new Map<number, number>();
  movements.filter((m) => openIds.has(m.sessionId)).forEach((m) => out.set(m.productId, (out.get(m.productId) ?? 0) + (m.type === "return" ? -m.quantity : m.quantity)));
  items.filter((i) => { const o = sessOrders.find((r) => r.o.id === i.orderId); return o && o.o.sessionId && openIds.has(o.o.sessionId); }).forEach((i) => { if (i.productId) out.set(i.productId, (out.get(i.productId) ?? 0) - i.quantity); });
  return (
    <GodownView
      stock={prodRows.map((r) => ({ ...r.p, branchName: r.branchName, categoryName: r.categoryName, outInField: Math.max(0, out.get(r.p.id) ?? 0) }))}
      sessions={sessRows.map((r) => ({ ...r.s, employeeName: r.employeeName, branchName: r.branchName }))}
      movements={movements}
      sessionOrders={sessOrders.map((r) => ({ ...r.o, branchName: r.branchName, employeeName: r.employeeName, items: items.filter((i) => i.orderId === r.o.id) }))}
      focusSession={session ? Number(session) : undefined}
    />
  );
}
