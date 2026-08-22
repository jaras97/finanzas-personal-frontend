export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type TransactionType = "income" | "expense" | "transfer";

export type DebtKind = "loan" | "credit_card";

export type LoginRequest = {
  username: string; // Email
  password: string;
};
// 💰 Category
export type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  is_active: boolean;
  is_system: boolean;
  system_key?: string | null;
};

// 🧾 Transaction
export type Transaction = {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO
  transaction_fee: number | null;
  is_cancelled: boolean;
  reversed_transaction_id: number | null; // ID of the transaction that reversed this one

  category: Category | null;
  saving_account_id: number | null;

  from_account?: SavingAccount | null;
  to_account?: SavingAccount | null;
};

// Código ISO-4217 de una moneda (p. ej. "COP", "USD", "MXN"). Ya no es un
// union cerrado -- el catálogo real viene de GET /currencies.
export type currencyType = string;

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  decimal_digits: number;
};

export type Account ="cash" | "bank" | "investment"
// 🏦 Saving Account
export type SavingAccount = {
  id: number;
  name: string;
  balance: number;
  currency: currencyType;
  type: Account;
  status: "active" | "closed";
  closed_at: string | null; // ISO
};

// 💳 Debt
export type Debt = {
  id: number;
  name: string;
  total_amount: number;
  interest_rate: number;
  due_date?: string; // ISO
  currency: currencyType;
  status: "active" | "closed";
  transactions_count?: number;
  kind: DebtKind;
};

export interface DebtTransaction {
  id: number;
  user_id: string;        // UUID
  debt_id: number;
  amount: number;
  type: 'payment' | 'interest_charge' | 'extra_charge';
  description?: string | null;
  date: string;           // ISO string, conviertes con new Date(date) si lo necesitas
}

export interface TransactionWithCategoryRead {
  id: number;
  amount: number;
  description: string;
  type: TransactionType;
  date: string;
  transaction_fee?: number | null;
  is_cancelled: boolean;
  reversed_transaction_id?: number | null;
  category?: Category | null;
  from_account?: SavingAccount | null;
  to_account?: SavingAccount | null;
  saving_account?: SavingAccount | null;
  saving_account_id?: number | null;
  debt_id?: number | null;
  debt_name?: string | null;
  debt?: Debt | null;
  source_type?: string | null; 
  reversal_note?: string | null;
}

export type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
};

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type RecurringTransaction = {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  saving_account_id: number;
  frequency: RecurrenceFrequency;
  next_run: string; // YYYY-MM-DD
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  last_run_at: string | null;
  category_name: string | null;
  account_name: string | null;
  account_currency: currencyType | null;
};

export type RecurringRunResult = {
  generated: {
    recurring_id: number;
    description: string;
    transaction_ids: number[];
    count: number;
  }[];
  skipped: { recurring_id: number; description: string; reason: string }[];
  total_created: number;
};

export type CurrentUser = {
  user_id: string;
  email: string;
  role: 'user' | 'admin';
};

export type AdminSubscriptionStatus = 'none' | 'active' | 'expired' | 'inactive';

export type AdminUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  subscription_status: AdminSubscriptionStatus;
  subscription_start: string | null;
  subscription_end: string | null;
};

export type AdminUsersPage = {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export interface SubscriptionStatusRead {
  id: number;
  user_id: string; 
  start_date: string; 
  end_date: string;   
  is_active: boolean;
}

export type TotalesPorMoneda = Record<currencyType, number>;