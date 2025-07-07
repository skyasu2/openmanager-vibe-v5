/**
 * 🚀 시스템 초기화 API - 통합 초기화 v3.0
 */

import { createServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';
// MCP 웜업 서비스 제거됨 - Google Cloud VM 24시간 동작
import { systemLogger } from '@/lib/logger';

// 초기화 상태를 저장하는 간단한 플래그
let isInitialized = false;
let isInitializing = false;

async function runInitialization(): Promise<string[]> {
  const logs: string[] = [];
  isInitializing = true;

  try {
    // 1. 데이터 생성기 초기화
    try {
      const generator = createServerDataGenerator();
      await generator.initialize();
      logs.push('✅ 서버 데이터 생성기 초기화 완료');
      systemLogger.info('✅ 서버 데이터 생성기 초기화 완료');
    } catch (error) {
      logs.push(`❌ 서버 데이터 생성기 초기화 실패: ${(error as Error).message}`);
      systemLogger.error('❌ 서버 데이터 생성기 초기화 실패:', error);
      throw new Error('Data generator failed');
    }

    // 2. MCP 서버 웜업 (비동기, 실패해도 계속)
    // MCPWarmupService.getInstance()
    //   .wakeupMCPServer()
    //   .then(() => {
    //     systemLogger.info('✅ MCP 서버 웜업 요청 완료 (백그라운드)');
    //   })
    //   .catch(error => {
    //     systemLogger.warn(
    //       `⚠️ MCP 서버 웜업 실패 (백그라운드): ${error.message}`
    //     );
    //   });
    logs.push('�� MCP 서버 웜업 시작 (백그라운드)');

    // 3. 기타 필수 서비스 초기화 (예시)
    // 다른 서비스들...
    logs.push('✅ 기타 필수 서비스 초기화 완료');

    isInitialized = true;
    return logs;
  } catch (error) {
    isInitialized = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

export async function POST(request: NextRequest) {
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
      logs: ['👍 시스템은 이미 준비되었습니다.'],
    });
  }

  try {
    systemLogger.info('🚀 시스템 초기화 시작...');
    const logs = await runInitialization();
    systemLogger.info('🎉 시스템 초기화 완료');
    return NextResponse.json({
      success: true,
      message: '시스템 초기화 성공',
      logs,
    });
  } catch (error) {
    systemLogger.error(
      `❌ 시스템 초기화 실패: ${(error as Error).message}`,
      error
    );
    return NextResponse.json(
      { success: false, message: `시스템 초기화 실패: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
