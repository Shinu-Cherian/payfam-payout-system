"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { apiFetch, setSession, type UserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<{ access_token: string; user: UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(response.access_token, response.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#FBFAF6] lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="hidden bg-[#FBFAF6] px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <div className="text-2xl font-bold text-cyprus">PayFam</div>
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase text-cyprus">Creator Payouts</p>
          <h1 className="text-5xl font-bold tracking-normal text-[#102A27]">Affiliate earnings, advances, reconciliation, and withdrawals.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#48625D]">
            A focused full-stack implementation for managing user payouts with role-based workflows and auditable balance changes.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-[#48625D]">
          <div className="rounded-lg border border-[#D9D4C8] bg-white/70 p-4">10% advances</div>
          <div className="rounded-lg border border-[#D9D4C8] bg-white/70 p-4">Final reconciliation</div>
          <div className="rounded-lg border border-[#D9D4C8] bg-white/70 p-4">Withdrawal recovery</div>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center border-l border-[#D9D4C8] bg-sand px-8 py-10 shadow-soft">
        <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-[#D9D4C8] bg-[#FBFAF6] p-8 shadow-soft">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-cyprus">Sign in</h2>
            <p className="mt-2 text-sm text-[#65736F]">Access your payout workspace.</p>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#102A27]">
              Email
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7C8A85]" />
                <Input className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </label>
            <label className="block text-sm font-medium text-[#102A27]">
              Password
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7C8A85]" />
                <Input className="pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </label>
            {error ? <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
