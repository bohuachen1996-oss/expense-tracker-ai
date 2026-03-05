import { Category } from './types';

export type DateRangePreset = 'current-month' | 'last-month' | 'current-year' | 'last-3-months' | 'all';
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  categories: Category[] | 'all';
  dateRange: DateRangePreset;
  format: ExportFormat;
  color: string; // tailwind bg color
  accentColor: string; // hex for inline styles
  badge: string; // short label like "Tax" "Summary"
  fields: string[];
  useCases: string[];
}

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'Annual expense summary formatted for tax filing, grouped by deductible categories.',
    emoji: '🧾',
    categories: 'all',
    dateRange: 'current-year',
    format: 'pdf',
    color: 'bg-emerald-50',
    accentColor: '#10b981',
    badge: 'Tax',
    fields: ['Date', 'Category', 'Amount', 'Description'],
    useCases: ['Annual filing', 'Accountant review', 'Deduction tracking'],
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'This month\'s spending broken down by category with totals and averages.',
    emoji: '📊',
    categories: 'all',
    dateRange: 'current-month',
    format: 'pdf',
    color: 'bg-indigo-50',
    accentColor: '#6366f1',
    badge: 'Summary',
    fields: ['Category', 'Total', 'Count', '% of Total'],
    useCases: ['Monthly review', 'Budget tracking', 'Personal finance'],
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    description: 'Deep-dive into spending patterns across all categories over time.',
    emoji: '🔍',
    categories: 'all',
    dateRange: 'last-3-months',
    format: 'json',
    color: 'bg-violet-50',
    accentColor: '#8b5cf6',
    badge: 'Analysis',
    fields: ['Category', 'Month', 'Total', 'Trend'],
    useCases: ['Spending trends', 'Data analysis', 'App integrations'],
  },
  {
    id: 'bills-tracker',
    name: 'Bills Tracker',
    description: 'All bill and utility payments for the year — great for spotting recurring charges.',
    emoji: '📄',
    categories: ['Bills'],
    dateRange: 'current-year',
    format: 'csv',
    color: 'bg-amber-50',
    accentColor: '#f59e0b',
    badge: 'Bills',
    fields: ['Date', 'Amount', 'Description'],
    useCases: ['Subscription audit', 'Bill history', 'Negotiate rates'],
  },
  {
    id: 'dining-entertainment',
    name: 'Food & Fun',
    description: 'Dining and entertainment spending — useful for lifestyle budget reviews.',
    emoji: '🍔',
    categories: ['Food', 'Entertainment'],
    dateRange: 'last-3-months',
    format: 'csv',
    color: 'bg-pink-50',
    accentColor: '#ec4899',
    badge: 'Lifestyle',
    fields: ['Date', 'Category', 'Amount', 'Description'],
    useCases: ['Lifestyle review', 'Diet budgeting', 'Entertainment limits'],
  },
  {
    id: 'full-backup',
    name: 'Full Backup',
    description: 'Complete export of all data — perfect for backup or migrating to another app.',
    emoji: '💾',
    categories: 'all',
    dateRange: 'all',
    format: 'json',
    color: 'bg-gray-50',
    accentColor: '#6b7280',
    badge: 'Backup',
    fields: ['All fields including metadata'],
    useCases: ['Data backup', 'App migration', 'Archive'],
  },
];
