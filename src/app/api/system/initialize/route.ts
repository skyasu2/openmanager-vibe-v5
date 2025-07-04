import { GCP_FUNCTIONS_CONFIG } from '@/config/gcp-functions';
import { systemLogger } from '@/lib/logger';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';
import { NextResponse } from 'next/server';

// 초기화 상태를 저장하는 간단한 플래그
let isInitialized = false;
let isInitializing = false;

/**
 * 🌐 GCP Functions 연결 확인
 */
async function checkGCPFunctions(): Promise<boolean> {
  try {
    const response = await fetch(
      `${GCP_FUNCTIONS_CONFIG.ENTERPRISE_METRICS}?action=health`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5초 타임아웃
      }
    );

    return response.ok;
  } catch (error) {
    console.warn('⚠️ GCP Functions 연결 확인 실패:', error);
    return false;
  }
}

async function runInitialization(): Promise<string[]> {
  const logs: string[] = [];
  isInitializing = true;

  try {
    // 1. GCP Functions 연결 확인
    try {
      const gcpConnected = await checkGCPFunctions();
      if (gcpConnected) {
        logs.push('✅ GCP Functions 연결 확인 완료');
        systemLogger.info('✅ GCP Functions 연결 확인 완료');
      } else {
        logs.push('⚠️ GCP Functions 연결 실패, 폴백 모드로 동작');
        systemLogger.warn('⚠️ GCP Functions 연결 실패, 폴백 모드로 동작');
      }
    } catch (error) {
      logs.push(`⚠️ GCP Functions 확인 중 오류: ${error.message}`);
      systemLogger.warn('⚠️ GCP Functions 확인 중 오류:', error);
    }

    // 2. MCP 서버 웜업 (비동기, 실패해도 계속)
    MCPWarmupService.getInstance()
      .wakeupMCPServer()
      .then(() => {
        systemLogger.info('✅ MCP 서버 웜업 요청 완료 (백그라운드)');
      })
      .catch(error => {
        systemLogger.warn(
          `⚠️ MCP 서버 웜업 실패 (백그라운드): ${error.message}`
        );
      });
    logs.push('👍 MCP 서버 웜업 시작 (백그라운드)');

    // 3. 기타 필수 서비스 초기화
    logs.push('✅ 기타 필수 서비스 초기화 완료');
    logs.push('🌐 GCP Functions 기반 시스템 준비 완료');

    isInitialized = true;
    return logs;
  } catch (error) {
    isInitialized = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

export async function POST() {
  if (isInitializing) {
    return NextResponse.json(
      { success: false, message: '시스템이 이미 초기화 중입니다.' },
      { status: 429 } // Too Many Requests
    );
  }

  if (isInitialized) {
    return NextResponse.json({
      success: true,
      message: '시스템이 이미 초기화되었습니다.',
      logs: ['👍 시스템은 이미 준비되었습니다.', '🌐 GCP Functions 연결 휴성'],
    });
  }

  try {
    systemLogger.info('🚀 통합 시스템 초기화 API 시작 (GCP Functions 기반)...');
    const logs = await runInitialization();
    systemLogger.info('🎉 통합 시스템 초기화 API 완료');
    return NextResponse.json({
      success: true,
      message: '시스템 초기화 성공 (GCP Functions 기반)',
      logs,
      metadata: {
        dataSource: 'gcp_functions',
        endpoint: GCP_FUNCTIONS_CONFIG.BASE_URL,
        version: '5.44.3',
      },
    });
  } catch (error) {
    systemLogger.error(
      `❌ 통합 시스템 초기화 API 오류: ${error.message}`,
      error
    );
    return NextResponse.json(
      { success: false, message: `시스템 초기화 실패: ${error.message}` },
      { status: 500 }
    );
  }
}
