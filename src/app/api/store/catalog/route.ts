import { getStorefront } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStorefront();
  return Response.json({ categories: data.categories, products: data.products, branches: data.branches, areas: data.areas, cachedAt: new Date().toISOString() });
}
