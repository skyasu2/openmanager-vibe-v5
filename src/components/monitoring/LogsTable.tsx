import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { AlertTriangle, Info, AlertCircle, Bug, RefreshCw, Filter } from 'lucide-react'
import type { LogEntry, LogLevel } from '@/lib/monitoring/logger'
import { formatDate } from '@/lib/utils'

export default function LogsTable() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<LogLevel | null>(null)

  // 로그 가져오기
  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = new URL('/api/monitoring/logs', window.location.origin)
      if (filter) {
        url.searchParams.append('level', filter)
      }
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('로그를 가져오는데 실패했습니다')
      }
      
      const { data } = await response.json()
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 로그 레벨 필터링
  const filterByLevel = (level: LogLevel | null) => {
    setFilter(level)
  }

  // 수동 새로고침
  const refreshLogs = async () => {
    try {
      setRefreshing(true)
      await fetchLogs()
    } finally {
      setRefreshing(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchLogs()
    
    // 30초마다 자동으로 새로고침
    const interval = setInterval(fetchLogs, 30000)
    
    return () => clearInterval(interval)
  }, [filter]) // 필터 변경 시 로그 다시 가져오기

  // 로그 레벨별 아이콘 렌더링
  const renderLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'DEBUG':
        return <Bug size={16} className="text-gray-500" />
      case 'INFO':
        return <Info size={16} className="text-blue-500" />
      case 'WARN':
        return <AlertCircle size={16} className="text-amber-500" />
      case 'ERROR':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'CRITICAL':
        return <AlertTriangle size={16} className="text-white bg-red-500 p-0.5 rounded-full" />
      default:
        return <Info size={16} className="text-gray-500" />
    }
  }

  // 로그 레벨별 스타일 클래스
  const getLevelClass = (level: LogLevel) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800'
      case 'INFO':
        return 'bg-blue-100 text-blue-800'
      case 'WARN':
        return 'bg-amber-100 text-amber-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      case 'CRITICAL':
        return 'bg-red-600 text-white'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">시스템 로그</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Filter size={16} className="text-gray-500" />
              <div className="flex space-x-1 text-xs">
                {(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'] as LogLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => filterByLevel(filter === level ? null : level)}
                    className={`px-2 py-0.5 rounded ${filter === level ? getLevelClass(level) : 'bg-gray-50'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={refreshLogs}
              disabled={refreshing || loading}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="로그 새로고침"
            >
              <RefreshCw
                size={20}
                className={`${refreshing ? 'animate-spin text-blue-500' : 'text-gray-500'}`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && !refreshing ? (
          <div className="flex justify-center items-center h-60">
            <RefreshCw size={30} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-60 text-red-500">
            <AlertTriangle size={30} />
            <p className="mt-2 text-sm text-center">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-500">
            <Info size={30} />
            <p className="mt-2 text-sm text-center">로그가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">레벨</th>
                  <th className="px-3 py-2 text-left">메시지</th>
                  <th className="px-3 py-2 text-left">소스</th>
                  <th className="px-3 py-2 text-left">시간</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr 
                    key={log.id || index} 
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-1">
                        {renderLevelIcon(log.level)}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getLevelClass(log.level)}`}>
                          {log.level}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {log.message}
                      {log.context && Object.keys(log.context).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer">컨텍스트</summary>
                          <pre className="text-xs p-1 bg-gray-50 rounded mt-1 overflow-auto max-h-20">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{log.source}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 justify-between">
        <span>마지막 업데이트: {new Date().toLocaleString()}</span>
        <span>{logs.length}개 로그</span>
      </CardFooter>
    </Card>
  )
} 