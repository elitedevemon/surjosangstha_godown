import { requireRole } from "@/lib/auth";
import { getEmployeeSnapshot } from "@/lib/queries";
import { EmployeeApp } from "@/components/employee/employee-app";

export const dynamic = "force-dynamic";
export const metadata = { title: "কর্মী প্যানেল" };

export default async function EmployeePage() {
  const s = await requireRole("employee");
  let snapshot = null;
  try { snapshot = await getEmployeeSnapshot(s.id); } catch { snapshot = null; }
  return <EmployeeApp initial={snapshot} userId={s.id} />;
}
