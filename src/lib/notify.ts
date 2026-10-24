import { db } from "@/db";
import { eq } from "drizzle-orm";
import { notifications } from "@/db/schema";
import Pusher from "pusher";

let pusher: Pusher | null = null;
let pusherCheckedAt = 0;
function getPusher() {
  if (pusher) return pusher;
  if (Date.now() - pusherCheckedAt < 30_000) return pusher;
  pusherCheckedAt = Date.now();
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER) {
    pusher = new Pusher({ appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER, useTLS: true });
    return pusher;
  }
  // admin-configured credentials from settings table
  import("@/db").then(async ({ db }) => {
    const { settings } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    try {
      const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
      if (row?.pusherAppId && row.pusherKey && row.pusherSecret && row.pusherCluster) {
        pusher = new Pusher({ appId: row.pusherAppId, key: row.pusherKey, secret: row.pusherSecret, cluster: row.pusherCluster, useTLS: true });
      }
    } catch { /* ignore */ }
  }).catch(() => {});
  return pusher;
}

export interface NotifyInput {
  branchId?: number | null;
  recipientRole?: "admin" | "employee" | "customer";
  recipientId?: number | null;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

export async function notify(input: NotifyInput) {
  const [{ id: rowId }] = await db
    .insert(notifications)
    .values({
      branchId: input.branchId ?? null,
      recipientRole: input.recipientRole ?? "admin",
      recipientId: input.recipientId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      data: input.data,
    })
    .$returningId();
  const [row] = await db.select().from(notifications).where(eq(notifications.id, rowId)).limit(1);
  const p = getPusher();
  if (p) {
    const channel = row.recipientId ? `user-${row.recipientId}` : `role-${row.recipientRole}`;
    p.trigger(channel, "notification", row).catch(() => {});
    // real-time DATA update: ড্যাশবোর্ড/প্যানেল লাইভ রিফ্রেশ করার ইভেন্ট
    p.trigger(channel, "data-update", { type: row.type, at: Date.now(), branchId: row.branchId }).catch(() => {});
    if (row.branchId) p.trigger(`branch-${row.branchId}`, "data-update", { type: row.type, at: Date.now() }).catch(() => {});
  }
  // Web Push (PC + Android + iOS PWA) — ব্যাকগ্রাউন্ডে থাকলেও ডিভাইস নোটিফিকেশন পাবে
  import("./push")
    .then(({ sendWebPush }) =>
      sendWebPush(
        { title: row.title, body: row.message, link: row.link, tag: `ss-${row.id}`, icon: "/logo.png" },
        row.recipientId,
        row.recipientRole === "admin" && !row.recipientId,
      ),
    )
    .catch(() => {});
  return row;
}

/**
 * স্টক কমে গেলে এডমিনকে অটো-নোটিফিকেশন।
 * নোটিফিকেশনে ক্লিক করলে সরাসরি পণ্যের এডিট মডাল খোলে (/admin/products?focus=id)।
 * ১ ঘণ্টার মধ্যে একই পণ্যের আনরিড অ্যালার্ট থাকলে ডুপ্লিকেট পাঠায় না।
 */
export async function checkLowStock(productId: number) {
  try {
    const { db } = await import("@/db");
    const { products, notifications } = await import("@/db/schema");
    const { eq, and, gt } = await import("drizzle-orm");
    const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!p || p.stock > p.lowStockAt) return;
    const since = new Date(Date.now() - 3600_000);
    const [dup] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.type, "stock"), eq(notifications.isRead, false), gt(notifications.createdAt, since), eq(notifications.branchId, p.branchId)))
      .limit(5);
    if (dup) return;
    await notify({
      branchId: p.branchId,
      type: "stock",
      title: `কম স্টক অ্যালার্ট: ${p.name}`,
      message: `স্টক ${p.stock} টি (সতর্কতা সীমা ${p.lowStockAt}) — ক্লিক করে স্টক আপডেট করুন`,
      link: `/admin/godown?product=${p.id}`,
      data: { productId: p.id, sound: "godown" },
    });
  } catch { /* ignore */ }
}
