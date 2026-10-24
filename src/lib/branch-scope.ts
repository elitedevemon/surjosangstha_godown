import { cookies } from "next/headers";

/** Admin-selected branch scope (null = universal / all branches). */
export async function currentBranchId(): Promise<number | null> {
  const c = (await cookies()).get("ss_branch")?.value;
  return c && c !== "all" && !Number.isNaN(Number(c)) ? Number(c) : null;
}
