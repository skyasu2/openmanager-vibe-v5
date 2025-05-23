import { NextRequest, NextResponse } from 'next/server'
import { checkSupabaseConnection } from '../../../lib/supabase'
import { checkRedisConnection } from '../../../lib/redis'
import { HealthCheckResponseSchema } from '../../../types/api'
import type { HealthCheckResponse } from '../../../types/api'

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  try {
    const startTime = Date.now()
    
    const [supabaseStatus, redisStatus] = await Promise.all([
      checkSupabaseConnection(),
      checkRedisConnection()
    ])

    const responseTime = Date.now() - startTime
    const allHealthy = supabaseStatus.status === 'connected' && redisStatus.status === 'connected'

    const response: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        supabase: {
          status: supabaseStatus.status,
          lastCheck: new Date().toISOString(),
          latency: responseTime / 2,
          details: supabaseStatus.message
        },
        redis: {
          status: redisStatus.status,
          lastCheck: new Date().toISOString(),
          latency: responseTime / 2,
          details: redisStatus.message
        }
      },
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }

    const validated = HealthCheckResponseSchema.parse(response)

    return NextResponse.json(validated, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      services: {},
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      timestamp: new Date().toISOString()
    } as HealthCheckResponse, { status: 500 })
  }
} 