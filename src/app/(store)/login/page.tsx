import { redirect } from "next/navigation";
import { ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import { LoginForm } from "@/components/store/auth-forms";
import { getSession } from "@/lib/auth";
import { SiteLogo } from "@/components/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "লগইন" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const s = await getSession();
  const { next } = await searchParams;
  if (s) redirect(s.role === "admin" ? "/admin" : s.role === "employee" ? "/employee" : "/account");
  return (
    <div className="container-x grid min-h-[70vh] items-center gap-8 py-10 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 p-10 text-white">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-sun-400/20" />
          <SiteLogo className="h-16 w-16 rounded-2xl" />
          <h2 className="mt-6 text-3xl font-extrabold">নিরাপদ লগইন</h2>
          <p className="mt-2 text-sm text-brand-100">আপনার অর্ডার, কিস্তির পণ্য ও প্রোফাইল এক জায়গায়। এডমিন ও কর্মীরা একই পোর্টাল থেকে লগইন করবেন।</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-sun-300" /> এনক্রিপ্টেড পাসওয়ার্ড ও সেশন</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sun-300" /> রোল-ভিত্তিক সুরক্ষিত ড্যাশবোর্ড</li>
            <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-sun-300" /> রিয়েল-টাইম অর্ডার আপডেট</li>
          </ul>
        </div>
      </div>
      <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">লগইন করুন</h1>
        <p className="mt-1 text-sm text-ink-500">কাস্টমার, কর্মী বা এডমিন — মোবাইল নম্বর দিয়ে লগইন করুন</p>
        <div className="mt-6"><LoginForm next={next} showDemo={process.env.DEMO_DATA !== "false"} /></div>
      </div>
    </div>
  );
}
