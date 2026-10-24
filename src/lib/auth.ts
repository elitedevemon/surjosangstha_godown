import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "ss_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "surjosangstha-dev-secret-change-me");

export interface SessionUser {
  id: number;
  name: string;
  phone: string;
  role: "admin" | "employee" | "customer";
  branchId: number | null;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(pw, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return {
      id: Number(payload.id),
      name: String(payload.name),
      phone: String(payload.phone),
      role: payload.role as SessionUser["role"],
      branchId: payload.branchId == null ? null : Number(payload.branchId),
    };
  } catch {
    return null;
  }
}

export async function requireRole(...roles: SessionUser["role"][]) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!roles.includes(s.role)) redirect(s.role === "admin" ? "/admin" : s.role === "employee" ? "/employee" : "/account");
  return s;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  return u ?? null;
}
