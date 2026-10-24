import { getDashboardData } from "@/lib/queries";
import { currentBranchId } from "@/lib/branch-scope";
import { AdminDashboard } from "@/components/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const branchId = await currentBranchId();
  const data = await getDashboardData(branchId);
  return <AdminDashboard data={data} branchId={branchId} />;
}
