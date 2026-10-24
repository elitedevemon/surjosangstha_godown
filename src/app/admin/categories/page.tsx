import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { sql } from "drizzle-orm";
import { CategoryManager } from "@/components/admin/people";

export const dynamic = "force-dynamic";

export default async function CategoriesAdmin() {
  const [cats, counts] = await Promise.all([
    db.select().from(categories).orderBy(categories.sortOrder),
    db.select({ id: products.categoryId, c: sql<number>`count(*)` }).from(products).groupBy(products.categoryId),
  ]);
  const map: Record<number, number> = {};
  counts.forEach((r) => { if (r.id) map[r.id] = Number(r.c); });
  return <CategoryManager categories={cats} counts={map} />;
}
