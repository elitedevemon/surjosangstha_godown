import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FilterPanel } from "./filter-toggle";
import { getStorefront } from "@/lib/queries";
import { ProductGrid } from "./store-client";
import { cn } from "@/lib/utils";

export interface ListingParams {
  q?: string; category?: string; installment?: string; filter?: string; sort?: string; min?: string; max?: string; branch?: string;
}

function buildHref(base: ListingParams, patch: Partial<ListingParams>) {
  const merged = { ...base, ...patch } as Record<string, string | undefined>;
  const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
  return `/products${qs ? `?${qs}` : ""}`;
}

export async function ProductsListing({ params, title }: { params: ListingParams; title?: string }) {
  const s = await getStorefront();
  let list = s.products;
  const cat = params.category ? s.categories.find((c) => c.slug === params.category) : undefined;
  if (cat) list = list.filter((p) => p.categoryId === cat.id);
  if (params.q) { const q = params.q.toLowerCase(); list = list.filter((p) => [p.name, p.brand, p.categoryName, p.description].some((x) => x?.toLowerCase().includes(q))); }
  if (params.installment) list = list.filter((p) => p.installmentType === params.installment);
  if (params.filter === "hot") list = list.filter((p) => p.isHot);
  if (params.filter === "featured") list = list.filter((p) => p.isFeatured);
  if (params.filter === "new") list = list.filter((p) => p.isNew);
  if (params.filter === "best") list = list.filter((p) => p.isBestSeller);
  if (params.branch) list = list.filter((p) => p.branchId === Number(params.branch));
  if (params.min) list = list.filter((p) => p.cashPrice >= Number(params.min));
  if (params.max) list = list.filter((p) => p.cashPrice <= Number(params.max));
  switch (params.sort) {
    case "price_asc": list = [...list].sort((a, b) => a.cashPrice - b.cashPrice); break;
    case "price_desc": list = [...list].sort((a, b) => b.cashPrice - a.cashPrice); break;
    case "best": list = [...list].sort((a, b) => b.soldCount - a.soldCount); break;
    case "rating": list = [...list].sort((a, b) => b.rating - a.rating); break;
    default: list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  const heading = title ?? (cat ? `${cat.icon ?? ""} ${cat.name}` : params.q ? `"${params.q}" এর ফলাফল` : params.filter === "hot" ? "🔥 হট ডিল" : "সব পণ্য");
  const priceRanges = [{ l: "৳৫,০০০ এর নিচে", min: "", max: "5000" }, { l: "৳৫,০০০ – ২০,০০০", min: "5000", max: "20000" }, { l: "৳২০,০০০ – ৪০,০০০", min: "20000", max: "40000" }, { l: "৳৪০,০০০+", min: "40000", max: "" }];
  const sorts = [{ k: "new", l: "নতুন" }, { k: "best", l: "বেস্ট সেলিং" }, { k: "price_asc", l: "দাম: কম → বেশি" }, { k: "price_desc", l: "দাম: বেশি → কম" }, { k: "rating", l: "রেটিং" }];

  const activeCount = [params.category, params.installment, params.filter, params.branch, params.min, params.max].filter(Boolean).length;
  return (
    <div className="container-x py-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-ink-500"><Link href="/" className="hover:text-brand-600">হোম</Link><ChevronRight className="h-3 w-3" /><span>{heading}</span></nav>
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <FilterPanel activeCount={activeCount}>
            <div className="mt-3">
              <p className="label">ক্যাটাগরি</p>
              <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
                <Link href={buildHref(params, { category: undefined })} className={cn("rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-ink-100 dark:hover:bg-white/10", !params.category && "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300")}>সব পণ্য ({s.products.length})</Link>
                {s.categories.map((c) => (
                  <Link key={c.id} href={buildHref(params, { category: c.slug })} className={cn("rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-ink-100 dark:hover:bg-white/10", params.category === c.slug && "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300")}>{c.name} ({c.count})</Link>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="label">কিস্তির ধরন</p>
              <div className="flex flex-wrap gap-1.5">
                {[{ k: "", l: "সব" }, { k: "daily", l: "দৈনিক" }, { k: "weekly", l: "সাপ্তাহিক" }, { k: "monthly", l: "মাসিক" }].map((x) => (
                  <Link key={x.k} href={buildHref(params, { installment: x.k || undefined })} className={cn("chip", (params.installment ?? "") === x.k && "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10")}>{x.l}</Link>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="label">দাম (নগদ)</p>
              <div className="flex flex-wrap gap-1.5 lg:flex-col">
                {priceRanges.map((r) => (
                  <Link key={r.l} href={buildHref(params, { min: r.min || undefined, max: r.max || undefined })} className={cn("rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-ink-100 dark:hover:bg-white/10", (params.min ?? "") === r.min && (params.max ?? "") === r.max && "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300")}>{r.l}</Link>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="label">শাখা</p>
              <div className="flex flex-wrap gap-1.5">
                <Link href={buildHref(params, { branch: undefined })} className={cn("chip", !params.branch && "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10")}>সব</Link>
                {s.branches.map((b) => <Link key={b.id} href={buildHref(params, { branch: String(b.id) })} className={cn("chip", params.branch === String(b.id) && "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10")}>{b.code}</Link>)}
              </div>
            </div>
            <Link href="/products" className="mt-4 block text-center text-xs font-semibold text-rose-500 hover:underline">ফিল্টার মুছুন</Link>
          </FilterPanel>
        </aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-xl font-extrabold sm:text-2xl">{heading}</h1><p className="text-xs text-ink-500">{list.length} টি পণ্য পাওয়া গেছে</p></div>
            <div className="flex flex-wrap gap-1.5">
              {sorts.map((x) => <Link key={x.k} href={buildHref(params, { sort: x.k })} className={cn("chip", (params.sort ?? "new") === x.k && "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10")}>{x.l}</Link>)}
            </div>
          </div>
          <ProductGrid products={list} />
        </div>
      </div>
    </div>
  );
}
