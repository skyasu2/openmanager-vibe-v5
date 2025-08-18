/**
 * 📝 LogDashboard Types & Constants
 *
 * Centralized type definitions and constants for the logging dashboard:
 * - Log entry interfaces and metadata
 * - Status and statistics types
 * - Color schemes for levels and categories
 * - UI state management types
 */

// Core log types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type LogCategory =
  | 'ai-engine'
  | 'fallback'
  | 'performance'
  | 'mcp'
  | 'google-ai'
  | 'rag'
  | 'system'
  | 'user'
  | 'security';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  source: string;
  message: string;
  data?: unknown;
  metadata?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    engine?: string;
    mode?: string;
    responseTime?: number;
    success?: boolean;
  };
  tags?: string[];
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LogStats {
  totalLogs: number;
  levelBreakdown: Record<LogLevel, number>;
  categoryBreakdown: Record<LogCategory, number>;
  errorRate: number;
  recentErrors: LogEntry[];
  timeRange: {
    oldest: string;
    newest: string;
  };
}

export interface LogData {
  logs: LogEntry[];
  count: number;
  stats?: LogStats;
  status?: {
    enabled: boolean;
    logCount: number;
    lastLogTime?: string;
    config: Record<string, unknown>;
  };
}

// UI state management
export interface LogFilters {
  searchQuery: string;
  selectedLevels: LogLevel[];
  selectedCategories: LogCategory[];
  selectedSource: string;
  timeRange: { start: string; end: string };
  limit: number;
}

export interface LogDashboardState {
  data: LogData | null;
  loading: boolean;
  error: string | null;
  selectedTab: string;
  filters: LogFilters;
  autoRefresh: boolean;
  expandedLog: string | null;
}

// Color schemes
export const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
  critical: '#DC2626',
};

export const CATEGORY_COLORS: Record<LogCategory, string> = {
  'ai-engine': '#8B5CF6',
  fallback: '#F59E0B',
  performance: '#10B981',
  mcp: '#6366F1',
  'google-ai': '#3B82F6',
  rag: '#059669',
  system: '#6B7280',
  user: '#EC4899',
  security: '#DC2626',
};

// Chart data types for analytics
export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface TrendDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

// Export utilities types
export interface ExportOptions {
  format: 'json' | 'csv' | 'txt';
  includeMetadata: boolean;
  includeStackTrace: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
