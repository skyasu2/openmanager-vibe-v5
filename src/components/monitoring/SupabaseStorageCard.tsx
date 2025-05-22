import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, RefreshCw, Archive } from 'lucide-react'
import type { SupabaseStorageStats } from '@/lib/monitoring/supabase-monitor'
import { formatDate } from '@/lib/utils'

// 차트 색상
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6']

export default function SupabaseStorageCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SupabaseStorageStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Supabase 스토리지 사용량 통계 가져오기
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/monitoring/supabase-stats')
      
      if (!response.ok) {
        throw new Error('Supabase 스토리지 통계를 가져오는데 실패했습니다')
      }
      
      const { data } = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 자동 아카이빙 작업 실행
  const startArchiving = async () => {
    try {
      setRefreshing(true)
      
      const response = await fetch('/api/monitoring/supabase-stats', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Supabase 자동 아카이빙 작업을 실행하는데 실패했습니다')
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
    
    // 5분마다 자동으로 새로고침
    const interval = setInterval(fetchStats, 300000)
    
    return () => clearInterval(interval)
  }, [])

  // 차트 데이터 준비
  const chartData = stats
    ? Object.entries(stats.tableUsage)
        .filter(([, size]) => size > 0.1) // 너무 작은 테이블 필터링
        .map(([table, size], index) => ({
          name: table.replace('_', ' '),
          value: size,
          fill: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value) // 크기 내림차순
    : []

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Supabase 스토리지</CardTitle>
          <button
            onClick={startArchiving}
            disabled={refreshing || loading}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="자동 아카이빙 실행"
          >
            <Archive
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
                <span className="text-sm text-gray-500">총 사용량</span>
                <span className="text-2xl font-bold">{stats.totalStorageUsed.toFixed(1)} MB</span>
                <span className="text-xs text-gray-400">제한: 500 MB</span>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">사용률</span>
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
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}MB`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} MB`, '크기']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">테이블별 사용량 TOP 3</h4>
              <div className="space-y-1">
                {chartData.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toFixed(1)} MB</span>
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
          {stats.isWarning && (
            <span className="text-amber-500 font-medium">
              {stats.percentUsed}% 사용 중 - 자동 아카이빙 활성화됨
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  )
} 