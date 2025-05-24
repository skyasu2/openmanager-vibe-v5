import type { NextApiRequest, NextApiResponse } from 'next'

type HealthResponse = {
  status: string
  timestamp: string
  services?: {
    api: {
      status: string
      responseTime: string
      lastCheck: string
    }
  }
  system?: {
    memory: any
    uptime: string
    environment: {
      node: string
      vercel: string
      region: string
    }
  }
  version: string
  message: string
  error?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      const startTime = Date.now()

      // 메모리 사용량 체크
      const getMemoryInfo = () => {
        if (typeof process !== 'undefined' && process.memoryUsage) {
          const usage = process.memoryUsage()
          return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(usage.external / 1024 / 1024) + 'MB'
          }
        }
        return { status: 'N/A (Serverless)' }
      }

      // 업타임 체크
      const getUptime = () => {
        if (typeof process !== 'undefined' && process.uptime) {
          const uptime = Math.floor(process.uptime())
          return uptime < 60 ? `${uptime}s` : `${Math.floor(uptime / 60)}m`
        }
        return 'N/A (Serverless)'
      }

      // 환경 정보
      const environment = {
        node: process.env.NODE_ENV || 'unknown',
        vercel: process.env.VERCEL_ENV || 'unknown',
        region: process.env.VERCEL_REGION || 'unknown'
      }

      const responseTime = Date.now() - startTime
      const overallStatus = responseTime < 1000 ? 'healthy' : 'slow'

      res.setHeader('X-Health-Check-Time', responseTime.toString())
      res.setHeader('X-Health-Status', overallStatus)

      res.status(200).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          api: {
            status: 'operational',
            responseTime: `${responseTime}ms`,
            lastCheck: new Date().toISOString()
          }
        },
        system: {
          memory: getMemoryInfo(),
          uptime: getUptime(),
          environment
        },
        version: '1.0.0',
        message: 'Health check completed successfully'
      })

    } catch (error) {
      console.error('Health check failed:', error)
      
      res.status(500).json({
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
    }
  } else {
    res.setHeader('Allow', ['GET', 'OPTIONS'])
    res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  }
} 