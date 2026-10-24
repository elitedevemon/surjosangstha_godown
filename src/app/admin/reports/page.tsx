import { getDashboardData } from "@/lib/queries";
import { currentBranchId } from "@/lib/branch-scope";
import { ReportsView } from "@/components/admin/reports";

export const dynamic = "force-dynamic";

export default async function ReportsAdmin({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  const days = [7, 14, 30, 90].includes(Number(d)) ? Number(d) : 14;
  const branchId = await currentBranchId();
  const data = await getDashboardData(branchId, days);
  return <ReportsView data={data} branchId={branchId} days={days} />;
}
