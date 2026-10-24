import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const APP_NAME = "SurjoSangstha";
export const APP_TAGLINE = "সহজ কিস্তিতে বিশ্বস্ত কেনাকাটা";

export function formatMoney(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0);
  return "৳" + n.toLocaleString("en-BD", { maximumFractionDigits: 0 });
}

export function formatDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

export function uid(prefix = "") {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

export function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `SS-${stamp}-${rnd}`;
}

export const INSTALLMENT_LABEL: Record<"daily" | "weekly" | "monthly", { en: string; bn: string; per: string }> = {
  daily: { en: "Daily", bn: "দৈনিক", per: "/day" },
  weekly: { en: "Weekly", bn: "সাপ্তাহিক", per: "/week" },
  monthly: { en: "Monthly", bn: "মাসিক", per: "/month" },
};

export const ORDER_TYPE_LABEL: Record<"cod" | "cash" | "installment", { en: string; bn: string }> = {
  cod: { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  cash: { en: "Cash Sale", bn: "নগদ ক্রয়" },
  installment: { en: "Installment", bn: "কিস্তিতে ক্রয়" },
};

export const STATUS_LABEL: Record<string, { en: string; bn: string; tone: string }> = {
  pending: { en: "Pending", bn: "অপেক্ষমাণ", tone: "amber" },
  accepted: { en: "Accepted", bn: "গৃহীত", tone: "emerald" },
  rejected: { en: "Rejected", bn: "বাতিল", tone: "rose" },
  delivered: { en: "Delivered", bn: "ডেলিভারড", tone: "sky" },
  cancelled: { en: "Cancelled", bn: "ক্যানসেল", tone: "slate" },
};

export interface InstallmentPlanInput {
  price: number;
  cashPrice: number;
  downPayment: number;
  installmentAmount: number;
  installmentCount: number;
  installmentType: "daily" | "weekly" | "monthly";
  firstInstallmentAfterDays: number;
}

export function installmentPlan(p: InstallmentPlanInput) {
  const totalInstallments = p.installmentAmount * p.installmentCount;
  const totalPayable = p.downPayment + totalInstallments;
  const extraOverCash = Math.max(0, totalPayable - p.cashPrice);
  const durationDays =
    p.installmentType === "daily" ? p.installmentCount : p.installmentType === "weekly" ? p.installmentCount * 7 : p.installmentCount * 30;
  const firstDue = new Date();
  firstDue.setDate(firstDue.getDate() + p.firstInstallmentAfterDays);
  return {
    totalInstallments,
    totalPayable,
    extraOverCash,
    durationDays,
    durationLabel:
      p.installmentType === "daily"
        ? `${p.installmentCount} দিন`
        : p.installmentType === "weekly"
          ? `${p.installmentCount} সপ্তাহ`
          : `${p.installmentCount} মাস`,
    firstDue,
    savingsPercent: p.price > 0 ? Math.round(((p.price - p.cashPrice) / p.price) * 100) : 0,
  };
}

export interface AreaLike {
  district?: string | null;
  upazila?: string | null;
  union?: string | null;
  village?: string | null;
}

/** Whether a customer's location falls inside any service area of a branch. */
export function isInsideServiceArea(customer: AreaLike, areas: AreaLike[]) {
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const cd = norm(customer.district);
  const cu = norm(customer.upazila);
  const cn = norm(customer.union);
  const cv = norm(customer.village);
  if (!cd) return false;
  return areas.some((a) => {
    if (norm(a.district) !== cd) return false;
    if (a.upazila && norm(a.upazila) !== cu) return false;
    if (a.union && norm(a.union) !== cn) return false;
    const av = a.village;
    if (av && norm(av) !== cv) return false;
    return true;
  });
}

export function areaLabel(a: AreaLike) {
  return [a.village, a.union, a.upazila, a.district].filter(Boolean).join(", ");
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function productImage(images: string[] | null | undefined, idx = 0) {
  if (images && images.length > idx) return images[idx];
  return "/logo.png";
}

export type PaymentType = "cod" | "cash" | "installment";
