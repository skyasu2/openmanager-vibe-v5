// Supabase 데이터베이스 테이블 정의 및 설정
export const DB_TABLES = {
  SERVERS: 'servers',
  QUERIES: 'mcp_queries',
  CACHE: 'cached_data',
  REPORTS: 'reports',
  ALERTS: 'alerts',
  HEALTH_CHECKS: 'healthcheck'
}

// 데이터베이스 쿼리 타임아웃 설정
export const DB_TIMEOUT = 10000 // 10초

// 페이징 기본값
export const DB_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
}

// 서버 스키마 정의
export interface ServerSchema {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  cpu: number
  memory: number
  location: string
  last_updated: string
  ip_address?: string
  os_info?: string
  uptime?: number
}

// MCP 쿼리 스키마 정의
export interface MCPQuerySchema {
  id: string
  query: string
  response: string
  category: string
  confidence: number
  created_at: string
  user_id?: string
  metadata?: Record<string, unknown>
}

// 캐시 데이터 스키마 정의
export interface CacheSchema {
  key: string
  value: unknown
  expires_at: string
  created_at: string
} 