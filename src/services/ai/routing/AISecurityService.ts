/**
 * AI Security Service
 *
 * AI 요청/응답에 대한 보안 처리를 담당
 * - 프롬프트 검증 및 삭제
 * - 응답 필터링
 * - 보안 이벤트 추적
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { PromptSanitizer, sanitizePrompt } from '../security/PromptSanitizer';
import {
  AIResponseFilter,
  filterAIResponse,
} from '../security/AIResponseFilter';
import type { QueryRequest, QueryResponse } from '../SimplifiedQueryEngine';

export interface SecurityConfig {
  enableSecurity: boolean;
  strictSecurityMode: boolean;
}

export interface SecurityMetrics {
  promptsBlocked: number;
  responsesFiltered: number;
  threatsDetected: string[];
}

export interface SecurityResult {
  allowed: boolean;
  reason?: string;
  sanitizedRequest?: QueryRequest;
}

export class AISecurityService {
  private promptSanitizer: PromptSanitizer;
  private responseFilter: AIResponseFilter;
  private metrics: SecurityMetrics;

  constructor(private config: SecurityConfig) {
    this.promptSanitizer = PromptSanitizer.getInstance({
      enableStrictMode: config.strictSecurityMode,
      maxInputLength: 2000,
    });

    this.responseFilter = AIResponseFilter.getInstance({
      enableStrictFiltering: config.strictSecurityMode,
      preventCodeExecution: true,
      preventInfoLeakage: true,
    });

    this.metrics = {
      promptsBlocked: 0,
      responsesFiltered: 0,
      threatsDetected: [],
    };
  }

  /**
   * 요청에 보안 검사 적용
   */
  async checkRequest(request: QueryRequest): Promise<SecurityResult> {
    if (!this.config.enableSecurity) {
      return { allowed: true };
    }

    try {
      // 프롬프트 검증
      const sanitizationResult = await sanitizePrompt(request.query);

      if (sanitizationResult.blocked) {
        this.metrics.promptsBlocked++;

        if (sanitizationResult.threatsDetected.length > 0) {
          this.metrics.threatsDetected.push(
            ...sanitizationResult.threatsDetected
          );
        }

        return {
          allowed: false,
          reason:
            sanitizationResult.threatsDetected.join(', ') ||
            'Security policy violation',
        };
      }

      // 검증된 요청 반환
      return {
        allowed: true,
        sanitizedRequest: {
          ...request,
          query: sanitizationResult.sanitized,
        },
      };
    } catch (error) {
      console.error('Security check error:', error);

      // 보안 검사 실패 시 안전하게 차단
      if (this.config.strictSecurityMode) {
        return {
          allowed: false,
          reason: 'Security validation failed',
        };
      }

      return { allowed: true };
    }
  }

  /**
   * AI 응답 필터링
   */
  async filterResponse(response: QueryResponse): Promise<QueryResponse> {
    if (!this.config.enableSecurity) {
      return response;
    }

    try {
      const filteredResult = await filterAIResponse(response.response);

      if (filteredResult.filtered) {
        this.metrics.responsesFiltered++;

        const baseMetadata = response.metadata || {};
        const metadata: typeof response.metadata = baseMetadata;

        return {
          ...response,
          response: filteredResult.filtered,
          metadata,
        };
      }

      return response;
    } catch (error) {
      console.error('Response filtering error:', error);
      return response;
    }
  }

  /**
   * 보안 차단 응답 생성
   */
  createBlockedResponse(reason: string): QueryResponse {
    return {
      success: false,
      response: '🔒 보안 정책에 의해 요청이 차단되었습니다.',
      engine: 'local-rag' as const,
      confidence: 1,
      thinkingSteps: [
        {
          step: '보안 검사',
          description: `요청 차단: ${reason}`,
          status: 'completed',
          timestamp: Date.now(),
        },
      ],
      metadata: {
        blocked: true,
        reason,
        securityApplied: true,
      },
      processingTime: 0,
    };
  }

  /**
   * 보안 메트릭 조회
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * 보안 설정 업데이트
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 싱글톤 인스턴스 업데이트
    this.promptSanitizer.updateConfig({
      enableStrictMode: this.config.strictSecurityMode,
    });

    // Note: AIResponseFilter doesn't have updateConfig, so we need to get a new instance
    // This is a limitation of the singleton pattern when config changes are needed
    console.warn(
      'AIResponseFilter config update requires service restart for full effect'
    );
  }

  /**
   * 메트릭 리셋
   */
  resetMetrics(): void {
    this.metrics = {
      promptsBlocked: 0,
      responsesFiltered: 0,
      threatsDetected: [],
    };
  }
}
