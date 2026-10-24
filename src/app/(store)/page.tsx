import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Wallet, CalendarClock, Flame, Trophy, Sparkles, BadgeCheck, MapPin, Users, Store, Star, HandCoins, Search, ShoppingBag } from "lucide-react";
import { getStorefront } from "@/lib/queries";
import { siteSettings } from "@/lib/site";
import { Ticker, CountUp, Reveal } from "@/components/store/alive";
import { ProductGrid } from "@/components/store/store-client";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Section({ title, subtitle, icon, href, children }: { title: string; subtitle?: string; icon?: React.ReactNode; href?: string; children: React.ReactNode }) {
  return (
    <section className="container-x mt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2">{icon}{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {href && <Link href={href} className="btn-ghost !px-3 !py-2 text-xs">সব দেখুন <ArrowRight className="h-3.5 w-3.5" /></Link>}
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const [s, st] = await Promise.all([getStorefront(), siteSettings()]);
  const heroTitle = st.heroTitle?.trim();
  const banner = st.bannerUrl?.trim() || "/images/hero.jpg";
  const totalStock = s.products.reduce((a, p) => a + p.stock, 0);
  const cheapestDaily = [...s.products].filter((p) => p.installmentType === "daily").sort((a, b) => a.installmentAmount - b.installmentAmount)[0];
  return (
    <>
      <Ticker items={[
        `দৈনিক কিস্তি ${cheapestDaily ? formatMoney(cheapestDaily.installmentAmount) + " থেকে শুরু" : "উপলব্ধ"}`,
        `${s.branches.length} টি শাখা • ${s.areas.length} টি সার্ভিস এলাকা`,
        "ক্যাশ অন ডেলিভারি সারা দেশে",
        "নগদ ক্রয়ে বিশেষ ছাড় — প্রতিনিধির মাধ্যমে",
        `${s.best[0]?.name ?? "ফ্রিজ, টিভি, মোবাইল"} — বেস্ট সেলার`,
        "ডাউন পেমেন্ট দিয়েই পণ্য হাতে নিন",
      ]} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-sun-50 dark:from-brand-950 dark:via-ink-950 dark:to-ink-900" />
        <div className="absolute inset-0 -z-10 sun-grid opacity-60" />
        <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <span className="badge bg-white text-brand-700 shadow ring-1 ring-brand-200 dark:bg-white/10 dark:text-brand-200 dark:ring-white/10"><ShieldCheck className="h-3.5 w-3.5" /> বিশ্বস্ত • নিবন্ধিত • {s.branches.length} শাখা</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl dark:text-white">
              {heroTitle ?? <>স্বপ্নের পণ্য <span className="text-gradient">সহজ কিস্তিতে</span>,<br />আজই ঘরে নিন</>}
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink-600 dark:text-ink-300">
              দৈনিক {cheapestDaily ? formatMoney(cheapestDaily.installmentAmount) : "৳৫০"} থেকে শুরু। ফ্রিজ, টিভি, মোবাইল, সেলাই মেশিন, ফার্নিচার — নগদে, ক্যাশ অন ডেলিভারিতে অথবা দৈনিক / সাপ্তাহিক / মাসিক কিস্তিতে কিনুন। কোনো লুকানো চার্জ নেই।
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn-sun !px-6 !py-3.5 text-base">পণ্য দেখুন <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/products?installment=daily" className="btn-outline !px-6 !py-3.5 text-base bg-white/70 dark:bg-white/5">দৈনিক কিস্তি</Link>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-white/5 dark:ring-white/10">
                <p className="text-xl font-extrabold text-ink-900 dark:text-white"><CountUp to={s.products.length} suffix="+" /></p>
                <p className="text-[11px] font-medium text-ink-500">পণ্য</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-white/5 dark:ring-white/10">
                <p className="text-xl font-extrabold text-ink-900 dark:text-white"><CountUp to={totalStock} suffix="+" /></p>
                <p className="text-[11px] font-medium text-ink-500">স্টকে প্রস্তুত</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-white/5 dark:ring-white/10">
                <p className="text-xl font-extrabold text-ink-900 dark:text-white">৩ ধরনের</p>
                <p className="text-[11px] font-medium text-ink-500">কিস্তি সুবিধা</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-400/30 to-sun-400/30 blur-2xl" />
            <img src={banner} alt={`${st.siteName} ডেলিভারি`} className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl ring-1 ring-white/50 transition-transform duration-700 hover:scale-[1.02]" />
            <div className="absolute -left-3 top-6 hidden animate-float rounded-2xl bg-white/95 p-3 shadow-soft sm:block dark:bg-ink-900/95">
              <p className="flex items-center gap-2 text-xs font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><HandCoins className="h-4 w-4" /></span> ডাউন পেমেন্ট দিয়েই শুরু</p>
            </div>
            <div className="absolute -right-3 bottom-8 hidden animate-float rounded-2xl bg-white/95 p-3 shadow-soft [animation-delay:1.5s] sm:block dark:bg-ink-900/95">
              <p className="flex items-center gap-2 text-xs font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sun-100 text-sun-700"><Truck className="h-4 w-4" /></span> বাড়িতে ডেলিভারি ফ্রি</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment systems */}
      <Reveal>
      <section className="container-x -mt-2">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: <CalendarClock className="h-6 w-6" />, t: "কিস্তিতে ক্রয়", d: "দৈনিক, সাপ্তাহিক বা মাসিক — পণ্য অনুযায়ী নির্ধারিত সহজ কিস্তি। ডাউন পেমেন্ট দিয়েই পণ্য নিন।", tone: "from-brand-500 to-brand-700" },
            { icon: <Wallet className="h-6 w-6" />, t: "নগদ ক্রয়", d: "একবারে নগদ মূল্যে কিনলে বিশেষ ছাড়। শোরুম বা আমাদের প্রতিনিধির কাছ থেকে সরাসরি।", tone: "from-sun-400 to-sun-600" },
            { icon: <Truck className="h-6 w-6" />, t: "ক্যাশ অন ডেলিভারি", d: "আপনার এলাকা কিস্তি সার্ভিসের বাইরে হলেও চিন্তা নেই — পণ্য হাতে পেয়ে টাকা দিন।", tone: "from-sky-400 to-sky-600" },
          ].map((x) => (
            <div key={x.t} className="card card-hover flex gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${x.tone}`}>{x.icon}</div>
              <div><p className="font-bold text-ink-900 dark:text-white">{x.t}</p><p className="mt-1 text-xs leading-relaxed text-ink-500">{x.d}</p></div>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* Categories */}
      <Reveal delay={80}>
      <Section title="ক্যাটাগরি অনুযায়ী কেনাকাটা" subtitle="আপনার প্রয়োজনীয় পণ্য খুঁজে নিন" href="/products">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {s.categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="card card-hover group flex flex-col justify-between gap-3 p-4 text-left">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-brand-500 to-sun-400 transition-all duration-300 group-hover:w-full" />
              <div>
                <p className="text-sm font-extrabold leading-tight text-ink-900 dark:text-white">{c.name}</p>
                <p className="mt-1 text-[11px] font-medium text-ink-400">{c.count} টি পণ্য →</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
      </Reveal>

      {s.featured.length > 0 && (
        <Reveal delay={60}><Section title="ফিচার্ড পণ্য" subtitle="আমাদের বাছাইকৃত সেরা পণ্য" icon={<BadgeCheck className="h-6 w-6 text-violet-500" />} href="/products?filter=featured">
          <ProductGrid products={s.featured} />
        </Section></Reveal>
      )}

      {/* Hot deals banner */}
      {s.hot.length > 0 && (
        <section className="container-x mt-14">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-rose-500 via-sun-500 to-sun-400 p-6 text-white sm:p-8">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15" />
            <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Flame className="h-5 w-5" /> হট সেলিং</p>
                <h3 className="mt-1 text-2xl font-extrabold sm:text-3xl">এই সপ্তাহের সবচেয়ে চাহিদার পণ্য</h3>
                <p className="mt-1 text-sm text-white/90">সীমিত স্টক — দ্রুত অর্ডার করুন</p>
              </div>
              <Link href="/products?filter=hot" className="btn bg-white text-rose-600 hover:bg-rose-50">হট ডিল দেখুন <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="mt-5"><ProductGrid products={s.hot} /></div>
        </section>
      )}

      <Reveal delay={60}><Section title="বেস্ট সেলিং" subtitle="গ্রাহকদের সবচেয়ে পছন্দের পণ্য" icon={<Trophy className="h-6 w-6 text-sun-500" />} href="/products?sort=best">
        <ProductGrid products={s.best} />
      </Section></Reveal>

      <Reveal delay={60}><Section title="নতুন এসেছে" subtitle="সদ্য যুক্ত হওয়া পণ্যসমূহ" icon={<Sparkles className="h-6 w-6 text-sky-500" />} href="/products?sort=new">
        <ProductGrid products={s.newest} />
      </Section></Reveal>

      {/* How it works */}
      <Section title="কিভাবে কিনবেন" subtitle="৪টি ধাপে আপনার পণ্য" icon={<Store className="h-6 w-6 text-sun-500" />}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { n: "১", t: "পণ্য বেছে নিন", d: "ক্যাটাগরি বা সার্চ থেকে পণ্য বাছাই করুন — দৈনিক, সাপ্তাহিক বা মাসিক কিস্তিতে।", i: <Search className="h-6 w-6" /> },
            { n: "২", t: "কার্টে যোগ করুন", d: "রং বেছে নিন ও পরিমাণ ঠিক করুন। একই পণ্য বারবার যোগ করলে পরিমাণ একসাথে যোগ হয়।", i: <ShoppingBag className="h-6 w-6" /> },
            { n: "৩", t: "চেকআউট", d: "আপনার এলাকা অনুযায়ী কিস্তি/নগদ/COD সেবা যাচাই হয়। ডেলিভারি ঠিকানা দিন।", i: <Wallet className="h-6 w-6" /> },
            { n: "৪", t: "পণ্য পান", d: "প্রতিনিধি বাড়িতে গিয়ে পণ্য দেবেন। কিস্তির হিসাব অফিস থেকে আলাদাভাবে পাবেন।", i: <Truck className="h-6 w-6" /> },
          ].map((x) => (
            <div key={x.n} className="card relative overflow-hidden p-5">
              <div className="absolute -right-4 -top-4 text-6xl font-extrabold text-ink-100 dark:text-white/10">{x.n}</div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sun-400 text-white">{x.i}</div>
              <p className="mt-3 font-bold">{x.t}</p>
              <p className="mt-1 text-xs text-ink-500">{x.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Coverage */}      <section className="container-x mt-16">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-3">
            <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white">
              <MapPin className="h-8 w-8 text-sun-300" />
              <h3 className="mt-3 text-2xl font-extrabold">কিস্তি সার্ভিস এলাকা</h3>
              <p className="mt-2 text-sm text-brand-100">নিচের এলাকাগুলোতে আমাদের প্রতিনিধি সরাসরি বাড়িতে গিয়ে কিস্তি সেবা দেন। আপনার এলাকা তালিকায় না থাকলে ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন।</p>
              <div className="mt-5 flex gap-6">
                <div><p className="text-3xl font-extrabold">{s.branches.length}</p><p className="text-xs text-brand-200">শাখা</p></div>
                <div><p className="text-3xl font-extrabold">{s.areas.length}</p><p className="text-xs text-brand-200">সার্ভিস এলাকা</p></div>
              </div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3 lg:col-span-2">
              {s.branches.map((b) => (
                <div key={b.id} className="rounded-2xl border border-ink-100 p-4 dark:border-white/10">
                  <p className="flex items-center gap-2 font-bold"><Store className="h-4 w-4 text-brand-600" /> {b.name}</p>
                  <p className="mt-1 text-xs text-ink-500">{b.address}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.areas.filter((a) => a.branchId === b.id).map((a) => <span key={a.id} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{[a.union, a.upazila, a.district].filter(Boolean).join(", ")}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-x mt-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "Fatema Begum", a: "Rangpur", t: "সাপ্তাহিক ৫০০ টাকা কিস্তিতে সেলাই মেশিন নিয়েছি। এখন নিজেই আয় করছি। কর্মীরা খুবই আন্তরিক।" },
            { n: "Mizanur Rahman", a: "Dinajpur", t: "ফ্রিজ কিনেছি মাসিক কিস্তিতে। ডেলিভারি দ্রুত, কোনো লুকানো খরচ নেই। সম্পূর্ণ বিশ্বাসযোগ্য প্রতিষ্ঠান।" },
            { n: "Rafiqul Islam", a: "Bogura", t: "অনলাইনে অর্ডার দিলাম, পরদিন প্রতিনিধি এসে সব বুঝিয়ে দিলেন। কিস্তির হিসাব একদম স্বচ্ছ।" },
          ].map((r) => (
            <div key={r.n} className="card p-5">
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-sun-400 text-sun-400" />)}</div>
              <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">“{r.t}”</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-bold"><Users className="h-4 w-4 text-brand-600" /> {r.n} <span className="font-normal text-ink-400">• {r.a}</span></p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
