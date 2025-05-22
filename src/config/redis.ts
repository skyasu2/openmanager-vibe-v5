// Redis 키 접두사 정의
export const REDIS_PREFIXES = {
  SERVER: 'server:',
  MCP_QUERY: 'mcp:query:',
  MCP_RESPONSE: 'mcp:response:',
  STATS: 'stats:',
  CACHE: 'cache:',
  USER: 'user:'
}

// Redis 키 만료 시간 (초 단위)
export const REDIS_TTL = {
  SERVER_STATUS: 3600, // 1시간
  MCP_QUERY: 86400, // 24시간
  CACHE_SHORT: 300, // 5분
  CACHE_MEDIUM: 3600, // 1시간
  CACHE_LONG: 86400, // 24시간
  SESSION: 1800 // 30분
}

// Redis 키 생성 도우미 함수
export function createRedisKey(prefix: string, id: string): string {
  return `${prefix}${id}`
}

// 서버 상태 키 생성
export function createServerKey(serverId: string): string {
  return createRedisKey(REDIS_PREFIXES.SERVER, serverId)
}

// MCP 쿼리 키 생성
export function createMCPQueryKey(query: string): string {
  // 쿼리 정규화 (공백 제거, 소문자 변환)
  const normalizedQuery = query.trim().toLowerCase()
  return createRedisKey(REDIS_PREFIXES.MCP_QUERY, normalizedQuery)
}

// 통계 키 생성
export function createStatsKey(statsType: string, date?: string): string {
  const dateStr = date || new Date().toISOString().split('T')[0]
  return createRedisKey(REDIS_PREFIXES.STATS, `${statsType}:${dateStr}`)
} 