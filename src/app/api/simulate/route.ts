import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { CacheService } from '../../../lib/redis'
import { ENTERPRISE_SERVERS } from '../../../lib/enterprise-servers'
import { getCurrentPerformanceMetrics } from '../../../lib/enterprise-metrics'

export async function POST() {
  try {
    // 🔄 기업 IDC 시뮬레이터 - 10분마다 메트릭 업데이트
    console.log('🔄 Enterprise 시뮬레이터 시작...')
    
    const currentTime = new Date()
    const isBusinessHours = isBusinessTime(currentTime)
    
    // 각 서버의 메트릭을 현실적으로 변동
    const updatedServers = ENTERPRISE_SERVERS.map(server => {
      const newMetrics = generateDynamicMetrics(server, isBusinessHours)
      
      return {
        ...server,
        lastUpdate: currentTime.toISOString(),
        metrics: newMetrics,
        status: determineServerStatus(newMetrics)
      }
    })

    // Supabase 업데이트 시도
    let result
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }

      const updateData = updatedServers.map(server => ({
        server_id: server.id,
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
        status: server.status,
        last_updated: server.lastUpdate,
        updated_at: currentTime.toISOString()
      }))

      const { data, error } = await supabaseAdmin
        .from('server_metrics')
        .upsert(updateData, { onConflict: 'server_id' })
        .select('server_id')

      if (error) {
        console.warn('Supabase 업데이트 실패, 메모리 업데이트 진행:', error.message)
        result = { mode: 'memory', updated: updatedServers.length }
      } else {
        console.log(`✅ Supabase 업데이트 완료: ${data?.length || updatedServers.length}개 서버`)
        result = { mode: 'supabase', updated: data?.length || updatedServers.length }
      }
    } catch (dbError) {
      console.warn('Supabase 연결 실패, 메모리 업데이트 진행:', dbError)
      result = { mode: 'memory', updated: updatedServers.length }
    }

    // 캐시 무효화
    await CacheService.del('servers:all')
    await CacheService.del('enterprise:overview')
    await CacheService.del('dashboard:overview')
    
    // 전체 성능 메트릭 계산
    const performanceMetrics = getCurrentPerformanceMetrics()
    
    // 시뮬레이션 통계
    const stats = {
      totalUpdated: updatedServers.length,
      healthyServers: updatedServers.filter(s => s.status === 'online').length,
      warningServers: updatedServers.filter(s => s.status === 'warning').length,
      criticalServers: updatedServers.filter(s => s.status === 'error').length,
      averageCpuUsage: Math.round(
        updatedServers.reduce((sum, s) => sum + s.metrics.cpu, 0) / updatedServers.length
      ),
      averageMemoryUsage: Math.round(
        updatedServers.reduce((sum, s) => sum + s.metrics.memory, 0) / updatedServers.length
      ),
      businessHours: isBusinessHours,
      timestamp: currentTime.toISOString()
    }

    return NextResponse.json({
      success: true,
      message: '시뮬레이터 실행 완료',
      ...result,
      stats,
      performanceMetrics,
      timestamp: currentTime.toISOString(),
      metadata: {
        nextRun: new Date(currentTime.getTime() + (10 * 60 * 1000)).toISOString(), // 10분 후
        environment: process.env.NODE_ENV,
        simulationCycle: Math.floor(currentTime.getTime() / (10 * 60 * 1000)) // 10분 단위 사이클
      }
    })

  } catch (error) {
    console.error('Simulator API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to run simulator',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 🕒 비즈니스 시간 체크 (한국 시간 기준)
function isBusinessTime(date: Date): boolean {
  const kstTime = new Date(date.getTime() + (9 * 60 * 60 * 1000))
  const hour = kstTime.getHours()
  const day = kstTime.getDay() // 0: 일요일, 6: 토요일
  
  // 주말 제외, 평일 09:00-18:00
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18
}

// 🔧 동적 메트릭 생성
function generateDynamicMetrics(server: any, isBusinessHours: boolean) {
  const baseMetrics = server.metrics
  
  // 비즈니스 시간 vs 야간 시간 부하 차이
  const businessMultiplier = isBusinessHours ? 1.3 : 0.7
  
  // 서버 상태에 따른 변동 범위
  let variationRange = 5 // 기본 ±5%
  if (server.status === 'warning') variationRange = 15 // ±15%
  if (server.status === 'error') variationRange = 25   // ±25%
  
  // 랜덤 변동 생성 (-range ~ +range)
  const cpuVariation = (Math.random() - 0.5) * 2 * variationRange
  const memoryVariation = (Math.random() - 0.5) * 2 * (variationRange * 0.8)
  const diskVariation = (Math.random() - 0.5) * 2 * (variationRange * 0.3)
  
  // 새 메트릭 계산 (0-100% 범위 내에서)
  const newCpu = Math.max(0, Math.min(100, 
    baseMetrics.cpu * businessMultiplier + cpuVariation
  ))
  
  const newMemory = Math.max(0, Math.min(100,
    baseMetrics.memory * businessMultiplier + memoryVariation
  ))
  
  const newDisk = Math.max(0, Math.min(100,
    baseMetrics.disk + diskVariation
  ))
  
  // 네트워크 트래픽 조정
  const networkMultiplier = isBusinessHours ? 1.5 : 0.5
  const latencyMultiplier = server.status === 'error' ? 2.0 : 
                           server.status === 'warning' ? 1.3 : 1.0
  
  return {
    cpu: Math.round(newCpu * 10) / 10,
    memory: Math.round(newMemory * 10) / 10,
    disk: Math.round(newDisk * 10) / 10,
    network: {
      bytesIn: Math.round(baseMetrics.network.bytesIn * networkMultiplier),
      bytesOut: Math.round(baseMetrics.network.bytesOut * networkMultiplier),
      packetsIn: Math.round(baseMetrics.network.packetsIn * networkMultiplier),
      packetsOut: Math.round(baseMetrics.network.packetsOut * networkMultiplier),
      latency: Math.round(baseMetrics.network.latency * latencyMultiplier),
      connections: Math.round(baseMetrics.network.connections * networkMultiplier)
    },
    processes: baseMetrics.processes + Math.round((Math.random() - 0.5) * 20),
    loadAverage: [
      Math.max(0, baseMetrics.loadAverage[0] + (Math.random() - 0.5) * 0.5),
      Math.max(0, baseMetrics.loadAverage[1] + (Math.random() - 0.5) * 0.3),
      Math.max(0, baseMetrics.loadAverage[2] + (Math.random() - 0.5) * 0.2)
    ] as const
  }
}

// 🚦 서버 상태 결정
function determineServerStatus(metrics: any): 'online' | 'warning' | 'error' {
  // Critical 조건 (기존 장애 서버는 계속 critical 유지하되, 약간의 회복 가능성)
  if (metrics.cpu > 95 || metrics.memory > 95 || metrics.disk > 95) {
    return 'error'
  }
  
  // Warning 조건
  if (metrics.cpu > 80 || metrics.memory > 80 || metrics.disk > 85 || metrics.network.latency > 100) {
    return 'warning'
  }
  
  // Healthy 조건
  return 'online'
} 