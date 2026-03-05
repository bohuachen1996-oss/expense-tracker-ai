'use client';

import { useCallback, useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { Download, Trash2, ArrowUpDown } from 'lucide-react';
import { ExpenseItem } from './ExpenseItem';
import { ExpenseFiltersPanel } from './ExpenseFilters';
import { Modal } from '@/components/ui/Modal';
import { ExpenseForm } from './ExpenseForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Expense, ExpenseFilters, ExpenseFormData } from '@/lib/types';
import { exportToCSV } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  onUpdate: (id: string, data: ExpenseFormData) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
}

type SortField = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

function SortButton({
  field,
  label,
  sortField,
  onToggle,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  onToggle: (field: SortField) => void;
}) {
  return (
    <button
      onClick={() => onToggle(field)}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
    >
      {label}
      <ArrowUpDown size={12} className={sortField === field ? 'text-indigo-600' : ''} />
    </button>
  );
}

export function ExpenseList({
  expenses,
  onUpdate,
  onDelete,
  onDeleteMultiple,
}: ExpenseListProps) {
  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    category: 'All',
    dateFrom: '',
    dateTo: '',
  });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toasts, show, dismiss } = useToast();

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (
            !e.description.toLowerCase().includes(q) &&
            !e.category.toLowerCase().includes(q)
          )
            return false;
        }
        if (filters.category !== 'All' && e.category !== filters.category) return false;
        if (filters.dateFrom) {
          const from = parseISO(filters.dateFrom);
          if (parseISO(e.date) < from) return false;
        }
        if (filters.dateTo) {
          const to = parseISO(filters.dateTo);
          if (parseISO(e.date) > to) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date') cmp = a.date.localeCompare(b.date);
        else if (sortField === 'amount') cmp = a.amount - b.amount;
        else cmp = a.category.localeCompare(b.category);
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [expenses, filters, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  };

  const handleEdit = (expense: Expense) => setEditingExpense(expense);

  const handleUpdate = async (data: ExpenseFormData) => {
    if (!editingExpense) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 200));
    onUpdate(editingExpense.id, data);
    setEditingExpense(null);
    setIsSubmitting(false);
    show('Expense updated successfully');
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    show('Expense deleted');
  };

  const handleDeleteSelected = () => {
    onDeleteMultiple(Array.from(selected));
    show(`${selected.size} expense${selected.size !== 1 ? 's' : ''} deleted`);
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col gap-4">
      <ExpenseFiltersPanel
        filters={filters}
        onChange={setFilters}
        totalCount={expenses.length}
        filteredCount={filtered.length}
      />

      <Card padding="none">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              checked={selected.size > 0 && selected.size === filtered.length}
              ref={(el) => {
                if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length;
              }}
              onChange={toggleSelectAll}
            />
            {selected.size > 0 ? (
              <span className="text-sm text-indigo-600 font-medium">
                {selected.size} selected
              </span>
            ) : (
              <span className="text-sm text-gray-500">{filtered.length} expenses</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={handleDeleteSelected}
              >
                Delete {selected.size}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => exportToCSV(filtered)}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <div className="w-4 shrink-0" />
          <div className="w-24 shrink-0">
            <SortButton field="date" label="Date" sortField={sortField} onToggle={toggleSort} />
          </div>
          <div className="w-36 shrink-0 hidden sm:block">
            <SortButton field="category" label="Category" sortField={sortField} onToggle={toggleSort} />
          </div>
          <div className="flex-1 text-xs font-medium text-gray-500">Description</div>
          <div className="shrink-0 text-right">
            <SortButton field="amount" label="Amount" sortField={sortField} onToggle={toggleSort} />
          </div>
          <div className="w-16 shrink-0" />
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">No expenses found</p>
            <p className="text-gray-400 text-sm mt-1">
              {expenses.length === 0
                ? 'Add your first expense to get started'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filtered.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selected={selected.has(expense.id)}
              onToggleSelect={toggleSelect}
            />
          ))
        )}
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExpense(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
