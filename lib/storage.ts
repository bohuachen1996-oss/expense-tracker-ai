import { Expense } from './types';

const STORAGE_KEY = 'expense-tracker-expenses';

export function loadExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultExpenses();
    return JSON.parse(raw) as Expense[];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// Pre-populate with some sample data for a better first-run experience
function getDefaultExpenses(): Expense[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const pm = String(now.getMonth()).padStart(2, '0') || '12';
  const py = now.getMonth() === 0 ? y - 1 : y;

  const defaults: Expense[] = [
    { id: 'sample-1', amount: 12.50, category: 'Food', description: 'Lunch at the deli', date: `${y}-${m}-03`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-2', amount: 45.00, category: 'Transportation', description: 'Monthly transit pass top-up', date: `${y}-${m}-02`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-3', amount: 89.99, category: 'Shopping', description: 'New headphones', date: `${y}-${m}-01`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-4', amount: 120.00, category: 'Bills', description: 'Electricity bill', date: `${y}-${m}-01`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-5', amount: 18.00, category: 'Entertainment', description: 'Movie tickets', date: `${y}-${m}-05`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-6', amount: 9.99, category: 'Entertainment', description: 'Streaming subscription', date: `${y}-${m}-01`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-7', amount: 55.30, category: 'Food', description: 'Grocery shopping', date: `${py}-${pm}-28`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-8', amount: 200.00, category: 'Bills', description: 'Internet & phone bill', date: `${py}-${pm}-25`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-9', amount: 32.00, category: 'Food', description: 'Dinner with friends', date: `${py}-${pm}-20`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sample-10', amount: 150.00, category: 'Shopping', description: 'Clothing', date: `${py}-${pm}-15`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  saveExpenses(defaults);
  return defaults;
}
