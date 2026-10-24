"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User as UserIcon, Headset, MapPin, Phone, User, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers";

type Msg = { id: number; sender: "customer" | "admin"; text: string; auto?: boolean; createdAt: string };

const LS_KEY = "ss_helpdesk_v1";
const SEEN_KEY = "ss_helpdesk_seen_v1";
const WEEK = 7 * 86400000;

/** বাংলা ডিজিট (০-৯) → ইংরেজি, ফাঁকা/ড্যাশ বাদ — যাতে ভ্যালিডেশন কখনো নিঃশব্দে আটকে না থাকে */
function normPhone(v: string) {
  const bn = "০১২৩৪৫৬৭৮৯";
  const mapped = v
    .split("")
    .map((ch) => (bn.includes(ch) ? String(bn.indexOf(ch)) : ch))
    .join("");
  return mapped.replace(/[^\d]/g, "").slice(0, 11);
}
const phoneOk = (p: string) => /^01\d{9}$/.test(p);

function loadLocal(phone: string): Msg[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { phone: string; at: number; messages: Msg[] };
    if (Date.now() - data.at > WEEK) { localStorage.removeItem(LS_KEY); return null; }
    if (data.phone !== phone) return null;
    return data.messages;
  } catch { return null; }
}
function saveLocal(phone: string, messages: Msg[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ phone, at: Date.now(), messages })); } catch { /* ignore */ }
}
function lastSeenId() { return Number(localStorage.getItem(SEEN_KEY) ?? 0); }
function setLastSeen(id: number) { try { localStorage.setItem(SEEN_KEY, String(id)); } catch { /* ignore */ } }

const SUGGESTIONS = ["ডেলিভারি চার্জ কত?", "কিস্তি কিভাবে নিব?", "আমার অর্ডার কোথায়?"];

export function HelpdeskWidget({ user }: { user: { id: number; name: string; phone: string } | null }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState(false);
  const [started, setStarted] = useState(!!user);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, open]);

  // এডমিনের অপঠিত রিপ্লাই গোনা — আইকনে লাল ডট ব্লিঙ্ক করবে
  useEffect(() => {
    const seen = lastSeenId();
    const count = messages.filter((m) => m.sender === "admin" && m.id > seen).length;
    setUnread(open ? 0 : count);
    if (open && messages.length) setLastSeen(messages[messages.length - 1].id);
  }, [messages, open]);

  // রিয়েল-টাইম: খোলা থাকলে ৪ সেকেন্ড পরপর নতুন মেসেজ (রিফ্রেশ লাগে না)
  useEffect(() => {
    if (!started || !phone) return;
    const id = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/helpdesk?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
        const d = await r.json();
        if (d?.messages?.length) {
          setMessages((prev) => (d.messages.length !== prev.length || d.messages[d.messages.length - 1]?.id !== prev[prev.length - 1]?.id ? d.messages : prev));
          saveLocal(phone, d.messages);
        }
      } catch { /* offline */ }
    }, open ? 5000 : 20000);
    return () => clearInterval(id);
  }, [open, started, phone]);

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("ss:open-helpdesk", openIt);
    return () => window.removeEventListener("ss:open-helpdesk", openIt);
  }, []);

  const load = async (ph: string) => {
    try {
      const local = loadLocal(ph);
      const r = await fetch(`/api/helpdesk?phone=${encodeURIComponent(ph)}`, { cache: "no-store" });
      const d = await r.json();
      const server: Msg[] = d.messages ?? [];
      setMessages(server.length ? server : local ?? []);
      if (server.length || local?.length) setStarted(true);
    } catch {
      const local = loadLocal(ph);
      if (local) setMessages(local);
    }
  };

  useEffect(() => { if (user) { setPhone(user.phone); setName(user.name); setStarted(true); load(user.phone); } }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setTouched(true);
    if (!name.trim() || !phoneOk(phone) || !address.trim()) return;
    setStarting(true);
    setStarted(true);
    await load(phone);
    setStarting(false);
  };

  const send = async (raw?: string) => {
    const t = (raw ?? text).trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/helpdesk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, name, address, text: t }) });
      const d = await r.json();
      if (d.ok) { setMessages(d.messages ?? []); saveLocal(phone, d.messages ?? []); setStarted(true); }
      else toast({ title: "মেসেজ পাঠানো যায়নি", message: d.error ?? "আবার চেষ্টা করুন", tone: "error" });
    } catch {
      // অফলাইনেও কিউ করে রাখা হয় — পরে পাঠানো যায়
      const local = loadLocal(phone) ?? [];
      const queued = [...local, { id: Date.now(), sender: "customer" as const, text: t, createdAt: new Date().toISOString() }];
      saveLocal(phone, queued);
      setMessages(queued);
      toast({ title: "অফলাইনে সংরক্ষিত", message: "ইন্টারনেট এলে অটো পাঠানো হবে", tone: "warning" });
    }
    setText(""); setBusy(false);
  };

  const clear = () => {
    try { localStorage.removeItem(LS_KEY); localStorage.removeItem(SEEN_KEY); } catch { /* ignore */ }
    setMessages([]);
    setUnread(0);
    setText("");
    if (!user) { setStarted(false); setTouched(false); }
    toast({ title: "চ্যাট মুছে ফেলা হয়েছে", message: "সার্ভারে সংরক্ষিত ইতিহাস এডমিনের কাছে থাকবে", tone: "info" });
  };

  const nameErr = touched && !name.trim() ? "আপনার নাম লিখুন" : "";
  const phoneErr = touched && !phoneOk(phone) ? "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)" : "";
  const addrErr = touched && !address.trim() ? "সংক্ষেপে ঠিকানা লিখুন" : "";
  const canStart = name.trim().length > 0 && phoneOk(phone) && address.trim().length > 0;

  return (
    <>
      <button
        aria-label="হেল্পডেস্ক খুলুন"
        title="হেল্পডেস্ক — মেসেজ করুন"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-4 z-[75] flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 py-3 pl-4 pr-5 text-sm font-bold text-white shadow-2xl ring-1 ring-white/20 transition hover:scale-105 active:scale-95 md:bottom-6 md:right-4"
      >
        {open ? <X className="h-5 w-5" /> : <Headset className="h-5 w-5" />}
        <span>{open ? "বন্ধ করুন" : "সাহায্য"}</span>
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center" aria-label={`${unread} টি নতুন রিপ্লাই`}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-[13.5rem] right-4 z-[76] flex max-h-[min(66vh,540px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-2xl md:bottom-40 md:right-4 dark:border-white/10 dark:bg-ink-900">
          <div className="flex items-center gap-2 bg-brand-700 p-4 text-white">
            <Headset className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-extrabold">হেল্পডেস্ক</p>
              <p className="truncate text-[11px] opacity-80">সাধারণ প্রশ্নের উত্তর সাথে সাথে, নাহলে এডমিন রিপ্লাই দেবেন</p>
            </div>
            <button onClick={clear} title="চ্যাট মুছুন" className="ml-auto shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold opacity-80 hover:bg-white/10">মুছুন</button>
          </div>

          {!started ? (
            <div className="space-y-3 overflow-y-auto p-4">
              <p className="rounded-xl bg-ink-50 p-2.5 text-xs leading-relaxed text-ink-600 dark:bg-white/5 dark:text-ink-300">
                মেসেজ শুরু করতে আপনার <b>নাম, মোবাইল নম্বর ও ঠিকানা</b> দিন। লগইন করা থাকলে তথ্য অটো বসে যায়।
              </p>
              <label className="block">
                <span className="label flex items-center gap-1"><User className="h-3 w-3" /> আপনার নাম</span>
                <input className={cn("input", nameErr && "border-rose-400")} placeholder="যেমন: রহিম উদ্দিন" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
                {nameErr && <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3" /> {nameErr}</span>}
              </label>
              <label className="block">
                <span className="label flex items-center gap-1"><Phone className="h-3 w-3" /> মোবাইল নম্বর</span>
                <input type="tel" inputMode="numeric" className={cn("input", phoneErr && "border-rose-400")} placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(normPhone(e.target.value))} onBlur={() => setTouched(true)} />
                {phoneErr ? <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3" /> {phoneErr}</span>
                  : phone && <span className="mt-1 block text-[11px] text-ink-400">{phone.length}/11 ডিজিট</span>}
              </label>
              <label className="block">
                <span className="label flex items-center gap-1"><MapPin className="h-3 w-3" /> ঠিকানা</span>
                <input className={cn("input", addrErr && "border-rose-400")} placeholder="গ্রাম / থানা / জেলা" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => setTouched(true)} />
                {addrErr && <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertCircle className="h-3 w-3" /> {addrErr}</span>}
              </label>
              <button disabled={!canStart || starting} onClick={start} className="btn-primary w-full !py-3 disabled:cursor-not-allowed">
                <MessageCircle className="h-4 w-4" /> {starting ? "খোলা হচ্ছে…" : "মেসেজ শুরু করুন"}
              </button>
              {!canStart && touched && <p className="text-center text-[11px] font-semibold text-sun-700 dark:text-sun-300">উপরের তিনটি ঘর সঠিকভাবে পূরণ করলে বাটন চালু হবে</p>}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <div className="space-y-2 p-2 text-center">
                    <p className="text-xs text-ink-400">আপনার প্রশ্ন লিখুন, অথবা এসব সাধারণ প্রশ্ন থেকে বেছে নিন:</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {SUGGESTIONS.map((q) => (
                        <button key={q} onClick={() => send(q)} className="chip border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
                          <Sparkles className="h-3 w-3" /> {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex gap-2", m.sender === "customer" && "justify-end")}>
                    {m.sender === "admin" && <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", m.auto ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" : "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300")}>{m.auto ? <Bot className="h-4 w-4" /> : <Headset className="h-4 w-4" />}</span>}
                    <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.sender === "customer" ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-white/10")}>
                      {m.text}
                      {m.auto && <p className="mt-1 text-[10px] opacity-70">— অটো উত্তর (নলেজ বেস)</p>}
                    </div>
                    {m.sender === "customer" && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200"><UserIcon className="h-4 w-4" /></span>}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex gap-2 border-t border-ink-100 p-3 dark:border-white/10">
                <input className="input" placeholder="মেসেজ লিখুন… (Enter পাঠান)" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
                <button onClick={() => send()} disabled={busy || !text.trim()} title="মেসেজ পাঠান" className="btn-primary shrink-0 !px-3 disabled:cursor-not-allowed"><Send className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
