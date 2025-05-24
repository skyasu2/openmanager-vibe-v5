import { NextRequest, NextResponse } from 'next/server'
import { metricsStorage } from '../../../services/storage'

/**
 * 서버 목록 조회 API
 * GET /api/servers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeCounts = searchParams.get('counts') === 'true'

    // 활성 서버 목록 조회
    const serverIds = await metricsStorage.getServerList()
    
    if (!includeCounts) {
      return NextResponse.json({
        success: true,
        data: serverIds,
        total: serverIds.length
      })
    }

    // 서버별 상세 정보 조회
    const servers = await Promise.all(
      serverIds.map(async (serverId) => {
        const server = await metricsStorage.getLatestMetrics(serverId)
        const isOnline = await metricsStorage.isServerOnline(serverId)
        
        return {
          ...server,
          status: isOnline ? server?.status || 'online' : 'offline'
        }
      })
    )

    // 필터링된 서버만 반환
    const validServers = servers.filter(server => server !== null)

    // 상태별 카운트
    const statusCounts = {
      online: validServers.filter(s => s.status === 'online').length,
      warning: validServers.filter(s => s.status === 'warning').length,
      offline: validServers.filter(s => s.status === 'offline').length
    }

    return NextResponse.json({
      success: true,
      data: validServers,
      total: validServers.length,
      counts: statusCounts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to fetch servers:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch servers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 