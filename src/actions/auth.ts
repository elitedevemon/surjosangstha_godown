"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession, hashPassword, verifyPassword, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notify } from "@/lib/notify";

export interface ActionResult { ok: boolean; error?: string; redirectTo?: string }

export async function loginAction(input: { phone: string; password: string }): Promise<ActionResult> {
  const phone = input.phone.trim();
  const [u] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!u || !(await verifyPassword(input.password, u.passwordHash))) return { ok: false, error: "ফোন নম্বর বা পাসওয়ার্ড সঠিক নয়" };
  if (!u.isActive) return { ok: false, error: "এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে" };
  if (u.blocked) return { ok: false, error: "⛔ আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। বিস্তারিত জানতে কল করুন: 01700-000000" };
  await createSession({ id: u.id, name: u.name, phone: u.phone, role: u.role, branchId: u.branchId });
  return { ok: true, redirectTo: u.role === "admin" ? "/admin" : u.role === "employee" ? "/employee" : "/account" };
}

export async function registerAction(input: { name: string; phone: string; password: string; village: string; union: string; upazila: string; district: string }): Promise<ActionResult> {
  const phone = input.phone.trim();
  if (!/^01\d{9}$/.test(phone)) return { ok: false, error: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)" };
  if (input.password.length < 6) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" };
  const [exists] = await db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.phone, phone)).limit(1);
  let user;
  if (exists) {
    // Customer previously registered offline by an employee (no password yet): let them claim the account.
    if (exists.passwordHash) return { ok: false, error: "এই নম্বরে ইতোমধ্যে অ্যাকাউন্ট আছে, লগইন করুন" };
    await db.update(users).set({ name: input.name, passwordHash: await hashPassword(input.password), village: input.village, union: input.union, upazila: input.upazila, district: input.district }).where(eq(users.id, exists.id));
    [user] = await db.select().from(users).where(eq(users.id, exists.id)).limit(1);
  } else {
    const [{ id: newId }] = await db.insert(users).values({ name: input.name.trim(), phone, passwordHash: await hashPassword(input.password), role: "customer", village: input.village, union: input.union, upazila: input.upazila, district: input.district }).$returningId();
    [user] = await db.select().from(users).where(eq(users.id, newId)).limit(1);
  }
  await createSession({ id: user.id, name: user.name, phone: user.phone, role: "customer", branchId: null });
  await notify({ type: "customer", title: "নতুন কাস্টমার রেজিস্ট্রেশন", message: `${user.name} (${user.phone}) - ${[input.upazila, input.district].filter(Boolean).join(", ")}`, link: "/admin/customers" });
  return { ok: true, redirectTo: "/account" };
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(input: { name: string; village: string; union: string; upazila: string; district: string; address?: string; password?: string }): Promise<ActionResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "লগইন করুন" };
  const patch: Partial<typeof users.$inferInsert> = { name: input.name, village: input.village, union: input.union, upazila: input.upazila, district: input.district, address: input.address };
  if (input.password) patch.passwordHash = await hashPassword(input.password);
  await db.update(users).set(patch).where(eq(users.id, s.id));
  return { ok: true };
}
