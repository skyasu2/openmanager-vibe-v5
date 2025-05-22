# OpenManager Vibe V5 - Performance Monitoring System

Add comprehensive performance monitoring and resource usage tracking to the existing OpenManager Vibe V5 project.

## 🎯 PERFORMANCE MONITORING REQUIREMENTS

### Core Monitoring Features
- **Redis Usage Monitor**: Track 10K daily request limit with auto-cleanup
- **Supabase Storage Monitor**: Monitor 500MB storage limit with auto-archiving
- **Vercel Function Optimization**: Response time, memory usage, timeout handling
- **Error Handling & Logging**: Comprehensive error boundaries and performance logging

## 📁 ADDITIONAL FILES TO CREATE

```
src/
├── lib/
│   ├── monitoring/
│   │   ├── redis-monitor.ts          # Redis usage tracking
│   │   ├── supabase-monitor.ts       # Supabase storage tracking
│   │   ├── vercel-monitor.ts         # Vercel function optimization
│   │   ├── performance-logger.ts     # Centralized logging
│   │   └── health-checker.ts         # System health monitoring
│   │
│   ├── middleware/
│   │   ├── error-handler.ts          # Global error handling
│   │   ├── performance-tracker.ts    # Request performance tracking
│   │   └── rate-limiter.ts           # Request rate limiting
│   │
│   └── utils/
│       ├── alerts.ts                 # Alert system
│       ├── cleanup.ts                # Auto-cleanup utilities
│       └── compression.ts            # Data compression utilities
│
├── app/
│   ├── api/
│   │   ├── monitoring/
│   │   │   ├── redis-stats/
│   │   │   │   └── route.ts          # Redis usage API
│   │   │   ├── supabase-stats/
│   │   │   │   └── route.ts          # Supabase usage API
│   │   │   ├── performance/
│   │   │   │   └── route.ts          # Performance metrics API
│   │   │   └── cleanup/
│   │   │       └── route.ts          # Cleanup operations API
│   │   │
│   │   └── health/
│   │       └── detailed/
│   │           └── route.ts          # Detailed health check
│   │
│   └── monitoring/
│       └── page.tsx                  # Monitoring dashboard
│
└── components/
    ├── monitoring/
    │   ├── RedisMonitor.tsx          # Redis usage visualization
    │   ├── SupabaseMonitor.tsx       # Supabase usage visualization
    │   ├── PerformanceChart.tsx      # Performance metrics chart
    │   └── AlertPanel.tsx            # Alert notifications
    │
    └── ui/
        ├── metric-card.tsx           # Metric display component
        └── status-indicator.tsx     # Status indicator component
```

## 🔧 IMPLEMENTATION CODE

### 1. Redis Usage Monitor
```typescript
// src/lib/monitoring/redis-monitor.ts
import { redis } from '@/lib/redis'

export class RedisMonitor {
  private static readonly DAILY_LIMIT = 10000
  private static readonly CLEANUP_THRESHOLD = 8000
  private static readonly USAGE_KEY = 'redis:daily_usage'
  private static readonly STATS_KEY = 'redis:stats'

  static async trackRequest(operation: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const usageKey = `${this.USAGE_KEY}:${today}`
    
    try {
      // Increment daily usage counter
      const currentUsage = await redis.incr(usageKey)
      
      // Set expiration to end of day if this is the first request today
      if (currentUsage === 1) {
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)
        const ttl = Math.floor((endOfDay.getTime() - Date.now()) / 1000)
        await redis.expire(usageKey, ttl)
      }
      
      // Track operation stats
      await this.updateOperationStats(operation)
      
      // Auto-cleanup if approaching limit
      if (currentUsage >= this.CLEANUP_THRESHOLD) {
        await this.autoCleanup()
      }
      
      // Alert if usage is critical
      if (currentUsage >= this.DAILY_LIMIT * 0.9) {
        await this.sendUsageAlert(currentUsage)
      }
    } catch (error) {
      console.error('Redis monitoring error:', error)
    }
  }

  static async getCurrentUsage(): Promise<{
    used: number
    limit: number
    percentage: number
    remaining: number
  }> {
    const today = new Date().toISOString().split('T')[0]
    const usageKey = `${this.USAGE_KEY}:${today}`
    
    try {
      const used = await redis.get(usageKey) || 0
      const remaining = Math.max(0, this.DAILY_LIMIT - Number(used))
      const percentage = (Number(used) / this.DAILY_LIMIT) * 100
      
      return {
        used: Number(used),
        limit: this.DAILY_LIMIT,
        percentage: Math.round(percentage * 100) / 100,
        remaining
      }
    } catch (error) {
      console.error('Failed to get Redis usage:', error)
      return { used: 0, limit: this.DAILY_LIMIT, percentage: 0, remaining: this.DAILY_LIMIT }
    }
  }

  private static async updateOperationStats(operation: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const statsKey = `${this.STATS_KEY}:${today}`
    
    try {
      await redis.hincrby(statsKey, operation, 1)
      await redis.expire(statsKey, 86400) // 24 hours
    } catch (error) {
      console.error('Failed to update operation stats:', error)
    }
  }

  private static async autoCleanup(): Promise<void> {
    try {
      console.log('Starting Redis auto-cleanup...')
      
      // Clean up old cache entries
      const keys = await redis.keys('cache:*')
      const oldKeys = []
      
      for (const key of keys) {
        const ttl = await redis.ttl(key)
        if (ttl < 3600) { // Less than 1 hour remaining
          oldKeys.push(key)
        }
      }
      
      if (oldKeys.length > 0) {
        await redis.del(...oldKeys)
        console.log(`Cleaned up ${oldKeys.length} old cache entries`)
      }
    } catch (error) {
      console.error('Auto-cleanup failed:', error)
    }
  }

  private static async sendUsageAlert(currentUsage: number): Promise<void> {
    const alertData = {
      type: 'redis_usage_high',
      message: `Redis usage is high: ${currentUsage}/${this.DAILY_LIMIT} requests`,
      timestamp: new Date().toISOString(),
      severity: currentUsage >= this.DAILY_LIMIT ? 'critical' : 'warning'
    }
    
    // Store alert in Redis with short TTL for immediate access
    await redis.setex('alert:redis_usage', 300, JSON.stringify(alertData))
    console.warn('Redis usage alert:', alertData)
  }

  static async getOperationStats(): Promise<Record<string, number>> {
    const today = new Date().toISOString().split('T')[0]
    const statsKey = `${this.STATS_KEY}:${today}`
    
    try {
      const stats = await redis.hgetall(statsKey)
      return Object.fromEntries(
        Object.entries(stats).map(([key, value]) => [key, Number(value)])
      )
    } catch (error) {
      console.error('Failed to get operation stats:', error)
      return {}
    }
  }
}
```

### 2. Supabase Storage Monitor
```typescript
// src/lib/monitoring/supabase-monitor.ts
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { redis } from '@/lib/redis'

export class SupabaseMonitor {
  private static readonly STORAGE_LIMIT = 500 * 1024 * 1024 // 500MB in bytes
  private static readonly ARCHIVE_THRESHOLD = 400 * 1024 * 1024 // 400MB
  private static readonly USAGE_CACHE_KEY = 'supabase:storage_usage'
  private static readonly CACHE_TTL = 300 // 5 minutes

  static async getCurrentStorageUsage(): Promise<{
    used: number
    limit: number
    percentage: number
    remaining: number
    tables: Record<string, number>
  }> {
    try {
      // Try to get from cache first
      const cached = await redis.get(this.USAGE_CACHE_KEY)
      if (cached) {
        return JSON.parse(cached)
      }

      // Calculate storage usage by querying table sizes
      const { data: tables, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (error) throw error

      const tableSizes: Record<string, number> = {}
      let totalUsed = 0

      for (const table of tables || []) {
        const { data: sizeData } = await supabaseAdmin
          .rpc('get_table_size', { table_name: table.table_name })
          .single()
        
        const size = sizeData?.size || 0
        tableSizes[table.table_name] = size
        totalUsed += size
      }

      const result = {
        used: totalUsed,
        limit: this.STORAGE_LIMIT,
        percentage: (totalUsed / this.STORAGE_LIMIT) * 100,
        remaining: Math.max(0, this.STORAGE_LIMIT - totalUsed),
        tables: tableSizes
      }

      // Cache the result
      await redis.setex(this.USAGE_CACHE_KEY, this.CACHE_TTL, JSON.stringify(result))

      // Check if cleanup is needed
      if (totalUsed >= this.ARCHIVE_THRESHOLD) {
        await this.autoArchive()
      }

      return result
    } catch (error) {
      console.error('Failed to get Supabase storage usage:', error)
      return {
        used: 0,
        limit: this.STORAGE_LIMIT,
        percentage: 0,
        remaining: this.STORAGE_LIMIT,
        tables: {}
      }
    }
  }

  private static async autoArchive(): Promise<void> {
    try {
      console.log('Starting Supabase auto-archive...')
      
      // Archive old monitoring data (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: oldData, error } = await supabaseAdmin
        .from('monitoring_logs')
        .select('*')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .limit(1000)

      if (error) throw error

      if (oldData && oldData.length > 0) {
        // Compress and store in archive table
        const compressedData = await this.compressData(oldData)
        
        await supabaseAdmin
          .from('archived_monitoring_logs')
          .insert({
            data: compressedData,
            archived_at: new Date().toISOString(),
            record_count: oldData.length
          })

        // Delete old records
        const oldIds = oldData.map(record => record.id)
        await supabaseAdmin
          .from('monitoring_logs')
          .delete()
          .in('id', oldIds)

        console.log(`Archived ${oldData.length} old monitoring records`)
      }
    } catch (error) {
      console.error('Auto-archive failed:', error)
    }
  }

  private static async compressData(data: any[]): Promise<string> {
    // Simple JSON compression - in production, consider using gzip
    return JSON.stringify(data)
  }

  static async trackStorageOperation(operation: string, tableName: string, size: number): Promise<void> {
    try {
      await supabaseAdmin.from('storage_operations').insert({
        operation,
        table_name: tableName,
        size_bytes: size,
        timestamp: new Date().toISOString()
      })

      // Invalidate cache
      await redis.del(this.USAGE_CACHE_KEY)
    } catch (error) {
      console.error('Failed to track storage operation:', error)
    }
  }
}
```

### 3. Vercel Function Optimization
```typescript
// src/lib/monitoring/vercel-monitor.ts
import { redis } from '@/lib/redis'

export class VercelMonitor {
  private static readonly FUNCTION_TIMEOUT = 10000 // 10 seconds
  private static readonly PERFORMANCE_KEY = 'vercel:performance'
  private static readonly MEMORY_KEY = 'vercel:memory'

  static async trackFunctionPerformance<T>(
    functionName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    const startMemory = process.memoryUsage()
    
    try {
      // Set timeout to prevent Vercel function timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout')), this.FUNCTION_TIMEOUT - 1000)
      })
      
      const result = await Promise.race([operation(), timeoutPromise])
      
      // Record successful execution
      await this.recordPerformance(functionName, startTime, startMemory, true)
      
      return result
    } catch (error) {
      // Record failed execution
      await this.recordPerformance(functionName, startTime, startMemory, false, error)
      throw error
    }
  }

  private static async recordPerformance(
    functionName: string,
    startTime: number,
    startMemory: NodeJS.MemoryUsage,
    success: boolean,
    error?: any
  ): Promise<void> {
    try {
      const endTime = Date.now()
      const endMemory = process.memoryUsage()
      const duration = endTime - startTime
      
      const performanceData = {
        functionName,
        duration,
        success,
        memory: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external - startMemory.external
        },
        timestamp: new Date().toISOString(),
        error: error ? error.message : null
      }

      // Store in Redis with daily expiration
      const today = new Date().toISOString().split('T')[0]
      const performanceKey = `${this.PERFORMANCE_KEY}:${today}`
      
      await redis.lpush(performanceKey, JSON.stringify(performanceData))
      await redis.expire(performanceKey, 86400) // 24 hours
      
      // Keep only last 1000 entries per day
      await redis.ltrim(performanceKey, 0, 999)
      
      // Update memory usage stats
      await this.updateMemoryStats(functionName, endMemory)
      
    } catch (monitoringError) {
      console.error('Performance monitoring error:', monitoringError)
    }
  }

  private static async updateMemoryStats(functionName: string, memory: NodeJS.MemoryUsage): Promise<void> {
    try {
      const memoryKey = `${this.MEMORY_KEY}:${functionName}`
      const memoryData = {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        timestamp: Date.now()
      }
      
      await redis.setex(memoryKey, 3600, JSON.stringify(memoryData)) // 1 hour
    } catch (error) {
      console.error('Memory stats update error:', error)
    }
  }

  static async getPerformanceMetrics(functionName?: string): Promise<{
    averageResponseTime: number
    successRate: number
    memoryUsage: any
    recentErrors: any[]
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const performanceKey = `${this.PERFORMANCE_KEY}:${today}`
      
      const rawData = await redis.lrange(performanceKey, 0, -1)
      const performanceData = rawData.map(data => JSON.parse(data))
      
      // Filter by function name if specified
      const filteredData = functionName 
        ? performanceData.filter(d => d.functionName === functionName)
        : performanceData
      
      if (filteredData.length === 0) {
        return {
          averageResponseTime: 0,
          successRate: 100,
          memoryUsage: null,
          recentErrors: []
        }
      }
      
      const totalDuration = filteredData.reduce((sum, d) => sum + d.duration, 0)
      const successCount = filteredData.filter(d => d.success).length
      const recentErrors = filteredData.filter(d => !d.success).slice(0, 10)
      
      return {
        averageResponseTime: Math.round(totalDuration / filteredData.length),
        successRate: Math.round((successCount / filteredData.length) * 100),
        memoryUsage: filteredData[0]?.memory,
        recentErrors
      }
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      return {
        averageResponseTime: 0,
        successRate: 100,
        memoryUsage: null,
        recentErrors: []
      }
    }
  }
}
```

### 4. Performance Logger
```typescript
// src/lib/monitoring/performance-logger.ts
import { redis } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase'

export class PerformanceLogger {
  private static readonly LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
  } as const

  private static readonly LOG_KEY = 'logs:performance'
  private static readonly MAX_LOGS_PER_DAY = 10000

  static async log(
    level: keyof typeof PerformanceLogger.LOG_LEVELS,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      const logEntry = {
        level,
        message,
        metadata,
        timestamp: new Date().toISOString(),
        severity: this.LOG_LEVELS[level]
      }

      // Store in Redis for immediate access
      await this.storeInRedis(logEntry)
      
      // Store in Supabase for persistence (async, no await)
      this.storeInSupabase(logEntry).catch(error => 
        console.error('Failed to store log in Supabase:', error)
      )
      
      // Console output for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level}] ${message}`, metadata)
      }
    } catch (error) {
      console.error('Logging failed:', error)
    }
  }

  private static async storeInRedis(logEntry: any): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const logKey = `${this.LOG_KEY}:${today}`
    
    await redis.lpush(logKey, JSON.stringify(logEntry))
    await redis.expire(logKey, 86400) // 24 hours
    
    // Keep only max logs per day
    await redis.ltrim(logKey, 0, this.MAX_LOGS_PER_DAY - 1)
  }

  private static async storeInSupabase(logEntry: any): Promise<void> {
    await supabaseAdmin.from('performance_logs').insert(logEntry)
  }

  static async getLogs(
    level?: keyof typeof PerformanceLogger.LOG_LEVELS,
    limit = 100
  ): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const logKey = `${this.LOG_KEY}:${today}`
      
      const rawLogs = await redis.lrange(logKey, 0, limit - 1)
      const logs = rawLogs.map(log => JSON.parse(log))
      
      if (level) {
        return logs.filter(log => log.level === level)
      }
      
      return logs
    } catch (error) {
      console.error('Failed to get logs:', error)
      return []
    }
  }

  static async getLogSummary(): Promise<{
    totalLogs: number
    logsByLevel: Record<string, number>
    recentCritical: any[]
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const logKey = `${this.LOG_KEY}:${today}`
      
      const rawLogs = await redis.lrange(logKey, 0, -1)
      const logs = rawLogs.map(log => JSON.parse(log))
      
      const logsByLevel: Record<string, number> = {}
      for (const level of Object.keys(this.LOG_LEVELS)) {
        logsByLevel[level] = logs.filter(log => log.level === level).length
      }
      
      const recentCritical = logs
        .filter(log => log.level === 'CRITICAL')
        .slice(0, 5)
      
      return {
        totalLogs: logs.length,
        logsByLevel,
        recentCritical
      }
    } catch (error) {
      console.error('Failed to get log summary:', error)
      return {
        totalLogs: 0,
        logsByLevel: {},
        recentCritical: []
      }
    }
  }
}
```

### 5. API Routes for Monitoring
```typescript
// src/app/api/monitoring/redis-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { RedisMonitor } from '@/lib/monitoring/redis-monitor'
import { VercelMonitor } from '@/lib/monitoring/vercel-monitor'

export async function GET(request: NextRequest) {
  return VercelMonitor.trackFunctionPerformance('redis-stats', async () => {
    try {
      const [usage, operationStats] = await Promise.all([
        RedisMonitor.getCurrentUsage(),
        RedisMonitor.getOperationStats()
      ])

      return NextResponse.json({
        usage,
        operationStats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get Redis stats' },
        { status: 500 }
      )
    }
  })
}

// src/app/api/monitoring/supabase-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseMonitor } from '@/lib/monitoring/supabase-monitor'
import { VercelMonitor } from '@/lib/monitoring/vercel-monitor'

export async function GET(request: NextRequest) {
  return VercelMonitor.trackFunctionPerformance('supabase-stats', async () => {
    try {
      const storageUsage = await SupabaseMonitor.getCurrentStorageUsage()

      return NextResponse.json({
        storage: storageUsage,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get Supabase stats' },
        { status: 500 }
      )
    }
  })
}

// src/app/api/monitoring/performance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { VercelMonitor } from '@/lib/monitoring/vercel-monitor'
import { PerformanceLogger } from '@/lib/monitoring/performance-logger'

export async function GET(request: NextRequest) {
  return VercelMonitor.trackFunctionPerformance('performance-stats', async () => {
    try {
      const { searchParams } = new URL(request.url)
      const functionName = searchParams.get('function')

      const [performanceMetrics, logSummary] = await Promise.all([
        VercelMonitor.getPerformanceMetrics(functionName || undefined),
        PerformanceLogger.getLogSummary()
      ])

      return NextResponse.json({
        performance: performanceMetrics,
        logs: logSummary,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get performance stats' },
        { status: 500 }
      )
    }
  })
}
```

### 6. Monitoring Dashboard Component
```typescript
// src/components/monitoring/MonitoringDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, Clock, Database, Server } from 'lucide-react'

interface MonitoringStats {
  redis: {
    usage: { used: number; limit: number; percentage: number; remaining: number }
    operationStats: Record<string, number>
  }
  supabase: {
    storage: { used: number; limit: number; percentage: number; remaining: number; tables: Record<string, number> }
  }
  performance: {
    averageResponseTime: number
    successRate: number
    memoryUsage: any
    recentErrors: any[]
  }
  logs: {
    totalLogs: number
    logsByLevel: Record<string, number>
    recentCritical: any[]
  }
}

export function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [redisRes, supabaseRes, performanceRes] = await Promise.all([
          fetch('/api/monitoring/redis-stats'),
          fetch('/api/monitoring/supabase-stats'),
          fetch('/api/monitoring/performance')
        ])

        const [redisData, supabaseData, performanceData] = await Promise.all([
          redisRes.json(),
          supabaseRes.json(),
          performanceRes.json()
        ])

        setStats({
          redis: redisData,
          supabase: supabaseData,
          performance: performanceData.performance,
          logs: performanceData.logs
        })
      } catch (err) {
        setError('Failed to fetch monitoring stats')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Loading monitoring data...</div>
  if (error) return <div>Error: {error}</div>
  if (!stats) return <div>No data available</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {/* Redis Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Redis Usage</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.redis.usage.used.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            of {stats.redis.usage.limit.toLocaleString()} requests
          </p>
          <Progress value={stats.redis.usage.percentage} className="mt-2" />
          <div className="mt-2 text-xs text-muted-foreground">
            {stats.redis.usage.remaining.toLocaleString()} remaining
          </div>
        </CardContent>
      </Card>

      {/* Supabase Storage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Supabase Storage</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(stats.supabase.storage.used / 1024 / 1024)}MB
          </div>
          <p className="text-xs text-muted-foreground">
            of {Math.round(stats.supabase.storage.limit / 1024 / 1024)}MB
          </p>
          <Progress value={stats.supabase.storage.percentage} className="mt-2" />
          <div className="mt-2 text-xs text-muted-foreground">
            {Math.round(stats.supabase.storage.remaining / 1024 / 1024)}MB remaining
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.performance.averageResponseTime}ms</div>
          <p className="text-xs text-muted-foreground">Average response time</p>
          <div className="mt-2 flex items-center gap-2">
            {stats.performance.successRate >= 95 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm">{stats.performance.successRate}% success rate</span>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Critical Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.logs.recentCritical.length === 0 ? (
            <div className="text-sm text-muted-foreground">No critical issues detected</div>
          ) : (
            <div className="space-y-2">
              {stats.logs.recentCritical.map((log, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="text-sm font-medium">{log.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🚀 INTEGRATION INSTRUCTIONS

### 1. Update existing API routes to use monitoring
```typescript
// Example: Update existing MCP query route
import { VercelMonitor } from '@/lib/monitoring/vercel-monitor'
import { RedisMonitor } from '@/lib/monitoring/redis-monitor'
import { PerformanceLogger } from '@/lib/monitoring/performance-logger'

export async function POST(request: Request) {
  return VercelMonitor.trackFunctionPerformance('mcp-query', async () => {
    await RedisMonitor.trackRequest('mcp_query')
    await PerformanceLogger.log('INFO', 'MCP query initiated')
    
    // ... existing logic
  })
}
```

### 2. Add middleware for global monitoring
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { PerformanceLogger } from '@/lib/monitoring/performance-logger'

export async function middleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  // Log API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const duration = Date.now() - start
    await PerformanceLogger.log('INFO', 'API request', {
      path: request.nextUrl.pathname,
      method: request.method,
      duration,
      status: response.status
    })
  }
  
  return response
}
```

### 3. Add monitoring page
```typescript
// src/app/monitoring/page.tsx
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard'

export default function MonitoringPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">System Monitoring</h1>
      <MonitoringDashboard />
    </div>
  )
}
```

## ✅ TESTING CHECKLIST

After implementation, verify:
- [ ] Redis usage tracking works correctly
- [ ] Supabase storage monitoring is accurate
- [ ] Performance metrics are collected
- [ ] Error logging is functioning
- [ ] Auto-cleanup runs when thresholds are reached
- [ ] Monitoring dashboard displays data correctly
- [ ] API endpoints respond within timeout limits
- [ ] Alerts are triggered for high usage

## 🎯 EXPECTED BENEFITS

1. **Proactive Monitoring**: Detect issues before they cause problems
2. **Resource Optimization**: Stay within free tier limits
3. **Performance Insights**: Identify bottlenecks and optimization opportunities
4. **Automated Maintenance**: Self-healing capabilities with auto-cleanup
5. **Production Readiness**: Enterprise-level monitoring and alerting

Implement this comprehensive monitoring system to ensure your OpenManager Vibe V5 runs efficiently and reliably in production!
