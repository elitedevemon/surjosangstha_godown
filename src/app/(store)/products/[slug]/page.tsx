import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, ShieldCheck, Store, CheckCircle2, Info, Truck } from "lucide-react";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getStorefront } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { ProductGallery, InstallmentBox, AddToCartPanel, ProductBadges, Stars, ProductGrid } from "@/components/store/store-client";
import { BudgetPlanner } from "@/components/store/budget-planner";
import { Badge } from "@/components/ui";
import { formatMoney, formatDate, INSTALLMENT_LABEL, isInsideServiceArea, areaLabel } from "@/lib/utils";
import { mapEmbedUrl } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [s, user] = await Promise.all([getStorefront(), getCurrentUser()]);
  const p = s.products.find((x) => x.slug === slug);
  if (!p) notFound();
  void db.update(products).set({ views: sql`${products.views} + 1` }).where(eq(products.id, p.id)).catch(() => {});
  const branch = s.branches.find((b) => b.id === p.branchId);
  const areas = s.areas.filter((a) => a.branchId === p.branchId);
  const inside = user ? isInsideServiceArea(user, areas) : null;
  const related = s.products.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 4);
  const lbl = INSTALLMENT_LABEL[p.installmentType];
  const approvedReviews = await db.select().from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt)).limit(8);
  return (
    <div className="container-x py-6">
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">হোম</Link><ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-brand-600">পণ্য</Link><ChevronRight className="h-3 w-3" />
        {p.categorySlug && <><Link href={`/category/${p.categorySlug}`} className="hover:text-brand-600">{p.categoryName}</Link><ChevronRight className="h-3 w-3" /></>}
        <span className="text-ink-800 dark:text-ink-200">{p.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={p.images} name={p.name} />
        <div>
          <ProductBadges p={p} />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
            <Stars rating={p.rating} /><span>•</span><span>{p.soldCount} বার বিক্রি</span><span>•</span><span>{p.views} ভিউ</span>
            {p.brand && <><span>•</span><span>ব্র্যান্ড: <b className="text-ink-800 dark:text-ink-200">{p.brand}</b></span></>}
            {p.sku && <><span>•</span><span>SKU: {p.sku}</span></>}
          </div>
          <div className="mt-5 rounded-3xl bg-ink-50 p-5 dark:bg-white/5">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">কিস্তির রেট</p><p className="text-4xl font-extrabold text-brand-700 dark:text-brand-300">{formatMoney(p.installmentAmount)}<span className="text-base font-bold text-ink-500">{lbl.per}</span></p></div>
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">ডাউন পেমেন্ট</p><p className="text-2xl font-extrabold">{formatMoney(p.downPayment)}</p></div>
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">মোট ({p.installmentCount} কিস্তি)</p><p className="text-2xl font-extrabold">{formatMoney(p.price)}</p></div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-500"><Truck className="h-3.5 w-3.5 text-brand-600" /> অনলাইনে অর্ডারে ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে {formatMoney(p.price)} পরিশোধ। কিস্তিতে নিতে প্রতিনিধিকে বলুন।</p>
          </div>
          <div className="mt-5"><InstallmentBox p={p} /></div>
          <div className="mt-5"><AddToCartPanel p={p} /></div>

          <div className="mt-6 rounded-3xl border border-ink-200/70 p-5 dark:border-white/10">
            <p className="flex items-center gap-2 text-sm font-bold"><Store className="h-4 w-4 text-brand-600" /> {branch?.name} <Badge tone="slate">{branch?.code}</Badge></p>
            <p className="mt-1 text-xs text-ink-500">{branch?.address} • {branch?.phone}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-500">কিস্তি / নগদ সার্ভিস এলাকা</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{areas.map((a) => <span key={a.id} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><MapPin className="h-3 w-3" /> {areaLabel(a)}</span>)}</div>
            {user ? (
              inside ? (
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-xs font-semibold text-brand-800 dark:bg-brand-500/10 dark:text-brand-200"><CheckCircle2 className="h-4 w-4" /> সুখবর! আপনার এলাকায় ({areaLabel(user)}) এই পণ্যটি কিস্তি ও নগদে পাওয়া যাবে।</p>
              ) : (
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-sun-50 p-3 text-xs font-semibold text-sun-800 dark:bg-sun-500/10 dark:text-sun-200"><Info className="h-4 w-4" /> আপনার এলাকা ({areaLabel(user) || "ঠিকানা দিন"}) কিস্তি সার্ভিসের বাইরে — ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন।</p>
              )
            ) : (
              <p className="mt-3 text-xs text-ink-500"><Link href="/login" className="font-semibold text-brand-600 underline">লগইন</Link> করলে আপনার এলাকায় কিস্তি সুবিধা আছে কিনা দেখতে পারবেন।</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-extrabold">পণ্যের বিবরণ</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600 dark:text-ink-300">{p.description}</p>
          {p.specs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold">স্পেসিফিকেশন</h3>
              <dl className="mt-2 divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-white/5 dark:border-white/10">
                {p.specs.map((sp) => <div key={sp.key} className="flex justify-between px-4 py-2.5 text-sm"><dt className="text-ink-500">{sp.key}</dt><dd className="font-semibold">{sp.value}</dd></div>)}
                {p.warranty && <div className="flex justify-between px-4 py-2.5 text-sm"><dt className="text-ink-500">ওয়ারেন্টি</dt><dd className="font-semibold">{p.warranty}</dd></div>}
                {p.colors.length > 0 && <div className="flex justify-between px-4 py-2.5 text-sm"><dt className="text-ink-500">রং</dt><dd className="font-semibold">{p.colors.join(", ")}</dd></div>}
              </dl>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <iframe title="map" src={mapEmbedUrl(`${branch?.upazila ?? ""} ${branch?.district ?? ""}`)} className="h-56 w-full border-0" loading="lazy" />
            <p className="p-3 text-xs text-ink-500">{branch?.name} — {branch?.district}</p>
          </div>
          <div className="card p-5 text-sm">
            <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-brand-600" /> কেন SurjoSangstha?</p>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-500">
              <li>✔ স্বচ্ছ কিস্তি — কোনো লুকানো চার্জ নেই</li><li>✔ আসল পণ্য, ব্র্যান্ড ওয়ারেন্টি</li><li>✔ আমাদের প্রতিনিধি বাড়িতে গিয়ে সেবা দেন</li><li>✔ {s.branches.length} শাখা, {s.areas.length}+ সার্ভিস এলাকা</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Savings calculator */}
      <div className="card mt-10 overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-200">এক নজরে</p>
            <h2 className="mt-2 text-2xl font-extrabold">কিস্তির হিসাব</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase text-brand-200">প্রতি কিস্তি</p><p className="text-2xl font-extrabold">{formatMoney(p.installmentAmount)}<span className="text-xs">{INSTALLMENT_LABEL[p.installmentType].per}</span></p></div>
              <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase text-brand-200">কিস্তি সংখ্যা</p><p className="text-2xl font-extrabold">{p.installmentCount}</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase text-brand-200">ডাউন পেমেন্ট</p><p className="text-2xl font-extrabold">{formatMoney(p.downPayment)}</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase text-brand-200">মোট ব্যয়</p><p className="text-2xl font-extrabold">{formatMoney(p.price)}</p></div>
            </div>
            <p className="mt-4 text-xs text-brand-100">ডাউন পেমেন্ট দিয়েই শুরু, বাকি {INSTALLMENT_LABEL[p.installmentType].bn} কিস্তিতে দিন। অনলাইনে অর্ডার করলে ক্যাশ অন ডেলিভারিতে পুরো টাকা ডেলিভারির সময়।</p>
          </div>
          <div className="p-7">
            <h2 className="text-lg font-extrabold">আপনার বাজেট অনুযায়ী পরিকল্পনা</h2>
            <BudgetPlanner price={p.price} cash={p.cashPrice} down={p.downPayment} amt={p.installmentAmount} count={p.installmentCount} itype={p.installmentType} />
          </div>
        </div>
      </div>

      {/* Reviews (approved by admin) */}
      <div className="mt-10">
        <h2 className="section-title mb-4">কাস্টমার রিভিউ ({approvedReviews.length})</h2>
        {approvedReviews.length === 0 ? <p className="rounded-2xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400 dark:border-white/10">এই পণ্যে এখনো কোনো রিভিউ নেই — ডেলিভারির পর আপনি প্রোফাইল থেকে রিভিউ দিতে পারবেন।</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {approvedReviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-bold">{r.customerName}</p><Stars rating={r.rating} /></div>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">“{r.comment}”</p>
                <p className="mt-2 text-[10px] text-ink-400">{formatDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && <div className="mt-12"><h2 className="section-title mb-4">সম্পর্কিত পণ্য</h2><ProductGrid products={related} /></div>}
    </div>
  );
}
