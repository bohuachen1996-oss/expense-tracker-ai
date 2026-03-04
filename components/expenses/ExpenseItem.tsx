'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/Badge';
import { Expense } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

export function ExpenseItem({
  expense,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}: ExpenseItemProps) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors group ${
        selected ? 'bg-indigo-50/60' : ''
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(expense.id)}
        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Date */}
      <div className="w-24 shrink-0">
        <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
      </div>

      {/* Category */}
      <div className="w-36 shrink-0 hidden sm:block">
        <CategoryBadge category={expense.category} />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
        <p className="text-xs text-gray-400 sm:hidden mt-0.5">{expense.category}</p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold text-gray-900 tabular-nums">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Edit"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
