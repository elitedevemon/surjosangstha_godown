import "server-only";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export function vapidConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function ensureVapid() {
  if (!vapidConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@surjosangstha.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  link?: string | null;
  tag?: string;
  icon?: string;
}

/**
 * Web Push পাঠায় — PC (Chrome/Firefox/Edge), Android Chrome, iOS Safari 16.4+ (PWA)।
 * recipientId থাকলে সেই ইউজারের সব ডিভাইসে; নাহলে isAdminBroadcast হলে সব এডমিন ডিভাইসে।
 */
export async function sendWebPush(payload: PushPayload, recipientId: number | null, isAdminBroadcast: boolean) {
  if (!ensureVapid()) return 0;
  try {
    let subs: typeof pushSubscriptions.$inferSelect[] = [];
    if (recipientId) {
      subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, recipientId));
    } else if (isAdminBroadcast) {
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      if (admins.length) subs = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, admins.map((a) => a.id)));
    }
    let sent = 0;
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 86400 });
          sent++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)).catch(() => {});
        }
      }),
    );
    return sent;
  } catch {
    return 0;
  }
}
