/**
 * Shared Constants
 *
 * 🔧 모든 모듈에서 공통으로 사용하는 상수들
 */

export const MODULE_VERSIONS = {
  AI_AGENT: '1.0.0',
  AI_SIDEBAR: '1.0.0',
  MCP: '1.0.0',
  SHARED: '1.0.0',
} as const;

export const API_ENDPOINTS = {
  AI_AGENT: '/api/ai-agent',
  HEALTH: '/api/health',
  STATUS: '/api/dashboard',
  DASHBOARD: '/api/dashboard',
  SERVERS: '/api/servers',
} as const;

export const ERROR_CODES = {
  UNKNOWN: 'UNKNOWN_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  AI_ENGINE_ERROR: 'AI_ENGINE_ERROR',
  MCP_ERROR: 'MCP_ERROR',
} as const;

export const DEFAULT_TIMEOUTS = {
  API_REQUEST: 5000,
  AI_RESPONSE: 10000,
  HEALTH_CHECK: 3000,
  CONNECTION: 30000,
} as const;

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export const STORAGE_KEYS = {
  AI_SIDEBAR_CONFIG: 'ai-sidebar-config',
  AI_SIDEBAR_HISTORY: 'ai-sidebar-history',
  USER_PREFERENCES: 'user-preferences',
  SESSION_DATA: 'session-data',
} as const;

export const EVENTS = {
  AI_RESPONSE: 'ai:response',
  AI_ERROR: 'ai:error',
  SIDEBAR_OPEN: 'sidebar:open',
  SIDEBAR_CLOSE: 'sidebar:close',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  ACTION_EXECUTED: 'action:executed',
  CONFIG_UPDATED: 'config:updated',
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

export const POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
} as const;

export const STATUS_TYPES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  LOADING: 'loading',
  ERROR: 'error',
} as const;

export const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system',
} as const;

export const ACTION_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
} as const;
