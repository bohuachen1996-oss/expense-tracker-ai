import { format, parseISO } from 'date-fns';
import { Expense } from './types';
import { formatCurrency, formatDate } from './utils';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  expenses: Expense[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function runExport(options: ExportOptions): Promise<void> {
  return new Promise((resolve) => {
    // Simulate async work for loading state UX
    setTimeout(() => {
      if (options.format === 'csv') exportCSV(options);
      else if (options.format === 'json') exportJSON(options);
      else exportPDF(options);
      resolve();
    }, 600);
  });
}

function exportCSV({ expenses, filename }: ExportOptions) {
  const headers = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.amount.toFixed(2),
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

function exportJSON({ expenses, filename }: ExportOptions) {
  const data = {
    exported_at: new Date().toISOString(),
    total_records: expenses.length,
    total_amount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
    })),
  };
  const json = JSON.stringify(data, null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), `${filename}.json`);
}

function exportPDF({ expenses, filename }: ExportOptions) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const rows = expenses
    .map(
      (e) => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td><span class="badge badge-${e.category.toLowerCase()}">${e.category}</span></td>
        <td class="amount">${formatCurrency(e.amount)}</td>
        <td>${e.description}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; padding: 40px; }
    header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; border-bottom: 2px solid #6366f1; padding-bottom: 16px; }
    header h1 { font-size: 22px; font-weight: 700; color: #1e1b4b; }
    header .meta { text-align: right; color: #6b7280; font-size: 12px; line-height: 1.6; }
    .summary { display: flex; gap: 20px; margin-bottom: 24px; }
    .summary-card { flex: 1; background: #f5f3ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px 16px; }
    .summary-card .label { font-size: 11px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 20px; font-weight: 700; color: #1e1b4b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #6366f1; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody td { padding: 9px 12px; }
    .amount { font-weight: 600; font-variant-numeric: tabular-nums; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500; }
    .badge-food { background:#ede9fe; color:#6366f1; }
    .badge-transportation { background:#f3e8ff; color:#8b5cf6; }
    .badge-entertainment { background:#fce7f3; color:#ec4899; }
    .badge-shopping { background:#fef3c7; color:#f59e0b; }
    .badge-bills { background:#d1fae5; color:#10b981; }
    .badge-other { background:#f3f4f6; color:#6b7280; }
    tfoot td { padding: 10px 12px; font-weight: 700; border-top: 2px solid #e5e7eb; }
    footer { margin-top: 32px; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Expense Report</h1>
      <div style="color:#6b7280;font-size:12px;margin-top:4px;">${filename}</div>
    </div>
    <div class="meta">
      <div>Generated: ${format(new Date(), 'MMM d, yyyy')}</div>
      <div>${expenses.length} records</div>
    </div>
  </header>
  <div class="summary">
    <div class="summary-card"><div class="label">Total Records</div><div class="value">${expenses.length}</div></div>
    <div class="summary-card"><div class="label">Total Amount</div><div class="value">${formatCurrency(total)}</div></div>
    <div class="summary-card"><div class="label">Average</div><div class="value">${formatCurrency(expenses.length ? total / expenses.length : 0)}</div></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2">Total</td><td class="amount">${formatCurrency(total)}</td><td></td></tr></tfoot>
  </table>
  <footer>Expensify &mdash; Exported on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</footer>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
