import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { currentBranchId } from "@/lib/branch-scope";
import { NotificationsList } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function NotificationsAdmin() {
  const branchId = await currentBranchId();
  const items = await db.select().from(notifications).where(branchId ? and(eq(notifications.recipientRole, "admin"), eq(notifications.branchId, branchId)) : eq(notifications.recipientRole, "admin")).orderBy(desc(notifications.createdAt)).limit(150);
  return <NotificationsList items={items} />;
}
