import { NextRequest, NextResponse } from 'next/server'
import { Logger, LogLevel } from '@/lib/monitoring/logger'

export const dynamic = 'force-dynamic'

// 로그 조회 API
export async function GET(request: NextRequest) {
  try {
    const logger = Logger.getInstance()
    
    // URL 파라미터에서 필터 옵션 가져오기
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as LogLevel | null
    const source = searchParams.get('source')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    
    await logger.debug('로그 조회 요청', { level, source, startDate, endDate }, 'api:logs')
    
    // 로그 조회
    const logs = await logger.getLogs({
      level: level || undefined,
      source: source || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset
    })
    
    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`로그 조회 오류: ${errorMessage}`, { error }, 'api:logs')
    
    return NextResponse.json(
      {
        success: false,
        error: '로그를 조회하는 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// 새 로그 추가 API
export async function POST(request: NextRequest) {
  try {
    const logger = Logger.getInstance()
    
    // 요청 본문 파싱
    const body = await request.json()
    const { level, message, context, source } = body
    
    if (!level || !message) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다',
          message: 'level과 message는 필수 필드입니다'
        },
        { status: 400 }
      )
    }
    
    // 로그 레벨 유효성 검사
    if (!Object.values(LogLevel).includes(level as LogLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 로그 레벨입니다',
          message: `유효한 로그 레벨: ${Object.values(LogLevel).join(', ')}`
        },
        { status: 400 }
      )
    }
    
    // 로그 추가
    switch (level as LogLevel) {
      case LogLevel.DEBUG:
        await logger.debug(message, context, source)
        break
      case LogLevel.INFO:
        await logger.info(message, context, source)
        break
      case LogLevel.WARN:
        await logger.warn(message, context, source)
        break
      case LogLevel.ERROR:
        await logger.error(message, context, source)
        break
      case LogLevel.CRITICAL:
        await logger.critical(message, context, source)
        break
    }
    
    return NextResponse.json({
      success: true,
      message: '로그가 성공적으로 추가되었습니다',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`로그 추가 오류: ${errorMessage}`, { error }, 'api:logs')
    
    return NextResponse.json(
      {
        success: false,
        error: '로그를 추가하는 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
} 