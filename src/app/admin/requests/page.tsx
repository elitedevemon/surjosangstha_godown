import { db } from "@/db";
import { categories } from "@/db/schema";
import { listProductRequests } from "@/actions/extra";
import { RequestsClient } from "@/components/admin/requests-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "পণ্যের চাহিদা" };

export default async function RequestsAdmin() {
  const [rows, cats] = await Promise.all([listProductRequests(), db.select().from(categories).orderBy(categories.sortOrder)]);
  return <RequestsClient rows={rows} categories={cats} />;
}
