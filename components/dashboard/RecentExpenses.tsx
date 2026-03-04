'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { CategoryBadge } from '@/components/ui/Badge';
import { Expense } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RecentExpensesProps {
  expenses: Expense[];
  limit?: number;
}

export function RecentExpenses({ expenses, limit = 5 }: RecentExpensesProps) {
  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-gray-100">
        <CardHeader className="mb-0">
          <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
          <Link
            href="/expenses"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight size={14} />
          </Link>
        </CardHeader>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-2">💸</div>
          <p className="text-gray-500 text-sm">No expenses yet</p>
          <Link
            href="/expenses/add"
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Add your first expense
          </Link>
        </div>
      ) : (
        <div>
          {recent.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {expense.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={expense.category} />
                  <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
