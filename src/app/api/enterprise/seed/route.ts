import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { ENTERPRISE_SERVERS } from '../../../../lib/enterprise-servers'
import { cacheService } from '../../../../services/cacheService'

export async function POST() {
  try {
    // 🌱 기업 IDC 30대 서버 초기 데이터 시딩
    console.log('🌱 Enterprise 서버 시딩 시작...')
    
    const seedData = ENTERPRISE_SERVERS.map(server => ({
      server_id: server.id,
      server_name: server.name,
      server_type: server.id.includes('k8s-') ? 'kubernetes' : 'onpremise',
      server_ip: generateMockIP(server.id),
      location: server.location,
      status: server.status,
      uptime: server.uptime,
      cpu_usage: server.metrics.cpu,
      memory_usage: server.metrics.memory,
      disk_usage: server.metrics.disk,
      network_bytes_in: server.metrics.network.bytesIn,
      network_bytes_out: server.metrics.network.bytesOut,
      network_latency: server.metrics.network.latency,
      network_connections: server.metrics.network.connections,
      processes: server.metrics.processes,
      load_average_1: server.metrics.loadAverage[0],
      load_average_5: server.metrics.loadAverage[1],
      load_average_15: server.metrics.loadAverage[2],
      last_updated: server.lastUpdate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // Supabase에 upsert (존재하면 업데이트, 없으면 삽입)
    let result
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }

      const { data, error } = await supabaseAdmin
        .from('server_metrics')
        .upsert(seedData, { 
          onConflict: 'server_id',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.warn('Supabase upsert 실패, 메모리 시딩 진행:', error.message)
        result = { 
          mode: 'memory',
          seeded: seedData.length,
          data: seedData 
        }
      } else {
        console.log(`✅ Supabase 시딩 완료: ${data?.length || seedData.length}개 서버`)
        result = { 
          mode: 'supabase',
          seeded: data?.length || seedData.length,
          data: data || seedData 
        }
      }
    } catch (dbError) {
      console.warn('Supabase 연결 실패, 메모리 시딩 진행:', dbError)
      result = { 
        mode: 'memory',
        seeded: seedData.length,
        data: seedData 
      }
    }

    // 캐시에서 확인
    const cached = await cacheService.get('enterprise:seed')

    // 캐시에 저장 (5분)
    await cacheService.set('enterprise:seed', seedData, 300)

    // 캐시 초기화
    await cacheService.invalidateCache('servers:all')
    await cacheService.invalidateCache('enterprise:overview')
    console.log('🧹 관련 캐시 초기화 완료')

    return NextResponse.json({
      success: true,
      message: 'Enterprise 서버 데이터 시딩 완료',
      ...result,
      timestamp: new Date().toISOString(),
      metadata: {
        totalServers: ENTERPRISE_SERVERS.length,
        kubernetesNodes: ENTERPRISE_SERVERS.filter(s => s.id.includes('k8s-')).length,
        onPremiseServers: ENTERPRISE_SERVERS.filter(s => !s.id.includes('k8s-')).length,
        criticalServers: ENTERPRISE_SERVERS.filter(s => s.status === 'error').length,
        warningServers: ENTERPRISE_SERVERS.filter(s => s.status === 'warning').length,
        healthyServers: ENTERPRISE_SERVERS.filter(s => s.status === 'online').length
      }
    })

  } catch (error) {
    console.error('Enterprise seed API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to seed enterprise server data',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 🔧 Mock IP 생성 함수
function generateMockIP(serverId: string): string {
  // 서버 ID 기반으로 일관된 IP 생성
  const idHash = serverId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // IDC별 서브넷 분배
  let subnet = '10.1' // 기본값
  if (serverId.includes('k8s-master')) subnet = '10.10'
  else if (serverId.includes('k8s-worker')) subnet = '10.20'
  else if (serverId.includes('web-')) subnet = '10.30'
  else if (serverId.includes('db-')) subnet = '10.40'
  else if (serverId.includes('storage-') || serverId.includes('file-') || serverId.includes('backup-')) subnet = '10.50'
  else if (serverId.includes('monitor-') || serverId.includes('log-') || serverId.includes('proxy-') || serverId.includes('dns-')) subnet = '10.60'
  
  const hostPart = (idHash % 250) + 2 // 2-251 범위
  return `${subnet}.1.${hostPart}`
} 