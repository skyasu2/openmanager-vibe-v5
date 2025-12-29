/**
 * Unified Stream Security Module
 * 경량화된 입력/출력 보안 필터
 *
 * @description Cloud Run Multi-Agent API의 보안 레이어
 * - 입력: 길이 제한, 민감정보 마스킹
 * - 출력: 길이 제한, 잠재적 위험 콘텐츠 필터링
 *
 * @updated 2025-12-30 - ReDoS 방지 및 XSS 필터 강화
 * - 기존 정규식의 `\S+` 패턴 → 길이 제한 `[^\s]{1,100}` 으로 변경
 * - XSS 벡터 추가: img onerror, svg onload, javascript: URL 등
 * - HTML 특수문자 이스케이프 함수 추가
 */

// ============================================================================
// 상수 정의
// ============================================================================

const MAX_INPUT_LENGTH = 10000;
const MAX_OUTPUT_LENGTH = 50000;

/**
 * 민감 정보 패턴 (API 키, 토큰, 비밀번호 등)
 *
 * @security ReDoS 방지를 위해 값 부분을 `[^\s]{1,100}`으로 제한
 * - 기존: `\S+` → 무제한 백트래킹 가능
 * - 변경: `[^\s]{1,100}` → 최대 100자로 제한
 */
const SENSITIVE_PATTERNS = [
  /(api[_-]?key|apikey)\s*[=:]\s*['"]?[^\s'"]{1,100}['"]?/gi,
  /(token|bearer)\s*[=:]\s*['"]?[^\s'"]{1,100}['"]?/gi,
  /(password|passwd|pwd)\s*[=:]\s*['"]?[^\s'"]{1,100}['"]?/gi,
  /(secret|private[_-]?key)\s*[=:]\s*['"]?[^\s'"]{1,100}['"]?/gi,
  /(access[_-]?key|secret[_-]?key)\s*[=:]\s*['"]?[^\s'"]{1,100}['"]?/gi,
];

/**
 * 위험 콘텐츠 패턴 (코드 실행, 시스템 접근, XSS 등)
 *
 * @security 확장된 XSS 벡터 커버리지
 * - script 태그
 * - event handler 속성 (onerror, onload, onclick 등)
 * - javascript: URL 스키마
 * - eval/exec 호출
 */
const DANGEROUS_OUTPUT_PATTERNS = [
  // Script 태그 (모든 변형)
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  // Event handler 속성들 (img, svg, body, iframe 등)
  /<[^>]+\s+on\w+\s*=/gi,
  // javascript: URL 스키마
  /javascript\s*:/gi,
  // data: URL (잠재적 XSS 벡터)
  /data\s*:\s*text\/html/gi,
  // eval/exec 호출 (길이 제한으로 ReDoS 방지)
  /eval\s*\([^)]{0,500}\)/gi,
  /exec\s*\([^)]{0,500}\)/gi,
  // DOM 조작 메서드 (XSS 벡터)
  /\.innerHTML\s*=/gi,
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

// ============================================================================
// HTML 이스케이프 유틸리티
// ============================================================================

/**
 * HTML 특수문자 매핑 테이블
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * HTML 특수문자 이스케이프
 *
 * @description XSS 방지를 위한 HTML 엔티티 변환
 * @param text - 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * 안전한 텍스트 출력을 위한 통합 필터
 *
 * @description 위험 패턴 제거 + HTML 이스케이프 적용
 * @param text - 필터링할 문자열
 * @returns 안전하게 처리된 문자열
 */
export function safeOutput(text: string): string {
  // 1. 위험 패턴 제거
  const filtered = quickFilter(text);
  // 2. HTML 이스케이프
  return escapeHtml(filtered);
}
