import { useState, useEffect } from 'react'
import { Server } from '@/types'
import serversData from '@/data/servers.json'
import { MCPStore } from '@/lib/kv'

export function useServers() {
  const [servers, setServers] = useState<Server[]>(serversData.servers as Server[])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchServers() {
    setIsLoading(true)
    setError(null)
    
    try {
      // 로컬 데이터와 Vercel KV의 실시간 데이터를 결합
      const updatedServers = await Promise.all(
        serversData.servers.map(async (server) => {
          const status = await MCPStore.getServerStatus(server.id)
          
          if (status) {
            return {
              ...server,
              ...status,
              status: status.status as Server['status'] || server.status,
              lastUpdate: status.lastUpdate
            }
          }
          
          return server as Server
        })
      )
      
      setServers(updatedServers as Server[])
    } catch (err) {
      setError('서버 데이터를 불러오는 중 오류가 발생했습니다.')
      console.error('Server data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServers()
    
    // 30초마다 서버 상태 업데이트
    const interval = setInterval(fetchServers, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusCounts = () => {
    return servers.reduce(
      (acc, server) => {
        acc[server.status]++
        acc.total++
        return acc
      },
      { running: 0, warning: 0, error: 0, stopped: 0, total: 0 }
    )
  }

  const getAveragePerformance = () => {
    const total = servers.length
    
    if (total === 0) return { avgCpu: 0, avgMemory: 0 }
    
    const sumCpu = servers.reduce((sum, server) => sum + server.cpu, 0)
    const sumMemory = servers.reduce((sum, server) => sum + server.memory, 0)
    
    return {
      avgCpu: Math.round(sumCpu / total),
      avgMemory: Math.round(sumMemory / total)
    }
  }

  return {
    servers,
    isLoading,
    error,
    fetchServers,
    getStatusCounts,
    getAveragePerformance
  }
}
