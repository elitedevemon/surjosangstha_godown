"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Upload, X, ImagePlus, PackagePlus, Star, FileDown } from "lucide-react";
import { Modal, Field, Badge, Spinner, Empty } from "@/components/ui";
import { useToast } from "@/components/providers";
import { saveProduct, deleteProduct, adjustStock, type ProductInput } from "@/actions/admin";
import { PageTitle } from "./shell";
import { formatMoney, INSTALLMENT_LABEL, productImage, cn } from "@/lib/utils";
import { exportPdf } from "@/lib/pdf";
import type { Branch, Category, Product } from "@/db/schema";

type Row = Product & { categoryName: string | null; branchName: string };

const blank = (branchId: number): ProductInput => ({
  branchId, categoryId: null, name: "", sku: "", brand: "", description: "", price: 0, cashPrice: 0, minSellPrice: null, installmentType: "monthly", downPayment: 0,
  installmentAmount: 0, installmentCount: 0, firstInstallmentAfterDays: 30, stock: 0, lowStockAt: 5, images: [], colors: [], specs: [], warranty: "",
  isFeatured: false, isHot: false, isBestSeller: false, isNew: true, isActive: true,
});

export function ProductManager({ products, branches, categories, branchId, focus }: { products: Row[]; branches: Branch[]; categories: Category[]; branchId: number | null; focus?: number }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductInput | null>(null);
  const [stockFor, setStockFor] = useState<Row | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const list = useMemo(() => products
    .filter((p) => !q || [p.name, p.brand, p.sku, p.categoryName, p.branchName].some((x) => x?.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.stock <= a.lowStockAt ? 0 : 1) - (b.stock <= b.lowStockAt ? 0 : 1) || a.stock - b.stock), [products, q]);
  const sp = useSearchParams();
  const focusId = Number(sp.get("focus") ?? focus ?? 0) || undefined;
  // নোটিফিকেশনে ক্লিক → সেই পণ্যের ডিটেইল/এডিট মডাল (একই পেজে থাকলেও কাজ করবে)
  useEffect(() => {
    if (!focusId) return;
    const fp = products.find((x) => x.id === focusId);
    if (fp) edit(fp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, products]);

  const edit = (p: Row) => setEditing({ id: p.id, branchId: p.branchId, categoryId: p.categoryId, name: p.name, sku: p.sku ?? "", brand: p.brand ?? "", description: p.description ?? "", price: p.price, cashPrice: p.cashPrice, minSellPrice: p.minSellPrice, installmentType: p.installmentType, downPayment: p.downPayment, installmentAmount: p.installmentAmount, installmentCount: p.installmentCount, firstInstallmentAfterDays: p.firstInstallmentAfterDays, stock: p.stock, lowStockAt: p.lowStockAt, images: p.images, colors: p.colors, specs: p.specs, warranty: p.warranty ?? "", isFeatured: p.isFeatured, isHot: p.isHot, isBestSeller: p.isBestSeller, isNew: p.isNew, isActive: p.isActive });
  const del = (p: Row) => { if (!confirm(`"${p.name}" মুছে ফেলবেন?`)) return; start(async () => { const r = await deleteProduct(p.id); toast({ title: r.ok ? "পণ্য মুছে ফেলা হয়েছে" : r.error!, tone: r.ok ? "success" : "error" }); router.refresh(); }); };
  const pdf = () => exportPdf({ title: "Product & Stock List", subtitle: branchId ? branches.find((b) => b.id === branchId)?.name : "All branches", filename: "products", tables: [{ title: `${list.length} products`, columns: ["SKU", "Name", "Branch", "Category", "Cash", "Installment", "Plan", "Stock", "Sold"], rows: list.map((p) => [p.sku ?? "", p.name, p.branchName, p.categoryName ?? "", p.cashPrice, p.price, `${p.downPayment} + ${p.installmentAmount}x${p.installmentCount} ${p.installmentType}`, p.stock, p.soldCount]) }] });

  return (
    <div>
      <PageTitle title="পণ্য ব্যবস্থাপনা" subtitle={`${products.length} টি পণ্য • মোট স্টক ${products.reduce((a, p) => a + p.stock, 0)}`} action={
        <div className="flex gap-2">
          <button onClick={pdf} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> PDF</button>
          <button onClick={() => setEditing(blank(branchId ?? branches[0]?.id))} className="btn-primary"><Plus className="h-4 w-4" /> নতুন পণ্য</button>
        </div>
      } />
      <div className="card">
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-3 dark:border-white/10">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="নাম, ব্র্যান্ড, SKU..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {list.length === 0 ? <div className="p-6"><Empty title="কোনো পণ্য নেই" action={<button onClick={() => setEditing(blank(branchId ?? branches[0]?.id))} className="btn-primary">পণ্য যোগ করুন</button>} /></div> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>পণ্য</th><th>শাখা</th><th>ক্যাটাগরি</th><th>নগদ / কিস্তি</th><th>কিস্তি প্ল্যান</th><th>স্টক</th><th>বিক্রি</th><th>ফ্ল্যাগ</th><th></th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className={cn(!p.isActive && "opacity-50")}>
                    <td><div className="flex items-center gap-3"><img src={productImage(p.images)} className="h-11 w-11 rounded-xl object-cover" alt="" /><div><p className="font-bold">{p.name}</p><p className="text-[10px] text-ink-400">{p.sku} • {p.images.length} ছবি • {p.colors.join(", ")}</p></div></div></td>
                    <td><Badge tone="slate">{p.branchName}</Badge></td>
                    <td className="text-xs">{p.categoryName ?? "-"}</td>
                    <td><p className="font-bold">{formatMoney(p.cashPrice)}</p><p className="text-[10px] text-ink-400">{formatMoney(p.price)}</p></td>
                    <td className="text-xs">ডাউন {formatMoney(p.downPayment)}<br /><span className="text-ink-500">{formatMoney(p.installmentAmount)} × {p.installmentCount} {INSTALLMENT_LABEL[p.installmentType].bn}</span></td>
                    <td><button onClick={() => setStockFor(p)} className={cn("rounded-lg px-2 py-1 text-xs font-bold", p.stock <= p.lowStockAt ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15" : "bg-brand-100 text-brand-700 dark:bg-brand-500/15")}>{p.stock}</button></td>
                    <td className="text-xs font-semibold">{p.soldCount}</td>
                    <td><div className="flex flex-wrap gap-1">{p.isFeatured && <Badge tone="violet">F</Badge>}{p.isHot && <Badge tone="rose">Hot</Badge>}{p.isBestSeller && <Badge tone="amber">Best</Badge>}{p.isNew && <Badge tone="sky">New</Badge>}</div></td>
                    <td><div className="flex gap-1"><button onClick={() => edit(p)} className="rounded-lg p-1.5 hover:bg-ink-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button><button onClick={() => del(p)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <ProductForm value={editing} branches={branches} categories={categories} onClose={() => setEditing(null)} />}
      <StockModal p={stockFor} onClose={() => setStockFor(null)} />
      {pending && <div className="fixed bottom-4 left-4 z-50 rounded-xl bg-ink-900 px-3 py-2 text-xs text-white"><Spinner className="mr-2" />প্রসেস হচ্ছে...</div>}
    </div>
  );
}

function StockModal({ p, onClose }: { p: Row | null; onClose: () => void }) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Modal open={!!p} onClose={onClose} title={`স্টক সমন্বয় — ${p?.name ?? ""}`} size="sm">
      <p className="text-sm text-ink-500">বর্তমান স্টক: <b className="text-ink-900 dark:text-white">{p?.stock}</b></p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="পরিমাণ (+ যোগ / - বাদ)"><input type="number" className="input" value={delta} onChange={(e) => setDelta(Number(e.target.value))} /></Field>
        <Field label="কারণ"><input className="input" placeholder="নতুন চালান / ক্ষতি" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </div>
      <button disabled={pending || !delta} onClick={() => start(async () => { const r = await adjustStock(p!.id, delta, reason); toast({ title: r.ok ? "স্টক আপডেট হয়েছে" : r.error!, tone: r.ok ? "success" : "error" }); router.refresh(); onClose(); setDelta(0); })} className="btn-primary mt-4 w-full">{pending && <Spinner />} আপডেট</button>
    </Modal>
  );
}

function ProductForm({ value, branches, categories, onClose }: { value: ProductInput; branches: Branch[]; categories: Category[]; onClose: () => void }) {
  const [f, setF] = useState<ProductInput>(value);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((s) => ({ ...s, [k]: v }));
  const num = (k: keyof ProductInput) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append("files", file));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = (await res.json()) as { urls: string[] };
      set("images", [...f.images, ...d.urls]);
      toast({ title: `${d.urls.length} টি ছবি আপলোড হয়েছে`, tone: "success" });
    } catch { toast({ title: "আপলোড ব্যর্থ", tone: "error" }); } finally { setUploading(false); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveProduct({ ...f, colors: f.colors.map((c) => c.trim()).filter(Boolean), specs: f.specs.filter((s) => s.key) });
      toast({ title: r.ok ? "পণ্য সংরক্ষিত হয়েছে" : r.error!, tone: r.ok ? "success" : "error" });
      if (r.ok) { router.refresh(); onClose(); }
    });
  };
  const totalPlan = f.downPayment + f.installmentAmount * f.installmentCount;
  return (
    <Modal open onClose={onClose} title={f.id ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ"} size="xl">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="শাখা *"><select className="input" value={f.branchId} onChange={(e) => set("branchId", Number(e.target.value))}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label="ক্যাটাগরি"><select className="input" value={f.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}><option value="">— নির্বাচন —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></Field>
          <Field label="SKU"><input className="input" value={f.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
          <Field label="পণ্যের নাম *" className="sm:col-span-2"><input className="input" required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="ব্র্যান্ড"><input className="input" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
          <Field label="বিবরণ" className="sm:col-span-3"><textarea className="input" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
        </div>

        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
          <p className="mb-3 text-sm font-bold text-brand-800 dark:text-brand-200">মূল্য ও কিস্তি সেটআপ</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="নগদ মূল্য (৳) *"><input type="number" className="input" required min={0} value={f.cashPrice} onChange={num("cashPrice")} /></Field>
            <Field label="কিস্তিতে মোট মূল্য (৳) *"><input type="number" className="input" required min={0} value={f.price} onChange={num("price")} /></Field>
            <Field label="সর্বনিম্ন বিক্রয় মূল্য" hint="কর্মী এর নিচে বিক্রি করতে পারবে না"><input type="number" className="input" min={0} value={f.minSellPrice ?? ""} onChange={(e) => set("minSellPrice", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="কিস্তির ধরন"><select className="input" value={f.installmentType} onChange={(e) => set("installmentType", e.target.value as ProductInput["installmentType"])}><option value="daily">দৈনিক</option><option value="weekly">সাপ্তাহিক</option><option value="monthly">মাসিক</option></select></Field>
            <Field label="ডাউন পেমেন্ট (৳)"><input type="number" className="input" min={0} value={f.downPayment} onChange={num("downPayment")} /></Field>
            <Field label="প্রতি কিস্তির পরিমাণ (৳)"><input type="number" className="input" min={0} value={f.installmentAmount} onChange={num("installmentAmount")} /></Field>
            <Field label="কিস্তির সংখ্যা"><input type="number" className="input" min={0} value={f.installmentCount} onChange={num("installmentCount")} /></Field>
            <Field label="প্রথম কিস্তি (দিন পর)"><input type="number" className="input" min={0} value={f.firstInstallmentAfterDays} onChange={num("firstInstallmentAfterDays")} /></Field>
          </div>
          <p className={cn("mt-2 text-xs font-semibold", totalPlan === f.price ? "text-brand-700" : "text-sun-700")}>ডাউন + কিস্তি = {formatMoney(totalPlan)} {totalPlan !== f.price && `(কিস্তির মোট মূল্য ${formatMoney(f.price)} এর সাথে মিলছে না)`}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="স্টক পরিমাণ"><input type="number" className="input" min={0} value={f.stock} onChange={num("stock")} /></Field>
          <Field label="কম স্টক সতর্কতা"><input type="number" className="input" min={0} value={f.lowStockAt} onChange={num("lowStockAt")} /></Field>
          <Field label="রং (কমা দিয়ে)"><input className="input" placeholder="Red, Black" value={f.colors.join(", ")} onChange={(e) => set("colors", e.target.value.split(","))} /></Field>
          <Field label="ওয়ারেন্টি"><input className="input" value={f.warranty} onChange={(e) => set("warranty", e.target.value)} /></Field>
        </div>

        <div>
          <p className="label">পণ্যের ছবি (একাধিক)</p>
          <div className="flex flex-wrap gap-2">
            {f.images.map((src, i) => (
              <div key={src + i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-ink-200 dark:border-white/10">
                <img src={src} className="h-full w-full object-cover" alt="" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-sun-500 px-1 text-[9px] font-bold text-ink-950"><Star className="inline h-2.5 w-2.5" /> main</span>}
                <button type="button" onClick={() => set("images", f.images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-rose-600 p-0.5 text-white opacity-0 transition group-hover:opacity-100"><X className="h-3 w-3" /></button>
                {i > 0 && <button type="button" onClick={() => { const arr = [...f.images]; [arr[0], arr[i]] = [arr[i], arr[0]]; set("images", arr); }} className="absolute bottom-0 inset-x-0 bg-ink-950/70 py-0.5 text-[9px] text-white opacity-0 transition group-hover:opacity-100">main করুন</button>}
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-300 text-[10px] font-semibold text-ink-500 hover:border-brand-500 hover:text-brand-600 dark:border-white/20">
              {uploading ? <Spinner /> : <Upload className="h-5 w-5" />} আপলোড
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          </div>
          <div className="mt-2 flex gap-2">
            <input className="input" placeholder="অথবা ছবির URL পেস্ট করুন" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
            <button type="button" onClick={() => { if (urlInput) { set("images", [...f.images, urlInput.trim()]); setUrlInput(""); } }} className="btn-ghost shrink-0"><ImagePlus className="h-4 w-4" /> যোগ</button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between"><p className="label">স্পেসিফিকেশন</p><button type="button" onClick={() => set("specs", [...f.specs, { key: "", value: "" }])} className="text-xs font-semibold text-brand-600">+ যোগ করুন</button></div>
          <div className="space-y-2">
            {f.specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" placeholder="যেমন: Capacity" value={s.key} onChange={(e) => set("specs", f.specs.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                <input className="input" placeholder="252 Litre" value={s.value} onChange={(e) => set("specs", f.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <button type="button" onClick={() => set("specs", f.specs.filter((_, j) => j !== i))} className="rounded-xl p-2 text-rose-500 hover:bg-rose-50"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 rounded-2xl bg-ink-50 p-4 dark:bg-white/5">
          {([["isFeatured", "ফিচার্ড"], ["isHot", "হট সেলিং"], ["isBestSeller", "বেস্ট সেলার"], ["isNew", "নতুন"], ["isActive", "সক্রিয় (স্টোরে দেখাবে)"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f[k]} onChange={(e) => set(k, e.target.checked)} /> {l}</label>
          ))}
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-ghost">বাতিল</button><button disabled={pending} className="btn-primary">{pending ? <Spinner /> : <PackagePlus className="h-4 w-4" />} সংরক্ষণ</button></div>
      </form>
    </Modal>
  );
}
