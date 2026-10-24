"use client";

import Link from "next/link";
import { FileDown, Globe2, Building2 } from "lucide-react";
import { Badge, SectionHeader, Stat } from "@/components/ui";
import { SalesAreaChart, SimpleBarChart, DonutChart, BubbleBranches, RadarCompare } from "@/components/charts";
import { PageTitle } from "./shell";
import { exportPdf } from "@/lib/pdf";
import { formatMoney, cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/queries";

export function ReportsView({ data, branchId, days }: { data: DashboardData; branchId: number | null; days: number }) {
  const scope = branchId ? data.branches.find((b) => b.id === branchId)?.name ?? "Branch" : "Universal (All branches)";
  const t = data.totals;
  const dayRows = data.byDay.map((d) => [d.day, d.orders, d.installment, d.cash, d.cod, d.sales]);
  const branchRows = data.branchStats.map((b) => [b.name, b.code, b.orders, b.pending, b.customers, b.products, b.stock, b.employees, b.revenue]);
  const empRows = data.employeePerf.map((e) => [e.name, data.branches.find((b) => b.id === e.branchId)?.code ?? "", e.sessions, e.taken, e.soldQty, e.returned, e.orders, e.customers, e.cash, e.revenue]);
  const catRows = data.salesByCategory.map((c) => [c.name, c.value]);
  const pdf = () => exportPdf({ title: `Sales & Operations Report — ${scope}`, subtitle: `Last ${days} days`, filename: `report-${branchId ?? "universal"}-${days}d`, tables: [
    { title: "Summary", columns: ["Revenue", "Collected", "Orders", "Pending", "Avg order", "Products", "Stock", "Stock value", "Employees", "Customers"], rows: [[t.revenue, t.collected, t.orders, t.pending, t.avgOrder, t.products, t.totalStock, t.stockValue, t.employees, t.customers]] },
    { title: "Daily sales", columns: ["Day", "Orders", "Installment", "Cash", "COD", "Sales (BDT)"], rows: dayRows },
    { title: "Branch comparison (universal)", columns: ["Branch", "Code", "Orders", "Pending", "Customers", "Products", "Stock", "Employees", "Revenue"], rows: branchRows },
    { title: "Employee performance", columns: ["Employee", "Branch", "Sessions", "Taken", "Sold", "Returned", "Orders", "Customers", "Cash", "Revenue"], rows: empRows },
    { title: "Sales by category", columns: ["Category", "Revenue"], rows: catRows },
  ] });
  return (
    <div className="space-y-6">
      <PageTitle title="রিপোর্ট সেন্টার" subtitle={<span className="flex items-center gap-2">{branchId ? <Building2 className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />} {scope} • শেষ {days} দিন</span>} action={
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30, 90].map((d) => <Link key={d} href={`/admin/reports?days=${d}`} className={cn("chip", d === days && "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10")}>{d} দিন</Link>)}
          <button onClick={pdf} className="btn-primary !px-3"><FileDown className="h-4 w-4" /> PDF এক্সপোর্ট</button>
        </div>
      } />
      <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-3 text-xs text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/5 dark:text-brand-200">
        টিপস: উপরের শাখা সিলেক্টর থেকে <b>সব শাখা</b> বেছে নিলে ইউনিভার্সাল রিপোর্ট, আর নির্দিষ্ট শাখা বেছে নিলে শুধু সেই শাখার আলাদা রিপোর্ট পাবেন। শাখা তুলনা টেবিলটি সবসময় সব শাখা দেখায়।
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="বিক্রয়" value={formatMoney(t.revenue)} sub={`আদায় ${formatMoney(t.collected)}`} trend={t.trend} />
        <Stat label="অর্ডার" value={t.orders} sub={`পেন্ডিং ${t.pending}`} tone="sky" />
        <Stat label="গড় অর্ডার মূল্য" value={formatMoney(t.avgOrder)} tone="sun" />
        <Stat label="স্টক মূল্য" value={formatMoney(t.stockValue)} sub={`${t.totalStock} ইউনিট`} tone="violet" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2"><SectionHeader title="দৈনিক বিক্রয়" /><SalesAreaChart data={data.byDay} /></div>
        <div className="card p-5"><SectionHeader title="আয়ের উৎস" /><DonutChart data={data.revenueByType} money /></div>
      </div>
      <div className="card p-5">
        <SectionHeader title="দৈনিক বিক্রয় টেবিল" />
        <div className="overflow-x-auto"><table className="table-base"><thead><tr><th>দিন</th><th>অর্ডার</th><th>কিস্তি</th><th>নগদ</th><th>COD</th><th>বিক্রয়</th></tr></thead><tbody>{data.byDay.map((d) => <tr key={d.day}><td className="font-semibold">{d.day}</td><td>{d.orders}</td><td>{d.installment}</td><td>{d.cash}</td><td>{d.cod}</td><td className="font-bold">{formatMoney(d.sales)}</td></tr>)}</tbody></table></div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <SectionHeader title="শাখা তুলনা (ইউনিভার্সাল)" subtitle="সব শাখার তুলনামূলক চিত্র" />
          <BubbleBranches data={data.branchStats} height={240} />
          <div className="mt-3 overflow-x-auto"><table className="table-base"><thead><tr><th>শাখা</th><th>অর্ডার</th><th>পেন্ডিং</th><th>কাস্টমার</th><th>পণ্য</th><th>স্টক</th><th>কর্মী</th><th>আয়</th></tr></thead><tbody>{data.branchStats.map((b) => <tr key={b.id} className={cn(b.id === branchId && "bg-sun-50 dark:bg-sun-500/10")}><td className="font-semibold">{b.name} <Badge tone="slate">{b.code}</Badge></td><td>{b.orders}</td><td>{b.pending}</td><td>{b.customers}</td><td>{b.products}</td><td>{b.stock}</td><td>{b.employees}</td><td className="font-bold">{formatMoney(b.revenue)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="card p-5">
          <SectionHeader title="কর্মী পারফরম্যান্স" subtitle="সেশন, নেওয়া, বিক্রি, ফেরত, আদায়" />
          {data.radar.length > 0 && data.employeePerf.length > 0 && <RadarCompare data={data.radar} series={data.employeePerf.slice(0, 4).map((e) => e.name)} height={240} />}
          <div className="mt-3 overflow-x-auto"><table className="table-base"><thead><tr><th>কর্মী</th><th>সেশন</th><th>নেওয়া</th><th>বিক্রি</th><th>ফেরত</th><th>অর্ডার</th><th>নগদ আদায়</th><th>আয়</th></tr></thead><tbody>{data.employeePerf.map((e) => <tr key={e.id}><td className="font-semibold">{e.name}</td><td>{e.sessions}</td><td>{e.taken}</td><td>{e.soldQty}</td><td>{e.returned}</td><td>{e.orders}</td><td>{formatMoney(e.cash)}</td><td className="font-bold">{formatMoney(e.revenue)}</td></tr>)}</tbody></table></div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5"><SectionHeader title="ক্যাটাগরি অনুযায়ী আয়" /><SimpleBarChart data={data.salesByCategory} money /></div>
        <div className="card p-5"><SectionHeader title="সেরা পণ্য (আয়)" /><SimpleBarChart data={data.topProducts.map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name, value: p.revenue }))} money horizontal color="#a78bfa" height={300} /></div>
      </div>
    </div>
  );
}
