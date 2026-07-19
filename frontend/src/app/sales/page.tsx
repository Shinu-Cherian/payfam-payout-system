"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, FastForward, Plus, Search, X } from "lucide-react";
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
import { apiFetch, type Page, type PayoutUser, type Sale, type SaleStatus, type UserProfile } from "@/lib/api";
import { currency, shortDate } from "@/lib/utils";

type SaleForm = {
  user_id: string;
  customer_name: string;
  product_name: string;
  gross_amount: string;
  commission_amount: string;
};

const emptyForm: SaleForm = {
  user_id: "",
  customer_name: "",
  product_name: "",
  gross_amount: "",
  commission_amount: "",
};

export default function SalesPage() {
  return (
    <RequireAuth>
      {(user) => (
        <AppShell>
          <SalesContent user={user} />
        </AppShell>
      )}
    </RequireAuth>
  );
}

function SalesContent({ user }: { user: UserProfile }) {
  const [sales, setSales] = useState<Page<Sale> | null>(null);
  const [users, setUsers] = useState<PayoutUser[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SaleForm>(emptyForm);

  async function loadSales() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: "1", page_size: "10" });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    try {
      setSales(await apiFetch<Page<Sale>>(`/sales?${params.toString()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, [status]);

  useEffect(() => {
    if (user.role !== "ADMIN") return;
    apiFetch<PayoutUser[]>("/users")
      .then((items) => {
        setUsers(items);
        setForm((current) => ({ ...current, user_id: current.user_id || String(items[0]?.id ?? "") }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load users"));
  }, [user.role]);

  async function createSale(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      await apiFetch<Sale>("/sales", {
        method: "POST",
        body: JSON.stringify({
          user_id: Number(form.user_id),
          customer_name: form.customer_name.trim(),
          product_name: form.product_name.trim(),
          gross_amount: Number(form.gross_amount),
          commission_amount: Number(form.commission_amount),
        }),
      });
      setToast("Sale added");
      setCreateOpen(false);
      setForm({ ...emptyForm, user_id: String(users[0]?.id ?? "") });
      await loadSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add sale");
    } finally {
      setCreating(false);
    }
  }

  async function reconcile(saleId: number, decision: SaleStatus) {
    try {
      await apiFetch(`/sales/${saleId}/reconcile`, {
        method: "PATCH",
        body: JSON.stringify({ status: decision }),
      });
      setToast(`Sale ${decision.toLowerCase()}`);
      await loadSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reconcile sale");
    }
  }

  async function runAdvance(saleId?: number) {
    try {
      const result = await apiFetch<{ processed_count: number; total_amount: string }>("/payouts/advance", {
        method: "POST",
        body: JSON.stringify({ sale_id: saleId ?? null }),
      });
      setToast(`${result.processed_count} advance payout(s) processed`);
      await loadSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run advance payout");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-cyprus">Sales</h1>
          <p className="mt-1 text-sm text-[#65736F]">Create affiliate sales, run advances, and reconcile final payouts.</p>
        </div>
        {user.role === "ADMIN" ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Sale
            </Button>
            <Button onClick={() => runAdvance()}>
              <FastForward className="h-4 w-4" />
              Run Advance
            </Button>
          </div>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sales Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7C8A85]" />
              <Input
                className="pl-9"
                placeholder="Search customer or product"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
            <Button variant="secondary" onClick={loadSales} disabled={loading}>
              Search
            </Button>
          </div>
          {error ? <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {sales?.items.length ? (
            <DataTable columns={["Sale", "Gross", "Commission", "Advance", "Status", "Created", "Actions"]}>
              {sales.items.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#102A27]">{sale.product_name}</div>
                    <div className="text-xs text-[#65736F]">
                      {sale.customer_name} - User #{sale.user_id}
                    </div>
                  </td>
                  <td className="px-4 py-3">{currency(sale.gross_amount)}</td>
                  <td className="px-4 py-3">{currency(sale.commission_amount)}</td>
                  <td className="px-4 py-3">{sale.advance_paid ? currency(sale.advance_amount) : "Not paid"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="px-4 py-3 text-[#65736F]">{shortDate(sale.created_at)}</td>
                  <td className="px-4 py-3">
                    {user.role === "ADMIN" && sale.status === "PENDING" ? (
                      <div className="flex flex-wrap gap-2">
                        {!sale.advance_paid ? (
                          <Button size="sm" variant="secondary" onClick={() => runAdvance(sale.id)}>
                            <FastForward className="h-4 w-4" />
                            Advance
                          </Button>
                        ) : null}
                        <Button size="sm" onClick={() => reconcile(sale.id, "APPROVED")}>
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => reconcile(sale.id, "REJECTED")}>
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-[#7C8A85]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              label={
                loading
                  ? "Loading sales..."
                  : user.role === "ADMIN"
                    ? "No sales found. Add the first sale from this page."
                    : "No sales assigned yet."
              }
            />
          )}
        </CardContent>
      </Card>
      <Dialog open={createOpen} title="Add sale" onClose={() => setCreateOpen(false)}>
        <form onSubmit={createSale} className="space-y-4">
          <label className="block text-sm font-medium text-[#102A27]">
            User
            <Select
              className="mt-2 w-full"
              value={form.user_id}
              onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
              required
            >
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name} ({item.email})
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-medium text-[#102A27]">
            Customer name
            <Input
              className="mt-2"
              value={form.customer_name}
              onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
              required
            />
          </label>
          <label className="block text-sm font-medium text-[#102A27]">
            Product name
            <Input
              className="mt-2"
              value={form.product_name}
              onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))}
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#102A27]">
              Gross amount
              <Input
                className="mt-2"
                type="number"
                min="1"
                step="0.01"
                value={form.gross_amount}
                onChange={(event) => setForm((current) => ({ ...current, gross_amount: event.target.value }))}
                required
              />
            </label>
            <label className="block text-sm font-medium text-[#102A27]">
              Commission
              <Input
                className="mt-2"
                type="number"
                min="1"
                step="0.01"
                value={form.commission_amount}
                onChange={(event) => setForm((current) => ({ ...current, commission_amount: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={creating || !form.user_id}>{creating ? "Adding..." : "Add Sale"}</Button>
          </div>
        </form>
      </Dialog>
      <Toast message={toast} />
    </div>
  );
}
