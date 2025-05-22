export interface Server {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  cpu: number
  memory: number
  location?: string
  lastUpdate?: string
}

export interface ServerStatus {
  cpu?: number
  memory?: number
  status?: 'running' | 'stopped' | 'error' | 'warning'
  location?: string
  services?: Record<string, boolean>
  version?: string
  uptime?: number
}

export interface MCPResponse {
  response: string
  category: string
  confidence: number
  cached?: boolean
  timestamp?: string
  data?: unknown
  queryAnalysis?: {
    isQuestion: boolean
    isCommand: boolean
    isStatus: boolean
    isPerformance: boolean
    isAlert: boolean
  }
}

export interface QueryStats {
  totalQueries: number
  todayQueries: number
  yesterdayQueries: number
  popularQueries: Array<{ query: string; count: number }>
}
