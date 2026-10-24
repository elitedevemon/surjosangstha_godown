"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, User, ShieldCheck, Eye, EyeOff, Pencil } from "lucide-react";
import { loginAction, registerAction, updateProfileAction } from "@/actions/auth";
import { LocationPicker } from "@/components/location-picker";
import { Field, Modal, Spinner } from "@/components/ui";
import { useToast } from "@/components/providers";
import type { User as DbUser } from "@/db/schema";

export function LoginForm({ next, showDemo = true }: { next?: string; showDemo?: boolean }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await loginAction({ phone, password });
      if (!r.ok) return setError(r.error ?? "Failed");
      router.push(next && next.startsWith("/") ? next : r.redirectTo ?? "/");
      router.refresh();
    });
  };
  const demo = [{ l: "এডমিন", p: "01700000000", pw: "admin123" }, { l: "কর্মী", p: "01711000001", pw: "employee123" }, { l: "কাস্টমার", p: "01811000001", pw: "customer123" }];
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="মোবাইল নম্বর"><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="numeric" /></div></Field>
      <Field label="পাসওয়ার্ড"><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type={show ? "text" : "password"} className="input pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></Field>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</p>}
      <button disabled={pending} className="btn-primary w-full !py-3">{pending ? <Spinner /> : <ShieldCheck className="h-4 w-4" />} নিরাপদে লগইন</button>
      <p className="text-center text-xs text-ink-500">অ্যাকাউন্ট নেই? <Link href="/register" className="font-semibold text-brand-600">রেজিস্টার করুন</Link></p>
      {showDemo && <div className="rounded-2xl border border-dashed border-ink-200 p-3 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">ডেমো অ্যাকাউন্ট (টেস্টিং)</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {demo.map((d) => <button type="button" key={d.l} onClick={() => { setPhone(d.p); setPassword(d.pw); }} className="rounded-xl bg-ink-50 px-2 py-1.5 text-[11px] font-semibold hover:bg-brand-50 hover:text-brand-700 dark:bg-white/5">{d.l}</button>)}
        </div>
      </div>}
    </form>
  );
}

export function RegisterForm() {
  const [f, setF] = useState({ name: "", phone: "", password: "" });
  const [loc, setLoc] = useState({ district: "", upazila: "", union: "", village: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await registerAction({ ...f, ...loc, village: loc.village ?? "" });
      if (!r.ok) return setError(r.error ?? "Failed");
      router.push(r.redirectTo ?? "/account");
      router.refresh();
    });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="পুরো নাম"><div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="মোবাইল নম্বর"><input className="input" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required inputMode="numeric" /></Field>
        <Field label="পাসওয়ার্ড"><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={6} /></Field>
      </div>
      <LocationPicker value={loc} onChange={(v) => setLoc({ ...v, village: v.village ?? "" })} />
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</p>}
      <button disabled={pending} className="btn-primary w-full !py-3">{pending && <Spinner />} অ্যাকাউন্ট তৈরি করুন</button>
      <p className="text-center text-xs text-ink-500">ইতোমধ্যে অ্যাকাউন্ট আছে? <Link href="/login" className="font-semibold text-brand-600">লগইন</Link></p>
    </form>
  );
}

export function ProfileEditor({ user }: { user: DbUser }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState(user.address ?? "");
  const [loc, setLoc] = useState({ district: user.district ?? "", upazila: user.upazila ?? "", union: user.union ?? "", village: user.village ?? "" });
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline !px-3 !py-2 text-xs"><Pencil className="h-3.5 w-3.5" /> প্রোফাইল সম্পাদনা</button>
      <Modal open={open} onClose={() => setOpen(false)} title="প্রোফাইল সম্পাদনা">
        <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateProfileAction({ name, address, password: password || undefined, ...loc, village: loc.village ?? "" }); if (r.ok) { toast({ title: "প্রোফাইল আপডেট হয়েছে", tone: "success" }); setOpen(false); router.refresh(); } else toast({ title: r.error ?? "Failed", tone: "error" }); }); }} className="space-y-3">
          <Field label="নাম"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <LocationPicker value={loc} onChange={(v) => setLoc({ ...v, village: v.village ?? "" })} />
          <Field label="বিস্তারিত ঠিকানা"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <Field label="নতুন পাসওয়ার্ড (ঐচ্ছিক)"><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <button disabled={pending} className="btn-primary w-full">{pending && <Spinner />} সংরক্ষণ</button>
        </form>
      </Modal>
    </>
  );
}
