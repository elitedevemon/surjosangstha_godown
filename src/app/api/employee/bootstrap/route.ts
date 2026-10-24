import { getSession } from "@/lib/auth";
import { getEmployeeSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "employee") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const snapshot = await getEmployeeSnapshot(s.id);
  return Response.json({ snapshot });
}
