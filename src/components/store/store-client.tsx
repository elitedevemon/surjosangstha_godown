"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, ShoppingCart, Menu, X, User, Heart, Star, Flame, Sparkles, Trophy, BadgeCheck, ZoomIn, ChevronLeft, ChevronRight, Minus, Plus, MapPin, ShieldCheck, Truck, Wallet, CalendarClock, Home, LayoutGrid, Phone } from "lucide-react";
import { Badge, Modal } from "@/components/ui";
import { useCart, useToast, useOnline, type CartItem } from "@/components/providers";
import { logoutAction } from "@/actions/auth";
import { NotificationCenter } from "@/components/notifications";
import { cn, formatMoney, INSTALLMENT_LABEL, installmentPlan, productImage } from "@/lib/utils";
import type { StoreProduct } from "@/lib/queries";
import type { Category } from "@/db/schema";
import { SiteLogo } from "@/components/brand";

export interface HeaderUser { id: number; name: string; role: "admin" | "employee" | "customer" }

/** ছোট ব্লিঙ্কিং লাল ডট — টপ-রাইট কর্নারে অফলাইন ইন্ডিকেটর */
export function OfflineDot() {
  const online = useOnline();
  if (online) return null;
  return (
    <span title="আপনি অফলাইনে আছেন — ডাটা অটো সিঙ্ক হবে" className="relative ml-1 inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
    </span>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const [ask, setAsk] = useState(false);
  const router = useRouter();
  return (
    <>
      <button onClick={() => setAsk(true)} className={className ?? "btn-ghost !px-3 !py-2 text-xs"}>লগআউট</button>
      <Modal open={ask} onClose={() => setAsk(false)} title="লগআউট করবেন?" size="sm">
        <p className="text-sm text-ink-500">আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setAsk(false)} className="btn-ghost flex-1">না, থাকছি</button>
          <button onClick={async () => { await logoutAction(); router.push("/"); router.refresh(); }} className="btn-primary flex-1">হ্যাঁ, লগআউট</button>
        </div>
      </Modal>
    </>
  );
}

export function HeaderClient({ user, categories, logo = "/logo.png", siteName = "SurjoSangstha" }: { user: HeaderUser | null; categories: Category[]; logo?: string; siteName?: string }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const dash = user?.role === "admin" ? "/admin" : user?.role === "employee" ? "/employee" : "/account";
  const hideCats = pathname.startsWith("/account");
  const submit = (e: React.FormEvent) => { e.preventDefault(); router.push(`/products?q=${encodeURIComponent(q)}`); setOpen(false); };
  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-brand-900 text-[11px] text-brand-100 sm:block">
        <div className="container-x flex h-8 items-center justify-between">
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-sun-300" /> নিবন্ধিত ও বিশ্বস্ত প্রতিষ্ঠান • দৈনিক / সাপ্তাহিক / মাসিক কিস্তি</p>
          <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> হটলাইন: 01700-000000</p>
        </div>
      </div>
      <div className="glass border-b border-ink-200/60 dark:border-white/10">
        <div className="container-x flex h-16 items-center gap-3">
          <button className="rounded-xl p-2 hover:bg-ink-100 lg:hidden dark:hover:bg-white/10" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-6 w-6" /></button>
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo src={logo} alt={siteName} className="h-10 w-10 rounded-xl drop-shadow-sm transition-transform duration-300 hover:scale-105" />
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-ink-900 dark:text-white">Surjo<span className="text-brand-600">Sangstha</span></p>
              <p className="hidden text-[10px] font-medium text-ink-500 sm:block">সহজ কিস্তিতে বিশ্বস্ত কেনাকাটা</p>
            </div>
          </Link>
          <form onSubmit={submit} className="mx-auto hidden w-full max-w-xl items-center md:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="পণ্য, ব্র্যান্ড বা ক্যাটাগরি খুঁজুন..." className="input rounded-full pl-10 pr-24" />
              <button className="btn-primary absolute right-1 top-1 h-[calc(100%-8px)] rounded-full px-4 py-0 text-xs">খুঁজুন</button>
            </div>
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <OfflineDot />
            {user && <NotificationCenter userId={user.id} role={user.role} compact />}
            <Link href="/cart" className="relative rounded-xl p-2 hover:bg-ink-100 dark:hover:bg-white/10" aria-label="Cart">
              <ShoppingCart className="h-6 w-6" />
              {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sun-500 px-1 text-[10px] font-bold text-ink-950">{count}</span>}
            </Link>
            {user ? (
              <>
                <Link href={dash} className="btn-ghost hidden !px-3 sm:inline-flex"><User className="h-4 w-4" /> {user.name.split(" ")[0]}</Link>
                <LogoutButton className="btn-ghost hidden !px-3 sm:inline-flex" />
              </>
            ) : (
              <Link href="/login" className="btn-primary hidden !px-4 sm:inline-flex">লগইন</Link>
            )}
          </div>
        </div>
        {!hideCats && <div className="h-0.5 w-full bg-gradient-to-r from-brand-600 via-sun-400 to-brand-600 opacity-80 md:hidden" />}
        <div className="container-x flex items-center justify-between gap-2 py-1.5 text-[10px] font-semibold text-ink-500 md:hidden">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-brand-600" /> নিবন্ধিত প্রতিষ্ঠান</span>
          <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-sun-600" /> সারা দেশে ডেলিভারি</span>
          <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-brand-600" /> 01700-000000</span>
        </div>
        {!hideCats && (
        <nav className="container-x flex h-11 items-center gap-1 overflow-x-auto no-scrollbar border-t border-ink-100/70 dark:border-white/5">
          <Link href="/products" className={cn("chip border-transparent", pathname === "/products" ? "bg-brand-600 text-white shadow-sm" : "bg-transparent")}>সব পণ্য</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className={cn("chip border-transparent", pathname === `/category/${c.slug}` ? "bg-brand-600 text-white shadow-sm" : "bg-transparent")}>{c.name}</Link>
          ))}
          <Link href="/products?filter=hot" className="chip ml-auto border-transparent bg-transparent text-rose-600"><Flame className="h-3.5 w-3.5" /> হট ডিল</Link>
          <Link href="/products?installment=daily" className="chip border-transparent bg-transparent">দৈনিক কিস্তি</Link>
        </nav>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84vw] max-w-sm flex-col bg-white p-5 shadow-2xl dark:bg-ink-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><SiteLogo src={logo} className="h-9 w-9 rounded-lg" /><b>{siteName}</b></div>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-ink-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="পণ্য খুঁজুন..." className="input pl-10" />
            </form>
            <div className="mt-5 space-y-1 overflow-y-auto">
              <p className="label">ক্যাটাগরি</p>
              <Link href="/products" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-ink-100 dark:hover:bg-white/10">🛍️ সব পণ্য</Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-ink-100 dark:hover:bg-white/10">{c.name}</Link>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-4 dark:border-white/10">
              <LogoutButton />
              {user ? <Link href={dash} onClick={() => setOpen(false)} className="btn-primary">আমার অ্যাকাউন্ট</Link> : <Link href="/login" onClick={() => setOpen(false)} className="btn-primary">লগইন / রেজিস্টার</Link>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileBottomNav({ user }: { user: HeaderUser | null }) {
  const { count } = useCart();
  const pathname = usePathname();
  const dash = user?.role === "admin" ? "/admin" : user?.role === "employee" ? "/employee" : user ? "/account" : "/login";
  const items = [
    { href: "/", label: "হোম", icon: Home, match: pathname === "/" },
    { href: "/products", label: "পণ্য", icon: LayoutGrid, match: pathname.startsWith("/products") || pathname.startsWith("/category") },
    { href: "/cart", label: "কার্ট", icon: ShoppingCart, match: pathname.startsWith("/cart"), badge: count },
    { href: dash, label: user ? "অ্যাকাউন্ট" : "লগইন", icon: User, match: pathname === dash || pathname.startsWith(dash + "/") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-white/10 dark:bg-ink-900/95">
      <div className="grid grid-cols-4">
        {items.map((i) => (
          <Link key={i.label} href={i.href} aria-current={i.match ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition", i.match ? "text-brand-600 dark:text-brand-300" : "text-ink-500")}>
            {i.match && <span className="absolute -top-px h-0.5 w-10 rounded-full bg-gradient-to-r from-brand-500 to-sun-400" />}
            <i.icon className={cn("h-5 w-5 transition-transform", i.match && "scale-110")} strokeWidth={i.match ? 2.5 : 2} />
            {i.label}
            {i.badge ? <span className="absolute right-[26%] top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun-500 px-1 text-[9px] text-ink-950">{i.badge}</span> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(rating) ? "fill-sun-400 text-sun-400" : "text-ink-300")} />)}
      <span className="ml-1 text-[11px] text-ink-500">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ProductBadges({ p, className }: { p: Pick<StoreProduct, "isHot" | "isNew" | "isBestSeller" | "isFeatured" | "stock">; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {p.isHot && <Badge tone="rose"><Flame className="h-3 w-3" /> Hot</Badge>}
      {p.isBestSeller && <Badge tone="amber"><Trophy className="h-3 w-3" /> Best seller</Badge>}
      {p.isNew && <Badge tone="sky"><Sparkles className="h-3 w-3" /> New</Badge>}
      {p.isFeatured && <Badge tone="violet"><BadgeCheck className="h-3 w-3" /> Featured</Badge>}
      {p.stock <= 0 && <Badge tone="slate">Stock out</Badge>}
    </div>
  );
}

export function toCartItem(p: StoreProduct, qty = 1, color?: string): CartItem {
  return { productId: p.id, slug: p.slug, name: p.name, image: productImage(p.images), price: p.price, cashPrice: p.cashPrice, qty, color, branchId: p.branchId, branchName: p.branchName, installmentType: p.installmentType, downPayment: p.downPayment, installmentAmount: p.installmentAmount, installmentCount: p.installmentCount, stock: p.stock };
}

export function ProductCard({ p }: { p: StoreProduct }) {
  const { add } = useCart();
  const { toast } = useToast();
  const lbl = INSTALLMENT_LABEL[p.installmentType];
  return (
    <div className="card card-hover group relative flex flex-col overflow-hidden">
      <Link href={`/products/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-ink-100 dark:bg-ink-800">
        <img src={productImage(p.images)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {p.images[1] && <img src={p.images[1]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
        <ProductBadges p={p} className="absolute left-2 top-2" />
        <span className="absolute bottom-2 left-2 rounded-full bg-ink-950/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">{lbl.bn} {formatMoney(p.installmentAmount)}{lbl.per}</span>
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{p.categoryName ?? "General"}</p>
        <Link href={`/products/${p.slug}`} className="mt-1 line-clamp-2 text-sm font-bold text-ink-900 hover:text-brand-700 dark:text-white">{p.name}</Link>
        <div className="mt-1.5"><Stars rating={p.rating} /></div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold text-brand-700 dark:text-brand-300">{formatMoney(p.installmentAmount)}<span className="text-xs font-semibold text-ink-500">{lbl.per}</span></p>
            <p className="text-[11px] text-ink-500">ডাউন {formatMoney(p.downPayment)} • মোট {formatMoney(p.price)} ({p.installmentCount} কিস্তি)</p>
          </div>
          <button
            disabled={p.stock <= 0}
            onClick={() => { add(toCartItem(p)); toast({ title: "কার্টে যুক্ত হয়েছে", message: p.name, tone: "success" }); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 disabled:opacity-40"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-ink-400"><MapPin className="h-3 w-3" /> {p.branchName}</p>
      </div>
    </div>
  );
}

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const imgs = images.length ? images : ["/logo.png"];
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [light, setLight] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <div>
      <div ref={ref} onMouseMove={move} onMouseLeave={() => setZoom(null)} onClick={() => setLight(true)} className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl border border-ink-200/70 bg-white dark:border-white/10 dark:bg-ink-800">
        <img src={imgs[idx]} alt={name} className={cn("h-full w-full object-cover transition-opacity", zoom && "opacity-0")} />
        {zoom && <div className="absolute inset-0" style={{ backgroundImage: `url(${imgs[idx]})`, backgroundSize: "220%", backgroundPosition: `${zoom.x}% ${zoom.y}%` }} />}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur"><ZoomIn className="h-3.5 w-3.5" /> জুম করতে হোভার / ক্লিক</span>
        {imgs.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + imgs.length) % imgs.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow opacity-0 transition group-hover:opacity-100 dark:bg-ink-900/90"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % imgs.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow opacity-0 transition group-hover:opacity-100 dark:bg-ink-900/90"><ChevronRight className="h-4 w-4" /></button>
          </>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {imgs.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20", i === idx ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100")}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {light && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/95 p-4" onClick={() => setLight(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"><X className="h-6 w-6" /></button>
          <img src={imgs[idx]} alt={name} className="max-h-[90vh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          {imgs.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {imgs.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }} className={cn("h-2.5 w-2.5 rounded-full", i === idx ? "bg-sun-400" : "bg-white/40")} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InstallmentBox({ p }: { p: Pick<StoreProduct, "price" | "cashPrice" | "downPayment" | "installmentAmount" | "installmentCount" | "installmentType" | "firstInstallmentAfterDays"> }) {
  const plan = installmentPlan(p);
  const lbl = INSTALLMENT_LABEL[p.installmentType];
  const rows = [
    { icon: <Wallet className="h-4 w-4" />, k: "ডাউন পেমেন্ট", v: formatMoney(p.downPayment) },
    { icon: <CalendarClock className="h-4 w-4" />, k: `${lbl.bn} কিস্তি`, v: `${formatMoney(p.installmentAmount)} × ${p.installmentCount}` },
    { icon: <CalendarClock className="h-4 w-4" />, k: "প্রথম কিস্তি", v: `${p.firstInstallmentAfterDays} দিন পর (${plan.firstDue.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })})` },
    { icon: <BadgeCheck className="h-4 w-4" />, k: "মেয়াদ", v: plan.durationLabel },
  ];
  return (
    <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-sun-50 p-5 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-ink-900 dark:to-sun-500/10">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-brand-800 dark:text-brand-300">কিস্তি পরিকল্পনা ({lbl.bn})</p>
        <Badge tone="emerald">মোট {formatMoney(plan.totalPayable)}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {rows.map((r) => (
          <div key={r.k} className="rounded-2xl bg-white/80 p-3 dark:bg-white/5">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">{r.icon}{r.k}</p>
            <p className="mt-1 text-sm font-bold text-ink-900 dark:text-white">{r.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-ink-500"><span>ডাউন পেমেন্ট</span><span>{Math.round((p.downPayment / plan.totalPayable) * 100)}% আগেই পরিশোধ</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sun-400" style={{ width: `${Math.round((p.downPayment / plan.totalPayable) * 100)}%` }} /></div>
      </div>
      <p className="mt-3 text-[11px] text-ink-500">অনলাইনে অর্ডারে ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে পুরো টাকা ({formatMoney(plan.totalPayable)}) পরিশোধ করুন। কিস্তিতে নিতে চাইলে আমাদের প্রতিনিধির সাথে কথা বলুন। কিস্তির হিসাব আমাদের অফিস থেকে আলাদাভাবে রক্ষণাবেক্ষণ করা হয়।</p>
    </div>
  );
}

export function AddToCartPanel({ p }: { p: StoreProduct }) {
  const { add } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(p.colors[0]);
  const addIt = () => { add(toCartItem(p, qty, color)); toast({ title: "কার্টে যুক্ত হয়েছে", message: `${p.name} ×${qty}`, tone: "success" }); };
  return (
    <div className="space-y-4">
      {p.colors.length > 0 && (
        <div>
          <p className="label">রং নির্বাচন</p>
          <div className="flex flex-wrap gap-2">
            {p.colors.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={cn("chip", color === c && "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10")}>
                <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: c.toLowerCase().split(" ")[0] }} /> {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-xl border border-ink-200 dark:border-white/10">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"><Minus className="h-4 w-4" /></button>
          <span className="w-10 text-center text-sm font-bold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="p-2.5"><Plus className="h-4 w-4" /></button>
        </div>
        <span className={cn("text-xs font-semibold", p.stock > p.lowStockAt ? "text-brand-600" : p.stock > 0 ? "text-sun-600" : "text-rose-600")}>
          {p.stock > 0 ? `স্টকে আছে (${p.stock})` : "স্টক নেই"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button disabled={p.stock <= 0} onClick={addIt} className="btn-outline !py-3"><ShoppingCart className="h-4 w-4" /> কার্টে রাখুন</button>
        <button disabled={p.stock <= 0} onClick={() => { addIt(); router.push("/cart"); }} className="btn-sun !py-3">এখনই অর্ডার করুন</button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-ink-500">
        <div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><ShieldCheck className="mx-auto mb-1 h-4 w-4 text-brand-600" />অরিজিনাল পণ্য</div>
        <div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><Truck className="mx-auto mb-1 h-4 w-4 text-brand-600" />হোম ডেলিভারি</div>
        <div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><Heart className="mx-auto mb-1 h-4 w-4 text-brand-600" />ওয়ারেন্টি সাপোর্ট</div>
      </div>
    </div>
  );
}

/** Caches the catalog in localStorage so the storefront can be browsed offline. */
export function CatalogCacher() {
  useEffect(() => {
    if (!navigator.onLine) return;
    const last = Number(localStorage.getItem("ss_catalog_at") ?? 0);
    if (Date.now() - last < 5 * 60 * 1000) return;
    localStorage.setItem("ss_catalog_at", String(Date.now()));
    fetch("/api/store/catalog").then((r) => r.json()).then((d) => localStorage.setItem("ss_catalog", JSON.stringify(d))).catch(() => {});
  }, []);
  return null;
}

export function ProductGrid({ products, empty }: { products: StoreProduct[]; empty?: ReactNode }) {
  if (!products.length) return <>{empty ?? <p className="py-10 text-center text-sm text-ink-500">কোনো পণ্য পাওয়া যায়নি</p>}</>;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}

export function QuickView({ p, onClose }: { p: StoreProduct | null; onClose: () => void }) {
  const open = !!p;
  const content = useMemo(() => p, [p]);
  return (
    <Modal open={open} onClose={onClose} title={content?.name} size="lg">
      {content && (
        <div className="grid gap-5 md:grid-cols-2">
          <ProductGallery images={content.images} name={content.name} />
          <div className="space-y-4">
            <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">{formatMoney(content.installmentAmount)}<span className="text-sm font-semibold text-ink-500">{INSTALLMENT_LABEL[content.installmentType].per}</span> <span className="text-sm font-medium text-ink-500">• মোট {formatMoney(content.price)}</span></p>
            <InstallmentBox p={content} />
            <AddToCartPanel p={content} />
          </div>
        </div>
      )}
    </Modal>
  );
}
