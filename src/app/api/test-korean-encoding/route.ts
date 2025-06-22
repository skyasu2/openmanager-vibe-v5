/**
 * 🔧 한글 인코딩 테스트 API
 *
 * 기능:
 * 1. 한글 인코딩/디코딩 테스트
 * 2. 터미널 출력 한글 테스트
 * 3. API 요청/응답 한글 테스트
 * 4. 재발 방지 검증
 */

import {
  detectAndFixTerminalEncoding,
  safeKoreanLog,
  safeProcessRequestBody,
  testKoreanEncoding,
} from '@/utils/encoding-fix';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 터미널 인코딩 자동 수정
    detectAndFixTerminalEncoding();

    // 한글 인코딩 테스트 실행
    const testResults = testKoreanEncoding();

    // 안전한 한글 로그 출력 테스트
    safeKoreanLog('🧪 한글 인코딩 테스트 실행 중...');
    safeKoreanLog('✅ 서버 상태 확인 완료');
    safeKoreanLog('📊 CPU 사용량: 45%');
    safeKoreanLog('💾 메모리 사용량: 67%');

    const response = {
      success: true,
      message: '한글 인코딩 테스트 완료',
      timestamp: new Date().toISOString(),
      platform: process.platform,
      encoding: {
        terminal: {
          LANG: process.env.LANG,
          LC_ALL: process.env.LC_ALL,
          platform: process.platform,
        },
        tests: testResults.tests,
        overall: testResults.success,
      },
      samples: {
        korean: '서버 모니터링 시스템',
        mixed: 'CPU 사용량 85% 초과',
        special: '메모리 부족! 즉시 확인 필요',
        technical: 'API 응답시간: 250ms',
      },
      recommendations: testResults.success
        ? ['✅ 한글 인코딩이 정상적으로 작동합니다']
        : [
            '⚠️ 한글 인코딩 문제가 감지되었습니다',
            '🔧 터미널 인코딩을 UTF-8로 설정하세요',
            '📝 환경변수 LANG=ko_KR.UTF-8 설정 권장',
          ],
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('❌ 한글 인코딩 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '한글 인코딩 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 한글 요청 본문 안전 처리 테스트
    const body = await safeProcessRequestBody(request);
    const { testQuery, expectedResult } = body;

    if (!testQuery) {
      return NextResponse.json(
        {
          success: false,
          error: '테스트 쿼리가 필요합니다',
          message: 'testQuery 파라미터를 제공해주세요',
        },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 한글 처리 테스트
    safeKoreanLog(`🧪 POST 테스트 쿼리: "${testQuery}"`);

    const processingResult = {
      original: testQuery,
      processed: testQuery, // safeProcessQuery는 이미 적용됨
      isValid: /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(testQuery),
      hasBreakage: /[����]/.test(testQuery),
      length: testQuery.length,
    };

    const response = {
      success: true,
      message: '한글 POST 테스트 완료',
      timestamp: new Date().toISOString(),
      input: {
        testQuery,
        expectedResult,
      },
      processing: processingResult,
      validation: {
        isKorean: processingResult.isValid,
        isBroken: processingResult.hasBreakage,
        status:
          processingResult.isValid && !processingResult.hasBreakage
            ? '정상'
            : '문제 감지',
      },
      echo: {
        message: `처리된 쿼리: "${testQuery}"`,
        recommendation: processingResult.isValid
          ? '한글 처리가 정상적으로 작동합니다'
          : '한글 인코딩 문제가 있을 수 있습니다',
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('❌ 한글 POST 테스트 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '한글 POST 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}
