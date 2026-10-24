"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pusher `data-update` ইভেন্ট শুনলে পেজ লাইভ রিফ্রেশ হয় (রিয়েল-টাইম ডাটা)।
 * Pusher কনফিগ না থাকলে নির্ভরযোগ্য ফলব্যাক: ৩০ সেকেন্ড পরপর রিফ্রেশ।
 */
export function LiveRefresh({ channels, pollMs = 45000 }: { channels: string[]; pollMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef(0);
  const [live, setLive] = useState<"pusher" | "polling" | "off">("off");

  useEffect(() => {
    let cancelled = false;
    let pusher: import("pusher-js").default | null = null;
    const subs: import("pusher-js").Channel[] = [];
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - last.current < 2500) return;
      last.current = now;
      router.refresh();
    };

    fetch("/api/realtime-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((cfg: { enabled?: boolean; pusherKey?: string; pusherCluster?: string }) => {
        if (cancelled) return;
        if (!cfg?.enabled) { setLive("polling"); return; }
        import("pusher-js").then(({ default: Pusher }) => {
          if (cancelled) return;
          pusher = new Pusher(cfg.pusherKey!, { cluster: cfg.pusherCluster ?? "" });
          pusher.connection.bind("connected", () => setLive("pusher"));
          pusher.connection.bind("disconnected", () => setLive("polling"));
          channels.forEach((c) => {
            const ch = pusher!.subscribe(c);
            ch.bind("data-update", throttledRefresh);
            subs.push(ch);
          });
        });
      })
      .catch(() => !cancelled && setLive("polling"));

    // Pusher কানেক্টেড থাকলে পোলিং সম্পূর্ণ বন্ধ; লুকানো ট্যাবেও বন্ধ (সার্ভার লোড কমাতে)
    const timer = setInterval(() => {
      if (pusher?.connection?.state === "connected") return;
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      router.refresh();
    }, pollMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
      subs.forEach((ch) => { try { pusher?.unsubscribe(ch.name); } catch { /* ignore */ } });
      pusher?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.join(","), pathname === null]);

  return (
    <span
      title={live === "pusher" ? "Pusher লাইভ কানেক্টেড — ডাটা রিয়েল-টাইম আপডেট হচ্ছে" : live === "polling" ? "পোলিং মোড — ৩০ সেকেন্ড পরপর রিফ্রেশ (Pusher কী সেট করলে লাইভ হবে)" : "কানেক্ট হচ্ছে…"}
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", live === "pusher" ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300")}
    >
      <Radio className={cn("h-3 w-3", live === "pusher" && "animate-pulse")} />
      {live === "pusher" ? "LIVE" : live === "polling" ? "AUTO" : "…"}
    </span>
  );
}
