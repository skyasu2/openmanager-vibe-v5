import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/redis'
import { DUMMY_SERVERS, DUMMY_FAILURES } from '../../../../lib/dummy-data'
import { updateSessionStep } from '../init/route'

// 🌍 전역 세션 키
const GLOBAL_SESSION_KEY = 'sim:global:session'
const DATA_TTL = 3600 // 1시간 (초)

interface GlobalSession {
  startedAt: string
  sessionId: string
  currentStep: number
  totalSteps: number
}

interface SimulationStepResponse {
  success: boolean
  step: number
  timestamp: string
  dataKey: string
  serversAffected: number
  newIssues: number
  description: string
}

/**
 * 🎯 시뮬레이션 스텝 실행 API
 * POST /api/simulate/step
 * 
 * 목적: 5분 단위로 시뮬레이션 데이터 생성 및 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    // 전역 세션 확인
    const session = await CacheService.get<GlobalSession>(GLOBAL_SESSION_KEY)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active global session found. Please call /api/simulate/init first.'
      }, { status: 404 })
    }

    const { sessionId, startedAt, totalSteps } = session
    const startTime = new Date(startedAt)
    const now = new Date()
    
    // 현재 경과 시간 기준으로 스텝 계산
    const elapsedMs = now.getTime() - startTime.getTime()
    const currentMinutes = Math.floor(elapsedMs / (1000 * 60))
    const currentStep = Math.floor(currentMinutes / 5) // 5분 단위

    // 스텝 범위 체크
    if (currentStep >= totalSteps) {
      return NextResponse.json({
        success: false,
        error: 'Simulation completed. Maximum 60 minutes reached.',
        currentStep,
        totalSteps
      }, { status: 400 })
    }

    // 해당 스텝의 데이터 생성 시간 계산
    const stepStartTime = new Date(startTime.getTime() + (currentStep * 5 * 60 * 1000))
    const timestamp = Math.floor(stepStartTime.getTime() / 1000)
    const dataKey = `sim:global:data:${timestamp}`

    // 이미 생성된 데이터인지 확인
    const existingData = await CacheService.get(dataKey)
    if (existingData) {
      return NextResponse.json({
        success: true,
        step: currentStep,
        timestamp: stepStartTime.toISOString(),
        dataKey,
        serversAffected: 0,
        newIssues: 0,
        description: 'Data already exists for this step'
      })
    }

    // 🎨 시뮬레이션 시나리오 생성
    const scenario = generateScenarioForStep(currentStep, stepStartTime)
    const simulationData = {
      timestamp: stepStartTime.toISOString(),
      step: currentStep,
      sessionId,
      scenario: scenario.name,
      description: scenario.description,
      servers: scenario.servers,
      incidents: scenario.incidents,
      metadata: {
        totalServers: scenario.servers.length,
        healthyServers: scenario.servers.filter(s => s.status === 'online').length,
        warningServers: scenario.servers.filter(s => s.status === 'warning').length,
        criticalServers: scenario.servers.filter(s => s.status === 'error').length,
        averageCpu: Math.round(scenario.servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / scenario.servers.length),
        averageMemory: Math.round(scenario.servers.reduce((sum, s) => sum + s.metrics.memory, 0) / scenario.servers.length),
        newIssuesCount: scenario.incidents.length
      }
    }

    // Redis에 저장
    await CacheService.set(dataKey, simulationData, DATA_TTL)

    // 세션 스텝 업데이트
    await updateSessionStep(sessionId, currentStep)

    console.log(`📊 Simulation step ${currentStep} created: ${scenario.name}`)
    console.log(`   Affected servers: ${scenario.affectedServers}, New issues: ${scenario.incidents.length}`)

    const response: SimulationStepResponse = {
      success: true,
      step: currentStep,
      timestamp: stepStartTime.toISOString(),
      dataKey,
      serversAffected: scenario.affectedServers,
      newIssues: scenario.incidents.length,
      description: scenario.description
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Failed to execute simulation step:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute simulation step',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 🎭 스텝별 시뮬레이션 시나리오 생성
 */
function generateScenarioForStep(step: number, stepTime: Date) {
  const hour = stepTime.getHours()
  const isBusinessHour = hour >= 9 && hour <= 18
  
  // 기본 서버 상태 깊은 복사
  const servers = DUMMY_SERVERS.map(server => ({
    ...server,
    metrics: {
      ...server.metrics,
      network: {
        ...server.metrics.network
      }
    }
  }))
  
  const incidents: Array<{ type: string; message: string; servers: number }> = []
  let affectedServers = 0
  
  // 🎯 스텝별 시나리오 패턴
  switch (step) {
    case 0: // 0-5분: 안정적인 시작
      return {
        name: 'Stable Start',
        description: '시뮬레이션 시작 - 모든 시스템 정상 운영',
        servers: servers.map(s => ({ ...s, status: 'online' as const })),
        incidents,
        affectedServers: 0
      }

    case 1: // 5-10분: 경미한 부하 증가
      affectedServers = 3
      servers.slice(0, 3).forEach(server => {
        server.status = 'warning'
        server.metrics.cpu = Math.min(90, server.metrics.cpu + 15)
        server.metrics.memory = Math.min(85, server.metrics.memory + 10)
      })
      incidents.push({ type: 'warning', message: '일부 서버에서 부하 증가 감지', servers: 3 })
      break

    case 2: // 10-15분: 데이터베이스 부하
      affectedServers = 2
      const dbServers = servers.filter(s => s.id.includes('db'))
      dbServers.slice(0, 2).forEach(server => {
        server.status = 'warning'
        server.metrics.cpu = Math.min(95, server.metrics.cpu + 25)
        server.metrics.memory = Math.min(90, server.metrics.memory + 20)
        server.metrics.network.connections = Math.min(3000, server.metrics.network.connections + 500)
      })
      incidents.push({ type: 'warning', message: 'DB 연결 풀 사용률 증가', servers: 2 })
      break

    case 3: // 15-20분: 첫 번째 장애 발생
      affectedServers = 1
      const criticalServer = servers.find(s => s.id === 'k8s-master-01')
      if (criticalServer) {
        criticalServer.status = 'error'
        criticalServer.metrics.cpu = 98
        criticalServer.metrics.memory = 95
      }
      incidents.push({ type: 'critical', message: 'K8s 마스터 노드 리소스 고갈', servers: 1 })
      break

    case 4: // 20-25분: 장애 확산
      affectedServers = 4
      servers.slice(0, 4).forEach((server, index) => {
        server.status = index === 0 ? 'error' : 'warning'
        server.metrics.cpu = Math.min(95, server.metrics.cpu + 20)
        server.metrics.memory = Math.min(90, server.metrics.memory + 15)
      })
      incidents.push({ type: 'critical', message: '장애 연쇄 반응 - 다중 서버 영향', servers: 4 })
      break

    case 5: // 25-30분: 복구 시작
      affectedServers = 2
      servers.slice(0, 2).forEach(server => {
        server.status = 'warning'
        server.metrics.cpu = Math.max(30, server.metrics.cpu - 15)
        server.metrics.memory = Math.max(40, server.metrics.memory - 10)
      })
      incidents.push({ type: 'info', message: '복구 절차 시작 - 부하 감소 중', servers: 2 })
      break

    case 6: // 30-35분: 안정화
      affectedServers = 1
      servers.forEach(server => {
        if (server.status !== 'online') {
          server.status = Math.random() < 0.7 ? 'online' : 'warning'
          server.metrics.cpu = Math.max(20, server.metrics.cpu - 10)
          server.metrics.memory = Math.max(30, server.metrics.memory - 8)
        }
      })
      incidents.push({ type: 'info', message: '시스템 안정화 진행 중', servers: 1 })
      break

    case 7: // 35-40분: 새로운 이슈
      affectedServers = 3
      const storageServers = servers.filter(s => s.id.includes('file') || s.id.includes('backup'))
      storageServers.slice(0, 2).forEach(server => {
        server.status = 'warning'
        server.metrics.disk = Math.min(95, server.metrics.disk + 20)
      })
      incidents.push({ type: 'warning', message: '스토리지 용량 부족 경고', servers: 2 })
      break

    case 8: // 40-45분: 네트워크 이슈
      affectedServers = 5
      servers.slice(0, 5).forEach(server => {
        server.status = 'warning'
        server.metrics.network.latency = Math.min(100, server.metrics.network.latency + 30)
        server.metrics.network.connections = Math.max(50, server.metrics.network.connections - 100)
      })
      incidents.push({ type: 'warning', message: '네트워크 지연 증가 감지', servers: 5 })
      break

    case 9: // 45-50분: 성능 최적화
      affectedServers = 2
      servers.forEach(server => {
        server.metrics.cpu = Math.max(15, server.metrics.cpu - 5)
        server.metrics.memory = Math.max(25, server.metrics.memory - 5)
        server.metrics.network.latency = Math.max(5, server.metrics.network.latency - 10)
      })
      incidents.push({ type: 'info', message: '자동 최적화 적용 - 성능 개선', servers: 0 })
      break

    case 10: // 50-55분: 최종 안정화
      affectedServers = 1
      servers.forEach(server => {
        server.status = Math.random() < 0.95 ? 'online' : 'warning'
        server.metrics.cpu = Math.max(10, server.metrics.cpu - 3)
        server.metrics.memory = Math.max(20, server.metrics.memory - 3)
      })
      incidents.push({ type: 'info', message: '전체 시스템 안정화 완료', servers: 0 })
      break

    case 11: // 55-60분: 시뮬레이션 종료
      servers.forEach(server => {
        server.status = 'online'
        server.metrics.cpu = Math.max(8, server.metrics.cpu - 5)
        server.metrics.memory = Math.max(15, server.metrics.memory - 5)
      })
      incidents.push({ type: 'success', message: '시뮬레이션 완료 - 모든 시스템 정상', servers: 0 })
      break

    default:
      // 기본 안정 상태
      break
  }

  // 시간대별 부하 조정
  if (isBusinessHour) {
    servers.forEach(server => {
      server.metrics.cpu = Math.min(100, server.metrics.cpu * 1.2)
      server.metrics.memory = Math.min(100, server.metrics.memory * 1.1)
      server.metrics.network.connections = Math.min(5000, server.metrics.network.connections * 1.3)
    })
  }

  // lastUpdate 시간 업데이트
  servers.forEach(server => {
    server.lastUpdate = stepTime.toISOString()
  })

  return {
    name: `Step ${step}`,
    description: incidents.length > 0 ? incidents[0].message : '정상 운영 중',
    servers,
    incidents,
    affectedServers
  }
} 