import { db } from "@/db";
import { branches, products, users, orders, serviceAreas } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { BranchManager } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function BranchesAdmin() {
  const [brs, ps, es, os, as] = await Promise.all([
    db.select().from(branches).orderBy(branches.id),
    db.select({ id: products.branchId, c: sql<number>`count(*)` }).from(products).groupBy(products.branchId),
    db.select({ id: users.branchId, c: sql<number>`count(*)` }).from(users).where(eq(users.role, "employee")).groupBy(users.branchId),
    db.select({ id: orders.branchId, c: sql<number>`count(*)`, s: sql<number>`coalesce(sum(case when ${orders.status} in ('accepted','delivered') then ${orders.total} else 0 end),0)` }).from(orders).groupBy(orders.branchId),
    db.select({ id: serviceAreas.branchId, c: sql<number>`count(*)` }).from(serviceAreas).groupBy(serviceAreas.branchId),
  ]);
  const stats: Record<number, { products: number; employees: number; orders: number; revenue: number; areas: number }> = {};
  brs.forEach((b) => { stats[b.id] = { products: 0, employees: 0, orders: 0, revenue: 0, areas: 0 }; });
  ps.forEach((r) => { if (stats[r.id]) stats[r.id].products = Number(r.c); });
  es.forEach((r) => { if (r.id && stats[r.id]) stats[r.id].employees = Number(r.c); });
  os.forEach((r) => { if (stats[r.id]) { stats[r.id].orders = Number(r.c); stats[r.id].revenue = Number(r.s); } });
  as.forEach((r) => { if (stats[r.id]) stats[r.id].areas = Number(r.c); });
  return <BranchManager branches={brs} stats={stats} />;
}
