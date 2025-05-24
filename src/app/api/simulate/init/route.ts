import { NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/redis'
import { DUMMY_SERVERS } from '../../../../lib/dummy-data'

// 🌍 전역 세션 키
const GLOBAL_SESSION_KEY = 'sim:global:session'
const SESSION_TTL = 3600 // 60분 (초)
const DATA_TTL = 3600 // 1시간 (초)

interface GlobalSession {
  startedAt: string
  sessionId: string
  currentStep: number
  totalSteps: number
}

interface SimulationInitResponse {
  success: boolean
  newSession: boolean
  startedAt: string
  minutesElapsed: number
  sessionId: string
  currentStep: number
  totalSteps: number
  nextDataUpdate?: string
}

/**
 * 🎯 전역 시뮬레이션 세션 초기화 API
 * GET /api/simulate/init
 * 
 * 목적: 누가 랜딩페이지에서 들어와도 동일한 1시간 시뮬레이션 공유
 */
export async function GET() {
  try {
    const now = new Date()
    const currentTimestamp = now.getTime()

    // 🔍 기존 전역 세션 확인
    const existingSession = await CacheService.get<GlobalSession>(GLOBAL_SESSION_KEY)

    if (existingSession) {
      const startedAt = new Date(existingSession.startedAt)
      const elapsedMs = currentTimestamp - startedAt.getTime()
      const minutesElapsed = Math.floor(elapsedMs / (1000 * 60))

      // ✅ 60분 미경과: 기존 세션 유지
      if (minutesElapsed < 60) {
        // 다음 데이터 업데이트 시간 계산 (5분 단위)
        const nextUpdateMinutes = Math.ceil(minutesElapsed / 5) * 5
        const nextUpdateTime = new Date(startedAt.getTime() + (nextUpdateMinutes * 60 * 1000))

        const response: SimulationInitResponse = {
          success: true,
          newSession: false,
          startedAt: existingSession.startedAt,
          minutesElapsed,
          sessionId: existingSession.sessionId,
          currentStep: existingSession.currentStep,
          totalSteps: existingSession.totalSteps,
          nextDataUpdate: nextUpdateTime.toISOString()
        }

        return NextResponse.json(response)
      }

      // 🔄 60분 경과: 기존 세션 만료로 처리
      console.log(`🕒 Global session expired after ${minutesElapsed} minutes, creating new session`)
    }

    // 🆕 새로운 전역 세션 생성
    const sessionId = `global_${currentTimestamp}_${Math.random().toString(36).substr(2, 9)}`
    const totalSteps = 12 // 60분 ÷ 5분 = 12단계

    const newSession: GlobalSession = {
      startedAt: now.toISOString(),
      sessionId,
      currentStep: 0,
      totalSteps
    }

    // Redis에 전역 세션 저장 (TTL 60분)
    await CacheService.set(GLOBAL_SESSION_KEY, newSession, SESSION_TTL)

    // 🎯 초기 더미 데이터 생성 (0분차)
    await generateInitialSimulationData(sessionId, now)

    console.log(`🌍 New global simulation session created: ${sessionId}`)

    const response: SimulationInitResponse = {
      success: true,
      newSession: true,
      startedAt: newSession.startedAt,
      minutesElapsed: 0,
      sessionId,
      currentStep: 0,
      totalSteps,
      nextDataUpdate: new Date(now.getTime() + (5 * 60 * 1000)).toISOString() // 5분 후
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Failed to initialize global simulation:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize simulation session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 🎨 초기 시뮬레이션 데이터 생성
 */
async function generateInitialSimulationData(sessionId: string, startTime: Date) {
  try {
    const timestamp = Math.floor(startTime.getTime() / 1000)
    const dataKey = `sim:global:data:${timestamp}`

    // 기본 서버 상태 (30개 서버)
    const initialData = {
      timestamp: startTime.toISOString(),
      step: 0,
      sessionId,
      servers: DUMMY_SERVERS.map(server => ({
        ...server,
        // 초기 상태는 대부분 안정적
        status: Math.random() < 0.8 ? 'online' : (Math.random() < 0.7 ? 'warning' : 'error'),
        metrics: {
          ...server.metrics,
          // 초기 리소스 사용률을 약간 낮춤
          cpu: Math.max(10, server.metrics.cpu * 0.8 + (Math.random() * 10 - 5)),
          memory: Math.max(15, server.metrics.memory * 0.8 + (Math.random() * 10 - 5)),
          disk: Math.max(10, server.metrics.disk * 0.9 + (Math.random() * 5 - 2.5))
        },
        lastUpdate: startTime.toISOString()
      })),
      metadata: {
        description: '시뮬레이션 시작 - 안정적인 상태',
        totalServers: DUMMY_SERVERS.length,
        healthyServers: 0, // 계산 후 업데이트
        warningServers: 0,
        criticalServers: 0,
        averageCpu: 0,
        averageMemory: 0
      }
    }

    // 상태별 서버 카운트 계산
    initialData.metadata.healthyServers = initialData.servers.filter(s => s.status === 'online').length
    initialData.metadata.warningServers = initialData.servers.filter(s => s.status === 'warning').length
    initialData.metadata.criticalServers = initialData.servers.filter(s => s.status === 'error').length
    initialData.metadata.averageCpu = Math.round(
      initialData.servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / initialData.servers.length
    )
    initialData.metadata.averageMemory = Math.round(
      initialData.servers.reduce((sum, s) => sum + s.metrics.memory, 0) / initialData.servers.length
    )

    // Redis에 저장 (TTL 1시간)
    await CacheService.set(dataKey, initialData, DATA_TTL)

    console.log(`📊 Initial simulation data created: ${dataKey}`)
    console.log(`   Healthy: ${initialData.metadata.healthyServers}, Warning: ${initialData.metadata.warningServers}, Critical: ${initialData.metadata.criticalServers}`)

  } catch (error) {
    console.error('❌ Failed to generate initial simulation data:', error)
    throw error
  }
}

/**
 * 🔄 세션 상태 업데이트 (내부 함수)
 */
export async function updateSessionStep(sessionId: string, newStep: number) {
  try {
    const session = await CacheService.get<GlobalSession>(GLOBAL_SESSION_KEY)
    if (session && session.sessionId === sessionId) {
      session.currentStep = newStep
      await CacheService.set(GLOBAL_SESSION_KEY, session, SESSION_TTL)
      console.log(`📈 Session step updated: ${sessionId} -> step ${newStep}`)
    }
  } catch (error) {
    console.error('❌ Failed to update session step:', error)
  }
} 