'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { Button } from '@/components/ui/Button';

export default function ExpensesPage() {
  const { expenses, isLoaded, updateExpense, deleteExpense, deleteMultiple } =
    useExpenses();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and review all your expenses
          </p>
        </div>
        <Link href="/expenses/add">
          <Button icon={<Plus size={16} />}>Add Expense</Button>
        </Link>
      </div>

      <ExpenseList
        expenses={expenses}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
        onDeleteMultiple={deleteMultiple}
      />
    </div>
  );
}
