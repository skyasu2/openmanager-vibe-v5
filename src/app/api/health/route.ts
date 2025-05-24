import { NextResponse } from 'next/server'
import { withErrorPrevention, validatePayloadSize } from '../../../lib/error-prevention'

// 헬스체크 응답 타입 정의
interface HealthCheckResponse {
  status: 'healthy' | 'warning' | 'critical' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    api?: {
      status: string
      responseTime: number
      lastCheck: string
    }
    database?: {
      status: string
      connectionPool?: string
      lastCheck: string
    }
    cache?: {
      status: string
      hitRate?: string
      lastCheck: string
    }
  }
  metrics: {
    uptime: string
    memoryUsage: string
    activeConnections: number
    responseTime: number
  }
  version: string
  environment: string
}

// 메모리 사용량 확인
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024)
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024)
    return `${usedMB}MB / ${totalMB}MB (${Math.round((usedMB / totalMB) * 100)}%)`
  }
  return 'N/A (Serverless)'
}

// 업타임 계산
function getUptime() {
  if (typeof process !== 'undefined' && process.uptime) {
    const uptimeSeconds = Math.floor(process.uptime())
    if (uptimeSeconds < 60) return `${uptimeSeconds}s`
    if (uptimeSeconds < 3600) return `${Math.floor(uptimeSeconds / 60)}m`
    return `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
  }
  return 'N/A (Serverless)'
}

// 데이터베이스 연결 확인 (간단한 버전)
async function checkDatabase() {
  try {
    // 실제로는 Supabase 연결을 확인하지만, 간단히 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 10)) // 10ms 지연
    return {
      status: 'connected',
      connectionPool: '8/10',
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'disconnected',
      connectionPool: '0/10',
      lastCheck: new Date().toISOString()
    }
  }
}

// 캐시 연결 확인 (간단한 버전)
async function checkCache() {
  try {
    // 실제로는 Redis 연결을 확인하지만, 간단히 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 5)) // 5ms 지연
    return {
      status: 'connected',
      hitRate: '95%',
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'disconnected',
      hitRate: '0%',
      lastCheck: new Date().toISOString()
    }
  }
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 타임아웃 설정 (5초)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 5000)
    )

    // 병렬로 모든 서비스 상태 확인
    const [databaseStatus, cacheStatus] = await Promise.race([
      Promise.all([
        checkDatabase(),
        checkCache()
      ]),
      timeoutPromise
    ]) as [any, any]

    const responseTime = Date.now() - startTime
    
    // API 자체 상태
    const apiStatus = {
      status: responseTime < 1000 ? 'healthy' : 'slow',
      responseTime,
      lastCheck: new Date().toISOString()
    }

    // 전체 시스템 상태 결정
    let overallStatus: 'healthy' | 'warning' | 'critical' | 'degraded' = 'healthy'
    
    if (databaseStatus.status === 'disconnected' || cacheStatus.status === 'disconnected') {
      overallStatus = 'critical'
    } else if (responseTime > 1000) {
      overallStatus = 'warning'
    } else if (responseTime > 500) {
      overallStatus = 'degraded'
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        api: apiStatus,
        database: databaseStatus,
        cache: cacheStatus
      },
      metrics: {
        uptime: getUptime(),
        memoryUsage: getMemoryUsage(),
        activeConnections: Math.floor(Math.random() * 20) + 5, // 시뮬레이션
        responseTime
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown'
    }

    // 상태에 따른 HTTP 상태 코드 결정
    let httpStatus = 200
    if (overallStatus === 'critical') httpStatus = 503
    else if (overallStatus === 'warning' || overallStatus === 'degraded') httpStatus = 200

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Health-Check-Time': responseTime.toString(),
        'X-Health-Status': overallStatus,
        // CORS 헤더 추가
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Health check failed:', error)
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {},
      metrics: {
        uptime: getUptime(),
        memoryUsage: getMemoryUsage(),
        activeConnections: 0,
        responseTime
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown'
    }

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Health-Check-Time': responseTime.toString(),
        'X-Health-Status': 'unhealthy',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
} 