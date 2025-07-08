/**
 * 🌐 Cloud File System Status API
 *
 * 통합 클라우드 서비스 상태 조회
 *
 * GET /api/cloud-filesystem/status
 */

import { CloudFileSystemReplacement } from '@/services/integration/CloudFileSystemReplacement';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 클라우드 파일시스템 상태 조회 시작...');

    const cloudFS = CloudFileSystemReplacement.getInstance();

    // 서비스 상태 조회
    const status = await cloudFS.getServiceStatus();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: status,
    };

    console.log(`✅ 클라우드 파일시스템 상태 조회 완료: ${status.overall}`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('❌ 클라우드 파일시스템 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Cloud filesystem status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
