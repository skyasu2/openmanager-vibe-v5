export interface Server {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  cpu: number
  memory: number
  location?: string
  lastUpdate?: string
}

export interface MCPResponse {
  response: string
  category: string
  confidence: number
  cached?: boolean
  timestamp?: string
  data?: any
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
