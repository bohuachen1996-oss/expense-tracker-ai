import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Category, CategorySummary, Expense, MonthlySummary } from './types';

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#6366f1',
  Transportation: '#8b5cf6',
  Entertainment: '#ec4899',
  Shopping: '#f59e0b',
  Bills: '#10b981',
  Other: '#6b7280',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍔',
  Transportation: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Other: '📦',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatMonth(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, { total: number; count: number }> = {};

  for (const expense of expenses) {
    if (!byCategory[expense.category]) {
      byCategory[expense.category] = { total: 0, count: 0 };
    }
    byCategory[expense.category].total += expense.amount;
    byCategory[expense.category].count += 1;
  }

  return Object.entries(byCategory)
    .map(([category, { total: catTotal, count }]) => ({
      category: category as Category,
      total: catTotal,
      count,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlySummaries(expenses: Expense[], months = 6): MonthlySummary[] {
  const now = new Date();
  const result: MonthlySummary[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const label = format(date, 'MMM yyyy');

    const total = expenses
      .filter((e) => {
        const expDate = parseISO(e.date);
        return isWithinInterval(expDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, e) => sum + e.amount, 0);

    result.push({ month: label, total });
  }

  return result;
}

export function getThisMonthExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  return expenses.filter((e) => {
    const expDate = parseISO(e.date);
    return isWithinInterval(expDate, { start: monthStart, end: monthEnd });
  });
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Amount', 'Category', 'Description'];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
