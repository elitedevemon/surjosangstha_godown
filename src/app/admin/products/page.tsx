import { db } from "@/db";
import { products, categories, branches } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { currentBranchId } from "@/lib/branch-scope";
import { ProductManager } from "@/components/admin/product-manager";

export const dynamic = "force-dynamic";

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams;
  const branchId = await currentBranchId();
  const [rows, cats, brs] = await Promise.all([
    db.select({ p: products, categoryName: categories.name, branchName: branches.name }).from(products).innerJoin(branches, eq(products.branchId, branches.id)).leftJoin(categories, eq(products.categoryId, categories.id)).where(branchId ? eq(products.branchId, branchId) : undefined).orderBy(desc(products.createdAt)),
    db.select().from(categories).orderBy(categories.sortOrder),
    db.select().from(branches).orderBy(branches.id),
  ]);
  return <ProductManager products={rows.map((r) => ({ ...r.p, categoryName: r.categoryName, branchName: r.branchName }))} branches={brs} categories={cats} branchId={branchId} focus={focus ? Number(focus) : undefined} />;
}
