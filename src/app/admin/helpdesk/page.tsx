import { db } from "@/db";
import { helpdeskThreads, helpdeskMessages, helpdeskKb } from "@/db/schema";
import { desc } from "drizzle-orm";
import { HelpdeskAdmin } from "@/components/admin/helpdesk-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "হেল্পডেস্ক" };

export default async function HelpdeskAdminPage() {
  const [threads, kb] = await Promise.all([
    db.select().from(helpdeskThreads).orderBy(desc(helpdeskThreads.updatedAt)).limit(100),
    db.select().from(helpdeskKb).orderBy(desc(helpdeskKb.updatedAt)),
  ]);
  const ids = threads.map((t) => t.id);
  const messages = ids.length ? await db.select().from(helpdeskMessages).where(inArrayHelper(ids)) : [];
  return <HelpdeskAdmin threads={threads} messages={messages} kb={kb} />;
}

import { inArray } from "drizzle-orm";
function inArrayHelper(ids: number[]) {
  return inArray(helpdeskMessages.threadId, ids);
}
