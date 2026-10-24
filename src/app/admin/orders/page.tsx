import { db } from "@/db";
import { orders, orderItems, branches, users, packages } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { currentBranchId } from "@/lib/branch-scope";
import { OrdersManager } from "@/components/admin/orders-godown";

export const dynamic = "force-dynamic";

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams;
  const branchId = await currentBranchId();
  const rows = await db.select({ o: orders, branchName: branches.name, employeeName: users.name }).from(orders).innerJoin(branches, eq(orders.branchId, branches.id)).leftJoin(users, eq(orders.employeeId, users.id)).where(branchId ? eq(orders.branchId, branchId) : undefined).orderBy(desc(orders.createdAt)).limit(500);
  const ids = rows.map((r) => r.o.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  const pkgs = await db.select().from(packages);
  const list = rows.map((r) => ({ ...r.o, branchName: r.branchName, employeeName: r.employeeName, items: items.filter((i) => i.orderId === r.o.id) }));
  return <OrdersManager orders={list} focus={focus ? Number(focus) : undefined} packages={pkgs} />;
}
