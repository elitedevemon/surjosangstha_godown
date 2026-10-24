"use client";

import { useEffect, useState } from "react";
import { WifiOff, Search } from "lucide-react";
import { QuickView } from "@/components/store/store-client";
import type { StoreProduct } from "@/lib/queries";
import { formatMoney, INSTALLMENT_LABEL, productImage } from "@/lib/utils";

export default function OfflinePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<StoreProduct | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  useEffect(() => {
    try { const d = JSON.parse(localStorage.getItem("ss_catalog") ?? "null"); if (d) { setProducts(d.products ?? []); setCachedAt(d.cachedAt); } } catch { /* ignore */ }
  }, []);
  const list = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="container-x py-6">
      <div className="rounded-3xl bg-gradient-to-r from-sun-500 to-sun-400 p-5 text-ink-950">
        <p className="flex items-center gap-2 text-sm font-bold"><WifiOff className="h-5 w-5" /> অফলাইন ক্যাটালগ</p>
        <p className="mt-1 text-xs">ইন্টারনেট ছাড়াই সংরক্ষিত পণ্যতালিকা দেখুন। {cachedAt && `সর্বশেষ আপডেট: ${new Date(cachedAt).toLocaleString("en-GB")}`}</p>
      </div>
      <div className="relative mt-4"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-10" placeholder="পণ্য খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 && <p className="py-12 text-center text-sm text-ink-500">এখনো কোনো পণ্য ক্যাশ করা হয়নি। অনলাইনে একবার হোমপেজ খুললেই ক্যাটালগ সংরক্ষিত হবে।</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <button key={p.id} onClick={() => setSel(p)} className="card card-hover overflow-hidden text-left">
            <img src={productImage(p.images)} alt="" className="aspect-[4/3] w-full object-cover" />
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-bold">{p.name}</p>
              <p className="mt-1 text-base font-extrabold">{formatMoney(p.cashPrice)}</p>
              <p className="text-[11px] text-ink-500">{INSTALLMENT_LABEL[p.installmentType].bn} {formatMoney(p.installmentAmount)} • ডাউন {formatMoney(p.downPayment)}</p>
            </div>
          </button>
        ))}
      </div>
      <QuickView p={sel} onClose={() => setSel(null)} />
    </div>
  );
}
