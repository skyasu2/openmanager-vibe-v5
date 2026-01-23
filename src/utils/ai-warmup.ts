/**
 * AI 엔진 웜업 유틸리티
 *
 * Cloud Run cold start 대응을 위한 조기 웜업 기능
 * - 세션 내 중복 호출 방지 (60초 쿨다운)
 * - Fire-and-forget 패턴 (실패해도 사용자 경험 미영향)
 */

const WARMUP_COOLDOWN_MS = 60_000; // 60초 쿨다운
const WARMUP_STORAGE_KEY = 'ai_warmup_timestamp';

/**
 * 마지막 웜업 시간 조회
 */
function getLastWarmupTime(): number {
  try {
    if (typeof window === 'undefined') return 0;
    const stored = sessionStorage.getItem(WARMUP_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * 웜업 시간 기록
 */
function setWarmupTime(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(WARMUP_STORAGE_KEY, Date.now().toString());
    }
  } catch {
    // sessionStorage 비활성화 환경 무시
  }
}

/**
 * 웜업이 필요한지 확인 (쿨다운 체크)
 */
function needsWarmup(): boolean {
  const lastWarmup = getLastWarmupTime();
  return Date.now() - lastWarmup > WARMUP_COOLDOWN_MS;
}

/**
 * AI 엔진 웜업 트리거
 *
 * - 60초 쿨다운 내에는 중복 호출하지 않음
 * - Fire-and-forget: 결과 무시, 실패해도 사용자 경험 미영향
 *
 * @param source 호출 위치 (로깅용)
 * @returns 실제 웜업 요청이 전송되었는지 여부
 */
export async function triggerAIWarmup(source?: string): Promise<boolean> {
  // 쿨다운 체크
  if (!needsWarmup()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[AI Warmup] Skipped (cooldown) - source: ${source || 'unknown'}`
      );
    }
    return false;
  }

  // 타임스탬프 먼저 기록 (중복 요청 방지)
  setWarmupTime();

  try {
    await fetch('/api/ai/wake-up', { method: 'POST' });
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AI Warmup] Triggered - source: ${source || 'unknown'}`);
    }
    return true;
  } catch {
    // Fire-and-forget: 실패해도 무시
    return true; // 요청은 시도됨
  }
}

/**
 * 웜업 상태 리셋 (테스트용)
 */
export function resetWarmupState(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(WARMUP_STORAGE_KEY);
    }
  } catch {
    // 무시
  }
}
