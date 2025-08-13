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

export type currencyType = "COP" | "USD" | "EUR";

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

export interface SubscriptionStatusRead {
  id: number;
  user_id: string; 
  start_date: string; 
  end_date: string;   
  is_active: boolean;
}

export type TotalesPorMoneda = {
  [key in "COP" | "USD" | "EUR"]: number;
};