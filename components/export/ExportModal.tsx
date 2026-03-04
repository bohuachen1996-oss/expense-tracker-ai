'use client';

import { useState, useMemo } from 'react';
import { parseISO } from 'date-fns';
import {
  X,
  Download,
  FileText,
  FileJson,
  FilePlus,
  SlidersHorizontal,
  Eye,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Expense, Category } from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  formatCurrency,
  formatDate,
  getTodayISO,
} from '@/lib/utils';
import { ExportFormat, runExport } from '@/lib/exporters';
import { format as dateFnsFormat, subMonths } from 'date-fns';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  ext: string;
}[] = [
  {
    id: 'csv',
    label: 'CSV',
    description: 'Spreadsheet-compatible, works with Excel & Google Sheets',
    icon: <FileText size={20} />,
    ext: '.csv',
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Structured data format, ideal for developers & backups',
    icon: <FileJson size={20} />,
    ext: '.json',
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Formatted report for printing or sharing',
    icon: <FilePlus size={20} />,
    ext: '.pdf',
  },
];

type Step = 'configure' | 'preview' | 'done';

export function ExportModal({ isOpen, onClose, expenses }: ExportModalProps) {
  const [step, setStep] = useState<Step>('configure');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(CATEGORIES)
  );
  const [filename, setFilename] = useState(
    `expenses-${getTodayISO()}`
  );
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (!selectedCategories.has(e.category)) return false;
      if (dateFrom && parseISO(e.date) < parseISO(dateFrom)) return false;
      if (dateTo && parseISO(e.date) > parseISO(dateTo)) return false;
      return true;
    });
  }, [expenses, selectedCategories, dateFrom, dateTo]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleAllCategories = () => {
    setSelectedCategories(
      selectedCategories.size === CATEGORIES.length ? new Set() : new Set(CATEGORIES)
    );
  };

  const handleExport = async () => {
    setLoading(true);
    await runExport({ format, filename, expenses: filtered });
    setLoading(false);
    setStep('done');
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('configure');
      setFormat('csv');
      setDateFrom('');
      setDateTo('');
      setSelectedCategories(new Set(CATEGORIES));
      setFilename(`expenses-${getTodayISO()}`);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Download size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Export Data</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === 'configure' && 'Configure your export options'}
                {step === 'preview' && `Previewing ${filtered.length} records`}
                {step === 'done' && 'Export complete'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {(['configure', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  step === s
                    ? 'bg-indigo-600 text-white'
                    : i < ['configure', 'preview', 'done'].indexOf(step)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i < ['configure', 'preview', 'done'].indexOf(step) ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <span>{i + 1}</span>
                )}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < 2 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}

          {/* Live record count */}
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            <span>{filtered.length} records</span>
            <span className="text-indigo-300">·</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">

          {/* ── CONFIGURE STEP ── */}
          {step === 'configure' && (
            <div className="p-6 flex flex-col gap-6">

              {/* Format selection */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormat(opt.id)}
                      className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 text-left transition-all ${
                        format === opt.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          format === opt.id
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            format === opt.id ? 'text-indigo-700' : 'text-gray-800'
                          }`}
                        >
                          {opt.label}
                          <span className="text-xs font-normal ml-1 opacity-60">{opt.ext}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Date Range
                  <span className="text-xs font-normal text-gray-400 ml-2">
                    (leave blank for all)
                  </span>
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-gray-400">From</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="pt-5 text-gray-300">→</div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-gray-400">To</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="pt-5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {/* Quick range shortcuts */}
                <div className="flex gap-2 mt-2">
                  {[
                    { label: 'This month', from: dateFnsFormat(new Date(), 'yyyy-MM-01'), to: getTodayISO() },
                    { label: 'Last 3 months', from: dateFnsFormat(subMonths(new Date(), 3), 'yyyy-MM-dd'), to: getTodayISO() },
                    { label: 'This year', from: `${new Date().getFullYear()}-01-01`, to: getTodayISO() },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => { setDateFrom(range.from); setDateTo(range.to); }}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Categories</label>
                  <button
                    onClick={toggleAllCategories}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {selectedCategories.size === CATEGORIES.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = selectedCategories.has(cat);
                    const color = CATEGORY_COLORS[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                          active ? 'border-transparent' : 'border-gray-200 bg-white text-gray-400'
                        }`}
                        style={
                          active
                            ? { backgroundColor: `${color}18`, color, borderColor: `${color}40` }
                            : {}
                        }
                      >
                        <span>{CATEGORY_ICONS[cat]}</span>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filename */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Filename
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-400 shrink-0">
                    .{format === 'pdf' ? 'pdf' : format}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── PREVIEW STEP ── */}
          {step === 'preview' && (
            <div className="p-6">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-medium text-gray-700">No records match your filters</p>
                  <p className="text-sm text-gray-400 mt-1">Go back and adjust your settings</p>
                </div>
              ) : (
                <>
                  {/* Summary bar */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Records', value: filtered.length.toString() },
                      { label: 'Total Amount', value: formatCurrency(totalAmount) },
                      { label: 'Format', value: format.toUpperCase() },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                        <p className="text-base font-bold text-gray-900 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Preview table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[100px_1fr_90px_1fr] bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                      {['Date', 'Category', 'Amount', 'Description'].map((h) => (
                        <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {filtered.map((e) => (
                        <div
                          key={e.id}
                          className="grid grid-cols-[100px_1fr_90px_1fr] px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-xs text-gray-500">{formatDate(e.date)}</span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: CATEGORY_COLORS[e.category] }}
                          >
                            {CATEGORY_ICONS[e.category]} {e.category}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 tabular-nums">
                            {formatCurrency(e.amount)}
                          </span>
                          <span className="text-xs text-gray-600 truncate">{e.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {filtered.length > 8 && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Showing all {filtered.length} records
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── DONE STEP ── */}
          {step === 'done' && (
            <div className="p-6 flex flex-col items-center text-center gap-4 py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export complete!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">{filename}.{format}</span> with{' '}
                  {filtered.length} records has been downloaded.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep('configure')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Export Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== 'done' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={step === 'configure' ? handleClose : () => setStep('configure')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition-colors"
            >
              {step === 'configure' ? 'Cancel' : '← Back'}
            </button>

            {step === 'configure' && (
              <button
                onClick={() => setStep('preview')}
                disabled={selectedCategories.size === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={15} />
                Preview {filtered.length} records
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleExport}
                disabled={loading || filtered.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Export {filtered.length} records
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
