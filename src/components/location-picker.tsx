"use client";

import { BD_LOCATIONS, upazilasOf, unionsOf } from "@/lib/locations";
import { Field } from "@/components/ui";

export interface LocationValue { district: string; upazila: string; union: string; village?: string }

export function LocationPicker({ value, onChange, withVillage = true, compact = false, allowEmpty = false }: { value: LocationValue; onChange: (v: LocationValue) => void; withVillage?: boolean; compact?: boolean; allowEmpty?: boolean }) {
  const ups = upazilasOf(value.district);
  const uns = unionsOf(value.district, value.upazila);
  const known = BD_LOCATIONS.some((d) => d.name === value.district);
  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-3 sm:grid-cols-2"}>
      <Field label="জেলা (District)">
        <select className="input" value={known ? value.district : value.district ? "__other" : ""} onChange={(e) => onChange({ ...value, district: e.target.value === "__other" ? "Other" : e.target.value, upazila: "", union: "" })}>
          <option value="">{allowEmpty ? "সব জেলা" : "জেলা নির্বাচন"}</option>
          {BD_LOCATIONS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          <option value="__other">অন্যান্য (লিখুন)</option>
        </select>
        {!known && value.district && <input className="input mt-1.5" placeholder="জেলার নাম লিখুন" value={value.district === "Other" ? "" : value.district} onChange={(e) => onChange({ ...value, district: e.target.value || "Other" })} />}
      </Field>
      <Field label="উপজেলা / থানা">
        {ups.length ? (
          <select className="input" value={value.upazila} onChange={(e) => onChange({ ...value, upazila: e.target.value, union: "" })}>
            <option value="">{allowEmpty ? "সব উপজেলা" : "উপজেলা নির্বাচন"}</option>
            {ups.map((u) => <option key={u.name} value={u.name}>{u.name}</option>)}
          </select>
        ) : (
          <input className="input" placeholder="উপজেলার নাম" value={value.upazila} onChange={(e) => onChange({ ...value, upazila: e.target.value })} />
        )}
      </Field>
      <Field label="ইউনিয়ন / ওয়ার্ড">
        {uns.length ? (
          <select className="input" value={value.union} onChange={(e) => onChange({ ...value, union: e.target.value })}>
            <option value="">{allowEmpty ? "সব ইউনিয়ন" : "ইউনিয়ন নির্বাচন"}</option>
            {uns.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        ) : (
          <input className="input" placeholder="ইউনিয়নের নাম" value={value.union} onChange={(e) => onChange({ ...value, union: e.target.value })} />
        )}
      </Field>
      {withVillage && (
        <Field label="গ্রাম / মহল্লা">
          <input className="input" placeholder="গ্রামের নাম" value={value.village ?? ""} onChange={(e) => onChange({ ...value, village: e.target.value })} />
        </Field>
      )}
    </div>
  );
}
