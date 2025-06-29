/**
 * 🔤 UTF-8 로깅 유틸리티
 * 한국어 및 특수문자 출력을 위한 인코딩 보장
 * Windows 환경 한국어 인코딩 문제 해결
 */

/**
 * Windows 환경에서 한국어 안전 출력
 */
function safeKoreanOutput(text: string): void {
  try {
    if (typeof window !== 'undefined') {
      // 브라우저 환경: 일반 출력
      return;
    }

    // Windows 환경 감지
    const isWindows = process.platform === 'win32';

    if (isWindows && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) {
      // Windows + 한국어: Buffer를 통한 안전 출력
      const buffer = Buffer.from(text + '\n', 'utf8');
      process.stdout.write(buffer);
    } else {
      // 다른 환경: 일반 출력
      console.log(text);
    }
  } catch (error) {
    // 최후의 수단: 영어 메시지로 대체
    console.log('[Korean encoding error]', text);
  }
}

/**
 * UTF-8 인코딩으로 텍스트 정규화
 */
function normalizeUTF8(text: string): string {
  try {
    // Windows 환경에서 한국어인 경우 Buffer 기반 정규화
    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) {
      const buffer = Buffer.from(text, 'utf8');
      return buffer.toString('utf8');
    }

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
    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
      if (args.length > 0) {
        console.log(...args);
      }
    } else {
      console.log(normalizedMessage, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
      if (args.length > 0) {
        console.info(...args);
      }
    } else {
      console.info(normalizedMessage, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
      if (args.length > 0) {
        console.warn(...args);
      }
    } else {
      console.warn(normalizedMessage, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
      if (args.length > 0) {
        console.error(...args);
      }
    } else {
      console.error(normalizedMessage, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    const normalizedMessage = normalizeUTF8(message);
    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
      if (args.length > 0) {
        console.debug(...args);
      }
    } else {
      console.debug(normalizedMessage, ...args);
    }
  },

  /**
   * 한국어 쿼리 전용 로그 (이모지 포함) - Windows 최적화
   */
  korean: (emoji: string, message: string, data?: any) => {
    const fullMessage = `${emoji} ${message}`;
    const normalizedMessage = normalizeUTF8(fullMessage);

    if (process.platform === 'win32') {
      // Windows: Buffer 기반 안전 출력
      safeKoreanOutput(normalizedMessage);
      if (data) {
        console.log(data);
      }
    } else {
      // 다른 OS: 일반 출력
      if (data) {
        console.log(normalizedMessage, data);
      } else {
        console.log(normalizedMessage);
      }
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

    const fullMessage = `${statusEmoji[status]} ${engine}: ${message}`;
    const normalizedMessage = normalizeUTF8(fullMessage);

    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
    } else {
      console.log(normalizedMessage);
    }
  },

  /**
   * 성능 메트릭 로그
   */
  performance: (operation: string, duration: number, details?: any) => {
    const fullMessage = `⏱️ ${operation}: ${duration}ms`;
    const normalizedMessage = normalizeUTF8(fullMessage);

    if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalizedMessage)) {
      safeKoreanOutput(normalizedMessage);
      if (details) {
        console.log(details);
      }
    } else {
      if (details) {
        console.log(normalizedMessage, details);
      } else {
        console.log(normalizedMessage);
      }
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
        if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalized)) {
          safeKoreanOutput(normalized);
          if (args.length > 0) {
            originalConsole.log(...args);
          }
        } else {
          originalConsole.log(normalized, ...args);
        }
      } else {
        originalConsole.log(message, ...args);
      }
    };

    console.info = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalized)) {
          safeKoreanOutput(normalized);
          if (args.length > 0) {
            originalConsole.info(...args);
          }
        } else {
          originalConsole.info(normalized, ...args);
        }
      } else {
        originalConsole.info(message, ...args);
      }
    };

    console.warn = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalized)) {
          safeKoreanOutput(normalized);
          if (args.length > 0) {
            originalConsole.warn(...args);
          }
        } else {
          originalConsole.warn(normalized, ...args);
        }
      } else {
        originalConsole.warn(message, ...args);
      }
    };

    console.error = (message: any, ...args: any[]) => {
      if (typeof message === 'string') {
        const normalized = normalizeUTF8(message);
        if (process.platform === 'win32' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(normalized)) {
          safeKoreanOutput(normalized);
          if (args.length > 0) {
            originalConsole.error(...args);
          }
        } else {
          originalConsole.error(normalized, ...args);
        }
      } else {
        originalConsole.error(message, ...args);
      }
    };
  }
}

export default utf8Logger;
