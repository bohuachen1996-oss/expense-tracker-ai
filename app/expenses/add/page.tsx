'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Card } from '@/components/ui/Card';
import { ExpenseFormData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function AddExpensePage() {
  const { addExpense } = useExpenses();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ description: string; amount: number } | null>(null);

  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    const expense = addExpense(data);
    setLastAdded({ description: expense.description, amount: expense.amount });
    setIsSubmitting(false);
  };

  const handleAddAnother = () => {
    setLastAdded(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/expenses"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record a new expense</p>
        </div>
      </div>

      {lastAdded ? (
        <Card className="text-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Expense Added!</h2>
              <p className="text-gray-500 text-sm mt-1">
                <span className="font-medium text-gray-700">{lastAdded.description}</span>{' '}
                — {formatCurrency(lastAdded.amount)}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleAddAnother}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Add Another
              </button>
              <button
                onClick={() => router.push('/expenses')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View All
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <ExpenseForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/expenses')}
            isSubmitting={isSubmitting}
          />
        </Card>
      )}
    </div>
  );
}
