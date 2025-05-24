import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { CacheService } from '../../../lib/redis'
import { ServerStatusSchema } from '../../../types/api'
import { ENTERPRISE_SERVERS } from '../../../lib/enterprise-servers'
import type { ServerStatus } from '../../../types/index'

export async function GET() {
  try {
    // 캐시에서 먼저 확인
    const cached = await CacheService.get<ServerStatus[]>('servers:all')
    if (cached) {
      return NextResponse.json({ 
        success: true, 
        data: cached, 
        timestamp: new Date().toISOString(),
        cached: true
      })
    }

    // 🏢 기업 인프라 30개 서버 데이터 사용
    const servers = ENTERPRISE_SERVERS

    // 캐시에 저장 (3분)
    await CacheService.set('servers:all', servers, 180)

    return NextResponse.json({
      success: true,
      data: servers,
      timestamp: new Date().toISOString(),
      cached: false,
      metadata: {
        totalServers: servers.length,
        healthyServers: servers.filter(s => s.status === 'online').length,
        warningServers: servers.filter(s => s.status === 'warning').length,
        criticalServers: servers.filter(s => s.status === 'error').length,
        kubernetesNodes: servers.filter(s => s.id.includes('k8s-')).length,
        onPremiseServers: servers.filter(s => !s.id.includes('k8s-')).length,
        environment: 'production',
        region: 'IDC-Seoul-Main'
      }
    })
  } catch (error) {
    console.error('Servers API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch servers',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 