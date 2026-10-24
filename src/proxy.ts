import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "surjosangstha-dev-secret-change-me");

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedRoles: Record<string, string[]> = { "/admin": ["admin"], "/employee": ["employee"], "/account": ["customer", "admin", "employee"] };
  const key = Object.keys(protectedRoles).find((k) => pathname === k || pathname.startsWith(k + "/"));
  if (!key) return NextResponse.next();
  const token = req.cookies.get("ss_session")?.value;
  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      role = String(payload.role);
    } catch {
      role = null;
    }
  }
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!protectedRoles[key].includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : role === "employee" ? "/employee" : "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/employee/:path*", "/account/:path*"] };
