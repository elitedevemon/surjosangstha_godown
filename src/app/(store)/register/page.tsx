import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/store/auth-forms";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "রেজিস্টার" };

export default async function RegisterPage() {
  const s = await getSession();
  if (s) redirect("/account");
  return (
    <div className="container-x py-10">
      <div className="card mx-auto w-full max-w-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">কাস্টমার রেজিস্ট্রেশন</h1>
        <p className="mt-1 text-sm text-ink-500">আপনার এলাকা অনুযায়ী কিস্তি সুবিধা যাচাই করতে সঠিক ঠিকানা দিন। প্রতিটি মোবাইল নম্বরে একটি অ্যাকাউন্ট।</p>
        <div className="mt-6"><RegisterForm /></div>
      </div>
    </div>
  );
}
