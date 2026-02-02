import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { developmentOnly } from '@/lib/api/development-only';
import debug from '@/utils/debug';

// ⚡ Edge Runtime으로 전환 - 무료 티어 친화적 최적화
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * 🔄 시뮬레이션 데이터 API
 * GET /api/simulate/data
 * 현재 시뮬레이션 데이터 및 진행 상황을 반환합니다
 */
export const GET = developmentOnly(function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';

    // 시뮬레이션 단계 정의
    const totalSteps = 12;

    // 시간 기반 단계 계산 (더 현실적인 진행)
    const baseTime = Date.now() - 180000; // 3분 전에 시작
    const elapsedSeconds = Math.floor((Date.now() - baseTime) / 1000);
    const currentStep = Math.min(
      Math.floor(elapsedSeconds / 15),
      totalSteps - 1
    ); // 15초마다 단계 진행

    const isActive = currentStep < totalSteps;
    const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        data: {
          currentStep,
          totalSteps,
          isActive,
          progress,
          stepInfo: {
            description: getStepDescription(currentStep),
            icon: getStepIcon(currentStep),
            category: getStepCategory(currentStep),
            duration: getDurationForStep(currentStep),
          },
          timing: {
            startTime: new Date(baseTime).toISOString(),
            elapsedSeconds,
            nextStepETA: isActive ? 15 - (elapsedSeconds % 15) : 0,
            estimatedCompletion: new Date(
              baseTime + totalSteps * 15 * 1000
            ).toISOString(),
          },
        },
      });
    }

    // 기본 현재 데이터 반환
    return NextResponse.json({
      success: true,
      data: {
        currentStep,
        totalSteps,
        isActive,
        progress,
        stepDescription: getStepDescription(currentStep),
        stepIcon: getStepIcon(currentStep),
      },
    });
  } catch (error) {
    debug.error('❌ 시뮬레이션 데이터 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '시뮬레이션 데이터 조회 실패',
        data: {
          currentStep: 0,
          totalSteps: 12,
          isActive: false,
        },
      },
      { status: 500 }
    );
  }
});

/**
 * 단계별 설명 반환
 */
function getStepDescription(step: number): string {
  const descriptions = [
    '🟢 시스템 부팅 및 초기화',
    '🔍 인프라 스캔 및 검색',
    '📊 메트릭 수집기 시작',
    '🔧 데이터베이스 커넥션 풀 설정',
    '🌐 네트워크 인터페이스 구성',
    '🤖 AI 추론 엔진 워밍업',
    '📈 Prometheus 스크래핑 설정',
    '🔄 타이머 시스템 초기화',
    '⚡ 성능 최적화 알고리즘 적용',
    '🛡️ 보안 정책 및 방화벽 설정',
    '✅ 종합 헬스체크 및 검증',
    '🎉 시뮬레이션 완료 - 서비스 준비',
  ];

  return descriptions[step] || '❓ 알 수 없는 단계';
}

/**
 * 단계별 아이콘 반환
 */
function getStepIcon(step: number): string {
  const icons = [
    '🚀',
    '🔍',
    '📊',
    '🔧',
    '🌐',
    '🤖',
    '📈',
    '🔄',
    '⚡',
    '🛡️',
    '✅',
    '🎉',
  ];

  return icons[step] || '❓';
}

/**
 * 단계별 카테고리 반환
 */
function getStepCategory(step: number): string {
  const categories = [
    '_initialization',
    'discovery',
    'monitoring',
    'database',
    'network',
    'ai',
    'metrics',
    'optimization',
    'performance',
    'security',
    'validation',
    'completion',
  ];

  return categories[step] || 'unknown';
}

/**
 * 단계별 예상 소요 시간 반환 (초)
 */
function getDurationForStep(step: number): number {
  const durations = [
    20,
    15,
    10,
    25,
    15, // 초기화, 스캔, 메트릭, DB, 네트워크
    30,
    20,
    15,
    25,
    20, // AI, Prometheus, Timer, 성능, 보안
    15,
    5, // 검증, 완료
  ];

  return durations[step] || 15;
}
