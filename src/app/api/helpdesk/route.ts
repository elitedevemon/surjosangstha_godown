import { db } from "@/db";
import { helpdeskThreads, helpdeskMessages, helpdeskKb, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { aiHelpdeskAnswer } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Normalize a question for KB matching. */
function norm(s: string) {
  return s.toLowerCase().replace(/[?!।.,\s]+/g, " ").trim();
}

/** টোকেন সেট (২+ অক্ষরের শব্দ) */
function tokens(s: string) {
  return norm(s).split(" ").filter((w) => w.length > 1);
}

/**
 * দুটি প্রশ্নের মিলের হার (0..1) — Dice coefficient (টোকেন) + substring bonus।
 * ৮০%+ মিল হলে অটো-উত্তর পাঠানো হয়।
 */
function similarity(a: string, b: string) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => { if (B.has(w)) inter++; });
  const dice = (2 * inter) / (A.size + B.size);
  const na = norm(a), nb = norm(b);
  const contains = na.includes(nb) || nb.includes(na) ? 0.2 : 0;
  return Math.min(1, dice + contains);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone");
  const s = await getSession();
  if (s?.role === "admin") {
    const threads = await db.select().from(helpdeskThreads).orderBy(desc(helpdeskThreads.updatedAt)).limit(100);
    const all = await db.select().from(helpdeskMessages).orderBy(helpdeskMessages.id).limit(800);
    const kb = await db.select().from(helpdeskKb).orderBy(desc(helpdeskKb.updatedAt));
    return Response.json({ threads, messages: all, allMessages: all, kb });
  }
  if (!phone) return Response.json({ thread: null, messages: [] });
  const [thread] = await db.select().from(helpdeskThreads).where(eq(helpdeskThreads.phone, phone)).orderBy(desc(helpdeskThreads.updatedAt)).limit(1);
  if (!thread) return Response.json({ thread: null, messages: [] });
  const messages = await db.select().from(helpdeskMessages).where(eq(helpdeskMessages.threadId, thread.id)).orderBy(helpdeskMessages.id);
  return Response.json({ thread, messages });
}

/** Customer sends a message. If KB has a matching answer, reply instantly from DB. */
export async function POST(req: Request) {
  const body = (await req.json()) as { phone?: string; name?: string; address?: string; text?: string; customerId?: number | null };
  const text = (body.text ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!text) return Response.json({ ok: false, error: "মেসেজ লিখুন" }, { status: 400 });
  if (!/^01\d{9}$/.test(phone)) return Response.json({ ok: false, error: "সঠিক মোবাইল নম্বর দিন" }, { status: 400 });

  let [thread] = await db.select().from(helpdeskThreads).where(eq(helpdeskThreads.phone, phone)).orderBy(desc(helpdeskThreads.updatedAt)).limit(1);
  if (!thread) {
    const sess = await getSession();
    const [cust] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    const [{ id: tid }] = await db.insert(helpdeskThreads).values({
      phone, customerId: cust?.id ?? sess?.id ?? null, name: body.name || cust?.name || "কাস্টমার", address: body.address || cust?.address || null,
    }).$returningId();
    [thread] = await db.select().from(helpdeskThreads).where(eq(helpdeskThreads.id, tid)).limit(1);
  }
  await db.insert(helpdeskMessages).values({ threadId: thread.id, sender: "customer", text });

  // নলেজ বেস থেকে অটো-উত্তর — ৮০%+ মিল হলে সরাসরি উত্তর যাবে
  const kb = await db.select().from(helpdeskKb);
  let best: { row: (typeof kb)[number]; score: number } | null = null;
  for (const k of kb) {
    const score = similarity(text, k.question);
    if (!best || score > best.score) best = { row: k, score };
  }
  const MATCH_THRESHOLD = 0.8;
  const hit = best && best.score >= MATCH_THRESHOLD ? best.row : undefined;
  let auto = null;
  // KB-তে না মিললে AI (OpenRouter) খসড়া উত্তর দেওয়ার চেষ্টা করে — কনফিগ না থাকলে উপেক্ষা
  if (!hit) {
    const aiText = await aiHelpdeskAnswer(text, kb.map((k) => ({ question: k.question, answer: k.answer })));
    if (aiText) {
      const [{ id: aid }] = await db.insert(helpdeskMessages).values({ threadId: thread.id, sender: "admin", text: aiText, auto: true }).$returningId();
      await db.update(helpdeskThreads).set({ status: "open", updatedAt: new Date() }).where(eq(helpdeskThreads.id, thread.id));
      const aiMsg = (await db.select().from(helpdeskMessages).where(eq(helpdeskMessages.id, aid)))[0];
      const messagesAi = await db.select().from(helpdeskMessages).where(eq(helpdeskMessages.threadId, thread.id)).orderBy(helpdeskMessages.id);
      // AI উত্তর দিলেও এডমিনকে জানানো হয় — যাচাই ও প্রয়োজনে সংশোধনের জন্য
      await notify({
        recipientRole: "admin", type: "helpdesk",
        title: "হেল্পডেস্ক: AI খসড়া উত্তর দিয়েছে",
        message: `${body.name || thread.name} (${phone}): ${text.slice(0, 70)}`,
        link: `/admin/helpdesk?thread=${thread.id}`,
        data: { threadId: thread.id, ai: true, sound: "order" },
      });
      return Response.json({ ok: true, thread, messages: messagesAi, auto: true, ai: !!aiMsg });
    }
  }
  if (hit) {
    const [{ id: mid }] = await db.insert(helpdeskMessages).values({ threadId: thread.id, sender: "admin", text: hit.answer, auto: true }).$returningId();
    await db.update(helpdeskKb).set({ hits: hit.hits + 1 }).where(eq(helpdeskKb.id, hit.id));
    await db.update(helpdeskThreads).set({ status: "answered", updatedAt: new Date() }).where(eq(helpdeskThreads.id, thread.id));
    auto = (await db.select().from(helpdeskMessages).where(eq(helpdeskMessages.id, mid)))[0];
  } else {
    await db.update(helpdeskThreads).set({ status: "open", updatedAt: new Date() }).where(eq(helpdeskThreads.id, thread.id));
  }
  const messages = await db.select().from(helpdeskMessages).where(eq(helpdeskMessages.threadId, thread.id)).orderBy(helpdeskMessages.id);
  // অটো-উত্তর দেওয়া হলে এডমিনের কিছু করার নেই — তাই নোটিফিকেশন শুধু অমীমাংসিত মেসেজের জন্য
  if (!auto) {
    await notify({
      recipientRole: "admin",
      type: "helpdesk",
      title: "নতুন হেল্পডেস্ক মেসেজ",
      message: `${body.name || thread.name} (${phone}): ${text.slice(0, 80)}`,
      link: `/admin/helpdesk?thread=${thread.id}`,
      data: { threadId: thread.id, sound: "order" },
    });
  }
  return Response.json({ ok: true, thread, messages, auto: !!auto });
}
