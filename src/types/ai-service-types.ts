/**
 * 🤖 AI 서비스 타입 정의 (최소화 버전)
 *
 * 에러 처리 및 모니터링에 필요한 핵심 타입만 포함
 */

// ============================================================================
// 📈 메모리 메트릭 타입
// ============================================================================

/**
 * 메모리 사용량 메트릭
 */
export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  usagePercent: number;
}

// ============================================================================
// 🔨 에러 처리 관련 타입
// ============================================================================

/**
 * 에러 컨텍스트 타입
 */
export interface ErrorContext {
  /** 에러가 발생한 함수/메서드 이름 */
  method?: string;
  /** 에러가 발생한 파일 경로 */
  file?: string;
  /** 에러가 발생한 줄 번호 */
  line?: number;
  /** 사용자 ID */
  userId?: string;
  /** 요청 ID */
  requestId?: string;
  /** API 엔드포인트 */
  endpoint?: string;
  /** HTTP 메서드 */
  httpMethod?: string;
  /** 에러 발생 시간 */
  timestamp?: string | Date;
  /** 환경 (development, production 등) */
  environment?: string;
  /** 메모리 사용량 (에러 시점) */
  memoryUsage?: MemoryMetrics;
  /** 추가 속성 (최소화) */
  [key: string]: string | number | boolean | Date | MemoryMetrics | undefined;
}

/**
 * 모니터링 이벤트 데이터 타입
 */
export interface MonitoringEventData {
  /** 이벤트 이름 */
  eventName: string;
  /** 이벤트 심각도 */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** 영향받은 서비스 */
  service?: string;
  /** 에러 코드 */
  errorCode?: string;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 복구 시도 횟수 */
  recoveryAttempts?: number;
  /** 폴백 사용 여부 */
  fallbackUsed?: boolean;
  /** 메모리 기반 캐시 사용 여부 */
  memoryCacheUsed?: boolean;
  /** 추가 속성 (최소화) */
  [key: string]: string | number | boolean | Date | undefined;
}
