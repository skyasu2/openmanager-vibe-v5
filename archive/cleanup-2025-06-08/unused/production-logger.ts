/**
 * 🚀 Production-Safe 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하여 프로덕션 성능을 보호합니다.
 */

// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === 'development';

// Production-Safe 로깅 함수들
export const safeConsole = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // 에러는 프로덕션에서도 기록 (중요)
    console.error(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(message, ...args);
    }
  },
};

// 개발 전용 로그
export const devLog = (message: string, data?: any) => {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[DEV ${timestamp}] ${message}`, data);
    } else {
      console.log(`[DEV ${timestamp}] ${message}`);
    }
  }
};

// 시스템 로그 (개발환경에서만)
export const systemLog = (message: string, data?: any) => {
  if (isDevelopment) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[SYSTEM ${timestamp}] ${message}`, data);
    } else {
      console.log(`[SYSTEM ${timestamp}] ${message}`);
    }
  }
};

// 성능 로그 (개발환경에서만)
export const perfLog = (message: string, startTime?: number) => {
  if (isDevelopment) {
    const duration = startTime ? `(${Date.now() - startTime}ms)` : '';
    console.log(`⚡ [PERF] ${message} ${duration}`);
  }
};

// AI 관련 로그 (개발환경에서만)
export const aiLog = (message: string, data?: any) => {
  if (isDevelopment) {
    if (data) {
      console.log(`🧠 [AI] ${message}`, data);
    } else {
      console.log(`🧠 [AI] ${message}`);
    }
  }
};

// 기본 export (기존 console 대체용)
export default safeConsole;
