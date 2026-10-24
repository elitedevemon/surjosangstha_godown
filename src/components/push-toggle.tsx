"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff, Loader2, Smartphone } from "lucide-react";
import { useToast } from "@/components/providers";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type PushState = "unsupported" | "off" | "on" | "busy" | "denied" | "no-vapid";

/**
 * Web Push সাবস্ক্রিপশন টগল — PC, Android (Chrome) ও iOS (Safari 16.4+ PWA)।
 * ব্যাকগ্রাউন্ডে/ট্যাব বন্ধ থাকলেও ডিভাইসে নোটিফিকেশন পৌঁছাবে।
 */
export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<PushState>("off");
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return setState("unsupported");
    const cfg = await fetch("/api/push/vapid", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (!cfg?.configured) return setState("no-vapid");
    const perm = Notification.permission;
    if (perm === "denied") return setState("denied");
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription().catch(() => null);
    setState(sub ? "on" : perm === "granted" ? "off" : "off");
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // অটো-রিসাবস্ক্রাইব: পারমিশন আগে থেকে দেওয়া থাকলে (যেমন অন্য ডিভাইস/সেশন) নিঃশব্দে সাবস্ক্রিপশন সার্ভারে সেভ হয়
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission !== "granted") return;
      try {
        const cfg = await fetch("/api/push/vapid", { cache: "no-store" }).then((r) => r.json());
        if (!cfg?.configured) return;
        const reg = await navigator.serviceWorker.ready;
        const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) }));
        await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...sub.toJSON(), userAgent: navigator.userAgent }) });
        setState("on");
      } catch { /* ignore */ }
    })();
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      const cfg = await fetch("/api/push/vapid", { cache: "no-store" }).then((r) => r.json());
      if (!cfg?.configured) { setState("no-vapid"); return toast({ title: "VAPID কী সেট করা নেই", message: "instructions.md অনুযায়ী VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY সেট করুন", tone: "warning" }); }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return toast({ title: "নোটিফিকেশন পারমিশন দেওয়া হয়নি", message: "ব্রাউজার সাইট সেটিংস থেকে Allow করুন", tone: "warning" }); }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) }));
      await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      setState("on");
      toast({ title: "পুশ নোটিফিকেশন চালু ✅", message: "অ্যাপ বন্ধ থাকলেও এই ডিভাইসে নোটিফিকেশন পাবেন", tone: "success" });
    } catch {
      setState("off");
      toast({ title: "পুশ চালু করা যায়নি", message: "HTTPS এবং সাপোর্টেড ব্রাউজার প্রয়োজন", tone: "error" });
    }
  };

  const disable = async () => {
    setState("busy");
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription().catch(() => null);
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    setState("off");
    toast({ title: "পুশ নোটিফিকেশন বন্ধ", tone: "info" });
  };

  const label: Record<PushState, string> = {
    unsupported: "এই ব্রাউজারে পুশ সাপোর্ট নেই",
    "no-vapid": "সার্ভারে VAPID কী সেট নেই",
    denied: "ব্রাউজারে নোটিফিকেশন ব্লকড",
    off: "পুশ নোটিফিকেশন চালু করুন",
    on: "পুশ নোটিফিকেশন চালু আছে",
    busy: "একটু অপেক্ষা করুন…",
  };

  return (
    <button
      onClick={state === "on" ? disable : state === "busy" ? undefined : enable}
      disabled={state === "busy" || state === "unsupported"}
      title={label[state]}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
        state === "on" ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : state === "denied" || state === "no-vapid" ? "bg-sun-50 text-sun-800 dark:bg-sun-500/10 dark:text-sun-200" : "bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-white/10 dark:text-ink-100",
        compact && "!py-1.5",
      )}
    >
      {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "on" ? <BellRing className="h-4 w-4" /> : state === "denied" ? <BellOff className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
      <span className="min-w-0 flex-1 truncate">{label[state]}</span>
      {state === "on" && <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" /><span className="relative h-2 w-2 rounded-full bg-brand-600" /></span>}
    </button>
  );
}
