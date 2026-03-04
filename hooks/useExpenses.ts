'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadExpenses, saveExpenses } from '@/lib/storage';
import { generateId, getTodayISO } from '@/lib/utils';
import { Expense, ExpenseFormData } from '@/lib/types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((updated: Expense[]) => {
    setExpenses(updated);
    saveExpenses(updated);
  }, []);

  const addExpense = useCallback(
    (data: ExpenseFormData): Expense => {
      const now = new Date().toISOString();
      const expense: Expense = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      persist([expense, ...expenses]);
      return expense;
    },
    [expenses, persist]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData): void => {
      persist(
        expenses.map((e) =>
          e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
        )
      );
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    (id: string): void => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  const deleteMultiple = useCallback(
    (ids: string[]): void => {
      const idSet = new Set(ids);
      persist(expenses.filter((e) => !idSet.has(e.id)));
    },
    [expenses, persist]
  );

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteMultiple,
  };
}

export function defaultFormData(): ExpenseFormData {
  return {
    amount: 0,
    category: 'Food',
    description: '',
    date: getTodayISO(),
  };
}
