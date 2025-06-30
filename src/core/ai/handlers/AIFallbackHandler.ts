/**
 * 🚨 OpenManager Vibe v5 - AI 폴백 처리 시스템 v1.0
 *
 * UnifiedAIEngineRouter에서 분리된 폴백 로직 전담 클래스
 * - LOCAL 모드 전용 응급 폴백
 * - GOOGLE_AI 모드 전용 응급 폴백
 * - 범용 응급 폴백
 * - 한국시간 기준 로깅 및 메트릭
 *
 * 작성일: 2025-01-05 11:00 KST
 */

import { AIMode, AIRequest, AIResponse } from '@/types/ai-types';
import { KST } from '@/utils/koreanTime';

/**
 * 폴백 메트릭 인터페이스
 */
export interface FallbackMetrics {
  totalFallbacks: number;
  fallbacksByMode: Record<AIMode, number>;
  fallbacksByReason: Record<string, number>;
  averageFallbackTime: number;
  lastFallbackTime: string;
}

/**
 * 에러 타입별 상세 정보
 */
interface ErrorDetails {
  category: string;
  description: string;
  solutions: string[];
  technicalInfo?: string;
}

export class AIFallbackHandler {
  private static instance: AIFallbackHandler | null = null;

  private metrics: FallbackMetrics = {
    totalFallbacks: 0,
    fallbacksByMode: {
      LOCAL: 0,
      GOOGLE_AI: 0,
      AUTO: 0,
      GOOGLE_ONLY: 0,
    },
    fallbacksByReason: {},
    averageFallbackTime: 0,
    lastFallbackTime: KST.iso(),
  };

  private constructor() {
    console.log(`[${KST.log()}] 🚨 AIFallbackHandler 초기화 완료`);
  }

  public static getInstance(): AIFallbackHandler {
    if (!AIFallbackHandler.instance) {
      AIFallbackHandler.instance = new AIFallbackHandler();
    }
    return AIFallbackHandler.instance;
  }

  /**
   * 에러 이유에 따른 상세 정보 반환
   */
  private getErrorDetails(reason: string, mode: AIMode): ErrorDetails {
    const errorMap: Record<string, ErrorDetails> = {
      'network-timeout': {
        category: '네트워크 연결 문제',
        description: 'AI 서비스 서버와의 연결이 시간 초과되었습니다.',
        solutions: [
          '네트워크 연결 상태를 확인해주세요',
          '방화벽이나 프록시 설정을 점검해주세요',
          '잠시 후 다시 시도해주세요 (서버 일시 과부하 가능)',
          'VPN 연결 시 다른 서버로 변경해보세요',
        ],
        technicalInfo: 'Connection timeout exceeded 30 seconds',
      },
      'api-rate-limit': {
        category: 'API 사용량 한계',
        description: 'AI 서비스의 사용량 한계에 도달했습니다.',
        solutions: [
          '15분 후 다시 시도해주세요',
          '쿼리를 더 간단하게 줄여서 시도해보세요',
          '다른 AI 모드로 전환해보세요',
          '관리자에게 API 한계 증설을 요청하세요',
        ],
        technicalInfo: 'Rate limit: 100 requests per 15 minutes',
      },
      'google-ai-unavailable': {
        category: 'Google AI 서비스 중단',
        description: 'Google AI 서비스가 일시적으로 사용할 수 없습니다.',
        solutions: [
          'LOCAL 모드로 전환하여 로컬 AI 사용',
          '구글 서비스 상태 페이지 확인',
          '30분 후 재시도 권장',
          'API 키 유효성 확인',
        ],
        technicalInfo: 'Google AI API response: 503 Service Unavailable',
      },
      'local-engine-failed': {
        category: '로컬 AI 엔진 오류',
        description: '로컬 AI 엔진에서 처리 중 오류가 발생했습니다.',
        solutions: [
          'Supabase 연결 상태 확인',
          '로컬 AI 모델 파일 무결성 검사',
          '메모리 사용량 확인 (8GB 이상 권장)',
          '시스템 재시작 후 재시도',
        ],
        technicalInfo: 'Local transformer model loading failed',
      },
      'context-collection-failed': {
        category: 'MCP 컨텍스트 수집 실패',
        description:
          'MCP(Model Context Protocol) 컨텍스트 수집에 실패했습니다.',
        solutions: [
          'MCP 서버 연결 상태 확인',
          '컨텍스트 파일 권한 확인',
          '더 구체적인 질문으로 재시도',
          '기본 모드로 전환하여 시도',
        ],
        technicalInfo: 'MCP context retrieval timeout or permission denied',
      },
      'unknown-error': {
        category: '알 수 없는 오류',
        description: '예상하지 못한 오류가 발생했습니다.',
        solutions: [
          '브라우저 콘솔에서 오류 로그 확인',
          '페이지 새로고침 후 재시도',
          '다른 브라우저에서 시도',
          '시스템 관리자에게 문의',
        ],
        technicalInfo: 'Unhandled exception in AI processing pipeline',
      },
    };

    return errorMap[reason] || errorMap['unknown-error'];
  }

  /**
   * 🚨 LOCAL 모드 전용 응급 폴백 (Google AI 완전 제외)
   */
  public createLocalModeEmergencyFallback(
    request: AIRequest,
    startTime: number,
    fallbacksUsed: number,
    reason?: string
  ): AIResponse {
    const processingTime = Date.now() - startTime;
    const errorDetails = this.getErrorDetails(
      reason || 'local-engine-failed',
      'LOCAL'
    );

    console.log(
      `[${KST.log()}] 🚨 LOCAL 모드 응급 폴백 생성: ${reason || '알 수 없는 오류'}`
    );

    const detailedResponse = `
🏠 **LOCAL 모드 응급 폴백 응답**

**문제 상황**: ${errorDetails.category}
${errorDetails.description}

**현재 상태**:
❌ Supabase RAG 엔진: 사용 불가
❌ Korean AI 엔진: 사용 불가  
❌ Transformers 엔진: 사용 불가
❌ MCP 컨텍스트 수집: 사용 불가
✅ 기본 응답 시스템: 동작 중

**해결 방법**:
${errorDetails.solutions.map((solution, i) => `${i + 1}. ${solution}`).join('\n')}

**기술 정보**: ${errorDetails.technicalInfo || 'N/A'}

**쿼리**: "${request.query}"
**처리 시간**: ${processingTime}ms
**폴백 횟수**: ${fallbacksUsed + 1}

💡 **참고**: OpenManager는 서버 모니터링 및 AI 분석 도구입니다. 현재 기본 기능만 사용 가능합니다.
        `.trim();

    const response: AIResponse = {
      success: true,
      response: detailedResponse,
      confidence: 0.4,
      mode: 'LOCAL',
      enginePath: ['local-emergency-fallback'],
      processingTime,
      fallbacksUsed: fallbacksUsed + 1,
      metadata: {
        mainEngine: 'local-emergency-fallback',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false, // LOCAL 모드는 Google AI 절대 사용 안 함
        mcpContextUsed: false,
        subEnginesUsed: [],
        fallbackReason: `${errorDetails.category}: ${errorDetails.description}`,
      },
    };

    this.updateMetrics(
      'LOCAL',
      processingTime,
      reason || 'local-mode-emergency'
    );
    return response;
  }

  /**
   * 🚨 GOOGLE_AI 모드 전용 응급 폴백
   */
  public createGoogleOnlyModeEmergencyFallback(
    request: AIRequest,
    startTime: number,
    fallbacksUsed: number,
    reason?: string
  ): AIResponse {
    const processingTime = Date.now() - startTime;
    const errorDetails = this.getErrorDetails(
      reason || 'google-ai-unavailable',
      'GOOGLE_AI'
    );

    console.log(
      `[${KST.log()}] 🚨 GOOGLE_AI 모드 응급 폴백 생성: ${reason || '알 수 없는 오류'}`
    );

    const detailedResponse = `
🤖 **GOOGLE_AI 모드 응급 폴백 응답**

**문제 상황**: ${errorDetails.category}
${errorDetails.description}

**현재 상태**:
❌ Google AI API: 사용 불가
❌ Gemini Pro: 연결 실패
❌ 고급 AI 분석: 제한됨
✅ 기본 응답 시스템: 동작 중

**해결 방법**:
${errorDetails.solutions.map((solution, i) => `${i + 1}. ${solution}`).join('\n')}

**기술 정보**: ${errorDetails.technicalInfo || 'N/A'}

**쿼리**: "${request.query}"
**처리 시간**: ${processingTime}ms
**폴백 횟수**: ${fallbacksUsed + 1}

🔄 **권장**: LOCAL 모드로 전환하여 로컬 AI 엔진을 사용해보세요.
        `.trim();

    const response: AIResponse = {
      success: true,
      response: detailedResponse,
      confidence: 0.35,
      mode: 'GOOGLE_AI',
      enginePath: ['google-ai-emergency-fallback'],
      processingTime,
      fallbacksUsed: fallbacksUsed + 1,
      metadata: {
        mainEngine: 'google-ai-emergency-fallback',
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: false,
        mcpContextUsed: false,
        subEnginesUsed: [],
        fallbackReason: `${errorDetails.category}: ${errorDetails.description}`,
      },
    };

    this.updateMetrics(
      'GOOGLE_AI',
      processingTime,
      reason || 'google-ai-mode-emergency'
    );
    return response;
  }

  /**
   * 🔧 범용 응급 폴백 (모든 모드 지원)
   */
  public createEmergencyFallback(
    request: AIRequest,
    mode: AIMode,
    startTime: number,
    reason?: string
  ): AIResponse {
    const processingTime = Date.now() - startTime;
    const errorDetails = this.getErrorDetails(reason || 'unknown-error', mode);

    console.log(
      `[${KST.log()}] 🚨 ${mode} 모드 범용 응급 폴백 생성: ${reason || '시스템 오류'}`
    );

    const detailedResponse = `
⚠️ **${mode} 모드 응급 폴백 응답**

**문제 상황**: ${errorDetails.category}
${errorDetails.description}

**영향받는 시스템**:
${this.getAffectedSystems(mode, reason)
  .map(system => `❌ ${system}`)
  .join('\n')}

**해결 방법**:
${errorDetails.solutions.map((solution, i) => `${i + 1}. ${solution}`).join('\n')}

**기술 정보**: ${errorDetails.technicalInfo || 'System-wide failure detected'}

**쿼리**: "${request.query}"
**모드**: ${mode}
**처리 시간**: ${processingTime}ms
**폴백 횟수**: 1

🔧 **즉시 시도할 수 있는 해결책**:
- 다른 AI 모드로 전환
- 쿼리를 더 간단하게 수정
- 네트워크 연결 확인 후 재시도
        `.trim();

    const response: AIResponse = {
      success: true,
      response: detailedResponse,
      confidence: this.getConfidenceByMode(mode),
      mode,
      enginePath: [`${mode.toLowerCase()}-emergency-fallback`],
      processingTime,
      fallbacksUsed: 1,
      metadata: {
        mainEngine: `${mode.toLowerCase()}-emergency-fallback`,
        supportEngines: [],
        ragUsed: false,
        googleAIUsed: mode === 'GOOGLE_AI' || mode === 'GOOGLE_ONLY',
        mcpContextUsed: false,
        subEnginesUsed: [],
        fallbackReason: `${errorDetails.category}: ${errorDetails.description}`,
      },
    };

    this.updateMetrics(mode, processingTime, reason || 'system-emergency');
    return response;
  }

  /**
   * 모드별 영향받는 시스템 목록 반환
   */
  private getAffectedSystems(mode: AIMode, reason?: string): string[] {
    const systems = {
      LOCAL: [
        'Supabase RAG 엔진',
        'Korean AI 엔진',
        'Transformers 엔진',
        'MCP 컨텍스트',
      ],
      GOOGLE_AI: [
        'Google AI API',
        'Gemini Pro',
        '고급 AI 분석',
        'Cloud 서비스',
      ],
      AUTO: ['자동 모드 선택', '모든 AI 엔진', '최적화 시스템', '라우팅 엔진'],
      GOOGLE_ONLY: ['Google AI 전용 서비스', 'Gemini API', 'Cloud AI Platform'],
    };

    return systems[mode] || ['알 수 없는 시스템'];
  }

  /**
   * 모드별 신뢰도 반환
   */
  private getConfidenceByMode(mode: AIMode): number {
    const confidence = {
      LOCAL: 0.35,
      GOOGLE_AI: 0.3,
      AUTO: 0.25,
      GOOGLE_ONLY: 0.2,
    };

    return confidence[mode] || 0.2;
  }

  /**
   * 🔧 폴백 전략 업데이트
   */
  public updateFallbackStrategy(
    mode: AIMode,
    strategy: {
      confidence?: number;
      message?: string;
      useGoogleAI?: boolean;
    }
  ): void {
    console.log(`[${KST.log()}] 🔧 ${mode} 모드 폴백 전략 업데이트:`, strategy);
    // 전략 업데이트 로직은 필요시 구현
  }

  /**
   * 📊 폴백 메트릭 업데이트
   */
  private updateMetrics(
    mode: AIMode,
    processingTime: number,
    reason: string
  ): void {
    this.metrics.totalFallbacks++;
    this.metrics.fallbacksByMode[mode]++;
    this.metrics.fallbacksByReason[reason] =
      (this.metrics.fallbacksByReason[reason] || 0) + 1;

    // 평균 처리 시간 계산
    const currentAvg = this.metrics.averageFallbackTime;
    const totalFallbacks = this.metrics.totalFallbacks;
    this.metrics.averageFallbackTime =
      (currentAvg * (totalFallbacks - 1) + processingTime) / totalFallbacks;

    this.metrics.lastFallbackTime = KST.iso();
  }

  /**
   * 📊 폴백 메트릭 조회
   */
  public getMetrics(): FallbackMetrics {
    return { ...this.metrics };
  }

  /**
   * 🔄 메트릭 초기화
   */
  public resetMetrics(): void {
    this.metrics = {
      totalFallbacks: 0,
      fallbacksByMode: {
        LOCAL: 0,
        GOOGLE_AI: 0,
        AUTO: 0,
        GOOGLE_ONLY: 0,
      },
      fallbacksByReason: {},
      averageFallbackTime: 0,
      lastFallbackTime: KST.iso(),
    };

    console.log(`[${KST.log()}] 🔄 AIFallbackHandler 메트릭 초기화 완료`);
  }

  /**
   * 🔍 폴백 필요성 판단 (미래 확장용)
   */
  public shouldUseFallback(
    error: Error,
    mode: AIMode,
    attemptCount: number
  ): boolean {
    // 폴백 조건 로직 (필요시 확장)
    if (attemptCount >= 3) return true;
    if (error.message.includes('timeout')) return true;
    if (error.message.includes('network')) return true;

    return false;
  }

  /**
   * 🧹 정리 작업
   */
  public cleanup(): void {
    console.log(`[${KST.log()}] 🧹 AIFallbackHandler 정리 작업 완료`);
  }
}

/**
 * 전역 AIFallbackHandler 인스턴스 (싱글톤)
 */
export const fallbackHandler = AIFallbackHandler.getInstance();
