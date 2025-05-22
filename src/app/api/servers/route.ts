import { NextRequest, NextResponse } from 'next/server'
import serversData from '@/data/servers.json'
import { MCPStore } from '@/lib/kv'

export async function GET() {
  try {
    // 로컬 데이터와 Vercel KV의 실시간 데이터를 결합
    const servers = await Promise.all(
      serversData.servers.map(async (server) => {
        const status = await MCPStore.getServerStatus(server.id)
        
        if (status) {
          return {
            ...server,
            ...status,
            status: status.status || server.status,
            lastUpdate: status.lastUpdate
          }
        }
        
        return server
      })
    )
    
    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Servers API error:', error)
    return NextResponse.json(
      { error: '서버 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: '서버 ID와 상태 정보가 필요합니다.' },
        { status: 400 }
      )
    }
    
    await MCPStore.updateServerStatus(id, status)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server update API error:', error)
    return NextResponse.json(
      { error: '서버 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 