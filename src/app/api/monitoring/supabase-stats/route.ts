import { NextResponse } from 'next/server'
import { SupabaseMonitor } from '@/lib/monitoring/supabase-monitor'
import { Logger } from '@/lib/monitoring/logger'

export const dynamic = 'force-dynamic'

// Supabase 스토리지 사용량 통계 가져오기
export async function GET() {
  try {
    const logger = Logger.getInstance()
    await logger.info('Supabase 스토리지 사용량 통계 요청', {}, 'api:supabase-stats')
    
    const stats = await SupabaseMonitor.calculateStorageUsage()
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`Supabase 스토리지 통계 조회 오류: ${errorMessage}`, { error }, 'api:supabase-stats')
    
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase 스토리지 통계를 가져오는 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// 자동 아카이빙 작업 강제 실행
export async function POST() {
  try {
    const logger = Logger.getInstance()
    await logger.info('Supabase 자동 아카이빙 작업 요청', {}, 'api:supabase-stats')
    
    await SupabaseMonitor.startArchiving()
    
    // 정리 후 최신 통계 반환
    const stats = await SupabaseMonitor.calculateStorageUsage()
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 자동 아카이빙 작업이 성공적으로 실행되었습니다',
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    const logger = Logger.getInstance()
    await logger.error(`Supabase 자동 아카이빙 작업 오류: ${errorMessage}`, { error }, 'api:supabase-stats')
    
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase 자동 아카이빙 작업 중 오류가 발생했습니다',
        message: errorMessage
      },
      { status: 500 }
    )
  }
} 