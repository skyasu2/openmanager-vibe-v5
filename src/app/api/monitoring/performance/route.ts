import { NextRequest, NextResponse } from 'next/server'
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor'
import { Logger } from '@/lib/monitoring/logger'

export const dynamic = 'force-dynamic'

// 성능 통계 가져오기
export async function GET(request: NextRequest) {
  try {
    const logger = Logger.getInstance()
    
    // URL 파라미터에서 날짜 가져오기
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    await logger.info('성능 통계 요청', { date }, 'api:performance')
    
    const stats = await PerformanceMonitor.calculatePerformanceStats(date || undefined)
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`성능 통계 조회 오류: ${errorMessage}`, { error }, 'api:performance')
    
    return NextResponse.json(
      {
        success: false,
        error: '성능 통계를 가져오는 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
} 