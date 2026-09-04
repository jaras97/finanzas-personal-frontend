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
  /** Clave de paleta ("sky", "emerald"...), no un hex. Ver lib/categoryStyle.ts */
  color?: string | null;
  /** Nombre de un icono de lucide ("Home", "Car"...) */
  icon?: string | null;
  /** Nulo = categoría de primer nivel. La jerarquía es de dos niveles. */
  parent_id?: number | null;
  parent_name?: string | null;
};

export type SuggestedCategoriesResult = {
  created: Category[];
  skipped_existing: number;
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
  credit_limit?: number | null;
  statement_day?: number | null;
  payment_due_days?: number | null;
  minimum_payment_percent?: number | null;
};

export type DebtStatement = {
  next_statement_date: string; // ISO date
  payment_due_date: string; // ISO date
  current_period_charges: number;
  minimum_payment_estimate: number | null;
  available_credit: number | null;
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
  transfer_group_id?: string | null;
  reversal_note?: string | null;
  attachments_count?: number;
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

export type Budget = {
  id: number;
  category_id: number;
  category_name: string;
  currency: currencyType;
  amount: number;
  effective_from: string; // YYYY-MM-DD
  spent: number;
  percentage: number;
  created_at: string;
};

export type ImportColumnMapping = {
  date: number;
  description: number;
  amount: number;
};

export type ImportProfile = {
  id: number;
  saving_account_id: number;
  column_mapping: ImportColumnMapping;
  date_format: string;
  has_header: boolean;
};

export type ImportInspectResult = {
  mode: 'inspect';
  sample_rows: string[][];
  column_count: number;
  saved_profile: ImportProfile | null;
};

export type ImportRowPreview = {
  row_index: number;
  date: string | null;
  description: string;
  amount: number | null;
  type: 'income' | 'expense' | null;
  category_id: number;
  category_name: string;
  is_duplicate: boolean;
  include: boolean;
  error: string | null;
};

export type ImportReviewResult = {
  mode: 'review';
  rows: ImportRowPreview[];
  total_rows: number;
  duplicate_count: number;
  error_count: number;
};

export type ImportPreviewResult = ImportInspectResult | ImportReviewResult;

export type ImportConfirmResult = {
  created: number;
  skipped: number;
};

export type CategoryRule = {
  id: number;
  category_id: number;
  category_name: string;
  match_text: string;
  priority: number;
  is_active: boolean;
};

export type SavingGoal = {
  id: number;
  saving_account_id: number;
  account_name: string;
  currency: currencyType;
  name: string;
  target_amount: number;
  target_date: string | null; // YYYY-MM-DD
  is_active: boolean;
  current_balance: number;
  progress_percent: number;
  monthly_savings_needed: number | null;
};

export type Attachment = {
  id: number;
  transaction_id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  url: string | null;
};

export type CurrentUser = {
  user_id: string;
  email: string;
  role: 'user' | 'admin';
  report_currency: currencyType;
};

export type NetWorthConsolidatedBreakdownRow = {
  currency: currencyType;
  original_assets: number;
  original_liabilities: number;
  converted_assets: number | null;
  converted_liabilities: number | null;
  rate_used: number | null;
};

export type NetWorthConsolidated = {
  report_currency: currencyType;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  degraded: boolean;
  breakdown: NetWorthConsolidatedBreakdownRow[];
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
// --- Panel de administración: historial y paramétricas ---------------------

export type SubscriptionPlan = {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  currency: string;
  is_active: boolean;
};

export type UserTag = {
  id: number;
  name: string;
  color: string;
};

export type SubscriptionPeriod = {
  id: number;
  start_date: string;
  end_date: string;
  price: number;
  currency: string;
  origin: string;
  note: string | null;
  plan_name: string | null;
  created_at: string;
  created_by_email: string | null;
};

export type SubscriptionEvent = {
  id: number;
  action: 'activate' | 'renew' | 'delete' | 'payment' | string;
  end_date_before: string | null;
  end_date_after: string | null;
  months: number | null;
  detail: string | null;
  created_at: string;
  performed_by_email: string | null;
};

export type AdminPayment = {
  id: number;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  note: string | null;
  paid_at: string;
  created_at: string;
  created_by_email: string | null;
};

export type AdminUserMetrics = {
  last_login_at: string | null;
  transactions: number;
  accounts: number;
  debts: number;
  days_since_last_login: number | null;
  has_ever_logged_in: boolean;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  subscription_status: AdminSubscriptionStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  full_name: string | null;
  phone: string | null;
  notes: string | null;
  tags: UserTag[];
  metrics: AdminUserMetrics;
  periods: SubscriptionPeriod[];
  events: SubscriptionEvent[];
  payments: AdminPayment[];
  total_paid: number;
  first_subscribed_at: string | null;
};
