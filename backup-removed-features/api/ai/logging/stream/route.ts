/**
 * 🔄 실시간 AI 로그 스트리밍 API
 *
 * Server-Sent Events를 통한 실시간 AI 로그 스트리밍
 * - 안전한 폴백 모드로 작동
 * - 세션별 필터링 지원
 * - 관리자 페이지와 사이드바 공용
 * - 베르셀 환경 타임아웃 최적화
 */

import { NextRequest } from 'next/server';

// 🚀 베르셀 환경 감지 및 타임아웃 설정
const isVercel = process.env.VERCEL === '1';
const VERCEL_TIMEOUT = 30000; // 30초 (베르셀 함수 타임아웃보다 작게)
const PING_INTERVAL = isVercel ? 10000 : 30000; // 베르셀에서는 10초, 로컬에서는 30초
const MAX_STREAM_DURATION = isVercel ? VERCEL_TIMEOUT : 300000; // 베르셀: 30초, 로컬: 5분

export async function GET(request: NextRequest) {
  const isVercel = process.env.VERCEL === '1';

  // 🚫 서버리스 호환: 스트리밍 대신 즉시 응답
  console.warn('⚠️ 서버리스 환경에서 지속적 스트리밍 비활성화');

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';
    const mode = searchParams.get('mode') || 'standard';

    // 🚫 서버리스 호환: 즉시 로그 스냅샷 반환
    const logSnapshot = {
      type: 'snapshot',
      sessionId,
      mode,
      timestamp: new Date().toISOString(),
      environment: isVercel ? 'vercel' : 'local',
      serverless: true,
      logs: [
        {
          type: 'system',
          level: 'INFO',
          message: '서버리스 환경에서는 실시간 스트리밍이 비활성화됩니다',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'recommendation',
          level: 'INFO',
          message: 'Vercel Dashboard > Functions > Logs에서 실시간 로그를 확인하세요',
          timestamp: new Date().toISOString(),
        }
      ],
      metadata: {
        reason: 'serverless_compatibility',
        alternative: 'vercel_dashboard_logs',
      }
    };

    return new Response(JSON.stringify(logSnapshot), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Serverless-Mode': 'true',
        'X-Environment': isVercel ? 'vercel' : 'local',
      },
      status: 200,
    });

  } catch (error) {
    console.error('❌ AI 로그 API 오류:', error);

    return new Response(
      JSON.stringify({
        error: 'AI 로그 조회 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
        serverless: true,
        environment: isVercel ? 'vercel' : 'local',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Environment': isVercel ? 'vercel' : 'local',
        },
      }
    );
  }
}

// POST 요청으로 수동 로그 추가 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, engine, message, level = 'INFO', metadata } = body;

    console.log('📝 수동 로그 추가 요청:', {
      sessionId,
      engine,
      message,
      level,
    });

    if (!sessionId || !engine || !message) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다: sessionId, engine, message' },
        { status: 400 }
      );
    }

    // 간단한 로그 객체 생성
    const log = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: level as any,
      engine,
      module: 'manual',
      message,
      sessionId,
      metadata: {
        manual: true,
        environment: isVercel ? 'vercel' : 'local',
        ...metadata,
      },
    };

    console.log('✅ 수동 로그 생성 완료:', log);

    return Response.json({
      success: true,
      message: `로그가 생성되었습니다 (${isVercel ? 'Vercel' : 'Local'} 폴백 모드)`,
      log,
      environment: isVercel ? 'vercel' : 'local',
    });
  } catch (error) {
    console.error('수동 로그 추가 오류:', error);
    return Response.json(
      {
        error: '로그 추가 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        fallback: true,
        environment: isVercel ? 'vercel' : 'local',
      },
      { status: 200 } // 500 대신 200으로 변경
    );
  }
}
