"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, RadialBarChart, RadialBar, ComposedChart, Line,
} from "recharts";
import { formatMoney } from "@/lib/utils";

export const PALETTE = ["#10b98a", "#f5900b", "#38bdf8", "#a78bfa", "#fb7185", "#34d399", "#fbbf24", "#60a5fa"];

const axisStyle = { fontSize: 11, fill: "#8e9bb6" };
const gridStroke = "rgba(142,155,182,0.18)";

export function SalesAreaChart({ data, height = 280 }: { data: { day: string; sales: number; orders: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b98a" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#10b98a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis yAxisId="l" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <YAxis yAxisId="r" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v, n) => (n === "Sales" ? formatMoney(Number(v)) : v)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area yAxisId="l" type="monotone" dataKey="sales" name="Sales" stroke="#10b98a" strokeWidth={2.5} fill="url(#gSales)" />
        <Line yAxisId="r" type="monotone" dataKey="orders" name="Orders" stroke="#f5900b" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, dataKey = "value", nameKey = "name", height = 260, color = "#10b98a", money = false, horizontal = false }: { data: Record<string, unknown>[]; dataKey?: string; nameKey?: string; height?: number; color?: string; money?: boolean; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 10, right: 10, left: horizontal ? 10 : -10, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} vertical={false} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => (money && v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
            <YAxis type="category" dataKey={nameKey} tick={axisStyle} axisLine={false} tickLine={false} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} tick={axisStyle} axisLine={false} tickLine={false} interval={0} angle={data.length > 6 ? -20 : 0} height={data.length > 6 ? 50 : 30} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => (money && v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
          </>
        )}
        <Tooltip formatter={(v) => (money ? formatMoney(Number(v)) : v)} cursor={{ fill: "rgba(16,185,138,0.08)" }} />
        <Bar dataKey={dataKey} radius={[8, 8, 8, 8]} maxBarSize={38}>
          {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? color : `${color}bb`} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 260, money = false, inner = 62 }: { data: { name: string; value: number }[]; height?: number; money?: boolean; inner?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={inner} outerRadius={inner + 34} paddingAngle={3} cornerRadius={6} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => (money ? formatMoney(Number(v)) : v)} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total</p>
        <p className="text-lg font-extrabold text-ink-900 dark:text-white">{money ? formatMoney(total) : total}</p>
      </div>
    </div>
  );
}

export function PieBasic({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false} fontSize={10} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={PALETTE[(i + 2) % PALETTE.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RadarCompare({ data, series, height = 300 }: { data: Record<string, string | number>[]; series: string[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={gridStroke} />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#8e9bb6" }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        {series.map((s, i) => (
          <Radar key={s} name={s} dataKey={s} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.18} strokeWidth={2} />
        ))}
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function Histogram({ data, height = 240 }: { data: { range: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap={2} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "rgba(245,144,11,0.08)" }} />
        <Bar dataKey="count" name="Products" fill="#f5900b" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScatterPriceSold({ data, height = 260 }: { data: { name: string; price: number; sold: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} />
        <XAxis type="number" dataKey="price" name="Price" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <YAxis type="number" dataKey="sold" name="Sold" tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
          const p = payload?.[0]?.payload as { name: string; price: number; sold: number } | undefined;
          if (!p) return null;
          return <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-soft dark:bg-ink-900"><b>{p.name}</b><br />Price {formatMoney(p.price)} · Sold {p.sold}</div>;
        }} />
        <Scatter data={data} fill="#a78bfa" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function BubbleBranches({ data, height = 280 }: { data: { name: string; orders: number; revenue: number; customers: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} />
        <XAxis type="number" dataKey="orders" name="Orders" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis type="number" dataKey="revenue" name="Revenue" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <ZAxis type="number" dataKey="customers" range={[200, 1400]} name="Customers" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
          const p = payload?.[0]?.payload as { name: string; orders: number; revenue: number; customers: number } | undefined;
          if (!p) return null;
          return <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-soft dark:bg-ink-900"><b>{p.name}</b><br />Orders {p.orders} · Revenue {formatMoney(p.revenue)}<br />Customers {p.customers}</div>;
        }} />
        <Scatter data={data} fillOpacity={0.75}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function RadialProgress({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  const colored = data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart innerRadius="30%" outerRadius="100%" data={colored} startAngle={90} endAngle={-270}>
        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(142,155,182,0.12)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} layout="vertical" verticalAlign="middle" align="right" />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function StackedArea({ data, keys, height = 260 }: { data: Record<string, string | number>[]; keys: string[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.35} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
