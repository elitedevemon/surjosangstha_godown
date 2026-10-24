"use server";

import { db } from "@/db";
import { branches, orderItems, orders, products, serviceAreas, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { isInsideServiceArea, orderNumber, formatMoney } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/actions/extra";

export interface CheckoutItem { productId: number; qty: number; color?: string }
export interface CheckoutInput {
  items: CheckoutItem[];
  paymentType: "cod" | "cash" | "installment";
  address: string;
  notes?: string;
  village: string; union: string; upazila: string; district: string;
}

export async function checkAvailability(input: { branchIds: number[]; district: string; upazila: string; union: string }) {
  const areas = input.branchIds.length ? await db.select().from(serviceAreas).where(inArray(serviceAreas.branchId, input.branchIds)) : [];
  const result: Record<number, boolean> = {};
  for (const b of input.branchIds) result[b] = isInsideServiceArea(input, areas.filter((a) => a.branchId === b));
  return result;
}

export async function placeOrderAction(input: CheckoutInput): Promise<{ ok: boolean; error?: string; orderNumbers?: string[] }> {
  const s = await getSession();
  if (!s) return { ok: false, error: "অর্ডার করতে লগইন করুন" };
  if (s.role === "employee") return { ok: false, error: "কর্মী নিজের জন্য অনলাইন অর্ডার করতে পারবেন না — কাস্টমারের অর্ডার কর্মী প্যানেল থেকে এন্ট্রি দিন" };
  if (!input.items.length) return { ok: false, error: "কার্ট খালি" };
  const [customer] = await db.select().from(users).where(eq(users.id, s.id));
  const ids = input.items.map((i) => i.productId);
  const prods = await db.select().from(products).where(inArray(products.id, ids));
  const branchIds = [...new Set(prods.map((p) => p.branchId))];
  const [areas, brs] = await Promise.all([
    db.select().from(serviceAreas).where(inArray(serviceAreas.branchId, branchIds)),
    db.select().from(branches).where(inArray(branches.id, branchIds)),
  ]);
  const created: string[] = [];
  for (const bId of branchIds) {
    const inside = isInsideServiceArea(input, areas.filter((a) => a.branchId === bId));
    const type = inside ? input.paymentType : "cod";
    const bItems = input.items.filter((i) => prods.find((p) => p.id === i.productId)?.branchId === bId);
    let subtotal = 0;
    const lines = bItems.map((i) => {
      const p = prods.find((x) => x.id === i.productId)!;
      if (p.stock < i.qty) throw new Error(`${p.name} এর পর্যাপ্ত স্টক নেই`);
      const unit = type === "cash" ? p.cashPrice : p.price; // online (COD) uses the listed installment price; cash is field-agent only
      subtotal += unit * i.qty;
      return { productId: p.id, productName: p.name, image: p.images[0], color: i.color, quantity: i.qty, unitPrice: unit, lineTotal: unit * i.qty, p };
    });
    const first = lines[0].p;
    const st = await getSettings();
    const deliveryFee = inside ? st.deliveryFeeIn : st.deliveryFeeOut;
    const down = type === "installment" ? lines.reduce((a, l) => a + l.p.downPayment * l.quantity, 0) : 0;
    const instAmt = type === "installment" ? lines.reduce((a, l) => a + l.p.installmentAmount * l.quantity, 0) : 0;
    const num = orderNumber();
    const [{ id: oId }] = await db
      .insert(orders)
      .values({
        orderNumber: num, branchId: bId, customerId: customer.id, type, status: "pending", source: "online",
        subtotal, total: subtotal + deliveryFee, deliveryFee, downPayment: down, installmentType: type === "installment" ? first.installmentType : null,
        installmentAmount: instAmt, installmentCount: type === "installment" ? Math.max(...lines.map((l) => l.p.installmentCount)) : 0,
        customerName: customer.name, customerPhone: customer.phone, village: input.village, union: input.union, upazila: input.upazila, district: input.district,
        address: input.address, notes: input.notes,
      })
      .$returningId();
    await db.insert(orderItems).values(lines.map(({ p: _p, ...l }) => ({ ...l, orderId: oId })));
    created.push(num);
    const branchName = brs.find((b) => b.id === bId)?.name ?? "";
    await notify({
      branchId: bId, type: "order", title: `নতুন অনলাইন অর্ডার (${type.toUpperCase()})`,
      message: `${customer.name} • ${formatMoney(subtotal + deliveryFee)} (ডেলিভারি ${formatMoney(deliveryFee)}) • ${lines.length} পণ্য • ${branchName}`,
      link: `/admin/orders?focus=${oId}`, data: { orderId: oId, total: subtotal, type, sound: "order" },
    });
  }
  revalidatePath("/admin/orders");
  return { ok: true, orderNumbers: created };
}
