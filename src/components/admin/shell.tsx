"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Package, Tags, ShoppingBag, Warehouse, Users, UserRound, Store, MapPinned, BarChart3, Bell, Settings, Menu, X, LogOut, ChevronDown, Building2, Globe2, ExternalLink , MessageCircle , Sparkles} from "lucide-react";
import { Avatar, Modal } from "@/components/ui";
import { NotificationCenter } from "@/components/notifications";
import { LiveRefresh } from "@/components/live-refresh";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import type { Branch } from "@/db/schema";
import { SiteLogo } from "@/components/brand";

const NAV = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/admin/orders", label: "অর্ডার", icon: ShoppingBag },
  { href: "/admin/products", label: "পণ্য", icon: Package },
  { href: "/admin/categories", label: "ক্যাটাগরি", icon: Tags },
  { href: "/admin/godown", label: "গোডাউন", icon: Warehouse },
  { href: "/admin/requests", label: "পণ্যের চাহিদা", icon: Sparkles },
  { href: "/admin/employees", label: "কর্মী", icon: Users },
  { href: "/admin/customers", label: "কাস্টমার", icon: UserRound },
  { href: "/admin/branches", label: "শাখা", icon: Store },
  { href: "/admin/areas", label: "সার্ভিস এলাকা", icon: MapPinned },
  { href: "/admin/reports", label: "রিপোর্ট", icon: BarChart3 },
  { href: "/admin/notifications", label: "নোটিফিকেশন", icon: Bell },
  { href: "/admin/settings", label: "সেটিংস", icon: Settings },
  { href: "/admin/helpdesk", label: "হেল্পডেস্ক", icon: MessageCircle },
];

export function AdminShell({ children, user, branches, currentBranch }: { children: ReactNode; user: { id: number; name: string; role: "admin" }; branches: Branch[]; currentBranch: string }) {
  const [open, setOpen] = useState(false);
  const [logoutAsk, setLogoutAsk] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const branch = branches.find((b) => String(b.id) === currentBranch);
  const setBranch = (v: string) => {
    document.cookie = `ss_branch=${v}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <SiteLogo className="h-10 w-10 rounded-xl" />
        <div><p className="text-base font-extrabold leading-tight">Surjo<span className="text-brand-500">Sangstha</span></p><p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Admin Console</p></div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30" : "text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-white/10 dark:hover:text-white")}>
              <n.icon className="h-[18px] w-[18px]" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-100 p-3 dark:border-white/10">
        <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-100 dark:hover:bg-white/10"><ExternalLink className="h-4 w-4" /> স্টোরফ্রন্ট দেখুন</Link>
        <button onClick={() => setLogoutAsk(true)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><LogOut className="h-4 w-4" /> লগআউট</button>
      </div>
    </div>
  );
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-ink-200/70 bg-white lg:block dark:border-white/10 dark:bg-ink-900">{Sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl dark:bg-ink-900">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-xl p-2 hover:bg-ink-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
            {Sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 glass border-b border-ink-200/60 dark:border-white/10">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-ink-100 lg:hidden dark:hover:bg-white/10"><Menu className="h-5 w-5" /></button>
            <div className="relative">
              <select value={currentBranch} onChange={(e) => setBranch(e.target.value)} className={cn("appearance-none rounded-xl border py-2 pl-9 pr-8 text-xs font-bold outline-none sm:text-sm", branch ? "border-sun-300 bg-sun-50 text-sun-900 dark:border-sun-500/30 dark:bg-sun-500/10 dark:text-sun-200" : "border-brand-300 bg-brand-50 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200")}>
                <option value="all">🌐 সব শাখা (Universal)</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
              {branch ? <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" /> : <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />}
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            </div>
            <span className="hidden text-[11px] text-ink-400 md:block">{branch ? `শুধু ${branch.name} এর ডাটা দেখানো হচ্ছে` : "সব শাখার সম্মিলিত (universal) ডাটা"}</span>
            <LiveRefresh channels={branch ? ["role-admin", `branch-${branch.id}`] : ["role-admin"]} />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <NotificationCenter userId={user.id} role="admin" />
              <div className="ml-1 flex items-center gap-2 rounded-xl border border-ink-200 py-1 pl-1 pr-3 dark:border-white/10"><Avatar name={user.name} size="sm" /><span className="hidden text-xs font-bold sm:block">{user.name}</span></div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <Modal open={logoutAsk} onClose={() => setLogoutAsk(false)} title="লগআউট করবেন?" size="sm">
        <p className="text-sm text-ink-500">আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setLogoutAsk(false)} className="btn-ghost flex-1">না, থাকছি</button>
          <form action={logoutAction} className="flex-1"><button className="btn-primary w-full">হ্যাঁ, লগআউট</button></form>
        </div>
      </Modal>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}</div>
      {action}
    </div>
  );
}
