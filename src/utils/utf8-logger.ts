/**
 * 🔤 UTF-8 로깅 유틸리티
 * 한국어 및 특수문자 출력을 위한 인코딩 보장
 */

/**
 * UTF-8 인코딩으로 텍스트 정규화
 */
function normalizeUTF8(text: string): string {
  try {
    // TextEncoder/TextDecoder를 사용한 UTF-8 정규화
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');

    const encoded = encoder.encode(text);
    const normalized = decoder.decode(encoded);

    return normalized;
  } catch (error) {
    // 정규화 실패 시 원본 반환
    return text;
  }
}

/**
 * 한국어 안전 출력을 위한 로그 함수들
 */
export const utf8Logger = {
  log: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    console.log(normalizedMessage, ...args);
  },

  info: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    console.info(normalizedMessage, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    console.warn(normalizedMessage, ...args);
  },

  error: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    console.error(normalizedMessage, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    console.debug(normalizedMessage, ...args);
  },

  /**
   * 한국어 쿼리 전용 로그 (이모지 포함)
   */
  korean: (emoji: string, message: string, data?: any) => {
    const normalizedMessage = normalizeUTF8(`${emoji} ${message}`);
    if (data) {
      console.log(normalizedMessage, data);
    } else {
      console.log(normalizedMessage);
    }
  },

  /**
   * AI 엔진 상태 로그
   */
  aiStatus: (
    engine: string,
    status: 'success' | 'warning' | 'error',
    message: string
  ) => {
    const statusEmoji = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    const normalizedMessage = normalizeUTF8(
      `${statusEmoji[status]} ${engine}: ${message}`
    );
    console.log(normalizedMessage);
  },

  /**
   * 성능 메트릭 로그
   */
  performance: (operation: string, duration: number, details?: any) => {
    const normalizedMessage = normalizeUTF8(`⏱️ ${operation}: ${duration}ms`);
    if (details) {
      console.log(normalizedMessage, details);
    } else {
      console.log(normalizedMessage);
    }
  },
};

/**
 * 기존 console 함수들을 UTF-8 안전 버전으로 래핑
 */
export function enableUTF8Console() {
  if (typeof window === 'undefined') {
    // 서버 사이드에서만 실행
    const originalConsole = { ...console };

    console.log = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        originalConsole.log(normalized, ...args);
      } else {
        originalConsole.log(message, ...args);
      }
    };

    console.info = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        originalConsole.info(normalized, ...args);
      } else {
        originalConsole.info(message, ...args);
      }
    };

    console.warn = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        originalConsole.warn(normalized, ...args);
      } else {
        originalConsole.warn(message, ...args);
      }
    };

    console.error = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        originalConsole.error(normalized, ...args);
      } else {
        originalConsole.error(message, ...args);
      }
    };
  }
}

export default utf8Logger;
