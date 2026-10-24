"use client";

import Link from "next/link";
import { Banknote, ShoppingBag, Clock, Package, Users, Warehouse, TrendingUp, AlertTriangle, Truck } from "lucide-react";
import { Stat, ProgressBar, Badge, SectionHeader } from "@/components/ui";
import { SalesAreaChart, DonutChart, SimpleBarChart, RadarCompare, Histogram, ScatterPriceSold, BubbleBranches, RadialProgress, StackedArea, PieBasic } from "@/components/charts";
import { PageTitle } from "./shell";
import { formatMoney, formatDate, STATUS_LABEL, ORDER_TYPE_LABEL } from "@/lib/utils";
import type { DashboardData } from "@/lib/queries";

export function AdminDashboard({ data, branchId }: { data: DashboardData; branchId: number | null }) {
  const t = data.totals;
  const branchName = branchId ? data.branches.find((b) => b.id === branchId)?.name : null;
  const totalStatus = data.statusMix.reduce((a, b) => a + b.value, 0);
  return (
    <div className="space-y-6">
      <PageTitle title={branchName ? `${branchName} — ড্যাশবোর্ড` : "ইউনিভার্সাল ড্যাশবোর্ড"} subtitle={branchName ? "এই শাখার নিজস্ব বিক্রয়, স্টক ও কর্মী বিশ্লেষণ" : "সব শাখার সম্মিলিত রিয়েল-টাইম বিশ্লেষণ"} action={<Badge tone={branchId ? "amber" : "emerald"}>{branchId ? "Branch scope" : "Universal scope"}</Badge>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="মোট বিক্রয় (৯০ দিন)" value={formatMoney(t.revenue)} sub={`আদায় ${formatMoney(t.collected)}`} icon={<Banknote className="h-5 w-5" />} trend={t.trend} />
        <Stat label="অর্ডার" value={t.orders} sub={`আজ ${t.todaysOrders} টি`} icon={<ShoppingBag className="h-5 w-5" />} tone="sky" />
        <Stat label="পেন্ডিং অর্ডার" value={t.pending} sub="অনুমোদনের অপেক্ষায়" icon={<Clock className="h-5 w-5" />} tone="sun" />
        <Stat label="স্টক" value={t.totalStock} sub={`${t.products} পণ্য • ${formatMoney(t.stockValue)}`} icon={<Package className="h-5 w-5" />} tone="violet" />
        <Stat label="মাঠে আছে" value={t.outWithEmployees} sub={`${t.openSessions} টি খোলা সেশন`} icon={<Truck className="h-5 w-5" />} tone="rose" />
        <Stat label="কর্মী / কাস্টমার" value={`${t.employees} / ${t.customers}`} sub={`গড় অর্ডার ${formatMoney(t.avgOrder)}`} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <SectionHeader title="বিক্রয় ট্রেন্ড" subtitle="শেষ ১৪ দিনের বিক্রয় ও অর্ডার সংখ্যা (Area + Line)" action={<span className="flex items-center gap-1 text-xs font-semibold text-brand-600"><TrendingUp className="h-4 w-4" /> আজ {formatMoney(t.todaysSales)}</span>} />
          <SalesAreaChart data={data.byDay} />
        </div>
        <div className="card p-5">
          <SectionHeader title="বিক্রয় পদ্ধতি" subtitle="অর্ডার সংখ্যা অনুযায়ী (Donut)" />
          <DonutChart data={data.typeMix} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <SectionHeader title="অর্ডার স্ট্যাটাস" subtitle="Progress bars" />
          <div className="space-y-3">
            {data.statusMix.map((s, i) => <ProgressBar key={s.name} value={s.value} max={totalStatus} label={`${STATUS_LABEL[s.name]?.bn ?? s.name} (${s.value})`} tone={["sun", "brand", "sky", "rose", "violet"][i]} />)}
          </div>
        </div>
        <div className="card p-5">
          <SectionHeader title="আয়ের উৎস" subtitle="পদ্ধতি অনুযায়ী আয় (Radial)" />
          <RadialProgress data={data.revenueByType.map((r) => ({ name: r.name, value: Math.round((r.value / Math.max(1, t.revenue)) * 100) }))} />
        </div>
        <div className="card p-5">
          <SectionHeader title="অর্ডারের উৎস" subtitle="অনলাইন বনাম মাঠকর্মী (Pie)" />
          <PieBasic data={data.sourceMix} />
        </div>
        <div className="card p-5">
          <SectionHeader title="কিস্তির ধরন" subtitle="পণ্য অনুযায়ী (Donut)" />
          <DonutChart data={data.installmentMix} inner={50} height={240} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <SectionHeader title="ক্যাটাগরি অনুযায়ী বিক্রয়" subtitle="আয় (Bar chart)" />
          <SimpleBarChart data={data.salesByCategory} money />
        </div>
        <div className="card p-5">
          <SectionHeader title="সেরা বিক্রিত পণ্য" subtitle="ইউনিট (Horizontal bar)" />
          <SimpleBarChart data={data.topProducts.map((p) => ({ name: p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name, value: p.qty }))} horizontal color="#f5900b" height={300} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5">
          <SectionHeader title="কর্মী পারফরম্যান্স" subtitle="তুলনামূলক (Radar / Spider chart)" />
          {data.radar.length && data.employeePerf.length ? <RadarCompare data={data.radar} series={data.employeePerf.slice(0, 4).map((e) => e.name)} /> : <p className="py-10 text-center text-xs text-ink-400">ডাটা নেই</p>}
        </div>
        <div className="card p-5">
          <SectionHeader title="স্টক বণ্টন" subtitle="পণ্য সংখ্যা বনাম স্টক (Histogram)" />
          <Histogram data={data.stockBuckets} />
        </div>
        <div className="card p-5">
          <SectionHeader title="দাম বনাম বিক্রি" subtitle="প্রতিটি বিন্দু একটি পণ্য (Scatter plot)" />
          <ScatterPriceSold data={data.priceVsSold} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <SectionHeader title="পদ্ধতি অনুযায়ী দৈনিক অর্ডার" subtitle="Installment / Cash / COD (Stacked area)" />
          <StackedArea data={data.byDay} keys={["installment", "cash", "cod"]} />
        </div>
        <div className="card p-5">
          <SectionHeader title="শাখা তুলনা" subtitle="X: অর্ডার, Y: আয়, বৃত্ত: কাস্টমার (Bubble)" />
          <BubbleBranches data={data.branchStats} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <SectionHeader title="সাম্প্রতিক অর্ডার" action={<Link href="/admin/orders" className="text-xs font-semibold text-brand-600">সব দেখুন →</Link>} />
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>অর্ডার</th><th>কাস্টমার</th><th>পদ্ধতি</th><th>মোট</th><th>স্ট্যাটাস</th><th>সময়</th></tr></thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs font-bold">{o.orderNumber}</td>
                    <td><p className="font-semibold">{o.customerName}</p><p className="text-[10px] text-ink-400">{o.customerPhone}</p></td>
                    <td><Badge tone="sky">{ORDER_TYPE_LABEL[o.type].en}</Badge></td>
                    <td className="font-bold">{formatMoney(o.total)}</td>
                    <td><Badge tone={STATUS_LABEL[o.status].tone}>{STATUS_LABEL[o.status].en}</Badge></td>
                    <td className="text-xs text-ink-500">{formatDate(o.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <SectionHeader title="কম স্টক সতর্কতা" subtitle={`${t.lowStock} টি পণ্য`} />
            <div className="space-y-2">
              {data.lowStock.length === 0 && <p className="text-xs text-ink-400">সব পণ্যের স্টক ঠিক আছে ✅</p>}
              {data.lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-sun-50 p-2.5 dark:bg-sun-500/10">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-sun-600" />
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{p.name}</p><p className="text-[10px] text-ink-500">{p.categoryName}</p></div>
                  <Badge tone="rose">{p.stock} বাকি</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <SectionHeader title="শাখা সারসংক্ষেপ" />
            <div className="space-y-3">
              {data.branchStats.map((b) => (
                <div key={b.id} className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold"><Warehouse className="mr-1 inline h-4 w-4 text-brand-600" />{b.name}</p><Badge tone="slate">{b.code}</Badge></div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-lg bg-ink-50 p-1.5 dark:bg-white/5"><p className="font-bold">{formatMoney(b.revenue)}</p><p className="text-ink-400">আয়</p></div>
                    <div className="rounded-lg bg-ink-50 p-1.5 dark:bg-white/5"><p className="font-bold">{b.orders}</p><p className="text-ink-400">অর্ডার</p></div>
                    <div className="rounded-lg bg-ink-50 p-1.5 dark:bg-white/5"><p className="font-bold">{b.stock}</p><p className="text-ink-400">স্টক</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
