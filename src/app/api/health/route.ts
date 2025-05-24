import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const startTime = Date.now()

    // 메모리 사용량 체크 (Serverless에서 가능한 정보)
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

    // 응답 시간 계산
    const responseTime = Date.now() - startTime

    // 전체 상태 결정
    const overallStatus = responseTime < 1000 ? 'healthy' : 'slow'

    const response = {
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
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Time': responseTime.toString(),
        'X-Health-Status': overallStatus
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Health-Status': 'unhealthy'
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