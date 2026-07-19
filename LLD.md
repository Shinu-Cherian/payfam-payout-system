# Low Level Design - PayFam

## System Overview

PayFam is a monolithic payout management system. The frontend calls a FastAPI backend over REST. The backend owns authentication, business rules, persistence, and ledger/audit creation.

The design keeps routes thin. API routes validate input and delegate to service classes. Service classes contain payout, reconciliation, withdrawal, transaction, and dashboard logic.

## Database Design

### Users

Stores login identity, role, and current withdrawable balance.

Important fields:

- `id`
- `email`
- `full_name`
- `role`
- `password_hash`
- `withdrawable_balance`

### Sales

Stores affiliate sales and payout state.

Important fields:

- `user_id`
- `gross_amount`
- `commission_amount`
- `status`
- `advance_paid`
- `advance_amount`
- `final_paid_amount`
- `rejection_deduction_amount`

### AdvancePayouts

Stores advance payout records. `sale_id` is unique so one sale cannot be advanced twice.

### Withdrawals

Stores withdrawal requests and their final status. Funds are debited when a withdrawal is requested and credited back when a withdrawal fails, is cancelled, or is rejected.

### Transactions

Stores every balance-changing operation:

- advance payout credit
- final payout credit
- withdrawal debit
- withdrawal refund
- rejection deduction debit

### AuditLogs

Stores meaningful user/admin/system actions such as sale creation, reconciliation, advance payout, withdrawal request, and withdrawal resolution.

## Class Design

- `AuthService`: validates credentials and issues JWT tokens
- `SaleService`: lists, creates, and reconciles sales
- `PayoutService`: runs 10% advance payouts
- `WithdrawalService`: creates and resolves withdrawal requests
- `TransactionService`: returns ledger entries
- `DashboardService`: aggregates dashboard summary data
- `LedgerService`: applies balance credits/debits and writes transaction rows
- `AuditService`: writes audit log entries

## Business Rules

1. Advance payout is 10% of sale commission.
2. Advance payout is allowed only for pending sales.
3. Advance payout must never happen twice for the same sale.
4. Approved sale credits remaining commission:
   `commission_amount - advance_amount`.
5. Rejected sale deducts any previously paid advance from withdrawable balance.
6. Withdrawal amount must be less than or equal to withdrawable balance.
7. Only one withdrawal request is allowed every 24 hours per user.
8. Withdrawal request immediately debits withdrawable balance.
9. Failed, cancelled, or rejected withdrawal credits the money back.
10. Admin-only APIs are protected by role checks.

## API Flow

### Login

1. User submits email and password.
2. Backend verifies password hash.
3. Backend returns JWT and user profile.
4. Frontend stores token and sends it on API requests.

### Sale Creation

1. Admin opens Sales and clicks Add Sale.
2. Frontend loads payout users from `GET /api/users`.
3. Admin selects a user and enters customer, product, gross amount, and commission.
4. Backend validates the target user and amount rules.
5. Backend creates a pending sale that can receive advance payout and reconciliation.

### Advance Payout

1. Admin calls `POST /api/payouts/advance`.
2. Backend finds one sale or all eligible pending sales.
3. Backend checks advance was not already paid.
4. Backend credits 10% of commission to the user.
5. Backend creates `AdvancePayout`, `Transaction`, and `AuditLog`.

### Reconciliation

1. Admin approves or rejects a pending sale.
2. Approved sale credits remaining commission.
3. Rejected sale deducts paid advance.
4. Backend updates sale status and records transaction/audit rows.

### Withdrawal

1. User requests withdrawal.
2. Backend checks balance and last withdrawal time.
3. Backend creates pending withdrawal.
4. Backend debits balance and records transaction/audit rows.
5. Admin resolves withdrawal.
6. Failed, cancelled, or rejected status credits the amount back.

## Design Decisions

- SQLite is used for fast local setup and simple relational modeling.
- A monolith is used because the assignment does not require distributed infrastructure.
- A transaction ledger is used so balance changes are explainable and reviewable.
- The service layer owns business logic to keep routes readable.
- Login users are created at startup only when the database is empty. Sales, withdrawals, transactions, and audit logs start fresh.
- The UI uses simple responsive pages instead of a marketing-style landing page.
