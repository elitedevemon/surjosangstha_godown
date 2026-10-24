import { db } from "@/db";
import { users, branches, orders, godownSessions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { currentBranchId } from "@/lib/branch-scope";
import { EmployeeManager } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function EmployeesAdmin() {
  const branchId = await currentBranchId();
  const [emps, brs, os, ss] = await Promise.all([
    db.select().from(users).where(branchId ? and(eq(users.role, "employee"), eq(users.branchId, branchId)) : eq(users.role, "employee")).orderBy(users.name),
    db.select().from(branches).orderBy(branches.id),
    db.select({ id: orders.employeeId, c: sql<number>`count(*)`, s: sql<number>`coalesce(sum(${orders.total}),0)` }).from(orders).groupBy(orders.employeeId),
    db.select({ id: godownSessions.employeeId, c: sql<number>`count(*)` }).from(godownSessions).groupBy(godownSessions.employeeId),
  ]);
  const stats: Record<number, { orders: number; revenue: number; sessions: number }> = {};
  os.forEach((r) => { if (r.id) stats[r.id] = { orders: Number(r.c), revenue: Number(r.s), sessions: 0 }; });
  ss.forEach((r) => { stats[r.id] = { ...(stats[r.id] ?? { orders: 0, revenue: 0, sessions: 0 }), sessions: Number(r.c) }; });
  return <EmployeeManager employees={emps} branches={brs} stats={stats} />;
}
