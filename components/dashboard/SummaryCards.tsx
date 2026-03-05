'use client';

import { TrendingUp, TrendingDown, Receipt, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Expense } from '@/lib/types';
import {
  formatCurrency,
  getCategorySummaries,
  getThisMonthExpenses,
  CATEGORY_ICONS,
} from '@/lib/utils';
import { startOfMonth, subMonths, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

interface SummaryCardsProps {
  expenses: Expense[];
}

function StatCard({
  title,
  value,
  sub,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean } | null;
  color: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{sub}</p>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.positive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend.positive ? (
              <TrendingDown size={12} />
            ) : (
              <TrendingUp size={12} />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}

export function SummaryCards({ expenses }: SummaryCardsProps) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = getThisMonthExpenses(expenses);
  const thisMonthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  // Last month comparison
  const now = new Date();
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const lastMonthTotal = expenses
    .filter((e) => isWithinInterval(parseISO(e.date), { start: lastMonthStart, end: lastMonthEnd }))
    .reduce((s, e) => s + e.amount, 0);

  const monthDiff =
    lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : null;

  const summaries = getCategorySummaries(thisMonth);
  const topCategory = summaries[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Spending"
        value={formatCurrency(total)}
        sub="All time"
        icon={<Receipt size={20} className="text-indigo-600" />}
        color="bg-indigo-50"
        trend={null}
      />
      <StatCard
        title="This Month"
        value={formatCurrency(thisMonthTotal)}
        sub={`${thisMonth.length} expense${thisMonth.length !== 1 ? 's' : ''}`}
        icon={<Calendar size={20} className="text-violet-600" />}
        color="bg-violet-50"
        trend={
          monthDiff !== null
            ? {
                value: `${Math.abs(monthDiff).toFixed(1)}% vs last month`,
                positive: monthDiff <= 0,
              }
            : null
        }
      />
      <StatCard
        title="Total Expenses"
        value={String(expenses.length)}
        sub="Recorded transactions"
        icon={<Receipt size={20} className="text-emerald-600" />}
        color="bg-emerald-50"
        trend={null}
      />
      <StatCard
        title="Top Category"
        value={topCategory ? topCategory.category : '—'}
        sub={
          topCategory
            ? `${formatCurrency(topCategory.total)} this month`
            : 'No expenses this month'
        }
        icon={
          <span className="text-lg">
            {topCategory ? CATEGORY_ICONS[topCategory.category] : '📊'}
          </span>
        }
        color="bg-amber-50"
        trend={null}
      />
    </div>
  );
}
