export type Category =
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Other';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: string; // ISO datetime string
  updatedAt: string;
}

export type ExpenseFormData = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export interface ExpenseFilters {
  search: string;
  category: Category | 'All';
  dateFrom: string;
  dateTo: string;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlySummary {
  month: string; // "Jan 2025"
  total: number;
}
