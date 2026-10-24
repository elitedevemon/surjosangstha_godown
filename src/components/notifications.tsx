"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellRing, Volume2, VolumeX, CheckCheck, ShoppingBag, Warehouse, UserPlus, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/providers";
import { markNotificationsRead } from "@/actions/admin";
import { cn, formatDate } from "@/lib/utils";
import { PushToggle } from "@/components/push-toggle";
import type { Notification } from "@/db/schema";

const typeIcon: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="h-4 w-4" />,
  sale: <ShoppingBag className="h-4 w-4" />,
  godown: <Warehouse className="h-4 w-4" />,
  customer: <UserPlus className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
  stock: <AlertTriangle className="h-4 w-4" />,
};

let audioCtx: AudioContext | null = null;
export function playAlert(kind: "order" | "godown" | "soft" = "order") {
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const notes = kind === "order" ? [880, 1174, 1568] : kind === "godown" ? [659, 523, 659] : [740];
    notes.forEach((f, i) => {
      const o = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = audioCtx!.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(audioCtx!.destination);
      o.start(t);
      o.stop(t + 0.32);
    });
  } catch { /* ignore */ }
}

export function NotificationCenter({ userId, role, compact = false }: { userId: number; role: "admin" | "employee" | "customer"; compact?: boolean }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const since = useRef<string | null>(null);
  const seen = useRef<Set<number>>(new Set());
  const pusherLive = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setSound(localStorage.getItem("ss_sound") !== "off");
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    const unlock = () => { audioCtx?.resume(); };
    window.addEventListener("click", unlock, { once: true });
    return () => window.removeEventListener("click", unlock);
  }, []);

  const handleNew = useCallback((fresh: Notification[]) => {
    const novel = fresh.filter((n) => !seen.current.has(n.id));
    if (!novel.length) return;
    novel.forEach((n) => seen.current.add(n.id));
    setItems((s) => [...novel, ...s].slice(0, 50));
    setUnread((u) => u + novel.filter((n) => !n.isRead).length);
    const top = novel[0];
    const kind = (top.data as { sound?: string } | null)?.sound === "godown" ? "godown" : top.type === "order" || top.type === "sale" ? "order" : "soft";
    if (localStorage.getItem("ss_sound") !== "off") playAlert(kind);
    toast({ title: top.title, message: top.message, tone: top.type === "stock" ? "warning" : "success" });
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
      try { new Notification(top.title, { body: top.message, icon: "/logo.png", tag: `ss-${top.id}` }); } catch { /* ignore */ }
    }
    router.refresh();
  }, [router, toast]);

  useEffect(() => {
    let stop = false;
    let first = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      if (stop) return;
      // Pusher লাইভ থাকলে পোলিং লাগে না; ট্যাব লুকানো থাকলেও থেমে থাকে
      const skip = pusherLive.current || document.visibilityState !== "visible" || !navigator.onLine;
      if (!skip) {
        try {
          const q = since.current ? `?since=${encodeURIComponent(since.current)}` : "?limit=25";
          const res = await fetch(`/api/notifications${q}`, { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as { items: Notification[]; unread: number; serverTime: string };
            if (!stop) {
              since.current = data.serverTime;
              if (first) { first = false; data.items.forEach((n) => seen.current.add(n.id)); setItems(data.items); setUnread(data.unread); }
              else if (data.items.length) handleNew(data.items);
            }
          }
        } catch { /* offline */ }
      }
      // অ্যাডাপটিভ ইন্টারভাল: Pusher থাকলে ৬০s (নিছক সেফটি), নাহলে ১৫s; লুকানো ট্যাবে ৬০s
      const delay = pusherLive.current ? 60000 : document.visibilityState === "visible" ? 15000 : 60000;
      timer = setTimeout(tick, delay);
    };
    tick();
    const onVis = () => { if (document.visibilityState === "visible") { if (timer) clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { stop = true; if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [handleNew]);

  // Optional Pusher realtime channel
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    let key = "";
    let cluster = "";
    fetch("/api/realtime-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((cfg: { pusherKey?: string; pusherCluster?: string; enabled?: boolean }) => {
        if (cancelled || !cfg?.enabled) return;
        key = cfg.pusherKey ?? "";
        cluster = cfg.pusherCluster ?? "";
        connectPusher();
      })
      .catch(() => {});
    const connectPusher = () => {
    if (!key || !cluster) return;
    import("pusher-js").then(({ default: Pusher }) => {
      const p = new Pusher(key, { cluster });
      p.connection.bind("connected", () => { pusherLive.current = true; });
      p.connection.bind("disconnected", () => { pusherLive.current = false; });
      p.connection.bind("unavailable", () => { pusherLive.current = false; });
      const chans = [p.subscribe(`user-${userId}`)];
      if (role === "admin") chans.push(p.subscribe("role-admin"));
      chans.forEach((c) => c.bind("notification", (n: Notification) => handleNew([n])));
      cleanup = () => { pusherLive.current = false; p.disconnect(); };
    });
    };
    return () => { cancelled = true; cleanup(); };
  }, [userId, role, handleNew]);

  // একটিতে ক্লিক = সাথে সাথে পড়া (লোকাল + সার্ভার); সঠিক endpoint ব্যবহার
  const markOne = (n: Notification) => {
    if (!n.isRead) {
      setItems((s2) => s2.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
      markNotificationsRead([n.id]).catch(() => {});
    }
  };

  const markAll = async () => {
    setUnread(0);
    setItems((s) => s.map((n) => ({ ...n, isRead: true })));
    await markNotificationsRead();
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem("ss_sound", next ? "on" : "off");
    if (next) playAlert("soft");
  };

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {!compact && (
          <button onClick={toggleSound} title={sound ? "Sound on" : "Sound off"} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-white/10">
            {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        )}
        <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/10" aria-label="Notifications">
          {unread > 0 ? <BellRing className="h-5 w-5 text-brand-600" /> : <Bell className="h-5 w-5" />}
          {unread > 0 && (
            <>
              <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-ring rounded-full bg-rose-500" />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>
            </>
          )}
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[92vw] max-w-sm overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft dark:border-white/10 dark:bg-ink-900">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-white/10">
              <p className="text-sm font-bold">নোটিফিকেশন {unread > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{unread}</span>}</p>
              <div className="flex items-center gap-2">
                {perm === "default" && <button onClick={askPermission} className="text-[11px] font-semibold text-brand-600 hover:underline">ব্রাউজার অ্যালার্ট চালু</button>}
                <button onClick={markAll} className="flex items-center gap-1 text-[11px] font-semibold text-ink-500 hover:text-brand-600"><CheckCheck className="h-3.5 w-3.5" /> সব পড়া</button>
              </div>
            </div>
            <div className="border-b border-ink-100 p-2 dark:border-white/10">
              <PushToggle compact />
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-8 text-center text-xs text-ink-400">কোনো নোটিফিকেশন নেই</p>}
              {items.map((n) => (
                <Link key={n.id} href={n.link ?? "#"} onClick={() => { setOpen(false); markOne(n); }} className={cn("flex gap-3 border-b border-ink-100 px-4 py-3 text-left transition hover:bg-ink-50 dark:border-white/5 dark:hover:bg-white/5", !n.isRead && "bg-brand-50/60 dark:bg-brand-500/5")}>
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", n.type === "stock" ? "bg-sun-100 text-sun-700 dark:bg-sun-500/15" : "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300")}>
                    {typeIcon[n.type] ?? <Bell className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-ink-500 dark:text-ink-300">{n.message}</p>
                    <p className="mt-1 text-[10px] text-ink-400">{formatDate(n.createdAt, true)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
