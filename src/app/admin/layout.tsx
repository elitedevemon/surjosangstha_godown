import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth";
import { getBranches } from "@/lib/queries";
import { AdminShell } from "@/components/admin/shell";

export const dynamic = "force-dynamic";


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole("admin");
  const branches = await getBranches();
  const c = (await cookies()).get("ss_branch")?.value ?? "all";
  const current = c !== "all" && branches.some((b) => String(b.id) === c) ? c : "all";
  return <AdminShell user={{ id: s.id, name: s.name, role: "admin" }} branches={branches} currentBranch={current}>{children}</AdminShell>;
}
