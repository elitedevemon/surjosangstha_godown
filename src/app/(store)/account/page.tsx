import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, branches, users, reviews } from "@/db/schema";
import { desc, eq, inArray, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AccountClient } from "@/components/store/account-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "আমার অ্যাকাউন্ট" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  if (user.role !== "customer") redirect(user.role === "admin" ? "/admin" : "/employee");

  const myOrders = await db
    .select({ o: orders, branchName: branches.name, employeeName: users.name })
    .from(orders)
    .innerJoin(branches, eq(orders.branchId, branches.id))
    .leftJoin(users, eq(orders.employeeId, users.id))
    .where(eq(orders.customerId, user.id))
    .orderBy(desc(orders.createdAt));
  const ids = myOrders.map((x) => x.o.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  const myReviews = await db.select({ productId: reviews.productId }).from(reviews).where(and(eq(reviews.customerId, user.id)));
  const reviewed: Record<number, boolean> = {};
  myReviews.forEach((r) => (reviewed[r.productId] = true));

  const isDefaultPassword = !!user.passwordHash && bcrypt.compareSync("customer123", user.passwordHash);
  const list = myOrders.map((r) => ({ ...r.o, branchName: r.branchName, employeeName: r.employeeName, items: items.filter((i) => i.orderId === r.o.id) }));
  return (
    <div className="container-x py-6">
      <AccountClient user={user} orders={list} reviewed={reviewed} isDefaultPassword={isDefaultPassword} />
    </div>
  );
}
