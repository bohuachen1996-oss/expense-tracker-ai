'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ExportDrawer } from '@/components/export-hub/ExportDrawer';

export default function DashboardPage() {
  const { expenses, isLoaded } = useExpenses();
  const [exportOpen, setExportOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your financial overview at a glance
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          <Sparkles size={15} />
          Export Hub
        </button>
      </div>

      {/* Summary cards */}
      <SummaryCards expenses={expenses} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingChart expenses={expenses} />
        <CategoryChart expenses={expenses} />
      </div>

      {/* Recent expenses */}
      <RecentExpenses expenses={expenses} />

      {/* Export Hub drawer */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        expenses={expenses}
      />
    </div>
  );
}
