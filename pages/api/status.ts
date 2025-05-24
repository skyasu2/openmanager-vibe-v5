import type { NextApiRequest, NextApiResponse } from 'next'

type StatusResponse = {
  status: string
  timestamp: string
  environment?: {
    node: string
    vercel: string
  }
  performance?: {
    responseTime: string
    computeTime: string
  }
  server?: {
    region: string
    runtime: string
  }
  version: string
  error?: string
  message?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
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
      
      // 환경변수 확인
      const nodeEnv = process.env.NODE_ENV || 'unknown'
      const vercelEnv = process.env.VERCEL_ENV || 'unknown'
      
      // 간단한 성능 체크
      const performanceCheck = () => {
        const start = Date.now()
        // 간단한 연산 수행
        let result = 0
        for (let i = 0; i < 1000; i++) {
          result += Math.random()
        }
        return Date.now() - start
      }
      
      const responseTime = Date.now() - startTime
      const computeTime = performanceCheck()

      res.status(200).json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: {
          node: nodeEnv,
          vercel: vercelEnv
        },
        performance: {
          responseTime: `${responseTime}ms`,
          computeTime: `${computeTime}ms`
        },
        server: {
          region: process.env.VERCEL_REGION || 'unknown',
          runtime: 'Node.js'
        },
        version: '1.0.0'
      })

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Status check failed',
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