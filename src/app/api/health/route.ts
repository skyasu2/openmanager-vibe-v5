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
          external: Math.round(usage.external / 1024 / 1024) + 'MB',
          rss: Math.round(usage.rss / 1024 / 1024) + 'MB'
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

    // AI 에이전트 상태 체크 (빠른 체크)
    const checkAIAgentStatus = async () => {
      try {
        const aiCheckStart = Date.now()
        const response = await Promise.race([
          fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/ai-agent/integrated`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }),
          new Promise<Response>((_, reject) => 
            setTimeout(() => reject(new Error('AI timeout')), 3000)
          )
        ])
        
        const aiCheckTime = Date.now() - aiCheckStart
        
        if (response.ok) {
          return {
            status: 'operational',
            responseTime: `${aiCheckTime}ms`,
            lastCheck: new Date().toISOString()
          }
        } else {
          return {
            status: 'degraded',
            responseTime: `${aiCheckTime}ms`,
            error: `HTTP ${response.status}`,
            lastCheck: new Date().toISOString()
          }
        }
      } catch (error) {
        return {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        }
      }
    }

    // 환경 정보
    const environment = {
      node: process.env.NODE_ENV || 'unknown',
      vercel: process.env.VERCEL_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'localhost:3000'
    }

    // AI 에이전트 상태 체크 (병렬 실행)
    const aiAgentStatus = await checkAIAgentStatus()

    // 응답 시간 계산
    const responseTime = Date.now() - startTime

    // 전체 상태 결정
    const overallStatus = 
      responseTime > 5000 ? 'unhealthy' :
      responseTime > 2000 ? 'degraded' :
      aiAgentStatus.status === 'down' ? 'degraded' :
      'healthy'

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'operational',
          responseTime: `${responseTime}ms`,
          lastCheck: new Date().toISOString()
        },
        aiAgent: aiAgentStatus,
        database: {
          status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured'
        },
        redis: {
          status: process.env.REDIS_URL ? 'configured' : 'not_configured'
        }
      },
      system: {
        memory: getMemoryInfo(),
        uptime: getUptime(),
        environment
      },
      performance: {
        responseTime: `${responseTime}ms`,
        threshold: {
          healthy: '< 2000ms',
          degraded: '2000-5000ms',
          unhealthy: '> 5000ms'
        }
      },
      version: '1.0.0',
      message: `Health check completed - ${overallStatus}`
    }

    return NextResponse.json(response, {
      status: overallStatus === 'unhealthy' ? 503 : 200,
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