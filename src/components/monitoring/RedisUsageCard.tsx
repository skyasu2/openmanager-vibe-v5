import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import type { RedisUsageStats } from '@/lib/monitoring/redis-monitor'
import { formatDate } from '@/lib/utils'

export default function RedisUsageCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<RedisUsageStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Redis 사용량 통계 가져오기
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/monitoring/redis-stats')
      
      if (!response.ok) {
        throw new Error('Redis 사용량 통계를 가져오는데 실패했습니다')
      }
      
      const { data } = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 자동 정리 작업 실행
  const startCleanup = async () => {
    try {
      setRefreshing(true)
      
      const response = await fetch('/api/monitoring/redis-stats', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Redis 자동 정리 작업을 실행하는데 실패했습니다')
      }
      
      const { data } = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setRefreshing(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchStats()
    
    // 60초마다 자동으로 새로고침
    const interval = setInterval(fetchStats, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // 차트 데이터 준비
  const chartData = stats
    ? [
        {
          name: '일일 요청',
          value: stats.dailyRequests,
          fill: stats.isWarning ? '#f59e0b' : '#3b82f6'
        },
        {
          name: '제한',
          value: 10000,
          fill: '#d1d5db'
        }
      ]
    : []

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Redis 사용량</CardTitle>
          <button
            onClick={startCleanup}
            disabled={refreshing || loading}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="자동 정리 실행"
          >
            <RefreshCw
              size={20}
              className={`${refreshing ? 'animate-spin text-blue-500' : 'text-gray-500'}`}
            />
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCw size={30} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-red-500">
            <AlertTriangle size={30} />
            <p className="mt-2 text-sm text-center">{error}</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">일일 요청</span>
                <span className="text-2xl font-bold">{stats.dailyRequests.toLocaleString()}</span>
                <span className="text-xs text-gray-400">총 {stats.totalRequests.toLocaleString()}</span>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">사용량</span>
                <div className="flex items-center">
                  <span className={`text-2xl font-bold ${stats.isWarning ? 'text-amber-500' : 'text-blue-500'}`}>
                    {stats.percentUsed}%
                  </span>
                  {stats.isWarning ? (
                    <AlertTriangle size={18} className="ml-1 text-amber-500" />
                  ) : (
                    <CheckCircle size={18} className="ml-1 text-green-500" />
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {stats.isLimitReached ? '제한 초과' : stats.isWarning ? '경고 수준' : '정상'}
                </span>
              </div>
            </div>
            
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10000]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip
                    formatter={(value) => [`${value} 요청`, '']}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </CardContent>
      
      {stats && (
        <CardFooter className="text-xs text-gray-500 justify-between">
          <span>마지막 업데이트: {formatDate(stats.lastUpdated)}</span>
          {stats.isWarning && (
            <span className="text-amber-500 font-medium">
              {stats.percentUsed}% 사용 중 - 자동 정리 활성화됨
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  )
} 