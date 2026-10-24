export const dynamic = "force-dynamic";

/**
 * অতি-হালকা কিপ-অ্যালাইভ এন্ডপয়েন্ট।
 * ফ্রি হোস্টিং (Render/Koyeb) ১৫ মিনিট নিষ্ক্রিয় থাকলে অ্যাপ ঘুমিয়ে যায় —
 * cron-job.org / UptimeRobot দিয়ে প্রতি ১০ মিনিটে এটি পিং করলে অ্যাপ জেগে থাকে।
 * ডাটাবেসে হিট করে না, তাই CPU/কোটা প্রায় খরচ হয় না।
 */
export function GET() {
  return Response.json({ ok: true, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
