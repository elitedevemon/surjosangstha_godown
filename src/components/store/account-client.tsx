"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, KeyRound, IdCard, Package, Clock, CheckCircle2, XCircle, Eye, Star, MapPin, Phone, CalendarDays, User as UserIcon, Truck, ShieldAlert, BellRing } from "lucide-react";
import { Avatar, Badge, Modal, Field } from "@/components/ui";
import { useToast } from "@/components/providers";
import { uploadAvatarAction, resetPasswordAction, submitReviewAction } from "@/actions/extra";
import { LogoutButton } from "./store-client";
import { PushToggle } from "@/components/push-toggle";
import { cn, formatMoney, formatDate, ORDER_TYPE_LABEL, STATUS_LABEL, INSTALLMENT_LABEL, areaLabel } from "@/lib/utils";
import type { User, Order, OrderItem } from "@/db/schema";

type OrderView = Order & { branchName: string; employeeName: string | null; items: OrderItem[] };

export function AccountClient({ user, orders, reviewed, isDefaultPassword = false }: { user: User; orders: OrderView[]; reviewed: Record<number, boolean>; isDefaultPassword?: boolean }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwOpen, setPwOpen] = useState(false);
  const [detail, setDetail] = useState<OrderView | null>(null);
  const [reviewFor, setReviewFor] = useState<{ order: OrderView; productId: number; productName: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // pending first, then rest by date desc
  const sorted = [...orders].sort((a, b) => (a.status === "pending" ? -1 : b.status === "pending" ? 1 : b.createdAt.getTime() - a.createdAt.getTime()));
  const count = (s: string) => orders.filter((o) => o.status === s).length;

  const upload = (f: File) => {
    const rd = new FileReader();
    rd.onload = () => start(async () => {
      const r = await uploadAvatarAction(String(rd.result));
      toast({ title: r.ok ? "প্রোফাইল ছবি আপডেট হয়েছে" : r.error!, tone: r.ok ? "success" : "error" });
    });
    rd.readAsDataURL(f);
  };

  const doReset = () => start(async () => {
    const r = await resetPasswordAction(pw);
    toast({ title: r.ok ? "পাসওয়ার্ড বদলানো হয়েছে" : r.error!, tone: r.ok ? "success" : "error" });
    if (r.ok) { setPw({ current: "", next: "" }); setPwOpen(false); }
  });

  const doReview = () => start(async () => {
    if (!reviewFor) return;
    const r = await submitReviewAction({ orderId: reviewFor.order.id, productId: reviewFor.productId, rating, comment });
    toast({ title: r.ok ? "রিভিউ জমা হয়েছে — এডমিন অনুমোদনের পর স্টোরফ্রন্টে দেখাবে" : r.error!, tone: r.ok ? "success" : "error" });
    if (r.ok) { setReviewFor(null); setComment(""); setRating(5); }
  });

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-brand-800 via-brand-600 to-sun-500">
          <div className="absolute inset-0 sun-grid opacity-30" />
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <p className="absolute bottom-3 right-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Customer Profile</p>
        </div>
        <div className="grid gap-5 px-5 pb-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center gap-4 md:block">
            <div className="relative -mt-10 shrink-0 md:-mt-12">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-3xl border-4 border-white object-cover shadow-lg dark:border-ink-900 md:h-24 md:w-24" />
              ) : (
                <div className="rounded-3xl border-4 border-white shadow-lg dark:border-ink-900"><Avatar name={user.name} size="lg" /></div>
              )}
              <button onClick={() => fileRef.current?.click()} title="প্রোফাইল ছবি আপলোড / বদলান" aria-label="ছবি আপলোড" className="absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white shadow-lg ring-2 ring-white transition hover:scale-110 dark:ring-ink-900">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </div>
            <div className="md:hidden">
              <h1 className="text-lg font-extrabold leading-tight">{user.name}</h1>
              {user.uniqueId && <Badge tone="brand"><IdCard className="h-3 w-3" /> {user.uniqueId}</Badge>}
            </div>
          </div>
          <div className="min-w-0">
            <div className="hidden md:block">
              <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {user.uniqueId && <Badge tone="brand"><IdCard className="h-3 w-3" /> আইডি: {user.uniqueId}</Badge>}
                <Badge tone="emerald"><CheckCircle2 className="h-3 w-3" /> ভেরিফাইড কাস্টমার</Badge>
              </div>
            </div>
            <ul className="mt-3 grid gap-1.5 text-xs text-ink-600 sm:grid-cols-2 dark:text-ink-300">
              <li className="flex min-w-0 items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ink-100 dark:bg-white/10"><Phone className="h-3.5 w-3.5" /></span><span className="truncate font-semibold">{user.phone}</span></li>
              <li className="flex min-w-0 items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ink-100 dark:bg-white/10"><CalendarDays className="h-3.5 w-3.5" /></span><span className="truncate">সদস্য: {formatDate(user.createdAt)}</span></li>
              <li className="flex min-w-0 items-center gap-2 sm:col-span-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ink-100 dark:bg-white/10"><MapPin className="h-3.5 w-3.5" /></span><span className="truncate">{[user.village, areaLabel(user)].filter(Boolean).join(", ") || "ঠিকানা যোগ করুন"}</span></li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
            <button onClick={() => setPwOpen(true)} className="btn-ghost justify-center !px-3 !py-2 text-xs"><KeyRound className="h-3.5 w-3.5" /> পাসওয়ার্ড বদলান</button>
            <LogoutButton className="btn-ghost justify-center !px-3 !py-2 text-xs" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-ink-100 bg-ink-100 sm:grid-cols-4 dark:border-white/10 dark:bg-white/10">
          {[
            { l: "মোট অর্ডার", v: orders.length, i: Package, c: "text-brand-600" },
            { l: "পেন্ডিং", v: count("pending"), i: Clock, c: "text-sun-600" },
            { l: "গৃহীত/ডেলিভার্ড", v: count("accepted") + count("delivered"), i: CheckCircle2, c: "text-emerald-600" },
            { l: "বাতিল", v: count("rejected") + count("cancelled"), i: XCircle, c: "text-rose-500" },
          ].map((st) => (
            <div key={st.l} className="flex items-center gap-3 bg-white px-4 py-3 transition hover:bg-ink-50 dark:bg-ink-900 dark:hover:bg-ink-800/60">
              <st.i className={cn("h-5 w-5 shrink-0", st.c)} />
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-none">{st.v}</p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-ink-500">{st.l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isDefaultPassword && (
        <div className="card flex flex-wrap items-center gap-3 border-sun-300 bg-sun-50/60 p-4 dark:border-sun-500/30 dark:bg-sun-500/10">
          <ShieldAlert className="h-6 w-6 shrink-0 text-sun-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-sun-800 dark:text-sun-200">আপনার পাসওয়ার্ড এখনো ডিফল্ট: <code className="rounded bg-white/70 px-1 dark:bg-white/10">customer123</code></p>
            <p className="text-xs text-sun-700 dark:text-sun-300">নিরাপত্তার জন্য এখনই নিজের পাসওয়ার্ড সেট করে নিন।</p>
          </div>
          <button onClick={() => setPwOpen(true)} className="btn-sun !px-3 !py-2 text-xs"><KeyRound className="h-3.5 w-3.5" /> পাসওয়ার্ড বদলান</button>
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-200"><BellRing className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">ডিভাইসে পুশ নোটিফিকেশন</p>
          <p className="text-xs text-ink-500">কম্পিউটার, Android বা iPhone (হোম স্ক্রিনে যোগ করা PWA) — অ্যাপ বন্ধ থাকলেও অর্ডার আপডেট পৌঁছাবে।</p>
        </div>
        <div className="w-full sm:w-72"><PushToggle /></div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="section-title mb-3">আমার অর্ডারসমূহ <span className="text-sm font-normal text-ink-400">(পেন্ডিং আগে)</span></h2>
        <div className="space-y-3">
          {sorted.length === 0 && <div className="card p-8 text-center text-sm text-ink-400">এখনো কোনো অর্ডার নেই</div>}
          {sorted.map((o) => (
            <div key={o.id} className={cn("card p-4", o.status === "pending" && "border-sun-300 bg-sun-50/40 dark:border-sun-500/30 dark:bg-sun-500/5")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold">{o.orderNumber}</span>
                <Badge tone={STATUS_LABEL[o.status].tone}>{STATUS_LABEL[o.status].bn}</Badge>
                <Badge tone="sky">{ORDER_TYPE_LABEL[o.type].bn}</Badge>
                <span className="text-[11px] text-ink-400">{formatDate(o.createdAt, true)} • {o.branchName}</span>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setDetail(o)} className="btn-ghost !px-3 !py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> বিস্তারিত</button>
                </div>
              </div>
              <div className="mt-3 divide-y divide-ink-100 dark:divide-white/5">
                {o.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 py-2">
                    <img src={i.image ?? "/logo.png"} className="h-11 w-11 rounded-xl object-cover" alt="" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{i.productName}</p><p className="text-[11px] text-ink-500">{i.quantity} × {formatMoney(i.unitPrice)}</p></div>
                    {o.status === "delivered" && i.productId != null && !reviewed[i.productId] && (
                      <button onClick={() => setReviewFor({ order: o, productId: i.productId!, productName: i.productName })} className="btn-outline !px-3 !py-1.5 text-xs"><Star className="h-3.5 w-3.5" /> রিভিউ দিন</button>
                    )}
                    {i.productId != null && reviewed[i.productId] && <Badge tone="emerald">রিভিউ দেওয়া হয়েছে</Badge>}
                    <b className="text-sm">{formatMoney(i.lineTotal)}</b>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                <span>মোট <b className="text-ink-900 dark:text-white">{formatMoney(o.total)}</b></span>
                {o.deliveryFee > 0 && <span>ডেলিভারি ফি {formatMoney(o.deliveryFee)}</span>}
                {o.type === "installment" && o.installmentType && <span>ডাউন {formatMoney(o.downPayment)} + {formatMoney(o.installmentAmount)} × {o.installmentCount} ({INSTALLMENT_LABEL[o.installmentType].bn})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password modal */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="পাসওয়ার্ড রিসেট" size="sm">
        <div className="space-y-3">
          <Field label="বর্তমান পাসওয়ার্ড"><input type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="নতুন পাসওয়ার্ড"><input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <button disabled={pending || !pw.current || pw.next.length < 6} onClick={doReset} className="btn-primary w-full">{pending ? "হচ্ছে..." : "পাসওয়ার্ড বদলান"}</button>
        </div>
      </Modal>

      {/* Order detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={<span className="font-mono">{detail?.orderNumber}</span>} size="lg">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-1.5"><Badge tone={STATUS_LABEL[detail.status].tone}>{STATUS_LABEL[detail.status].bn}</Badge><Badge tone="sky">{ORDER_TYPE_LABEL[detail.type].bn}</Badge><Badge tone="slate">{detail.branchName}</Badge></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-ink-50 p-3 dark:bg-white/5">
                <p className="flex items-center gap-1.5 font-bold"><CalendarDays className="h-4 w-4 text-brand-600" /> কেনার তারিখ</p>
                <p className="mt-1 text-xs text-ink-500">{formatDate(detail.createdAt, true)}</p>
                <p className="mt-2 flex items-center gap-1.5 font-bold"><UserIcon className="h-4 w-4 text-brand-600" /> কার কাছ থেকে</p>
                <p className="mt-1 text-xs text-ink-500">{detail.employeeName ? `মাঠ প্রতিনিধি: ${detail.employeeName}` : "অনলাইন অর্ডার — শাখা থেকে ডেলিভারি"}</p>
              </div>
              <div className="rounded-2xl bg-ink-50 p-3 dark:bg-white/5">
                <p className="font-bold">পেমেন্ট</p>
                <p className="mt-1 text-xs text-ink-500">মোট {formatMoney(detail.total)} • পরিশোধিত {formatMoney(detail.paidAmount)}</p>
                {detail.type === "installment" && detail.installmentType && <p className="mt-1 text-xs text-ink-500">ডাউন {formatMoney(detail.downPayment)}; কিস্তি {formatMoney(detail.installmentAmount)} × {detail.installmentCount} ({INSTALLMENT_LABEL[detail.installmentType].bn})</p>}
                {detail.deliveryFee > 0 && <p className="mt-1 text-xs text-ink-500">ডেলিভারি ফি {formatMoney(detail.deliveryFee)}</p>}
              </div>
            </div>
            <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-white/5 dark:border-white/10">
              {detail.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3">
                  <img src={i.image ?? "/logo.png"} className="h-11 w-11 rounded-xl object-cover" alt="" />
                  <div className="flex-1"><p className="text-sm font-semibold">{i.productName}</p><p className="text-[11px] text-ink-500">{i.quantity} × {formatMoney(i.unitPrice)}</p></div>
                  <b>{formatMoney(i.lineTotal)}</b>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-ink-500"><Truck className="h-4 w-4" /> ডেলিভারি ঠিকানা: {[detail.village, detail.union, detail.upazila, detail.district, detail.address].filter(Boolean).join(", ")}</p>
            {detail.adminNote && <p className="rounded-xl bg-sun-50 p-2 text-xs text-sun-800 dark:bg-sun-500/10 dark:text-sun-200">এডমিন নোট: {detail.adminNote}</p>}
          </div>
        )}
      </Modal>

      {/* Review modal */}
      <Modal open={!!reviewFor} onClose={() => setReviewFor(null)} title={`রিভিউ: ${reviewFor?.productName}`} size="sm">
        <div className="space-y-3">
          <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setRating(i)}><Star className={cn("h-6 w-6", i <= rating ? "fill-sun-400 text-sun-400" : "text-ink-300")} /></button>)}</div>
          <Field label="আপনার অভিজ্ঞতা"><textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="পণ্য ও সার্ভিস কেমন ছিল?" /></Field>
          <button disabled={pending || comment.trim().length < 4} onClick={doReview} className="btn-primary w-full">রিভিউ জমা দিন</button>
        </div>
      </Modal>
    </div>
  );
}
