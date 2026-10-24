import { db } from "@/db";
import { media } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024; // 4MB — DB-safe

/**
 * ছবি আপলোড।
 * ১) ডিস্কে লেখার চেষ্টা (VPS/cPanel/Docker — persistent disk থাকলে দ্রুততর)
 * ২) ডিস্ক রিড-অনলি হলে (Vercel/Netlify serverless) ডাটাবেসে সংরক্ষণ
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "admin") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const urls: string[] = [];

  for (const f of files) {
    if (!f.type.startsWith("image/") || f.size > MAX) continue;
    const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await f.arrayBuffer());

    let savedToDisk = false;
    try {
      const dir = path.join(process.cwd(), "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), buf);
      savedToDisk = true;
      urls.push(`/api/files/${name}`);
    } catch {
      savedToDisk = false;
    }

    if (!savedToDisk) {
      const [{ id }] = await db
        .insert(media)
        .values({ name, mime: f.type || "image/jpeg", size: buf.length, data: buf.toString("base64") })
        .$returningId();
      urls.push(`/api/files/db-${id}`);
    }
  }

  return Response.json({ urls });
}
