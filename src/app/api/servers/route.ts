import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { CacheService } from '../../../lib/redis'
import { ServerStatusSchema } from '../../../types/api'
import type { ServerStatus } from '../../../types/index'

export async function GET() {
  try {
    // 캐시에서 먼저 확인
    const cached = await CacheService.get<ServerStatus[]>('servers:all')
    if (cached) {
      return NextResponse.json({ success: true, data: cached, timestamp: new Date().toISOString() })
    }

    // 데이터베이스에서 조회 (실제로는 더미 데이터 반환)
    const mockServers: ServerStatus[] = [
      {
        id: 'server-001',
        name: 'Web Server 01',
        status: 'online',
        lastUpdate: new Date().toISOString(),
        location: 'Seoul, Korea',
        uptime: 86400,
        metrics: {
          cpu: 45.2,
          memory: 67.8,
          disk: 23.1,
          network: {
            bytesIn: 1024000,
            bytesOut: 2048000,
            packetsIn: 1500,
            packetsOut: 1200,
            latency: 12,
            connections: 45
          },
          processes: 127,
          loadAverage: [0.8, 0.6, 0.4] as const
        }
      },
      {
        id: 'server-002',
        name: 'Database Server',
        status: 'warning',
        lastUpdate: new Date().toISOString(),
        location: 'Tokyo, Japan',
        uptime: 172800,
        metrics: {
          cpu: 78.5,
          memory: 89.2,
          disk: 45.6,
          network: {
            bytesIn: 2048000,
            bytesOut: 1024000,
            packetsIn: 2100,
            packetsOut: 1800,
            latency: 8,
            connections: 123
          },
          processes: 89,
          loadAverage: [1.2, 1.0, 0.9] as const
        }
      }
    ]

    // 캐시에 저장 (5분)
    await CacheService.set('servers:all', mockServers, 300)

    return NextResponse.json({
      success: true,
      data: mockServers,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Servers API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch servers',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 