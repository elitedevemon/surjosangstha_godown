import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { CustomersTable } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function CustomersAdmin() {
  const [list, agg] = await Promise.all([
    db.select().from(users).where(eq(users.role, "customer")).orderBy(desc(users.createdAt)),
    db.select({ id: orders.customerId, c: sql<number>`count(*)`, s: sql<number>`coalesce(sum(case when ${orders.status} in ('accepted','delivered') then ${orders.total} else 0 end),0)`, last: sql<string>`max(${orders.createdAt})` }).from(orders).groupBy(orders.customerId),
  ]);
  const map = new Map(agg.map((a) => [a.id, a]));
  return <CustomersTable customers={list.map((c) => ({ ...c, orders: Number(map.get(c.id)?.c ?? 0), spent: Number(map.get(c.id)?.s ?? 0), lastOrder: map.get(c.id)?.last ? new Date(map.get(c.id)!.last) : null }))} />;
}
