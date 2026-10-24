import { siteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Public realtime config so the client can open a Pusher channel using admin-set values. */
export async function GET() {
  const s = await siteSettings();
  const key = s.pusherKey?.trim() || process.env.NEXT_PUBLIC_PUSHER_KEY || "";
  const cluster = s.pusherCluster?.trim() || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "";
  return Response.json({ pusherKey: key, pusherCluster: cluster, enabled: !!(key && cluster), siteName: s.siteName, deliveryFeeIn: s.deliveryFeeIn, deliveryFeeOut: s.deliveryFeeOut });
}
