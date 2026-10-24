import { vapidConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Returns the VAPID public key so browsers can subscribe for Web Push. */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY ?? "";
  return Response.json({ publicKey: key, configured: vapidConfigured() });
}
