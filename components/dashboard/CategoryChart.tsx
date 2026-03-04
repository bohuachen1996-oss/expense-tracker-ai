'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Expense } from '@/lib/types';
import {
  getCategorySummaries,
  formatCurrency,
  CATEGORY_COLORS,
  getThisMonthExpenses,
} from '@/lib/utils';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryChartProps {
  expenses: Expense[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
        <p className="text-sm font-medium text-gray-700">{payload[0].name}</p>
        <p className="text-base font-bold mt-0.5" style={{ color: CATEGORY_COLORS[payload[0].name as keyof typeof CATEGORY_COLORS] }}>
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {payload[0].payload.percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryChart({ expenses }: CategoryChartProps) {
  const thisMonth = getThisMonthExpenses(expenses);
  const summaries = getCategorySummaries(thisMonth.length > 0 ? thisMonth : expenses);

  const data = summaries.map((s) => ({
    name: s.category,
    value: s.total,
    percentage: s.percentage,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieIcon size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900">By Category</h3>
          </div>
        </CardHeader>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieIcon size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900">By Category</h3>
        </div>
        <span className="text-xs text-gray-400">
          {thisMonth.length > 0 ? 'This month' : 'All time'}
        </span>
      </CardHeader>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>
            )}
            iconSize={10}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
