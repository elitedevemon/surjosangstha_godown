"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus, ShieldCheck, Truck, Wallet, CalendarClock, Info, PartyPopper, Lock } from "lucide-react";
import { useCart, useToast } from "@/components/providers";
import { Field, Modal, Spinner, Badge } from "@/components/ui";
import { LocationPicker } from "@/components/location-picker";
import { placeOrderAction, checkAvailability } from "@/actions/store";
import { cn, formatMoney, INSTALLMENT_LABEL } from "@/lib/utils";
import type { User } from "@/db/schema";
import { SiteLogo } from "@/components/brand";

export function CartCheckout({ user }: { user: User | null }) {
  const isEmployee = user?.role === "employee";
  const { items, setQty, remove, clear } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [loc, setLoc] = useState({ district: user?.district ?? "", upazila: user?.upazila ?? "", union: user?.union ?? "", village: user?.village ?? "" });
  const [address, setAddress] = useState(user?.address ?? "");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string[] | null>(null);
  const [fees, setFees] = useState<{ inn: number; out: number }>({ inn: 0, out: 60 });
  const [avail, setAvail] = useState<Record<number, boolean>>({});

  const subtotal = useMemo(() => items.reduce((a, i) => a + i.price * i.qty, 0), [items]);
  const branchIds = useMemo(() => [...new Set(items.map((i) => i.branchId))], [items]);
  useEffect(() => { fetch("/api/realtime-config", { cache: "no-store" }).then((r) => r.json()).then((c) => setFees({ inn: c.deliveryFeeIn ?? 0, out: c.deliveryFeeOut ?? 60 })).catch(() => {}); }, []);
  useEffect(() => {
    if (!branchIds.length || !loc.district) return;
    const t = setTimeout(() => { checkAvailability({ branchIds, ...loc }).then(setAvail).catch(() => {}); }, 250);
    return () => clearTimeout(t);
  }, [branchIds, loc]);
  const allInside = branchIds.length > 0 && branchIds.every((b) => avail[b] === true);
  const checked = branchIds.length > 0 && branchIds.every((b) => typeof avail[b] === "boolean");
  const fee = checked ? (allInside ? fees.inn : fees.out) : null;
  const total = subtotal + (fee ?? 0);

  const place = () => {
    if (!user) return router.push("/login?next=/cart");
    if (!loc.district || !address) return toast({ title: "ঠিকানা সম্পূর্ণ করুন", tone: "warning" });
    start(async () => {
      try {
        const r = await placeOrderAction({ items: items.map((i) => ({ productId: i.productId, qty: i.qty, color: i.color })), paymentType: "cod", address, notes, ...loc });
        if (!r.ok) return toast({ title: r.error ?? "অর্ডার ব্যর্থ", tone: "error" });
        setDone(r.orderNumbers ?? []);
        clear();
      } catch (e) { toast({ title: (e as Error).message, tone: "error" }); }
    });
  };

  if (!items.length && !done) {
    return (
      <div className="container-x py-16 text-center">
        <SiteLogo className="mx-auto h-20 w-20 rounded-3xl opacity-80" />
        <h1 className="mt-4 text-2xl font-extrabold">আপনার কার্ট খালি</h1>
        <p className="mt-1 text-sm text-ink-500">পছন্দের পণ্য কার্টে যোগ করুন — ক্যাশ অন ডেলিভারিতে নিন, কিস্তিতে নিতে প্রতিনিধিকে বলুন।</p>
        <Link href="/products" className="btn-primary mt-6">পণ্য দেখুন</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-6">
      <h1 className="text-2xl font-extrabold">কার্ট ও চেকআউট</h1>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card divide-y divide-ink-100 dark:divide-white/5">
            {items.map((i) => {
              const lbl = INSTALLMENT_LABEL[i.installmentType];
              return (
                <div key={`${i.productId}-${i.color}`} className="flex gap-3 p-4">
                  <Link href={`/products/${i.slug}`}><img src={i.image} alt="" className="h-20 w-20 rounded-xl object-cover" /></Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/products/${i.slug}`} className="line-clamp-2 text-sm font-bold hover:text-brand-700">{i.name}</Link>
                        <p className="text-[11px] text-ink-500">{i.color && `রং: ${i.color} • `}{i.branchName}</p>
                        <p className="mt-0.5 text-[11px] text-brand-700 dark:text-brand-300">{lbl.bn} {formatMoney(i.installmentAmount)}{lbl.per} × {i.installmentCount} • ডাউন {formatMoney(i.downPayment)}</p>
                      </div>
                      <button onClick={() => remove(i.productId, i.color)} className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-xl border border-ink-200 dark:border-white/10">
                        <button onClick={() => setQty(i.productId, i.qty - 1, i.color)} className="p-1.5"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-bold">{i.qty}</span>
                        <button onClick={() => setQty(i.productId, i.qty + 1, i.color)} className="p-1.5"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="text-right"><p className="text-sm font-extrabold">{formatMoney(i.price * i.qty)}</p><p className="text-[10px] text-ink-400">ডেলিভারিতে পরিশোধ</p></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-extrabold">ডেলিভারি ঠিকানা</h2>
            {!user && <p className="mt-2 rounded-xl bg-sun-50 p-3 text-xs font-semibold text-sun-800 dark:bg-sun-500/10 dark:text-sun-200">অর্ডার করতে <Link href="/login?next=/cart" className="underline">লগইন</Link> বা <Link href="/register" className="underline">রেজিস্টার</Link> করুন।</p>}
            <div className="mt-3"><LocationPicker value={loc} onChange={(v) => setLoc({ ...v, village: v.village ?? "" })} /></div>
            <div className="mt-3"><Field label="বিস্তারিত ঠিকানা"><input className="input" placeholder="বাড়ি / রাস্তা / ল্যান্ডমার্ক" value={address} onChange={(e) => setAddress(e.target.value)} /></Field></div>
            <div className="mt-3"><Field label="নোট (ঐচ্ছিক)"><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-extrabold">পেমেন্ট পদ্ধতি</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-3.5 dark:bg-brand-500/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Truck className="h-5 w-5" /></div>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-bold">ক্যাশ অন ডেলিভারি <Lock className="h-3.5 w-3.5" /></p>
                <p className="text-[11px] text-ink-500">পণ্য হাতে পেয়ে টাকা দিন — অনলাইন অর্ডারে সবসময়</p>
              </div>
              <div className="rounded-2xl border-2 border-ink-200 p-3.5 opacity-60 dark:border-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-white/10"><CalendarClock className="h-5 w-5" /></div>
                <p className="mt-2 text-sm font-bold">কিস্তিতে <span className="badge bg-ink-100 text-ink-500 dark:bg-white/10">শুধু প্রতিনিধি</span></p>
                <p className="text-[11px] text-ink-500">মাঠ প্রতিনিধির মাধ্যমে ডাউন পেমেন্টে</p>
              </div>
              <div className="rounded-2xl border-2 border-ink-200 p-3.5 opacity-60 dark:border-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-white/10"><Wallet className="h-5 w-5" /></div>
                <p className="mt-2 text-sm font-bold">নগদ <span className="badge bg-ink-100 text-ink-500 dark:bg-white/10">শুধু প্রতিনিধি</span></p>
                <p className="text-[11px] text-ink-500">প্রতিনিধির কাছ থেকে নগদ মূল্যে</p>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-[11px] text-ink-500 dark:bg-white/5"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> অনলাইনে অর্ডারে পেমেন্ট হয় ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে পুরো টাকা পরিশোধ করবেন। কিস্তিতে কিনতে চাইলে আমাদের মাঠ প্রতিনিধির সাথে কথা বলুন, তিনি ডাউন পেমেন্ট নিয়ে পণ্য দেবেন।</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-5">
            <h2 className="text-base font-extrabold">অর্ডার সারাংশ</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">পণ্য</dt><dd className="font-semibold">{items.reduce((a, i) => a + i.qty, 0)} টি</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">সাবটোটাল</dt><dd className="font-semibold">{formatMoney(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">ডেলিভারি ফি</dt><dd className={cn("font-semibold", fee === 0 ? "text-brand-600" : "")}>{fee === null ? "ঠিকানা দিলে দেখাবে" : fee === 0 ? "ফ্রি (সার্ভিস এলাকা)" : formatMoney(fee)}</dd></div>
              {checked && !allInside && <p className="text-[10px] text-sun-700 dark:text-sun-300">আপনার এলাকা সার্ভিস এলাকার বাইরে — তাই বাইরের রেট প্রযোজ্য</p>}
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base dark:border-white/10"><dt className="font-bold">মোট (ডেলিভারিতে পরিশোধ)</dt><dd className="font-extrabold">{formatMoney(total)}</dd></div>
            </dl>
            <div className="mt-3"><Badge tone="sky"><Truck className="h-3 w-3" /> ক্যাশ অন ডেলিভারি</Badge></div>
            <button onClick={place} disabled={pending || !items.length || isEmployee} className="btn-sun mt-4 w-full !py-3.5 text-base disabled:cursor-not-allowed">{pending ? <Spinner /> : <ShieldCheck className="h-5 w-5" />} {isEmployee ? "কর্মী অ্যাকাউন্টে অর্ডার করা যায় না" : user ? "অর্ডার নিশ্চিত করুন" : "লগইন করে অর্ডার করুন"}</button>
            <p className="mt-3 text-center text-[11px] text-ink-400">{isEmployee ? "কর্মীরা নিজের জন্য অনলাইন অর্ডার করতে পারেন না — মাঠে কাস্টমারের অর্ডার এন্ট্রি দিন (কর্মী প্যানেল → বিক্রয় এন্ট্রি)।" : "অর্ডার করার পর আমাদের প্রতিনিধি ফোনে যোগাযোগ করে নিশ্চিত করবেন। পণ্য হাতে পেয়ে টাকা পরিশোধ করবেন।"}</p>
          </div>
        </aside>
      </div>

      <Modal open={!!done} onClose={() => router.push("/account")} title={<span className="flex items-center gap-2"><PartyPopper className="h-5 w-5 text-sun-500" /> অর্ডার সফল হয়েছে!</span>} size="sm">
        <p className="text-sm text-ink-600 dark:text-ink-300">আপনার অর্ডার নম্বর:</p>
        <div className="mt-2 flex flex-wrap gap-2">{done?.map((n) => <span key={n} className="rounded-xl bg-brand-50 px-3 py-1.5 font-mono text-sm font-bold text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">{n}</span>)}</div>
        <p className="mt-3 text-xs text-ink-500">এডমিন অর্ডারটি যাচাই করে গ্রহণ করলে আপনি নোটিফিকেশন পাবেন। পণ্য হাতে পেয়ে ডেলিভারিম্যানকে টাকা দিবেন। অর্ডারের অবস্থা আপনার অ্যাকাউন্টে দেখতে পারবেন।</p>
        <Link href="/account" className="btn-primary mt-4 w-full">আমার অর্ডার দেখুন</Link>
      </Modal>
    </div>
  );
}
