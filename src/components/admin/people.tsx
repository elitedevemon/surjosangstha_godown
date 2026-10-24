"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin, UserPlus, Store, Tags, Power, Database, RefreshCw, FileDown, Bell } from "lucide-react";
import { Modal, Field, Badge, Spinner, Avatar, Empty } from "@/components/ui";
import { useToast } from "@/components/providers";
import { LocationPicker } from "@/components/location-picker";
import { saveCategory, deleteCategory, saveEmployee, toggleUserActive, deleteUser, saveBranch, saveArea, deleteArea, resetDemoData, type EmployeeInput } from "@/actions/admin";
import { toggleBlockCustomerAction, saveSettingsAction, setReviewStatusAction, helpdeskKbSaveAction, helpdeskKbDeleteAction, getSettings } from "@/actions/extra";
import { PageTitle } from "./shell";
import { exportPdf } from "@/lib/pdf";
import { mapEmbedUrl, districtCoords, unionsOf, villagesOf } from "@/lib/locations";
import { formatDate, formatMoney, areaLabel } from "@/lib/utils";
import type { Branch, Category, ServiceArea, User, Notification, Review, HelpdeskKb, Settings } from "@/db/schema";

function useAct() {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => { const r = await fn(); toast({ title: r.ok ? ok : r.error ?? "Failed", tone: r.ok ? "success" : "error" }); if (r.ok) { router.refresh(); after?.(); } });
  return { pending, run };
}

/* ---------- Categories ---------- */
export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<number, number> }) {
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const { pending, run } = useAct();
  return (
    <div>
      <PageTitle title="ক্যাটাগরি" subtitle="পণ্য ক্যাটাগরির অধীনে সাজানো হয়" action={<button onClick={() => setEdit({ name: "", icon: "📦", description: "", sortOrder: categories.length, isActive: true })} className="btn-primary"><Plus className="h-4 w-4" /> নতুন ক্যাটাগরি</button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {categories.map((c) => (
          <div key={c.id} className="card card-hover p-4">
            <div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-sun-50 text-2xl dark:from-white/5 dark:to-white/10">{c.icon}</span><div className="flex gap-1"><button onClick={() => setEdit(c)} className="rounded-lg p-1.5 hover:bg-ink-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button><button onClick={() => confirm("মুছে ফেলবেন?") && run(() => deleteCategory(c.id), "ক্যাটাগরি মুছে ফেলা হয়েছে")} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></div>
            <p className="mt-3 font-bold">{c.name}</p>
            <p className="text-xs text-ink-500">{c.description}</p>
            <div className="mt-2 flex items-center gap-2"><Badge tone="emerald">{counts[c.id] ?? 0} পণ্য</Badge>{!c.isActive && <Badge tone="rose">নিষ্ক্রিয়</Badge>}</div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"} size="sm">
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => saveCategory({ id: edit.id, name: edit.name!, icon: edit.icon ?? undefined, description: edit.description ?? undefined, sortOrder: edit.sortOrder ?? 0, isActive: edit.isActive ?? true }), "সংরক্ষিত হয়েছে", () => setEdit(null)); }} className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-3"><Field label="আইকন"><input className="input text-center text-xl" value={edit.icon ?? ""} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} /></Field><Field label="নাম"><input className="input" required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field></div>
            <Field label="বিবরণ"><input className="input" value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="ক্রম"><input type="number" className="input" value={edit.sortOrder ?? 0} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></Field><label className="flex items-end gap-2 pb-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={edit.isActive ?? true} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} /> সক্রিয়</label></div>
            <button disabled={pending} className="btn-primary w-full">{pending && <Spinner />} <Tags className="h-4 w-4" /> সংরক্ষণ</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Employees ---------- */
export function EmployeeManager({ employees, branches, stats }: { employees: User[]; branches: Branch[]; stats: Record<number, { orders: number; revenue: number; sessions: number }> }) {
  const [edit, setEdit] = useState<EmployeeInput | null>(null);
  const { pending, run } = useAct();
  const open = (u?: User) => setEdit(u ? { id: u.id, name: u.name, phone: u.phone, branchId: u.branchId ?? branches[0]?.id, designation: u.designation ?? "", email: u.email ?? "", nid: u.nid ?? "", salary: u.salary ?? 0, village: u.village ?? "", union: u.union ?? "", upazila: u.upazila ?? "", district: u.district ?? "", address: u.address ?? "", isActive: u.isActive, joinedAt: u.joinedAt ? new Date(u.joinedAt).toISOString().slice(0, 10) : "" } : { name: "", phone: "", password: "", branchId: branches[0]?.id, designation: "Field Sales Officer", email: "", nid: "", salary: 0, village: "", union: "", upazila: "", district: "", address: "", isActive: true, joinedAt: new Date().toISOString().slice(0, 10) });
  const pdf = () => exportPdf({ title: "Employee List", filename: "employees", tables: [{ title: `${employees.length} employees`, columns: ["Name", "Phone", "Branch", "Designation", "Area", "Salary", "Joined", "Orders", "Revenue", "Active"], rows: employees.map((e) => [e.name, e.phone, branches.find((b) => b.id === e.branchId)?.name ?? "", e.designation ?? "", areaLabel(e), e.salary ?? 0, e.joinedAt ? formatDate(e.joinedAt) : "", stats[e.id]?.orders ?? 0, stats[e.id]?.revenue ?? 0, e.isActive ? "Yes" : "No"]) }] });
  return (
    <div>
      <PageTitle title="কর্মী ব্যবস্থাপনা" subtitle="কর্মীদের কোনো রেজিস্ট্রেশন পেজ নেই — এডমিন নিজে যুক্ত করবেন" action={<div className="flex gap-2"><button onClick={pdf} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> PDF</button><button onClick={() => open()} className="btn-primary"><UserPlus className="h-4 w-4" /> কর্মী যোগ</button></div>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {employees.length === 0 && <div className="md:col-span-3"><Empty title="কোনো কর্মী নেই" /></div>}
        {employees.map((e) => (
          <div key={e.id} className="card card-hover p-4">
            <div className="flex items-start gap-3">
              <Avatar name={e.name} />
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{e.name}</p><p className="text-xs text-ink-500">{e.designation} • {e.phone}</p><p className="text-[11px] text-ink-400">{branches.find((b) => b.id === e.branchId)?.name}</p></div>
              {e.isActive ? <Badge tone="emerald">সক্রিয়</Badge> : <Badge tone="rose">নিষ্ক্রিয়</Badge>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-lg bg-ink-50 p-2 dark:bg-white/5"><p className="font-bold">{stats[e.id]?.orders ?? 0}</p><p className="text-ink-400">বিক্রয়</p></div>
              <div className="rounded-lg bg-ink-50 p-2 dark:bg-white/5"><p className="font-bold">{formatMoney(stats[e.id]?.revenue ?? 0)}</p><p className="text-ink-400">আয়</p></div>
              <div className="rounded-lg bg-ink-50 p-2 dark:bg-white/5"><p className="font-bold">{stats[e.id]?.sessions ?? 0}</p><p className="text-ink-400">সেশন</p></div>
            </div>
            <p className="mt-2 text-[11px] text-ink-500">📍 {[e.village, areaLabel(e)].filter(Boolean).join(", ") || "-"} • যোগদান {e.joinedAt ? formatDate(e.joinedAt) : "-"} • বেতন {formatMoney(e.salary ?? 0)}</p>
            <div className="mt-3 flex gap-1.5">
              <button onClick={() => open(e)} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> সম্পাদনা</button>
              <button onClick={() => run(() => toggleUserActive(e.id, !e.isActive), e.isActive ? "নিষ্ক্রিয় করা হয়েছে" : "সক্রিয় করা হয়েছে")} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Power className="h-3.5 w-3.5" /> {e.isActive ? "নিষ্ক্রিয়" : "সক্রিয়"}</button>
              <button onClick={() => confirm("কর্মী মুছে ফেলবেন?") && run(() => deleteUser(e.id), "মুছে ফেলা হয়েছে")} className="btn-ghost !px-2.5 !py-1.5 text-xs text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "কর্মী সম্পাদনা" : "নতুন কর্মী যোগ"} size="lg">
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => saveEmployee(edit), "কর্মী সংরক্ষিত হয়েছে", () => setEdit(null)); }} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="নাম *"><input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="মোবাইল (লগইন আইডি) *"><input className="input" required value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
              <Field label={edit.id ? "নতুন পাসওয়ার্ড (ঐচ্ছিক)" : "পাসওয়ার্ড *"}><input type="password" className="input" value={edit.password ?? ""} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
              <Field label="শাখা *"><select className="input" value={edit.branchId} onChange={(e) => setEdit({ ...edit, branchId: Number(e.target.value) })}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
              <Field label="পদবি"><input className="input" value={edit.designation} onChange={(e) => setEdit({ ...edit, designation: e.target.value })} /></Field>
              <Field label="ইমেইল"><input className="input" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
              <Field label="NID"><input className="input" value={edit.nid} onChange={(e) => setEdit({ ...edit, nid: e.target.value })} /></Field>
              <Field label="বেতন"><input type="number" className="input" value={edit.salary} onChange={(e) => setEdit({ ...edit, salary: Number(e.target.value) })} /></Field>
              <Field label="যোগদানের তারিখ"><input type="date" className="input" value={edit.joinedAt} onChange={(e) => setEdit({ ...edit, joinedAt: e.target.value })} /></Field>
              <label className="flex items-end gap-2 pb-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={edit.isActive ?? true} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} /> সক্রিয়</label>
            </div>
            <LocationPicker value={{ district: edit.district ?? "", upazila: edit.upazila ?? "", union: edit.union ?? "", village: edit.village ?? "" }} onChange={(v) => setEdit({ ...edit, ...v })} />
            <button disabled={pending} className="btn-primary w-full">{pending && <Spinner />} সংরক্ষণ</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Branches ---------- */
export function BranchManager({ branches, stats }: { branches: Branch[]; stats: Record<number, { products: number; employees: number; orders: number; revenue: number; areas: number }> }) {
  const [edit, setEdit] = useState<Partial<Branch> | null>(null);
  const { pending, run } = useAct();
  return (
    <div>
      <PageTitle title="শাখা ব্যবস্থাপনা" subtitle="প্রতিটি শাখার আলাদা পণ্য, স্টক, গোডাউন, কর্মী ও সার্ভিস এলাকা" action={<button onClick={() => setEdit({ name: "", code: "", address: "", district: "", upazila: "", phone: "", manager: "", isActive: true })} className="btn-primary"><Plus className="h-4 w-4" /> নতুন শাখা</button>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => (
          <div key={b.id} className="card card-hover overflow-hidden">
            <iframe title={b.name} src={mapEmbedUrl(`${b.upazila ?? ""} ${b.district ?? ""}`)} className="h-36 w-full border-0" loading="lazy" />
            <div className="p-4">
              <div className="flex items-start justify-between"><div><p className="flex items-center gap-2 font-bold"><Store className="h-4 w-4 text-brand-600" /> {b.name}</p><p className="text-xs text-ink-500">{b.address} • {b.phone}</p><p className="text-[11px] text-ink-400">ম্যানেজার: {b.manager ?? "-"}</p></div><div className="flex flex-col items-end gap-1"><Badge tone="slate">{b.code}</Badge>{!b.isActive && <Badge tone="rose">নিষ্ক্রিয়</Badge>}</div></div>
              <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px]">
                {[["পণ্য", stats[b.id]?.products ?? 0], ["কর্মী", stats[b.id]?.employees ?? 0], ["অর্ডার", stats[b.id]?.orders ?? 0], ["এলাকা", stats[b.id]?.areas ?? 0], ["আয়", formatMoney(stats[b.id]?.revenue ?? 0)]].map(([k, v]) => <div key={String(k)} className="rounded-lg bg-ink-50 p-1.5 dark:bg-white/5"><p className="truncate font-bold">{v}</p><p className="text-ink-400">{k}</p></div>)}
              </div>
              <button onClick={() => setEdit(b)} className="btn-ghost mt-3 w-full !py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> সম্পাদনা</button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "শাখা সম্পাদনা" : "নতুন শাখা"}>
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); const c = districtCoords(edit.district ?? ""); run(() => saveBranch({ id: edit.id, name: edit.name!, code: edit.code!, address: edit.address ?? "", district: edit.district ?? "", upazila: edit.upazila ?? "", phone: edit.phone ?? "", manager: edit.manager ?? "", isActive: edit.isActive ?? true, ...c }), "শাখা সংরক্ষিত", () => setEdit(null)); }} className="grid gap-3 sm:grid-cols-2">
            <Field label="শাখার নাম *"><input className="input" required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="কোড * (যেমন RNG)"><input className="input uppercase" required maxLength={5} value={edit.code ?? ""} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="ঠিকানা" className="sm:col-span-2"><input className="input" value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></Field>
            <div className="sm:col-span-2"><LocationPicker withVillage={false} value={{ district: edit.district ?? "", upazila: edit.upazila ?? "", union: "" }} onChange={(v) => setEdit({ ...edit, district: v.district, upazila: v.upazila })} /></div>
            <Field label="ফোন"><input className="input" value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="ম্যানেজার"><input className="input" value={edit.manager ?? ""} onChange={(e) => setEdit({ ...edit, manager: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={edit.isActive ?? true} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} /> সক্রিয়</label>
            <button disabled={pending} className="btn-primary sm:col-span-2">{pending && <Spinner />} সংরক্ষণ</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Service areas ---------- */
export function AreaManager({ areas, branches, branchId }: { areas: (ServiceArea & { branchName: string })[]; branches: Branch[]; branchId: number | null }) {
  const [loc, setLoc] = useState({ district: "", upazila: "", union: "" });
  const [bId, setBId] = useState(branchId ?? branches[0]?.id);
  const [preview, setPreview] = useState<string>(branches[0]?.district ?? "Rangpur");
  const [selUnions, setSelUnions] = useState<string[]>([]);
  const [selVillages, setSelVillages] = useState<string[]>([]);
  const { pending, run } = useAct();
  const sugg = loc.district && loc.upazila ? unionsOf(loc.district, loc.upazila) : [];
  const activeUnion = selUnions.length === 1 ? selUnions[0] : loc.union;
  const vSugg = loc.district && loc.upazila && activeUnion ? villagesOf(loc.district, loc.upazila, activeUnion) : [];
  const addSelected = () => {
    const c = districtCoords(loc.district);
    const rows: { union?: string; village?: string }[] = [];
    if (selVillages.length && activeUnion) {
      for (const v of selVillages) rows.push({ union: activeUnion, village: v });
    } else if (selUnions.length) {
      for (const u of selUnions) rows.push({ union: u });
    } else rows.push({ union: loc.union || undefined });
    run(async () => { for (const r of rows) await saveArea({ branchId: bId, district: loc.district, upazila: loc.upazila || undefined, union: r.union, village: r.village, ...c }); return { ok: true }; }, `${rows.length} টি এলাকা যুক্ত হয়েছে`, () => { setLoc({ district: "", upazila: "", union: "" }); setSelUnions([]); setSelVillages([]); });
  };
  return (
    <div>
      <PageTitle title="সার্ভিস এলাকা" subtitle="জেলা / উপজেলা / ইউনিয়ন নির্বাচন করুন — এর ভেতরের সব গ্রাম স্বয়ংক্রিয়ভাবে অন্তর্ভুক্ত হবে" />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm font-bold">নতুন এলাকা যোগ</p>
            <div className="mt-3 space-y-3">
              <Field label="শাখা"><select className="input" value={bId} onChange={(e) => setBId(Number(e.target.value))}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
              <LocationPicker withVillage={false} compact allowEmpty value={loc} onChange={(v) => { setLoc(v); setPreview([v.union, v.upazila, v.district].filter(Boolean).join(" ")); }} />
              <p className="text-[11px] text-ink-500">জেলা ও উপজেলা/থানা দিলে Google Map ডিটেক্ট করে সেই এলাকার সব ইউনিয়ন ও গ্রামের তালিকা সাজেশন হিসেবে দেখাবে — গ্রামগুলো ইউনিয়নের অন্তর্ভুক্ত থাকে।</p>
              {sugg.length > 0 && (
                <div className="rounded-2xl border border-ink-200 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold">ডিটেক্ট করা ইউনিয়নসমূহ ({sugg.length})</p><button onClick={() => setSelUnions(selUnions.length === sugg.length ? [] : [...sugg])} className="text-[11px] font-semibold text-brand-600 underline">{selUnions.length === sugg.length ? "আনসিলেক্ট অল" : "সিলেক্ট অল"}</button></div>
                  <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    {sugg.map((u) => (
                      <button key={u} onClick={() => setSelUnions((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u]))} className={cn("rounded-lg border px-2 py-1 text-[11px] font-semibold", selUnions.includes(u) ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200" : "border-ink-200 dark:border-white/10")}>{u}</button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-ink-400">{selUnions.length ? `${selUnions.length} টি ইউনিয়ন নির্বাচিত (প্রতিটির সব গ্রাম অন্তর্ভুক্ত)` : "কিছু না বাছলে পুরো উপজেলা কভার হবে"}</p>
                </div>
              )}
              {vSugg.length > 0 && (
                <div className="rounded-2xl border border-ink-200 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between"><p className="text-xs font-bold">{activeUnion} এর গ্রামসমূহ ({vSugg.length}) — অটো-ডিটেক্টেড</p><button onClick={() => setSelVillages(selVillages.length === vSugg.length ? [] : [...vSugg])} className="text-[11px] font-semibold text-brand-600 underline">{selVillages.length === vSugg.length ? "আনসিলেক্ট অল" : "সিলেক্ট অল"}</button></div>
                  <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                    {vSugg.map((v) => (
                      <button key={v} onClick={() => setSelVillages((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))} className={cn("rounded-lg border px-2 py-1 text-[11px] font-semibold", selVillages.includes(v) ? "border-sun-500 bg-sun-50 text-sun-800 dark:bg-sun-500/10 dark:text-sun-200" : "border-ink-200 dark:border-white/10")}>{v}</button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-ink-400">{selVillages.length ? `${selVillages.length} টি গ্রাম নির্বাচিত` : "গ্রাম না বাছলে পুরো ইউনিয়নের সব গ্রাম কভার হবে"}</p>
                </div>
              )}
              <button disabled={pending || !loc.district || !bId} onClick={() => { if (sugg.length) addSelected(); else { const c = districtCoords(loc.district); run(() => saveArea({ branchId: bId, ...loc, ...c }), "এলাকা যুক্ত হয়েছে", () => setLoc({ district: "", upazila: "", union: "" })); } }} className="btn-primary w-full">{pending && <Spinner />} <MapPin className="h-4 w-4" /> এলাকা যুক্ত করুন</button>
            </div>
          </div>
          <div className="card overflow-hidden"><iframe title="preview" src={mapEmbedUrl(preview || "Bangladesh")} className="h-64 w-full border-0" loading="lazy" /><p className="p-2 text-center text-[11px] text-ink-500">Google Map প্রিভিউ: {preview || "এলাকা নির্বাচন করুন"}</p></div>
        </div>
        <div className="space-y-4">
          {branches.filter((b) => !branchId || b.id === branchId).map((b) => (
            <div key={b.id} className="card p-4">
              <p className="flex items-center gap-2 font-bold"><Store className="h-4 w-4 text-brand-600" /> {b.name} <Badge tone="slate">{areas.filter((a) => a.branchId === b.id).length} এলাকা</Badge></p>
              <div className="mt-3 flex flex-wrap gap-2">
                {areas.filter((a) => a.branchId === b.id).length === 0 && <p className="text-xs text-ink-400">কোনো সার্ভিস এলাকা নেই — এই শাখার পণ্য শুধু COD তে যাবে</p>}
                {areas.filter((a) => a.branchId === b.id).map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
                    <button onClick={() => setPreview([a.union, a.upazila, a.district].filter(Boolean).join(" "))} className="hover:underline"><MapPin className="mr-1 inline h-3 w-3" />{areaLabel(a)}{!a.upazila && " (পুরো জেলা)"}{a.upazila && !a.union && " (পুরো উপজেলা)"}</button>
                    <button onClick={() => run(() => deleteArea(a.id), "এলাকা মুছে ফেলা হয়েছে")} className="rounded-lg p-1 text-rose-500 hover:bg-rose-100"><Trash2 className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Customers ---------- */
export function CustomersTable({ customers }: { customers: (User & { orders: number; spent: number; lastOrder: Date | null })[] }) {
  const [q, setQ] = useState("");
  const [blockAsk, setBlockAsk] = useState<{ id: number; name: string; blocked: boolean } | null>(null);
  const { run } = useAct();
  const list = customers.filter((c) => !q || [c.name, c.phone, c.district, c.upazila, c.village].some((x) => x?.toLowerCase().includes(q.toLowerCase())));
  const pdf = () => exportPdf({ title: "Customer List", filename: "customers", tables: [{ title: `${list.length} customers`, columns: ["Name", "Phone", "Village", "Union", "Upazila", "District", "Orders", "Spent", "Joined"], rows: list.map((c) => [c.name, c.phone, c.village ?? "", c.union ?? "", c.upazila ?? "", c.district ?? "", c.orders, c.spent, formatDate(c.createdAt)]) }] });
  return (
    <div>
      <PageTitle title="কাস্টমার" subtitle={`${customers.length} জন নিবন্ধিত কাস্টমার (অনলাইন ও মাঠ থেকে)`} action={<button onClick={pdf} className="btn-outline !px-3"><FileDown className="h-4 w-4" /> PDF</button>} />
      <div className="card">
        <div className="border-b border-ink-100 p-3 dark:border-white/10"><input className="input" placeholder="নাম, ফোন, এলাকা খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>কাস্টমার</th><th>ফোন</th><th>ইউনিক আইডি</th><th>ঠিকানা</th><th>অর্ডার</th><th>মোট ক্রয়</th><th>শেষ অর্ডার</th><th>অ্যাকাউন্ট</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><div className="flex items-center gap-2"><Avatar name={c.name} size="sm" /><div><p className="font-semibold">{c.name}</p><p className="text-[10px] text-ink-400">যোগ {formatDate(c.createdAt)}</p></div></div></td>
                  <td className="font-mono text-xs">{c.phone}</td>
                  <td className="font-mono text-[11px]">{c.uniqueId ?? <span className="text-ink-300">নেই</span>}</td>
                  <td className="text-xs">{[c.village, areaLabel(c)].filter(Boolean).join(", ")}</td>
                  <td className="font-bold">{c.orders}</td><td className="font-bold">{formatMoney(c.spent)}</td>
                  <td className="text-xs text-ink-500">{c.lastOrder ? formatDate(c.lastOrder) : "-"}</td>
                  <td>{c.passwordHash ? <Badge tone="emerald">অনলাইন</Badge> : <Badge tone="amber">শুধু মাঠ</Badge>}{c.blocked && <Badge tone="rose">ব্লকড</Badge>}</td>
                  <td><button onClick={() => setBlockAsk({ id: c.id, name: c.name, blocked: !!c.blocked })} className="btn-ghost !px-2 !py-1 text-[11px]"><Power className="h-3 w-3" /> {c.blocked ? "আনব্লক" : "ব্লক"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={!!blockAsk} onClose={() => setBlockAsk(null)} title={blockAsk?.blocked ? "আনব্লক নিশ্চিত করুন" : "ব্লক নিশ্চিত করুন"} size="sm">
        <p className="text-sm text-ink-600 dark:text-ink-300">{blockAsk?.blocked ? <>{blockAsk?.name} কে আনব্লক করবেন? উনি আবার লগইন ও অর্ডার করতে পারবেন।</> : <>{blockAsk?.name} কে ব্লক করবেন? ব্লক করা কাস্টমার লগইন করতে পারবে না এবং কর্মীরা তার কাছে পণ্য বিক্রি করতে পারবে না।</>}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setBlockAsk(null)} className="btn-ghost flex-1">বাতিল</button>
          <button onClick={async () => { const r = await toggleBlockCustomerAction(blockAsk!.id, !blockAsk!.blocked); if (r.ok) run(async () => ({ ok: true }), blockAsk!.blocked ? "আনব্লক হয়েছে" : "ব্লক হয়েছে"); setBlockAsk(null); }} className={blockAsk?.blocked ? "btn-primary flex-1" : "btn-danger flex-1"}>হ্যাঁ, নিশ্চিত</button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Notifications page ---------- */
export function NotificationsList({ items }: { items: Notification[] }) {
  return (
    <div>
      <PageTitle title="নোটিফিকেশন ইতিহাস" subtitle="অর্ডার, মাঠ বিক্রয়, গোডাউন ও স্টক আপডেট" />
      <div className="card divide-y divide-ink-100 dark:divide-white/5">
        {items.length === 0 && <div className="p-6"><Empty title="কোনো নোটিফিকেশন নেই" /></div>}
        {items.map((n) => (
          <a key={n.id} href={n.link ?? "#"} className="flex gap-3 p-4 hover:bg-ink-50 dark:hover:bg-white/5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><Bell className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{n.title} {!n.isRead && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-rose-500" />}</p><p className="text-xs text-ink-500">{n.message}</p><p className="mt-0.5 text-[10px] text-ink-400">{formatDate(n.createdAt, true)} • {n.type}</p></div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
export function SettingsPanel({ demoCount, settings, reviews, kb, pushStatus }: { demoCount: number; settings: Settings; reviews: Review[]; kb: HelpdeskKb[]; pushStatus: { pusher: boolean; vapid: boolean; subs: number } }) {
  const { pending, run } = useAct();
  const [st, setSt] = useState({ siteName: settings.siteName, logoUrl: settings.logoUrl ?? "", faviconUrl: settings.faviconUrl ?? "", bannerUrl: settings.bannerUrl ?? "", heroTitle: settings.heroTitle ?? "", pusherAppId: settings.pusherAppId ?? "", pusherKey: settings.pusherKey ?? "", pusherSecret: settings.pusherSecret ?? "", pusherCluster: settings.pusherCluster ?? "", deliveryFeeIn: settings.deliveryFeeIn, deliveryFeeOut: settings.deliveryFeeOut, reviewsAutoShow: settings.reviewsAutoShow, openrouterKey: settings.openrouterKey ?? "", openrouterModel: settings.openrouterModel ?? "openrouter/free", aiHelpdesk: settings.aiHelpdesk });
  const [kbEdit, setKbEdit] = useState<{ id?: number; question: string; answer: string } | null>(null);
  return (
    <div>
      <PageTitle title="সেটিংস" subtitle="স্টোরফ্রন্ট, ডেলিভারি ফি, রিভিউ, হেল্পডেস্ক, Pusher ও ডেমো ডাটা" action={<button disabled={pending} onClick={() => run(() => saveSettingsAction(st), "সেটিংস সেভ হয়েছে")} className="btn-primary">সেভ করুন</button>} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <p className="font-bold">🏬 স্টোরফ্রন্ট ব্র্যান্ডিং</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="সাইটের নাম"><input className="input" value={st.siteName} onChange={(e) => setSt({ ...st, siteName: e.target.value })} /></Field>
            <Field label="হিরো টাইটেল"><input className="input" value={st.heroTitle} onChange={(e) => setSt({ ...st, heroTitle: e.target.value })} /></Field>
            <Field label="লোগো URL / আপলোড"><input className="input" value={st.logoUrl} onChange={(e) => setSt({ ...st, logoUrl: e.target.value })} placeholder="/logo.png বা https://..." /></Field>
            <Field label="Favicon URL"><input className="input" value={st.faviconUrl} onChange={(e) => setSt({ ...st, faviconUrl: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="ব্যানার ছবি URL"><input className="input" value={st.bannerUrl} onChange={(e) => setSt({ ...st, bannerUrl: e.target.value })} /></Field></div>
          </div>
        </div>
        <div className="card p-5">
          <p className="font-bold">🚚 ক্যাশ অন ডেলিভারি ফি</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="সার্ভিস এলাকার ভিতরে (৳)"><input type="number" className="input" value={st.deliveryFeeIn} onChange={(e) => setSt({ ...st, deliveryFeeIn: Number(e.target.value) })} /></Field>
            <Field label="সার্ভিস এলাকার বাইরে (৳)"><input type="number" className="input" value={st.deliveryFeeOut} onChange={(e) => setSt({ ...st, deliveryFeeOut: Number(e.target.value) })} /></Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={st.reviewsAutoShow} onChange={(e) => setSt({ ...st, reviewsAutoShow: e.target.checked })} /> নতুন রিভিউ অটো-পাবলিশ (অফ থাকলে এডমিন অনুমোদন লাগবে)</label>
          <p className="mt-3 font-bold">📡 Pusher (রিয়েল-টাইম)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="App ID" value={st.pusherAppId} onChange={(e) => setSt({ ...st, pusherAppId: e.target.value })} />
            <input className="input" placeholder="Key" value={st.pusherKey} onChange={(e) => setSt({ ...st, pusherKey: e.target.value })} />
            <input className="input" placeholder="Secret" value={st.pusherSecret} onChange={(e) => setSt({ ...st, pusherSecret: e.target.value })} />
            <input className="input" placeholder="Cluster (ap2)" value={st.pusherCluster} onChange={(e) => setSt({ ...st, pusherCluster: e.target.value })} />
          </div>
        </div>
        <div className="card p-5">
          <p className="font-bold">⭐ রিভিউ moderations ({reviews.length})</p>
          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{r.customerName} • {"★".repeat(r.rating)}</p><Badge tone={r.status === "approved" ? "emerald" : r.status === "hidden" ? "rose" : "amber"}>{r.status}</Badge></div>
                <p className="mt-1 text-xs text-ink-500">{r.comment}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => run(() => setReviewStatusAction(r.id, "approved"), "রিভিউ পাবলিশ হয়েছে")} className="btn-outline !px-2 !py-1 text-[11px]">পাবলিশ</button>
                  <button onClick={() => run(() => setReviewStatusAction(r.id, "hidden"), "রিভিউ লুকানো হয়েছে")} className="btn-ghost !px-2 !py-1 text-[11px]">লুকাও</button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-xs text-ink-400">এখনো কোনো রিভিউ নেই</p>}
          </div>
        </div>
        <div className="card p-5">
          <p className="font-bold">🤖 AI সহকারী (OpenRouter)</p>
          <p className="mt-1 text-xs text-ink-500">নলেজ বেসে উত্তর না মিললে AI একটি খসড়া উত্তর দেবে এবং আপনাকে নোটিফিকেশন পাঠাবে — আপনি চাইলে সংশোধন করতে পারবেন। কী না দিলে সিস্টেম আগের মতোই চলবে।</p>
          <div className="mt-3 space-y-3">
            <Field label="OpenRouter API Key" hint="openrouter.ai → Keys থেকে নিন (sk-or-v1-...)">
              <input type="password" className="input" value={st.openrouterKey} onChange={(e) => setSt({ ...st, openrouterKey: e.target.value })} placeholder="sk-or-v1-..." />
            </Field>
            <Field label="মডেল" hint="ফ্রি রাউটার: openrouter/free">
              <input className="input" value={st.openrouterModel} onChange={(e) => setSt({ ...st, openrouterModel: e.target.value })} placeholder="openrouter/free" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={st.aiHelpdesk} onChange={(e) => setSt({ ...st, aiHelpdesk: e.target.checked })} /> হেল্পডেস্কে AI উত্তর চালু করুন
            </label>
            <p className="rounded-xl bg-ink-50 p-2 text-[11px] text-ink-500 dark:bg-white/5">সেটআপ গাইড: <code className="rounded bg-ink-100 px-1 dark:bg-white/10">instructions.md</code> → “OpenRouter AI সেটআপ”।</p>
          </div>
        </div>
        <div className="card p-5">
          <p className="font-bold"> রিয়েল-টাইম ও পুশ স্ট্যাটাস</p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 dark:bg-white/5"><span>Pusher (লাইভ ডাটা + ইন-অ্যাপ)</span>{pushStatus.pusher ? <Badge tone="emerald">কানেক্টেড কনফিগ</Badge> : <Badge tone="amber">কী সেট নেই — পোলিং চলছে</Badge>}</p>
            <p className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 dark:bg-white/5"><span>Web Push VAPID (PC/Android/iOS)</span>{pushStatus.vapid ? <Badge tone="emerald">কনফিগার্ড</Badge> : <Badge tone="amber">কী সেট নেই</Badge>}</p>
            <p className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 dark:bg-white/5"><span>সাবস্ক্রাইব করা ডিভাইস</span><b>{pushStatus.subs} টি</b></p>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">সেটআপ গাইড: প্রজেক্ট রুটের <code className="rounded bg-ink-100 px-1 dark:bg-white/10">instructions.md</code> → “Pusher ও Web Push সেটআপ গাইড” — অ্যাকাউন্ট খোলা, কী পাওয়া এবং কোথায় বসাবেন সব ধাপে দেওয়া আছে।</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center justify-between font-bold">💬 হেল্পডেস্ক নলেজ বেস <button onClick={() => setKbEdit({ question: "", answer: "" })} className="btn-outline !px-2 !py-1 text-[11px]">+ নতুন</button></p>
          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
            {kb.map((k) => (
              <div key={k.id} className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                <p className="text-sm font-semibold">প্রশ্ন: {k.question}</p>
                <p className="mt-1 text-xs text-ink-500">উত্তর: {k.answer}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setKbEdit({ id: k.id, question: k.question, answer: k.answer })} className="btn-outline !px-2 !py-1 text-[11px]">এডিট</button>
                  <button onClick={() => run(() => helpdeskKbDeleteAction(k.id), "মুছে ফেলা হয়েছে")} className="btn-ghost !px-2 !py-1 text-[11px] text-rose-500">মুছুন</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 font-bold"><Database className="h-5 w-5 text-brand-600" /> ডেমো / টেস্ট ডাটা</p>
          <p className="mt-1 text-sm text-ink-500">বর্তমানে {demoCount} টি ডেমো পণ্য রয়েছে। প্রোডাকশনে যাওয়ার সময় এনভায়রনমেন্টে <code className="rounded bg-ink-100 px-1 dark:bg-white/10">DEMO_DATA=false</code> সেট করলে সার্ভার চালু হওয়ার সময় সব ডেমো ডাটা স্বয়ংক্রিয়ভাবে মুছে যাবে এবং শুধু এডমিন অ্যাকাউন্ট ও মূল শাখা থাকবে।</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={pending} onClick={() => confirm("সব ডেমো ডাটা মুছে ফেলবেন?") && run(() => resetDemoData("remove"), "ডেমো ডাটা মুছে ফেলা হয়েছে")} className="btn-danger"><Trash2 className="h-4 w-4" /> ডেমো ডাটা মুছুন</button>
            <button disabled={pending} onClick={() => confirm("ডেমো ডাটা আবার তৈরি করবেন?") && run(() => resetDemoData("reseed"), "ডেমো ডাটা পুনরায় তৈরি হয়েছে")} className="btn-outline"><RefreshCw className="h-4 w-4" /> রিসিড করুন</button>
            {pending && <Spinner className="self-center" />}
          </div>
        </div>
        <div className="card p-5">
          <p className="font-bold">রিয়েল-টাইম নোটিফিকেশন</p>
          <p className="mt-1 text-sm text-ink-500">ডিফল্টভাবে সিস্টেম ৫ সেকেন্ড পরপর লাইভ পোলিং করে। Pusher ব্যবহার করতে চাইলে এনভায়রনমেন্টে যোগ করুন:</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-900 p-3 text-[11px] text-brand-200">{`PUSHER_APP_ID=...\nPUSHER_KEY=...\nPUSHER_SECRET=...\nPUSHER_CLUSTER=ap2\nNEXT_PUBLIC_PUSHER_KEY=...\nNEXT_PUBLIC_PUSHER_CLUSTER=ap2`}</pre>
          <p className="mt-3 text-xs text-ink-500">ডিফল্ট এডমিন: <b>01700000000 / admin123</b> — প্রোডাকশনে <code>ADMIN_PHONE</code>, <code>ADMIN_PASSWORD</code>, <code>AUTH_SECRET</code> সেট করুন।</p>
        </div>
      </div>
      <Modal open={!!kbEdit} onClose={() => setKbEdit(null)} title="নলেজ বেস এন্ট্রি">
        {kbEdit && (
          <div className="space-y-3">
            <Field label="প্রশ্ন"><input className="input" value={kbEdit.question} onChange={(e) => setKbEdit({ ...kbEdit, question: e.target.value })} /></Field>
            <Field label="উত্তর"><textarea className="input" rows={3} value={kbEdit.answer} onChange={(e) => setKbEdit({ ...kbEdit, answer: e.target.value })} /></Field>
            <button onClick={() => { run(() => helpdeskKbSaveAction(kbEdit), "সেভ হয়েছে"); setKbEdit(null); }} className="btn-primary w-full">সেভ করুন</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
