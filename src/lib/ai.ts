import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * OpenRouter AI — হেল্পডেস্কের জন্য ঐচ্ছিক সহকারী।
 * নলেজ বেসে উত্তর না মিললে AI একটি খসড়া উত্তর দেয় (এডমিন পরে সংশোধন করতে পারে)।
 * কী না থাকলে সিস্টেম আগের মতোই চলে — শুধু এডমিনের রিপ্লাইয়ের অপেক্ষা করে।
 */

export interface AiConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
  siteUrl?: string;
  siteName?: string;
}

/** env > DB settings — দুই জায়গা থেকেই কনফিগ নেওয়া যায় */
export async function aiConfig(): Promise<AiConfig> {
  let dbKey: string | null = null;
  let dbModel: string | null = null;
  let dbEnabled = false;
  try {
    const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    dbKey = row?.openrouterKey ?? null;
    dbModel = row?.openrouterModel ?? null;
    dbEnabled = row?.aiHelpdesk ?? false;
  } catch {
    /* settings টেবিল না থাকলেও চলবে */
  }
  const apiKey = (process.env.OPENROUTER_API_KEY ?? dbKey ?? "").trim();
  const model = (process.env.OPENROUTER_MODEL ?? dbModel ?? "openrouter/free").trim();
  // env-এ কী থাকলে ডিফল্ট চালু; শুধু DB কী হলে এডমিনের টগল লাগবে
  const enabled = !!apiKey && (process.env.OPENROUTER_API_KEY ? true : dbEnabled);
  return { apiKey, model, enabled, siteUrl: process.env.SITE_URL, siteName: "SurjoSangstha" };
}

export interface AiMessage { role: "system" | "user" | "assistant"; content: string }

/** OpenRouter chat completion — ব্যর্থ হলে null (সিস্টেম থেমে থাকবে না) */
export async function aiChat(messages: AiMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<string | null> {
  const cfg = await aiConfig();
  if (!cfg.enabled || !cfg.apiKey) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        ...(cfg.siteUrl ? { "HTTP-Referer": cfg.siteUrl } : {}),
        "X-Title": cfg.siteName ?? "SurjoSangstha",
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        max_tokens: opts?.maxTokens ?? 350,
        temperature: opts?.temperature ?? 0.3,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn("[AI] OpenRouter error", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 1 ? text : null;
  } catch (e) {
    console.warn("[AI] request failed:", (e as Error).message);
    return null;
  }
}

/** হেল্পডেস্কের প্রশ্নের উত্তর — প্রতিষ্ঠানের প্রসঙ্গ ও নলেজ বেস দিয়ে */
export async function aiHelpdeskAnswer(question: string, kb: { question: string; answer: string }[]): Promise<string | null> {
  const context = kb.slice(0, 25).map((k, i) => `${i + 1}. প্রশ্ন: ${k.question}\n   উত্তর: ${k.answer}`).join("\n");
  return aiChat([
    {
      role: "system",
      content:
        "তুমি SurjoSangstha-র হেল্পডেস্ক সহকারী। প্রতিষ্ঠানটি বাংলাদেশে কিস্তিতে (দৈনিক/সাপ্তাহিক/মাসিক) ও নগদে পণ্য বিক্রি করে; " +
        "অনলাইন অর্ডারে ক্যাশ অন ডেলিভারি প্রযোজ্য, কিস্তি নিতে হলে মাঠ প্রতিনিধির মাধ্যমে নিতে হয়। " +
        "সবসময় সংক্ষিপ্ত, ভদ্র ও সহজ বাংলায় উত্তর দাও (সর্বোচ্চ ৩ বাক্য)। " +
        "নিচের জানা তথ্যের বাইরে কিছু নিশ্চিতভাবে বলবে না — না জানলে বলবে যে একজন প্রতিনিধি শীঘ্রই যোগাযোগ করবেন। " +
        "দাম, স্টক বা তারিখ অনুমান করে বলবে না।" +
        (context ? `\n\nজানা তথ্য:\n${context}` : ""),
    },
    { role: "user", content: question },
  ]);
}
