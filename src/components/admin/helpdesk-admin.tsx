"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Headset, Send } from "lucide-react";
import { PageTitle } from "./shell";
import { Badge, Empty, Field } from "@/components/ui";
import { useToast } from "@/components/providers";
import { helpdeskReplyAction } from "@/actions/extra";
import { cn, formatDate } from "@/lib/utils";
import type { HelpdeskThread, HelpdeskMessage, HelpdeskKb } from "@/db/schema";

export function HelpdeskAdmin({ threads, messages, kb }: { threads: HelpdeskThread[]; messages: HelpdeskMessage[]; kb: HelpdeskKb[] }) {
  const sp = useSearchParams();
  const threadParam = Number(sp.get("thread") ?? 0) || null;
  const [sel, setSel] = useState<number | null>(threadParam ?? threads[0]?.id ?? null);
  // নোটিফিকেশনে ক্লিক করলে সংশ্লিষ্ট কনভার্সেশন খুলবে
  useEffect(() => { if (threadParam) setSel(threadParam); }, [threadParam]);
  const [text, setText] = useState("");
  const [kbQ, setKbQ] = useState("");
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [live, setLive] = useState<{ threads: HelpdeskThread[]; messages: HelpdeskMessage[]; kb: HelpdeskKb[] } | null>(null);
  const threadsL = live?.threads ?? threads;
  const messagesL = live?.messages ?? messages;
  const kbL = live?.kb ?? kb;
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/helpdesk", { cache: "no-store" });
        const d = await r.json();
        if (d?.threads) setLive({ threads: d.threads, messages: d.messages ?? [], kb: d.kb ?? [] });
      } catch { /* ignore */ }
    }, 10000);
    return () => clearInterval(id);
  }, []);
  const thread = threadsL.find((t) => t.id === sel) ?? null;
  const msgs = useMemo(() => messagesL.filter((m) => m.threadId === sel), [messagesL, sel]);

  const reply = (saveKb: boolean) => start(async () => {
    if (!thread || !text.trim()) return;
    const r = await helpdeskReplyAction(thread.id, text, saveKb ? { question: kbQ || msgs.find((m) => m.sender === "customer")?.text || thread.name } : undefined);
    toast({ title: r.ok ? "রিপ্লাই পাঠানো হয়েছে" : r.error!, tone: r.ok ? "success" : "error" });
    setText("");
  });

  return (
    <div>
      <PageTitle title="হেল্পডেস্ক" subtitle={`${threadsL.length} টি কনভার্সেশন • ${kbL.length} টি অটো-উত্তর • লাইভ আপডেট চালু`} />
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="card max-h-[70vh] divide-y divide-ink-100 overflow-y-auto dark:divide-white/5">
          {threadsL.length === 0 && <Empty title="কোনো কনভার্সেশন নেই" />}
          {threadsL.map((t) => (
            <button key={t.id} onClick={() => setSel(t.id)} className={cn("block w-full p-3 text-left", sel === t.id && "bg-brand-50 dark:bg-brand-500/10")}>
              <p className="flex items-center justify-between text-sm font-bold">{t.name} <Badge tone={t.status === "open" ? "amber" : t.status === "answered" ? "emerald" : "slate"}>{t.status}</Badge></p>
              <p className="text-[11px] text-ink-500">{t.phone}</p>
              <p className="text-[10px] text-ink-400">{formatDate(t.updatedAt, true)}</p>
            </button>
          ))}
        </div>
        <div className="card flex max-h-[70vh] flex-col">
          {thread ? (
            <>
              <div className="border-b border-ink-100 p-3 dark:border-white/10">
                <p className="text-sm font-bold">{thread.name} • {thread.phone}</p>
                <p className="text-[11px] text-ink-500">{thread.address ?? "ঠিকানা নেই"}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {msgs.map((m) => (
                  <div key={m.id} className={cn("flex gap-2", m.sender === "customer" && "justify-end")}>
                    {m.sender === "admin" && <span className={cn("grid h-7 w-7 place-items-center rounded-full", m.auto ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" : "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300")}>{m.auto ? <Bot className="h-4 w-4" /> : <Headset className="h-4 w-4" />}</span>}
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm", m.sender === "customer" ? "bg-ink-100 dark:bg-white/10" : "bg-brand-600 text-white")}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-ink-100 p-3 dark:border-white/10">
                <textarea className="input" rows={2} placeholder="রিপ্লাই লিখুন..." value={text} onChange={(e) => setText(e.target.value)} />
                <div className="flex flex-wrap items-center gap-2">
                  <button disabled={pending || !text.trim()} onClick={() => reply(false)} className="btn-primary !py-2 text-xs"><Send className="h-3.5 w-3.5" /> রিপ্লাই পাঠান</button>
                  <input className="input !w-56 !py-2 text-xs" placeholder="নলেজ বেস প্রশ্ন (সেভ করলে)" value={kbQ} onChange={(e) => setKbQ(e.target.value)} />
                  <button disabled={pending || !text.trim()} onClick={() => reply(true)} className="btn-outline !py-2 text-xs">রিপ্লাই + KB সেভ</button>
                </div>
              </div>
            </>
          ) : (
            <Empty title="বাম পাশ থেকে কনভার্সেশন বাছুন" />
          )}
        </div>
      </div>
    </div>
  );
}
