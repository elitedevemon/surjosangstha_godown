import { db } from "@/db";
import { branches, serviceAreas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { currentBranchId } from "@/lib/branch-scope";
import { AreaManager } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function AreasAdmin() {
  const branchId = await currentBranchId();
  const [rows, brs] = await Promise.all([
    db.select({ a: serviceAreas, branchName: branches.name }).from(serviceAreas).innerJoin(branches, eq(serviceAreas.branchId, branches.id)).orderBy(serviceAreas.district, serviceAreas.upazila),
    db.select().from(branches).orderBy(branches.id),
  ]);
  return <AreaManager areas={rows.map((r) => ({ ...r.a, branchName: r.branchName }))} branches={brs} branchId={branchId} />;
}
