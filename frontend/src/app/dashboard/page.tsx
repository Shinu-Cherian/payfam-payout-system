"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type Dashboard } from "@/lib/api";
import { currency, shortDate } from "@/lib/utils";

const summaryCards = [
  { key: "pending_earnings", label: "Pending Earnings", icon: Clock },
  { key: "advance_paid", label: "Advance Paid", icon: Banknote },
  { key: "final_payout", label: "Final Payout", icon: CheckCircle2 },
  { key: "withdrawable_balance", label: "Withdrawable Balance", icon: CreditCard },
] as const;

export default function DashboardPage() {
  return (
    <RequireAuth>
      {() => (
        <AppShell>
          <DashboardContent />
        </AppShell>
      )}
    </RequireAuth>
  );
}

function DashboardContent() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setDashboard(await apiFetch<Dashboard>("/dashboard"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (error) return <div className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  if (!dashboard) return <div className="text-sm text-[#65736F]">Loading dashboard...</div>;

  const counts = dashboard.status_counts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-cyprus">Dashboard</h1>
        <p className="mt-1 text-sm text-[#65736F]">Current earnings, payout activity, and recent balance changes.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#65736F]">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-cyprus">{currency(dashboard.summary[card.key])}</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-md bg-sand text-cyprus">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <StatusCount label="Pending Sales" value={counts.pending_sales} icon={<Clock className="h-4 w-4" />} />
        <StatusCount label="Approved Sales" value={counts.approved_sales} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatusCount label="Rejected Sales" value={counts.rejected_sales} icon={<XCircle className="h-4 w-4" />} />
        <StatusCount label="Pending Withdrawals" value={counts.pending_withdrawals} icon={<CreditCard className="h-4 w-4" />} />
      </section>
      <section className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recent_sales.length ? (
              <DataTable columns={["Sale", "Commission", "Advance", "Status"]}>
                {dashboard.recent_sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#102A27]">{sale.product_name}</div>
                      <div className="text-xs text-[#65736F]">{sale.customer_name}</div>
                    </td>
                    <td className="px-4 py-3">{currency(sale.commission_amount)}</td>
                    <td className="px-4 py-3">{currency(sale.advance_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sale.status} />
                    </td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState label="No sales found" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recent_transactions.length ? (
              <DataTable columns={["Type", "Amount", "Balance", "Created"]}>
                {dashboard.recent_transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#102A27]">{transaction.type.replaceAll("_", " ")}</div>
                      <div className="text-xs text-[#65736F]">{transaction.description}</div>
                    </td>
                    <td className="px-4 py-3">{currency(transaction.amount)}</td>
                    <td className="px-4 py-3">{currency(transaction.balance_after)}</td>
                    <td className="px-4 py-3 text-[#65736F]">{shortDate(transaction.created_at)}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState label="No transactions found" />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatusCount({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#D9D4C8] bg-white px-4 py-3">
      <div>
        <p className="text-sm text-[#65736F]">{label}</p>
        <p className="text-xl font-semibold text-cyprus">{value}</p>
      </div>
      <div className="text-cyprus">{icon}</div>
    </div>
  );
}
