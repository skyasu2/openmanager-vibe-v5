import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 시스템 상태 확인
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }

    // 간단한 헬스체크 수행
    await Promise.resolve(); // 비동기 작업 시뮬레이션

    return NextResponse.json({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('Status check failed:', error)
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
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