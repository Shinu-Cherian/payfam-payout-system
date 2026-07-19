import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class SaleStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class WithdrawalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class TransactionType(str, enum.Enum):
    ADVANCE_PAYOUT = "ADVANCE_PAYOUT"
    FINAL_PAYOUT = "FINAL_PAYOUT"
    WITHDRAWAL_DEBIT = "WITHDRAWAL_DEBIT"
    WITHDRAWAL_REFUND = "WITHDRAWAL_REFUND"
    REJECTION_DEDUCTION = "REJECTION_DEDUCTION"


class TransactionDirection(str, enum.Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"

