/**
 * 🏓 Ping API - 수동 테스트 전용
 * 자동 호출 금지
 */
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  return NextResponse.json(
    { ping: 'pong', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
