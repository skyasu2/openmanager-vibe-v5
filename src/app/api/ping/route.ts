import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: typeof process !== 'undefined' && typeof process.uptime === 'function'
        ? process.uptime()
        : 0,
      version: '5.44.0'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'ping failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// OPTIONS 메서드 추가 (CORS preflight)
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