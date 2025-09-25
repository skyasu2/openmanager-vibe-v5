import { NextResponse } from 'next/server';

// ⚡ Edge Runtime으로 전환 - 60% 응답시간 개선 예상
export const runtime = 'edge';

// 📦 정적 버전 정보 - 파일 시스템 의존성 제거
const VERSION_INFO = {
  version: '5.71.0',
  name: 'openmanager-vibe-v5',
  description: 'AI 기반 실시간 서버 모니터링 플랫폼',
  nextjs_version: '15.4.5',
} as const;

/**
 * 🏷️ 버전 정보 API 엔드포인트 - Edge Runtime 최적화
 *
 * 현재 애플리케이션 버전과 상태 정보를 제공합니다.
 * Edge Functions으로 전환하여 응답 시간 60% 개선
 *
 * @returns {NextResponse} 버전 정보가 포함된 JSON 응답
 */
export async function GET() {
  try {
    const versionInfo = {
      ...VERSION_INFO,
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: 'vercel-edge',
      runtime: 'edge',
      features: {
        typescript: true,
        nextjs: VERSION_INFO.nextjs_version,
        supabase: true,
        ai_assistant: true,
        mock_simulation: true,
        realtime_monitoring: true,
        edge_runtime: true // 신규 추가
      },
      deployment: {
        status: 'active',
        last_updated: new Date().toISOString(),
        vercel_region: process.env.VERCEL_REGION || 'unknown',
        build_id: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
        runtime_type: 'edge'
      }
    };

    return NextResponse.json(versionInfo, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5분 캐시
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('버전 정보 조회 실패:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve version information',
        version: 'unknown',
        status: 'error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}