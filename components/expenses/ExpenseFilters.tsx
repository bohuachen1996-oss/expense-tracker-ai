'use client';

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ExpenseFilters } from '@/lib/types';
import { CATEGORIES } from '@/lib/utils';

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const categoryOptions = [
  { value: 'All', label: 'All Categories' },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

export function ExpenseFiltersPanel({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: ExpenseFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.category !== 'All' ||
    filters.dateFrom ||
    filters.dateTo;

  const clear = () => {
    onChange({ search: '', category: 'All', dateFrom: '', dateTo: '' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {filteredCount !== totalCount && (
          <span className="ml-auto text-xs text-indigo-600 font-medium">
            {filteredCount} of {totalCount} shown
          </span>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            icon={<X size={14} />}
            className="ml-auto"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <Input
          placeholder="Search expenses..."
          type="text"
          leftIcon={<Search size={14} />}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        {/* Category */}
        <Select
          options={categoryOptions}
          value={filters.category}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value as ExpenseFilters['category'] })
          }
        />

        {/* Date from */}
        <Input
          type="date"
          placeholder="From date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        />

        {/* Date to */}
        <Input
          type="date"
          placeholder="To date"
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        />
      </div>
    </div>
  );
}
