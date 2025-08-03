/**
 * 🚫 FloatingSystemControl 제거됨
 *
 * Vercel 플랫폼 자체 모니터링 사용 권장:
 * - Vercel 대시보드: https://vercel.com/dashboard
 * - 함수 로그: Vercel Functions 탭
 * - 성능 모니터링: Analytics 탭
 * - 실시간 상태: Deployments 탭
 *
 * 이유:
 * 1. Vercel 플랫폼이 자체 헬스체크 제공
 * 2. 무료 티어 할당량 절약 필요
 * 3. 중복 모니터링으로 인한 리소스 낭비 방지
 */

'use client';

interface FloatingSystemControlProps {
  systemState: unknown;
  aiAgentState: unknown;
  isSystemActive: boolean;
  isSystemPaused: boolean;
  onStartSystem: () => Promise<void>;
  onStopSystem: () => Promise<void>;
  onResumeSystem: () => Promise<void>;
}

export default function FloatingSystemControl({
  systemState,
  aiAgentState,
  isSystemActive,
  isSystemPaused,
  onStartSystem,
  onStopSystem,
  onResumeSystem,
}: FloatingSystemControlProps): null {
  // 🚫 Vercel 플랫폼 자체 모니터링 사용으로 인한 제거
  //
  // 대안:
  // 1. Vercel 대시보드에서 함수 상태 확인
  // 2. 로그는 Vercel Functions 탭에서 실시간 확인
  // 3. 성능 메트릭은 Analytics 탭에서 확인
  // 4. 배포 상태는 Deployments 탭에서 확인

  return null;
}
