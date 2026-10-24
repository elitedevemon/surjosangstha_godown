import Link from "next/link";
import { ShieldCheck, Phone, Mail, MapPin, Globe, Video, MessageCircle } from "lucide-react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { HeaderClient, MobileBottomNav, CatalogCacher } from "./store-client";
import { ClickTop } from "@/components/click-top";
import { HelpdeskWidget } from "@/components/helpdesk";
import { LogoMark, WordMark, BengaliWordMark, SiteLogo } from "@/components/brand";
import { siteSettings, logoOf } from "@/lib/site";

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [session, cats, st] = await Promise.all([
    getSession(),
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder),
    siteSettings(),
  ]);
  const logo = logoOf(st);
  const user = session ? { id: session.id, name: session.name, role: session.role, phone: session.phone } : null;
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <HeaderClient user={user} categories={cats} logo={logo} siteName={st.siteName} />
      <CatalogCacher />
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-ink-200/70 bg-white dark:border-white/10 dark:bg-ink-900">
        <div className="container-x grid gap-10 py-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2"><SiteLogo src={logo} alt={st.siteName} className="h-11 w-11 rounded-xl" /><WordMark className="text-lg" /></div>
            <p className="mt-3 text-sm text-ink-500">গ্রামীণ ও শহুরে পরিবারের জন্য সহজ কিস্তিতে ঘরের প্রয়োজনীয় পণ্য। দৈনিক, সাপ্তাহিক ও মাসিক কিস্তি — আপনার সামর্থ্য অনুযায়ী।</p>
            <Link href="/branches" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-brand-700 ring-1 ring-ink-200 transition hover:ring-brand-400 dark:bg-white/5 dark:ring-white/10"><MapPin className="h-3.5 w-3.5" /> আমাদের শাখা ও সার্ভিস এলাকা দেখুন →</Link>
            <div className="mt-4 flex gap-2">
              {[Globe, Video, MessageCircle].map((I, i) => <span key={i} className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200"><I className="h-4 w-4" /></span>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">ক্যাটাগরি</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              {cats.slice(0, 7).map((c) => <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-brand-600">{c.name}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">দ্রুত লিংক</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/products" className="hover:text-brand-600">সব পণ্য</Link></li>
              <li><Link href="/products?filter=hot" className="hover:text-brand-600">হট ডিল</Link></li>
              <li><Link href="/products?installment=daily" className="hover:text-brand-600">দৈনিক কিস্তির পণ্য</Link></li>
              <li><Link href="/account" className="hover:text-brand-600">আমার অর্ডার</Link></li>
              <li><Link href="/login" className="hover:text-brand-600">কর্মী / এডমিন লগইন</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">যোগাযোগ</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-600" /> 01700-000000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-600" /> info@surjosangstha.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-600" /> Station Road, Rangpur</li>
            </ul>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-xs font-semibold text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
              <ShieldCheck className="h-5 w-5" /> ১০০% নিরাপদ লেনদেন ও নিবন্ধিত প্রতিষ্ঠান
            </div>
          </div>
        </div>
        <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400 dark:border-white/5">© {new Date().getFullYear()} SurjoSangstha. All rights reserved. Cash • Cash on Delivery • Installment</div>
      </footer>
      <MobileBottomNav user={user} />
      <ClickTop />
      <HelpdeskWidget user={user ? { id: user.id, name: user.name, phone: user.phone } : null} />
    </div>
  );
}
