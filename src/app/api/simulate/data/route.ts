import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/redis'

// 🌍 전역 세션 키
const GLOBAL_SESSION_KEY = 'sim:global:session'

interface GlobalSession {
  startedAt: string
  sessionId: string
  currentStep: number
  totalSteps: number
}

/**
 * 🎯 시뮬레이션 데이터 조회 API
 * GET /api/simulate/data?step=current
 * GET /api/simulate/data?timestamp=1634567890
 * 
 * 목적: 전역 세션의 특정 스텝 또는 타임스탬프 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stepParam = searchParams.get('step')
    const timestampParam = searchParams.get('timestamp')

    // 전역 세션 확인
    const session = await CacheService.get<GlobalSession>(GLOBAL_SESSION_KEY)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active global session found. Please call /api/simulate/init first.'
      }, { status: 404 })
    }

    const { startedAt, sessionId } = session
    const startTime = new Date(startedAt)
    const now = new Date()
    
    let targetTimestamp: number
    let targetStep: number

    if (timestampParam) {
      // 특정 타임스탬프 요청
      targetTimestamp = parseInt(timestampParam)
      const targetTime = new Date(targetTimestamp * 1000)
      const elapsedMs = targetTime.getTime() - startTime.getTime()
      targetStep = Math.floor(elapsedMs / (1000 * 60 * 5)) // 5분 단위
    } else {
      // 현재 또는 특정 스텝 요청
      const currentElapsedMs = now.getTime() - startTime.getTime()
      const currentStep = Math.floor(currentElapsedMs / (1000 * 60 * 5))
      
      if (stepParam === 'current' || !stepParam) {
        targetStep = currentStep
      } else {
        targetStep = parseInt(stepParam)
      }
      
      // 타겟 스텝의 타임스탬프 계산
      const targetTime = new Date(startTime.getTime() + (targetStep * 5 * 60 * 1000))
      targetTimestamp = Math.floor(targetTime.getTime() / 1000)
    }

    // 스텝 범위 검증
    if (targetStep < 0 || targetStep >= session.totalSteps) {
      return NextResponse.json({
        success: false,
        error: `Invalid step. Must be between 0 and ${session.totalSteps - 1}`,
        requestedStep: targetStep,
        maxStep: session.totalSteps - 1
      }, { status: 400 })
    }

    // Redis에서 데이터 조회
    const dataKey = `sim:global:data:${targetTimestamp}`
    const simulationData = await CacheService.get(dataKey)

    if (!simulationData) {
      return NextResponse.json({
        success: false,
        error: 'Simulation data not found for the requested step',
        dataKey,
        step: targetStep,
        timestamp: targetTimestamp,
        suggestion: 'Call /api/simulate/step to generate data for this step'
      }, { status: 404 })
    }

    // 현재 세션 상태 정보 추가
    const currentElapsedMs = now.getTime() - startTime.getTime()
    const currentMinutes = Math.floor(currentElapsedMs / (1000 * 60))
    const currentStep = Math.floor(currentMinutes / 5)

    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        startedAt,
        currentStep,
        totalSteps: session.totalSteps,
        minutesElapsed: currentMinutes,
        isActive: currentMinutes < 60
      },
      data: simulationData,
      meta: {
        requestedStep: targetStep,
        dataKey,
        timestamp: new Date(targetTimestamp * 1000).toISOString(),
        cached: true
      }
    })

  } catch (error) {
    console.error('❌ Failed to fetch simulation data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch simulation data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 🔍 세션 상태 조회 API
 * GET /api/simulate/data/status
 */
export async function OPTIONS() {
  try {
    const session = await CacheService.get<GlobalSession>(GLOBAL_SESSION_KEY)
    
    if (!session) {
      return NextResponse.json({
        success: true,
        hasActiveSession: false,
        message: 'No active simulation session'
      })
    }

    const { startedAt, sessionId, totalSteps } = session
    const startTime = new Date(startedAt)
    const now = new Date()
    const elapsedMs = now.getTime() - startTime.getTime()
    const minutesElapsed = Math.floor(elapsedMs / (1000 * 60))
    const currentStep = Math.floor(minutesElapsed / 5)

    // 사용 가능한 데이터 스텝 확인
    const availableSteps = []
    for (let step = 0; step <= Math.min(currentStep, totalSteps - 1); step++) {
      const stepTime = new Date(startTime.getTime() + (step * 5 * 60 * 1000))
      const timestamp = Math.floor(stepTime.getTime() / 1000)
      const dataKey = `sim:global:data:${timestamp}`
      
      // get을 사용하여 데이터 존재 여부 확인
      const hasData = await CacheService.get(dataKey)
      if (hasData) {
        availableSteps.push(step)
      }
    }

    return NextResponse.json({
      success: true,
      hasActiveSession: true,
      session: {
        sessionId,
        startedAt,
        minutesElapsed,
        currentStep,
        totalSteps,
        isCompleted: minutesElapsed >= 60,
        remainingMinutes: Math.max(0, 60 - minutesElapsed)
      },
      dataStatus: {
        availableSteps,
        totalGeneratedSteps: availableSteps.length,
        nextStepDue: currentStep < totalSteps - 1 ? new Date(startTime.getTime() + ((currentStep + 1) * 5 * 60 * 1000)).toISOString() : null
      }
    })

  } catch (error) {
    console.error('❌ Failed to get session status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get session status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 