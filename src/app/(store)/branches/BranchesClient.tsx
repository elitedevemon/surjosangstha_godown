"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Building2 } from "lucide-react";
import type { Branch, ServiceArea } from "@/db/schema";
import { LogoMark } from "@/components/brand";
import { areaLabel } from "@/lib/utils";

type Area = ServiceArea;

interface Props {
  branches: Branch[];
  areas: Area[];
  feeIn: number;
  feeOut: number;
}

export default function BranchesPage({ branches, areas, feeIn, feeOut }: Props) {
  const [q, setQ] = useState("");
  return (
    <div className="container-x py-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-ink-500"><Link href="/" className="hover:text-brand-600">হোম</Link><span>/</span><span>শাখা ও সার্ভিস এলাকা</span></nav>
      <h1 className="section-title">আমাদের শাখা ও সার্ভিস এলাকা</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">নিচের এলাকাগুলোতে আমাদের প্রতিনিধি সরাসরি বাড়িতে গিয়ে পণ্য দেয় ও কিস্তি সেবা দেন। আপনার এলাকা তালিকায় থাকলে কিস্তি, নগদ ও COD সব পাওয়া যায়।</p>
      <div className="mt-4"><input className="input max-w-md" placeholder="আপনার জেলা/উপজেলা লিখে দেখুন আপনার এলাকা আছে কি না..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.filter((b) => !q || [b.name, b.district, b.upazila].some((x) => x?.toLowerCase().includes(q.toLowerCase())) || areas.some((a) => a.branchId === b.id && [a.district, a.upazila, a.union].some((x) => x?.toLowerCase().includes(q.toLowerCase())))).map((b) => (
          <div key={b.id} className="card overflow-hidden">
            <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-white"><MapPin className="h-8 w-8 opacity-80" /><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.upazila ?? b.district ?? ""}, Bangladesh`)}`} className="absolute bottom-2 right-2 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-semibold backdrop-blur">ম্যাপে দেখুন →</a></div>
            <div className="p-5">
              <div className="flex items-start gap-3"><LogoMark className="h-12 w-12" /><div><p className="flex items-center gap-2 text-base font-extrabold"><Building2 className="h-4 w-4 text-brand-600" /> {b.name}</p><p className="text-xs text-ink-500">{b.address} &bull; {b.phone}</p></div></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {areas.filter((a) => a.branchId === b.id).slice(0, 8).map((a) => <span key={a.id} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><MapPin className="h-3 w-3" /> {areaLabel(a)}</span>)}
                {areas.filter((a) => a.branchId === b.id).length > 8 && <span className="badge bg-ink-100 text-ink-600 dark:bg-white/10">+{areas.filter((a) => a.branchId === b.id).length - 8}</span>}
                {areas.filter((a) => a.branchId === b.id).length === 0 && <span className="badge bg-sun-50 text-sun-700 dark:bg-sun-500/15 dark:text-sun-200">এই শাখার এখনো এলাকা যোগ হয়নি — শুধু COD (ফি ৳{feeOut})</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><p className="font-bold">{b.code}</p><p className="text-ink-400">শাখা</p></div>
                <div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><p className="font-bold">{areas.filter((a) => a.branchId === b.id).length}</p><p className="text-ink-400">এলাকা</p></div>
                <div className="rounded-xl bg-ink-50 p-2 dark:bg-white/5"><p className="font-bold">৳{feeIn}</p><p className="text-ink-400">ভিতরে ডেলিভারি</p></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <AreaChecker areas={areas} />
    </div>
  );
}

function AreaChecker({ areas }: { areas: Area[] }) {
  const [d, setD] = useState("");
  const [u, setU] = useState("");
  const [uni, setUni] = useState("");
  const match = areas.filter((a) => {
    if (a.district?.toLowerCase() !== d.toLowerCase()) return false;
    if (u && a.upazila?.toLowerCase() !== u.toLowerCase()) return false;
    if (uni && a.union?.toLowerCase() !== uni.toLowerCase()) return false;
    return true;
  });
  const branches = [...new Set(match.map((a) => a.branchId))];
  return (
    <div className="card mt-8 overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">কিস্তি এলাকা চেক করুন</p>
          <h2 className="mt-2 text-2xl font-extrabold">আপনার এলাকায় কিস্তি পাওয়া যায়?</h2>
          <p className="mt-2 text-sm text-brand-100">তলের ফর্মে জেলা, উপজেলা ও ইউনিয়ন দিন। স্বয়ংক্রিয়ভাবে যাচাই করে দেওয়া হবে।</p>
          <div className="mt-5 flex gap-6">
            <div><p className="text-3xl font-extrabold">{branches.length || areas.length}</p><p className="text-xs text-brand-200">শাখা</p></div>
            <div><p className="text-3xl font-extrabold">{areas.length}</p><p className="text-xs text-brand-200">সার্ভিস এলাকা</p></div>
          </div>
        </div>
        <div className="p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input" placeholder="জেলা" value={d} onChange={(e) => setD(e.target.value)} />
            <input className="input" placeholder="উপজেলা (ঐচ্ছিক)" value={u} onChange={(e) => setU(e.target.value)} />
            <input className="input" placeholder="ইউনিয়ন (ঐচ্ছিক)" value={uni} onChange={(e) => setUni(e.target.value)} />
          </div>
          {match.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">&#10003; হ্যাঁ! এই এলাকায় কিস্তি সেবা আছে — {branches.length} টি শাখা থেকে সেবা পাওয়া যাবে:</p>
              <div className="flex flex-wrap gap-2">
                {match.slice(0, 10).map((a) => <span key={a.id} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><MapPin className="h-3 w-3" /> {areaLabel(a)}</span>)}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">এলাকা দিয়ে যাচাই করুন — তালিকায় না থাকলে ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন।</p>
          )}
        </div>
      </div>
    </div>
  );
}
