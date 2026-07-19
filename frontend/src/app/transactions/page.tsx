"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type Page, type Transaction } from "@/lib/api";
import { currency, shortDate } from "@/lib/utils";

export default function TransactionsPage() {
  return (
    <RequireAuth>
      {() => (
        <AppShell>
          <TransactionsContent />
        </AppShell>
      )}
    </RequireAuth>
  );
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Page<Transaction> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Page<Transaction>>("/transactions?page=1&page_size=20")
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load transactions"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-cyprus">Transactions</h1>
        <p className="mt-1 text-sm text-[#65736F]">Every balance-changing event recorded in order.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {transactions?.items.length ? (
            <DataTable columns={["Type", "Direction", "Amount", "Balance", "Reference", "Created"]}>
              {transactions.items.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#102A27]">{transaction.type.replaceAll("_", " ")}</div>
                    <div className="text-xs text-[#65736F]">{transaction.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={transaction.direction} />
                  </td>
                  <td className="px-4 py-3">{currency(transaction.amount)}</td>
                  <td className="px-4 py-3">{currency(transaction.balance_after)}</td>
                  <td className="px-4 py-3 text-[#65736F]">
                    {transaction.reference_type} #{transaction.reference_id}
                  </td>
                  <td className="px-4 py-3 text-[#65736F]">{shortDate(transaction.created_at)}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState label="No transactions found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
