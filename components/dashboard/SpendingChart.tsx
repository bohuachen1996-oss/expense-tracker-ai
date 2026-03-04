'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Expense } from '@/lib/types';
import { getMonthlySummaries, formatCurrency } from '@/lib/utils';
import { BarChart2 } from 'lucide-react';

interface SpendingChartProps {
  expenses: Expense[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-base font-bold text-indigo-600 mt-0.5">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SpendingChart({ expenses }: SpendingChartProps) {
  const data = getMonthlySummaries(expenses, 6);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Monthly Spending</h3>
        </div>
        <span className="text-xs text-gray-400">Last 6 months</span>
      </CardHeader>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f0ff', radius: 6 }} />
          <Bar
            dataKey="total"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            name="Spending"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
