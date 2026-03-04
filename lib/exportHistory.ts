export type ExportDestination =
  | 'local'
  | 'email'
  | 'google-sheets'
  | 'dropbox'
  | 'onedrive'
  | 'notion';

export type ExportStatus = 'completed' | 'failed' | 'pending';

export interface ExportRecord {
  id: string;
  timestamp: string;
  templateName: string;
  format: string;
  destination: ExportDestination;
  recordCount: number;
  fileSizeKb: number;
  status: ExportStatus;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  hour: number; // 0–23
  format: 'csv' | 'json' | 'pdf';
  destination: ExportDestination;
  templateId: string;
}

export interface IntegrationState {
  connected: boolean;
  lastSync: string | null;
  accountLabel: string | null;
}

export type IntegrationId = 'google-sheets' | 'dropbox' | 'onedrive' | 'notion';

const HISTORY_KEY = 'export-hub-history';
const SCHEDULE_KEY = 'export-hub-schedule';
const INTEGRATIONS_KEY = 'export-hub-integrations';

export function loadHistory(): ExportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function appendHistory(record: Omit<ExportRecord, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const history = loadHistory();
  history.unshift({
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

export function loadSchedule(): ScheduleConfig {
  if (typeof window === 'undefined') return defaultSchedule();
  try {
    return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || 'null') ?? defaultSchedule();
  } catch { return defaultSchedule(); }
}

export function saveSchedule(config: ScheduleConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(config));
}

function defaultSchedule(): ScheduleConfig {
  return {
    enabled: false,
    frequency: 'weekly',
    hour: 9,
    format: 'csv',
    destination: 'email',
    templateId: 'monthly-summary',
  };
}

export function loadIntegrations(): Record<IntegrationId, IntegrationState> {
  if (typeof window === 'undefined') return defaultIntegrations();
  try {
    return JSON.parse(localStorage.getItem(INTEGRATIONS_KEY) || 'null') ?? defaultIntegrations();
  } catch { return defaultIntegrations(); }
}

export function saveIntegrations(state: Record<IntegrationId, IntegrationState>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(state));
}

function defaultIntegrations(): Record<IntegrationId, IntegrationState> {
  return {
    'google-sheets': { connected: false, lastSync: null, accountLabel: null },
    'dropbox': { connected: false, lastSync: null, accountLabel: null },
    'onedrive': { connected: false, lastSync: null, accountLabel: null },
    'notion': { connected: false, lastSync: null, accountLabel: null },
  };
}

export function calcNextRun(config: ScheduleConfig): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(config.hour, 0, 0, 0);
  if (next <= now) {
    if (config.frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (config.frequency === 'weekly') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
  }
  return next;
}
