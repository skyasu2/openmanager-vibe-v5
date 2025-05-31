/**
 * 🛡️ SafeFormat Utilities
 * 타입 안전성을 보장하는 포맷팅 유틸리티
 */

/**
 * 업타임 값을 안전하게 문자열로 포맷팅
 * @param uptime - 숫자 또는 문자열 업타임 값
 * @returns 안전하게 포맷팅된 업타임 문자열
 */
export function safeFormatUptime(uptime: any): string {
  try {
    // null, undefined 체크
    if (uptime === null || uptime === undefined) {
      return 'N/A';
    }
    
    // 이미 문자열인 경우
    if (typeof uptime === 'string') {
      return uptime.trim() || 'N/A';
    }
    
    // 숫자인 경우 (초 단위로 가정)
    if (typeof uptime === 'number') {
      if (uptime <= 0) return '0일';
      
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      if (days > 0) {
        return `${days}일 ${hours}시간`;
      } else if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
      } else {
        return `${minutes}분`;
      }
    }
    
    // 기타 타입인 경우 문자열로 변환 시도
    const stringValue = String(uptime);
    return stringValue || 'N/A';
    
  } catch (error) {
    console.warn('⚠️ [safeFormatUptime] 업타임 포맷팅 실패:', error);
    return 'N/A';
  }
}

/**
 * 업타임에서 일 수를 안전하게 추출
 * @param uptime - 업타임 값
 * @returns 일 수 (숫자) 또는 0
 */
export function extractDaysFromUptime(uptime: any): number {
  try {
    // 문자열인 경우 "day" 또는 "일" 포함 체크
    if (typeof uptime === 'string') {
      // "5 days", "3일" 등의 패턴 매칭
      const dayMatch = uptime.match(/(\d+)\s*(day|일)/i);
      if (dayMatch) {
        return parseInt(dayMatch[1]) || 0;
      }
      
      // 순수 숫자 문자열인 경우
      const numericValue = parseFloat(uptime);
      if (!isNaN(numericValue)) {
        return Math.floor(numericValue / 86400); // 초를 일로 변환
      }
    }
    
    // 숫자인 경우 (초 단위로 가정)
    if (typeof uptime === 'number') {
      return Math.floor(uptime / 86400);
    }
    
    return 0;
  } catch (error) {
    console.warn('⚠️ [extractDaysFromUptime] 일 수 추출 실패:', error);
    return 0;
  }
}

/**
 * 값이 유효한 문자열인지 안전하게 체크
 * @param value - 체크할 값
 * @returns 유효한 문자열 여부
 */
export function isValidString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 안전한 문자열 includes 체크
 * @param text - 체크할 텍스트
 * @param searchString - 찾을 문자열
 * @returns includes 결과 (안전)
 */
export function safeIncludes(text: any, searchString: string): boolean {
  try {
    if (!isValidString(text)) {
      return false;
    }
    return text.includes(searchString);
  } catch (error) {
    console.warn('⚠️ [safeIncludes] 안전한 includes 체크 실패:', error);
    return false;
  }
} 