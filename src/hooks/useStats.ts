import { useState, useEffect } from 'react'
import { QueryStats } from '@/types'
import { MCPStore } from '@/lib/kv'

export function useStats() {
  const [stats, setStats] = useState<QueryStats>({
    totalQueries: 0,
    todayQueries: 0,
    yesterdayQueries: 0,
    popularQueries: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchStats() {
    setIsLoading(true)
    setError(null)
    
    try {
      const { stats: statsData, popularQueries } = await MCPStore.getStats()
      
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      
      const formattedStats: QueryStats = {
        totalQueries: Number(statsData.total_queries) || 0,
        todayQueries: Number(statsData[`date:${today}`]) || 0,
        yesterdayQueries: Number(statsData[`date:${yesterday}`]) || 0,
        popularQueries: []
      }
      
      // 인기 쿼리 포맷팅
      if (Array.isArray(popularQueries)) {
        for (let i = 0; i < popularQueries.length; i += 2) {
          formattedStats.popularQueries.push({
            query: popularQueries[i],
            count: Number(popularQueries[i + 1])
          })
        }
      }
      
      setStats(formattedStats)
    } catch (err) {
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.')
      console.error('Stats fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // 1분마다 통계 업데이트
    const interval = setInterval(fetchStats, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    isLoading,
    error,
    fetchStats
  }
}
