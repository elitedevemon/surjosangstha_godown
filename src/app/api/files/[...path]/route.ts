import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif" };
const CACHE = "public, max-age=31536000, immutable";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const name = path.basename(parts.join("/"));

  // ডাটাবেসে রাখা ছবি: /api/files/db-<id>
  const dbMatch = name.match(/^db-(\d+)$/);
  if (dbMatch) {
    const [row] = await db.select().from(media).where(eq(media.id, Number(dbMatch[1]))).limit(1);
    if (!row) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(Buffer.from(row.data, "base64")), {
      headers: { "Content-Type": row.mime, "Cache-Control": CACHE },
    });
  }

  // ডিস্কে রাখা ছবি
  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", name));
    const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": CACHE } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
