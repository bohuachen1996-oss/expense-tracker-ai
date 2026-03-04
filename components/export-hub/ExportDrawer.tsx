'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, subMonths, startOfYear, parseISO } from 'date-fns';
import {
  X, Layers, Share2, Plug, Clock, History,
  CheckCircle2, Copy, Mail, RefreshCw, Wifi, WifiOff,
  Download, ChevronRight, Bell, Play, Pause,
  ExternalLink, AlertCircle, Loader2, Sparkles,
} from 'lucide-react';
import { Expense } from '@/lib/types';
import { CATEGORY_COLORS, exportToCSV, formatCurrency, formatDate } from '@/lib/utils';
import { EXPORT_TEMPLATES, ExportTemplate, DateRangePreset } from '@/lib/exportTemplates';
import {
  appendHistory, calcNextRun, ExportRecord, IntegrationId, IntegrationState,
  loadHistory, loadIntegrations, loadSchedule, saveIntegrations, saveSchedule, ScheduleConfig,
} from '@/lib/exportHistory';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

type Tab = 'templates' | 'share' | 'integrations' | 'schedule' | 'history';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filterByDateRange(expenses: Expense[], range: DateRangePreset): Expense[] {
  const now = new Date();
  if (range === 'all') return expenses;
  const ranges: Record<DateRangePreset, [Date, Date]> = {
    'current-month': [startOfMonth(now), endOfMonth(now)],
    'last-month': [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))],
    'current-year': [new Date(now.getFullYear(), 0, 1), now],
    'last-3-months': [startOfMonth(subMonths(now, 2)), now],
    'all': [new Date(0), now],
  };
  const [from, to] = ranges[range];
  return expenses.filter((e) => {
    const d = parseISO(e.date);
    return d >= from && d <= to;
  });
}

function applyTemplate(expenses: Expense[], tpl: ExportTemplate): Expense[] {
  let result = filterByDateRange(expenses, tpl.dateRange);
  if (tpl.categories !== 'all') {
    result = result.filter((e) => (tpl.categories as string[]).includes(e.category));
  }
  return result;
}

function generateShareToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function fileSizeKb(count: number): number {
  return Math.max(1, Math.round(count * 0.12));
}

const INTEGRATION_META: Record<IntegrationId, { name: string; logo: string; description: string; color: string }> = {
  'google-sheets': {
    name: 'Google Sheets',
    logo: '📊',
    description: 'Sync expenses to a spreadsheet automatically',
    color: '#34a853',
  },
  'dropbox': {
    name: 'Dropbox',
    logo: '📦',
    description: 'Save exports to your Dropbox folder',
    color: '#0061ff',
  },
  'onedrive': {
    name: 'OneDrive',
    logo: '☁️',
    description: 'Back up to Microsoft OneDrive',
    color: '#0078d4',
  },
  'notion': {
    name: 'Notion',
    logo: '📝',
    description: 'Push expense data to a Notion database',
    color: '#000000',
  },
};

// ─── Fake QR Code ─────────────────────────────────────────────────────────────

function FakeQRCode({ value, size = 120 }: { value: string; size?: number }) {
  const cells = 21;
  const cellSize = size / cells;

  // Deterministic "random" based on value string
  const hash = value.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
  const getRand = (i: number) => ((hash * (i + 1) * 2654435761) >>> 0) % 2 === 0;

  // Finder pattern (top-left, top-right, bottom-left)
  const finderCells = new Set<string>();
  const addFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
          finderCells.add(`${row + r},${col + c}`);
  };
  addFinder(0, 0); addFinder(0, 14); addFinder(14, 0);

  const modules: boolean[][] = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (__, c) => {
      const key = `${r},${c}`;
      if (finderCells.has(key)) return true;
      return getRand(r * cells + c);
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" />
      {modules.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#111"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExportDrawer({ isOpen, onClose, expenses }: ExportDrawerProps) {
  const [tab, setTab] = useState<Tab>('templates');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);

  // Share tab state
  const [shareToken] = useState(generateShareToken);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Integrations
  const [integrations, setIntegrations] = useState<Record<IntegrationId, IntegrationState>>(() => loadIntegrations());
  const [connectingId, setConnectingId] = useState<IntegrationId | null>(null);
  const [syncingId, setSyncingId] = useState<IntegrationId | null>(null);

  // Schedule
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => loadSchedule());
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // History
  const [history, setHistory] = useState<ExportRecord[]>(() => loadHistory());

  useEffect(() => {
    saveSchedule(schedule);
  }, [schedule]);

  useEffect(() => {
    saveIntegrations(integrations);
  }, [integrations]);

  // ── Template export ──
  const handleTemplateExport = useCallback(async (tpl: ExportTemplate) => {
    setExportingId(tpl.id);
    const data = applyTemplate(expenses, tpl);
    await new Promise((r) => setTimeout(r, 800));

    if (tpl.format === 'csv') exportToCSV(data);
    // For v3 simplicity, CSV works; JSON/PDF show as "downloaded" with fake file

    const record = {
      templateName: tpl.name,
      format: tpl.format,
      destination: 'local' as const,
      recordCount: data.length,
      fileSizeKb: fileSizeKb(data.length),
      status: 'completed' as const,
    };
    appendHistory(record);
    setHistory(loadHistory());
    setExportingId(null);
    setExportedId(tpl.id);
    setTimeout(() => setExportedId(null), 2500);
  }, [expenses]);

  // ── Copy share link ──
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`https://expensify.app/share/${shareToken}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareToken]);

  // ── Send email ──
  const sendEmail = useCallback(async () => {
    if (!emailInput.trim()) return;
    setSendingEmail(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSendingEmail(false);
    setEmailSent(true);
    appendHistory({
      templateName: 'Email Export',
      format: 'csv',
      destination: 'email',
      recordCount: expenses.length,
      fileSizeKb: fileSizeKb(expenses.length),
      status: 'completed',
    });
    setHistory(loadHistory());
    setTimeout(() => setEmailSent(false), 3000);
  }, [emailInput, expenses.length]);

  // ── Integration connect/disconnect ──
  const handleConnect = useCallback(async (id: IntegrationId) => {
    if (integrations[id].connected) {
      setIntegrations((prev) => ({
        ...prev,
        [id]: { connected: false, lastSync: null, accountLabel: null },
      }));
      return;
    }
    setConnectingId(id);
    await new Promise((r) => setTimeout(r, 1500));
    const emails = ['you@gmail.com', 'user@outlook.com', 'me@icloud.com', 'hello@notion.so'];
    setIntegrations((prev) => ({
      ...prev,
      [id]: {
        connected: true,
        lastSync: new Date().toISOString(),
        accountLabel: emails[Object.keys(INTEGRATION_META).indexOf(id)],
      },
    }));
    setConnectingId(null);
  }, [integrations]);

  const handleSync = useCallback(async (id: IntegrationId) => {
    setSyncingId(id);
    await new Promise((r) => setTimeout(r, 1800));
    setIntegrations((prev) => ({
      ...prev,
      [id]: { ...prev[id], lastSync: new Date().toISOString() },
    }));
    appendHistory({
      templateName: 'Full Backup',
      format: 'json',
      destination: id,
      recordCount: expenses.length,
      fileSizeKb: fileSizeKb(expenses.length),
      status: 'completed',
    });
    setHistory(loadHistory());
    setSyncingId(null);
  }, [expenses.length]);

  // ── Schedule save ──
  const saveScheduleConfig = useCallback(() => {
    saveSchedule(schedule);
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2000);
  }, [schedule]);

  const nextRun = useMemo(() => calcNextRun(schedule), [schedule]);
  const connectedCount = Object.values(integrations).filter((i) => i.connected).length;

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'templates', label: 'Templates', icon: <Layers size={15} /> },
    { id: 'share', label: 'Share', icon: <Share2 size={15} /> },
    { id: 'integrations', label: 'Integrations', icon: <Plug size={15} />, badge: connectedCount || undefined },
    { id: 'schedule', label: 'Schedule', icon: <Clock size={15} />, badge: schedule.enabled ? 1 : undefined },
    { id: 'history', label: 'History', icon: <History size={15} />, badge: history.length || undefined },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-white h-full flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-indigo-200" />
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Export Hub</span>
              </div>
              <h2 className="text-xl font-bold text-white">Connect & Share</h2>
              <p className="text-sm text-indigo-200 mt-0.5">
                {expenses.length} records · {connectedCount} integration{connectedCount !== 1 ? 's' : ''} connected
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ TEMPLATES ════ */}
          {tab === 'templates' && (
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Pre-built export formats for common needs
              </p>
              {EXPORT_TEMPLATES.map((tpl) => {
                const count = applyTemplate(expenses, tpl).length;
                const isExporting = exportingId === tpl.id;
                const isDone = exportedId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${tpl.accentColor}15` }}
                    >
                      {tpl.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{tpl.name}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                          style={{ backgroundColor: `${tpl.accentColor}18`, color: tpl.accentColor }}
                        >
                          {tpl.format}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-snug">{tpl.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">{count} records</span>
                        <span className="text-gray-200">·</span>
                        {tpl.useCases.slice(0, 2).map((u) => (
                          <span key={u} className="text-xs text-gray-400">{u}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleTemplateExport(tpl)}
                      disabled={isExporting || isDone}
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-600'
                          : isExporting
                          ? 'bg-indigo-100 text-indigo-400'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} />
                      ) : isExporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════ SHARE ════ */}
          {tab === 'share' && (
            <div className="p-5 flex flex-col gap-5">
              {/* Share link */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <ExternalLink size={14} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Shareable Link</span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <span className="text-xs text-gray-500 font-mono flex-1 truncate">
                      expensify.app/share/{shareToken}
                    </span>
                    <button
                      onClick={copyLink}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl border-2 border-gray-200 overflow-hidden shrink-0">
                      <FakeQRCode value={`https://expensify.app/share/${shareToken}`} size={100} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Scan the QR code or share the link. Recipients can view a read-only snapshot of your expense data.
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                        <AlertCircle size={11} />
                        Simulated — not a live link
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email export */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <Mail size={14} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Email Export</span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-xs text-gray-400">
                    Send a CSV export directly to an email address.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendEmail}
                      disabled={sendingEmail || emailSent || !emailInput.trim()}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        emailSent
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {sendingEmail ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : emailSent ? (
                        <><CheckCircle2 size={14} /> Sent!</>
                      ) : (
                        <><Mail size={14} /> Send</>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Format:</span>
                    {['CSV', 'JSON', 'PDF'].map((f) => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">{f}</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">· {expenses.length} records</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ INTEGRATIONS ════ */}
          {tab === 'integrations' && (
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Connect your cloud services
              </p>
              {(Object.entries(INTEGRATION_META) as [IntegrationId, typeof INTEGRATION_META[IntegrationId]][]).map(
                ([id, meta]) => {
                  const state = integrations[id];
                  const isConnecting = connectingId === id;
                  const isSyncing = syncingId === id;
                  return (
                    <div
                      key={id}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        state.connected ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0 shadow-sm">
                          {meta.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900">{meta.name}</span>
                            {state.connected ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                <Wifi size={9} /> Connected
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                <WifiOff size={9} /> Not connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{meta.description}</p>
                          {state.connected && state.accountLabel && (
                            <p className="text-xs text-gray-500 mt-1 font-medium">{state.accountLabel}</p>
                          )}
                          {state.connected && state.lastSync && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Last sync: {format(new Date(state.lastSync), 'MMM d \'at\' h:mm a')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {state.connected && (
                            <button
                              onClick={() => handleSync(id)}
                              disabled={isSyncing}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                              {isSyncing ? 'Syncing…' : 'Sync'}
                            </button>
                          )}
                          <button
                            onClick={() => handleConnect(id)}
                            disabled={isConnecting}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                              state.connected
                                ? 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {isConnecting ? (
                              <><Loader2 size={12} className="animate-spin" /> Connecting…</>
                            ) : state.connected ? (
                              'Disconnect'
                            ) : (
                              <>Connect <ChevronRight size={12} /></>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* ════ SCHEDULE ════ */}
          {tab === 'schedule' && (
            <div className="p-5 flex flex-col gap-5">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-white">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Automatic Backups</p>
                  <p className="text-xs text-gray-400 mt-0.5">Automatically export your data on a schedule</p>
                </div>
                <button
                  onClick={() => setSchedule((s) => ({ ...s, enabled: !s.enabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    schedule.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      schedule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className={`flex flex-col gap-4 transition-opacity ${schedule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                {/* Frequency */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSchedule((s) => ({ ...s, frequency: f }))}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          schedule.frequency === f
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Time</label>
                  <select
                    value={schedule.hour}
                    onChange={(e) => setSchedule((s) => ({ ...s, hour: Number(e.target.value) }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Format */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['csv', 'json', 'pdf'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSchedule((s) => ({ ...s, format: f }))}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium uppercase transition-all ${
                          schedule.format === f
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Destination</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'email', label: '📧 Email', connected: true },
                      { id: 'google-sheets', label: '📊 Google Sheets', connected: integrations['google-sheets'].connected },
                      { id: 'dropbox', label: '📦 Dropbox', connected: integrations['dropbox'].connected },
                      { id: 'onedrive', label: '☁️ OneDrive', connected: integrations['onedrive'].connected },
                    ] as const).map((d) => (
                      <button
                        key={d.id}
                        disabled={!d.connected}
                        onClick={() => setSchedule((s) => ({ ...s, destination: d.id }))}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-medium text-left transition-all ${
                          !d.connected
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                            : schedule.destination === d.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {d.label}
                        {!d.connected && <span className="ml-1 text-[10px] text-gray-300">(not connected)</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next run preview */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <Bell size={16} className="text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-700">Next scheduled export</p>
                    <p className="text-xs text-indigo-500 mt-0.5">
                      {format(nextRun, "EEEE, MMM d 'at' h:mm a")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={saveScheduleConfig}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    scheduleSaved
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {scheduleSaved ? (
                    <><CheckCircle2 size={16} /> Schedule saved!</>
                  ) : (
                    <><Play size={16} /> Save schedule</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════ HISTORY ════ */}
          {tab === 'history' && (
            <div className="p-5">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-medium text-gray-700">No export history yet</p>
                  <p className="text-sm text-gray-400 mt-1">Your exports will appear here</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      {history.length} export{history.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={() => {
                        localStorage.removeItem('export-hub-history');
                        setHistory([]);
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        record.status === 'completed' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {record.status === 'completed'
                          ? <CheckCircle2 size={16} className="text-emerald-600" />
                          : <AlertCircle size={16} className="text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{record.templateName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 uppercase font-medium">{record.format}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">{record.recordCount} records</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">{record.fileSizeKb}kb</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {format(new Date(record.timestamp), 'MMM d')}
                        </p>
                        <p className="text-xs text-gray-300">
                          {format(new Date(record.timestamp), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
