import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ ok: false, error: "login required" }, { status: 401 });
  const body = (await req.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string }; userAgent?: string };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) return Response.json({ ok: false, error: "bad subscription" }, { status: 400 });
  const [existing] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint)).limit(1);
  if (existing) {
    await db.update(pushSubscriptions).set({ userId: s.id, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: body.userAgent }).where(eq(pushSubscriptions.id, existing.id));
  } else {
    await db.insert(pushSubscriptions).values({ userId: s.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: body.userAgent });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (body.endpoint) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint));
  else await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, s.id));
  return Response.json({ ok: true });
}
