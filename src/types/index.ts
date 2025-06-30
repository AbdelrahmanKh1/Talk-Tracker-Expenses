// Core types for the application
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    plan?: string;
    [key: string]: any;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at?: number;
}

// Expense related types
export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date?: string;
  created_at: string;
  updated_at?: string;
  currency_code?: string;
}

export interface ExpenseInput {
  description: string;
  amount: number;
  category?: string;
  date?: string;
  currency_code?: string;
}

export interface BulkExpenseInput {
  expenses: ExpenseInput[];
  selectedMonth?: string;
}

// Budget related types
export interface BudgetStatus {
  budget: number;
  spent: number;
  remaining: number;
  percent: number;
  currency?: string;
  month?: string;
}

export interface BudgetInput {
  month: string;
  budgetAmount: number;
  budgetCurrency: string;
}

// Currency related types
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

// Search and filter types
export interface SearchFilters {
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResult {
  term: string;
  filters: SearchFilters;
  results: Expense[];
}

// Voice recording types
export interface VoiceRecordingState {
  isRecording: boolean;
  audioBlob: Blob | null;
  isProcessing: boolean;
}

// Modal and UI types
export interface ModalState {
  isOpen: boolean;
  data?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface VoiceProcessingResult {
  transcription: string;
  expenses: Expense[];
  notification?: {
    title: string;
    body: string;
  };
  error?: string;
}

// User settings types
export interface UserSettings {
  user_id: string;
  currency_code: string;
  plan: 'free' | 'pro';
  notifications_enabled: boolean;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'budget' | 'system' | 'reminder';
  read: boolean;
  created_at: string;
}

// Voice usage types
export interface VoiceUsage {
  user_id: string;
  month_id: string;
  voice_count: number;
  limit: number;
}

// Component prop types
export interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  currencySymbol: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface SearchBarProps {
  onSearch: (term: string, filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

// Hook return types
export interface UseExpensesReturn {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  addExpense: (data: ExpenseInput & { selectedMonth?: string }) => Promise<void>;
  isAddingExpense: boolean;
  addBulkExpenses: (data: BulkExpenseInput) => Promise<void>;
  isAddingBulkExpenses: boolean;
  updateExpense: (data: { expenseId: string; items: ExpenseInput[] }) => Promise<void>;
  isUpdatingExpense: boolean;
  deleteExpense: (expenseId: string) => Promise<void>;
  getMonthlyTotal: (month: string) => number;
  getExpensesForMonth: (month: string) => Expense[];
  getRecentExpenses: (limit?: number) => Expense[];
  searchExpenses: (term: string, month: string, filters: SearchFilters) => Expense[];
}

export interface UseBudgetReturn {
  budgetStatus: BudgetStatus | null;
  isLoading: boolean;
  error: string | null;
  setBudget: (data: BudgetInput) => Promise<void>;
  isSettingBudget: boolean;
  getCurrentMonth: () => string;
}

export interface UseCurrencyReturn {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currencyCode: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  setIsProcessing: (processing: boolean) => void;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: string | null }>;
} 