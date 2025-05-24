import { NextResponse } from 'next/server'

export async function GET() {
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

    return NextResponse.json(
      {
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
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Status check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
} 