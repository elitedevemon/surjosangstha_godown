import { db } from "@/db";
import { products, reviews, helpdeskKb, pushSubscriptions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSettings } from "@/actions/extra";
import { vapidConfigured } from "@/lib/push";
import { SettingsPanel } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(products).where(eq(products.isDemo, true));
  const [st, rvs, kb, subs] = await Promise.all([getSettings(), db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(100), db.select().from(helpdeskKb), db.select({ id: pushSubscriptions.id }).from(pushSubscriptions)]);
  const pushStatus = { pusher: !!(st.pusherAppId && st.pusherKey && st.pusherSecret && st.pusherCluster) || !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY), vapid: vapidConfigured(), subs: subs.length };
  return <SettingsPanel demoCount={Number(c)} settings={st} reviews={rvs} kb={kb} pushStatus={pushStatus} />;
}
