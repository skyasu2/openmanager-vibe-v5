/**
 * 📊 PerformanceDashboard Constants
 * 
 * Color schemes and constants for performance dashboard:
 * - Color palette definitions
 * - Engine-specific color mappings
 * - Theme constants
 */

// 색상 팔레트
export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
} as const;

export const ENGINE_COLORS: Record<string, string> = {
  'supabase-rag': COLORS.success,
  'google-ai': COLORS.primary,
  'mcp-context': COLORS.purple,
  'korean-ai': COLORS.pink,
  transformers: COLORS.indigo,
  fallback: COLORS.warning,
  emergency: COLORS.danger,
} as const;

// 차트 테마 설정
export const CHART_CONFIG = {
  strokeDashArray: "3 3",
  strokeWidth: 2,
  fillOpacity: 0.3,
  outerRadius: 80,
} as const;

// 자동 새로고침 간격 (ms)
export const AUTO_REFRESH_INTERVAL = 30000; // 30초