/**
 * Unified Stream Security Module
 * 경량화된 입력/출력 보안 필터
 *
 * @description Cloud Run Multi-Agent API의 보안 레이어
 * - 입력: 길이 제한, 민감정보 마스킹
 * - 출력: 길이 제한, 잠재적 위험 콘텐츠 필터링
 */

// ============================================================================
// 상수 정의
// ============================================================================

const MAX_INPUT_LENGTH = 10000;
const MAX_OUTPUT_LENGTH = 50000;

/** 민감 정보 패턴 (API 키, 토큰, 비밀번호 등) */
const SENSITIVE_PATTERNS = [
  /(api[_-]?key|apikey)\s*[=:]\s*['"]?\S+['"]?/gi,
  /(token|bearer)\s*[=:]\s*['"]?\S+['"]?/gi,
  /(password|passwd|pwd)\s*[=:]\s*['"]?\S+['"]?/gi,
  /(secret|private[_-]?key)\s*[=:]\s*['"]?\S+['"]?/gi,
  /(access[_-]?key|secret[_-]?key)\s*[=:]\s*['"]?\S+['"]?/gi,
];

/** 위험 콘텐츠 패턴 (코드 실행, 시스템 접근 등) */
const DANGEROUS_OUTPUT_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /eval\s*\([^)]*\)/gi,
  /exec\s*\([^)]*\)/gi,
];

// ============================================================================
// 입력 검증 함수
// ============================================================================

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  modifications: string[];
}

/**
 * 사용자 입력을 검증하고 정제
 * - 길이 제한 적용
 * - 민감 정보 마스킹
 */
export function sanitizeInput(text: string): SanitizationResult {
  const modifications: string[] = [];
  let sanitized = text;

  // 1. 길이 제한
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH);
    modifications.push(`truncated_to_${MAX_INPUT_LENGTH}_chars`);
  }

  // 2. 민감 정보 마스킹
  for (const pattern of SENSITIVE_PATTERNS) {
    const before = sanitized;
    sanitized = sanitized.replace(pattern, '[REDACTED]');
    if (before !== sanitized) {
      modifications.push('sensitive_info_masked');
      break; // 한 번만 기록
    }
  }

  return {
    sanitized,
    wasModified: modifications.length > 0,
    modifications,
  };
}

// ============================================================================
// 출력 필터 함수
// ============================================================================

export interface FilterResult {
  filtered: string;
  wasFiltered: boolean;
  reasons: string[];
}

/**
 * AI 응답을 필터링
 * - 길이 제한 적용
 * - 위험 콘텐츠 제거
 */
export function filterResponse(text: string): FilterResult {
  const reasons: string[] = [];
  let filtered = text;

  // 1. 길이 제한
  if (filtered.length > MAX_OUTPUT_LENGTH) {
    filtered = `${filtered.slice(0, MAX_OUTPUT_LENGTH)}...[truncated]`;
    reasons.push(`truncated_to_${MAX_OUTPUT_LENGTH}_chars`);
  }

  // 2. 위험 콘텐츠 제거
  for (const pattern of DANGEROUS_OUTPUT_PATTERNS) {
    const before = filtered;
    filtered = filtered.replace(pattern, '[removed]');
    if (before !== filtered) {
      reasons.push('dangerous_content_removed');
      break;
    }
  }

  return {
    filtered,
    wasFiltered: reasons.length > 0,
    reasons,
  };
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 간단한 입력 정제 (문자열만 반환)
 */
export function quickSanitize(text: string): string {
  return sanitizeInput(text).sanitized;
}

/**
 * 간단한 출력 필터 (문자열만 반환)
 */
export function quickFilter(text: string): string {
  return filterResponse(text).filtered;
}
