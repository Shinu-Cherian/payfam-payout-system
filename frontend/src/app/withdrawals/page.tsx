"use client";

import { FormEvent, useEffect, useState } from "react";
import { CreditCard, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, type Page, type UserProfile, type Withdrawal, type WithdrawalStatus } from "@/lib/api";
import { currency, shortDate } from "@/lib/utils";

export default function WithdrawalsPage() {
  return (
    <RequireAuth>
      {(user) => (
        <AppShell>
          <WithdrawalsContent user={user} />
        </AppShell>
      )}
    </RequireAuth>
  );
}

function WithdrawalsContent({ user }: { user: UserProfile }) {
  const [withdrawals, setWithdrawals] = useState<Page<Withdrawal> | null>(null);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [resolution, setResolution] = useState<WithdrawalStatus>("APPROVED");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  async function loadWithdrawals() {
    const params = new URLSearchParams({ page: "1", page_size: "10" });
    if (status) params.set("status", status);
    try {
      setWithdrawals(await apiFetch<Page<Withdrawal>>(`/withdrawals?${params.toString()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load withdrawals");
    }
  }

  useEffect(() => {
    loadWithdrawals();
  }, [status]);

  async function submitWithdrawal(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setAmount("");
      setToast("Withdrawal requested");
      await loadWithdrawals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request withdrawal");
    }
  }

  async function resolveWithdrawal() {
    if (!selected) return;
    setError("");
    try {
      await apiFetch(`/withdrawals/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: resolution, note }),
      });
      setToast(`Withdrawal marked ${resolution.toLowerCase()}`);
      setSelected(null);
      setNote("");
      await loadWithdrawals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update withdrawal");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-cyprus">Withdrawals</h1>
        <p className="mt-1 text-sm text-[#65736F]">Requests, approvals, and returned balances for failed payouts.</p>
      </div>
      {user.role === "USER" ? (
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitWithdrawal} className="flex flex-col gap-3 sm:flex-row">
              <Input type="number" min="1" step="0.01" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <Button disabled={!amount}>
                <CreditCard className="h-4 w-4" />
                Withdraw
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Withdrawal Ledger</CardTitle>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {withdrawals?.items.length ? (
            <DataTable columns={["ID", "User", "Amount", "Status", "Requested", "Resolved", "Actions"]}>
              {withdrawals.items.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td className="px-4 py-3 font-medium text-[#102A27]">#{withdrawal.id}</td>
                  <td className="px-4 py-3">User #{withdrawal.user_id}</td>
                  <td className="px-4 py-3">{currency(withdrawal.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={withdrawal.status} />
                  </td>
                  <td className="px-4 py-3 text-[#65736F]">{shortDate(withdrawal.requested_at)}</td>
                  <td className="px-4 py-3 text-[#65736F]">{withdrawal.resolved_at ? shortDate(withdrawal.resolved_at) : "-"}</td>
                  <td className="px-4 py-3">
                    {user.role === "ADMIN" && withdrawal.status === "PENDING" ? (
                      <Button size="sm" variant="secondary" onClick={() => setSelected(withdrawal)}>
                        <RotateCcw className="h-4 w-4" />
                        Resolve
                      </Button>
                    ) : (
                      <span className="text-sm text-[#7C8A85]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState label="No withdrawals found" />
          )}
        </CardContent>
      </Card>
      <Dialog open={!!selected} title={`Resolve withdrawal #${selected?.id ?? ""}`} onClose={() => setSelected(null)}>
        <div className="space-y-4">
          <Select value={resolution} onChange={(event) => setResolution(event.target.value as WithdrawalStatus)} className="w-full">
            <option value="APPROVED">Approved</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </Select>
          <Input placeholder="Note" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={resolveWithdrawal}>Save</Button>
          </div>
        </div>
      </Dialog>
      <Toast message={toast} />
    </div>
  );
}
