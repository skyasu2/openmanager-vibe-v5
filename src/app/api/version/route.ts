import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

/**
 * 🏷️ 버전 정보 API 엔드포인트
 * 
 * 현재 애플리케이션 버전과 상태 정보를 제공합니다.
 * 
 * @returns {NextResponse} 버전 정보가 포함된 JSON 응답
 */
export async function GET() {
  try {
    // package.json에서 버전 정보 읽기
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    const versionInfo = {
      version: packageJson.version,
      name: packageJson.name,
      description: packageJson.description,
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: 'vercel',
      features: {
        typescript: true,
        nextjs: '15.5.0',
        supabase: true,
        ai_assistant: true,
        mock_simulation: true,
        realtime_monitoring: true
      },
      deployment: {
        status: 'active',
        last_updated: new Date().toISOString(),
        vercel_region: process.env.VERCEL_REGION || 'unknown',
        build_id: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'
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