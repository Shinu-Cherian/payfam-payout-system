"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardList, CreditCard, FileClock, LogOut, ReceiptText } from "lucide-react";
import { clearSession, getStoredUser, type Role, type UserProfile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BarChart3;
  roles: Role[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, roles: ["ADMIN", "USER"] },
  { href: "/sales", label: "Sales", icon: ClipboardList, roles: ["ADMIN", "USER"] },
  { href: "/withdrawals", label: "Withdrawals", icon: CreditCard, roles: ["ADMIN", "USER"] },
  { href: "/transactions", label: "Transactions", icon: ReceiptText, roles: ["ADMIN", "USER"] },
  { href: "/audit-logs", label: "Audit Logs", icon: FileClock, roles: ["ADMIN"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser() as UserProfile | null;

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#D9D4C8] bg-[#FBFAF6] p-5 lg:block">
        <div className="mb-8">
          <div className="text-xl font-bold text-cyprus">PayFam</div>
          <div className="mt-1 text-sm text-[#65736F]">Payout Management</div>
        </div>
        <nav className="space-y-1">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                    active ? "bg-sand text-cyprus" : "text-[#48625D] hover:bg-sand hover:text-cyprus",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#D9D4C8] bg-[#FBFAF6]/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#65736F]">{user?.role === "ADMIN" ? "Admin" : "User"} Workspace</p>
              <h1 className="text-lg font-semibold text-cyprus">{user?.full_name ?? "PayFam"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden text-right text-sm sm:block">
                <div className="font-medium text-[#102A27]">{user?.email}</div>
                <div className="text-[#65736F]">{user?.role}</div>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navItems
              .filter((item) => !user || item.roles.includes(user.role))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
                    pathname === item.href ? "bg-sand text-cyprus" : "text-[#48625D]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
