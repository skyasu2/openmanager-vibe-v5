import { NextResponse } from 'next/server'
import { MCPStore } from '@/lib/kv'

export async function GET() {
  try {
    const { stats, popularQueries } = await MCPStore.getStats()
    
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    const formattedStats = {
      totalQueries: Number(stats.total_queries) || 0,
      todayQueries: Number(stats[`date:${today}`]) || 0,
      yesterdayQueries: Number(stats[`date:${yesterday}`]) || 0,
      popularQueries: [] as Array<{ query: string; count: number }>
    }
    
    // 인기 쿼리 포맷팅
    if (Array.isArray(popularQueries)) {
      // 새로운 형식: [[query, count], [query, count], ...]
      for (const [query, count] of popularQueries) {
        formattedStats.popularQueries.push({
          query,
          count: Number(count)
        })
      }
    }
    
    return NextResponse.json(formattedStats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: '통계 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}