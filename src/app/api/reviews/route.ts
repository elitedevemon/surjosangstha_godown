import { db } from "@/db";
import { reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Public: approved reviews for a product (storefront). */
export async function GET(req: Request) {
  const productId = Number(new URL(req.url).searchParams.get("productId") ?? 0);
  if (!productId) return Response.json({ items: [] });
  const items = await db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt)).limit(20);
  return Response.json({ items: items.filter((r) => r.status === "approved") });
}
