import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import type { PerformanceStats } from '@/lib/monitoring/performance-monitor'
import { formatDate } from '@/lib/utils'

export default function PerformanceCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 성능 통계 가져오기
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/monitoring/performance')
      
      if (!response.ok) {
        throw new Error('성능 통계를 가져오는데 실패했습니다')
      }
      
      const { data } = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 수동 새로고침
  const refreshStats = async () => {
    try {
      setRefreshing(true)
      await fetchStats()
    } finally {
      setRefreshing(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchStats()
    
    // 2분마다 자동으로 새로고침
    const interval = setInterval(fetchStats, 120000)
    
    return () => clearInterval(interval)
  }, [])

  // 라우트별 성능 데이터 준비
  const routesData = stats
    ? Object.entries(stats.routeStats)
        .filter(([route]) => route.startsWith('/api/')) // API 라우트만 필터링
        .map(([route, data]) => ({
          name: route.replace('/api/', ''),
          avgTime: data.avgResponseTime,
          errorRate: data.errorRate,
          requests: data.requestCount
        }))
        .sort((a, b) => b.avgTime - a.avgTime) // 평균 응답시간 내림차순
        .slice(0, 5) // 상위 5개만
    : []

  // 차트 데이터
  const chartData = [
    { 
      name: '응답시간',
      avg: stats?.avgResponseTime || 0,
      p95: stats?.p95ResponseTime || 0,
      max: stats?.maxResponseTime || 0
    }
  ]

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">API 성능</CardTitle>
          <button
            onClick={refreshStats}
            disabled={refreshing || loading}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="통계 새로고침"
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
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
                <span className="text-xs text-gray-500">평균 응답시간</span>
                <div className="flex items-center">
                  <Clock size={16} className="mr-1 text-blue-500" />
                  <span className="text-lg font-bold">{stats.avgResponseTime} ms</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
                <span className="text-xs text-gray-500">95th 백분위</span>
                <div className="flex items-center">
                  <Clock size={16} className="mr-1 text-amber-500" />
                  <span className="text-lg font-bold">{stats.p95ResponseTime} ms</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
                <span className="text-xs text-gray-500">에러율</span>
                <div className="flex items-center">
                  <AlertTriangle size={16} className={`mr-1 ${stats.errorRate > 5 ? 'text-red-500' : 'text-gray-500'}`} />
                  <span className={`text-lg font-bold ${stats.errorRate > 5 ? 'text-red-500' : ''}`}>
                    {stats.errorRate}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} ms`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    name="평균"
                    dataKey="avg" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    name="95th 백분위"
                    dataKey="p95" 
                    stroke="#f59e0b" 
                  />
                  <Line 
                    type="monotone" 
                    name="최대"
                    dataKey="max" 
                    stroke="#ef4444" 
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">API 라우트 응답시간 TOP 5</h4>
              <div className="space-y-1">
                {routesData.map((route, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-xs px-1 rounded bg-gray-100">{route.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">{route.requests}회</span>
                      <span className="font-medium">{route.avgTime} ms</span>
                      {route.errorRate > 0 && (
                        <span className="text-xs px-1 bg-red-50 text-red-600 rounded">{route.errorRate}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
      
      {stats && (
        <CardFooter className="text-xs text-gray-500 justify-between">
          <span>마지막 업데이트: {formatDate(stats.lastUpdated)}</span>
          <span>총 {stats.totalRequests}개 요청 분석</span>
        </CardFooter>
      )}
    </Card>
  )
} 