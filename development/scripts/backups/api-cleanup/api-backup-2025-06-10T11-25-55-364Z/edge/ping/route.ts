import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * 🚀 Edge Function - Ping
 * 최소 지연시간 확인을 위한 초경량 API
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  return NextResponse.json(
    {
      pong: true,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Edge-Function': 'ping',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const echoData = {
      received: body,
      echo: true,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(echoData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Edge-Function': 'ping-echo',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid JSON',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      },
      {
        status: 400,
        headers: {
          'X-Edge-Function': 'ping-echo',
          'X-Error': 'true',
        },
      }
    );
  }
}
