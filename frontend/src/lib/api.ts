export type Role = "ADMIN" | "USER";
export type SaleStatus = "PENDING" | "APPROVED" | "REJECTED";
export type WithdrawalStatus = "PENDING" | "APPROVED" | "FAILED" | "CANCELLED" | "REJECTED";

export type UserProfile = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  withdrawable_balance: number;
};

export type PayoutUser = UserProfile;

export type Sale = {
  id: number;
  user_id: number;
  customer_name: string;
  product_name: string;
  gross_amount: string;
  commission_amount: string;
  status: SaleStatus;
  advance_paid: boolean;
  advance_amount: string;
  final_paid_amount: string;
  rejection_deduction_amount: string;
  created_at: string;
  decided_at: string | null;
};

export type Withdrawal = {
  id: number;
  user_id: number;
  amount: string;
  status: WithdrawalStatus;
  note: string | null;
  requested_at: string;
  resolved_at: string | null;
};

export type Transaction = {
  id: number;
  user_id: number;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: string;
  balance_after: string;
  reference_type: string;
  reference_id: number;
  description: string;
  created_at: string;
};

export type AuditLog = {
  id: number;
  actor_user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  created_at: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type Dashboard = {
  summary: {
    pending_earnings: string;
    advance_paid: string;
    final_payout: string;
    withdrawable_balance: string;
  };
  status_counts: {
    pending_sales: number;
    approved_sales: number;
    rejected_sales: number;
    pending_withdrawals: number;
  };
  recent_sales: Sale[];
  recent_transactions: Transaction[];
  recent_withdrawals: Withdrawal[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("payfam_token");
}

export function setSession(token: string, user: UserProfile) {
  window.localStorage.setItem("payfam_token", token);
  window.localStorage.setItem("payfam_user", JSON.stringify(user));
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("payfam_user");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  window.localStorage.removeItem("payfam_token");
  window.localStorage.removeItem("payfam_user");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Request failed");
  }
  return response.json();
}
