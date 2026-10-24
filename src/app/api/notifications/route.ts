import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq, gt, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ items: [], unread: 0 });
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const scope =
    s.role === "admin"
      ? and(eq(notifications.recipientRole, "admin"))
      : or(eq(notifications.recipientId, s.id), and(eq(notifications.recipientRole, s.role), sql`${notifications.recipientId} is null`));
  // মাসিক অটো-ক্লিন: ৩০ দিনের পুরনো নোটিফিকেশন মুছে যায়
  const cutoff = new Date(Date.now() - 30 * 86400000);
  await db.delete(notifications).where(sql`${notifications.createdAt} < ${cutoff}`).catch(() => {});
  const where = since ? and(scope, gt(notifications.createdAt, new Date(since))) : scope;
  const [items, unreadRow] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(limit),
    db.select({ c: sql<number>`count(*)` }).from(notifications).where(and(scope, eq(notifications.isRead, false))),
  ]);
  return Response.json({ items, unread: Number(unreadRow[0]?.c ?? 0), serverTime: new Date().toISOString() });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ ok: false }, { status: 401 });
  const { id, all } = (await req.json().catch(() => ({}))) as { id?: number; all?: boolean };
  if (all) await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  else if (id) await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return Response.json({ ok: true });
}
