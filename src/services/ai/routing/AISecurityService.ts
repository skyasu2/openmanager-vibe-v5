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
import { AIResponseFilter, filterAIResponse } from '../security/AIResponseFilter';
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
    this.promptSanitizer = new PromptSanitizer({
      enableStrictMode: config.strictSecurityMode,
      customBlockedPatterns: [],
      maxQueryLength: 2000,
    });
    
    this.responseFilter = new AIResponseFilter({
      enableFiltering: true,
      strictMode: config.strictSecurityMode,
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
        
        if (sanitizationResult.reason) {
          this.metrics.threatsDetected.push(sanitizationResult.reason);
        }
        
        return {
          allowed: false,
          reason: sanitizationResult.reason || 'Security policy violation',
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
        
        return {
          ...response,
          response: filteredResult.content,
          metadata: {
            ...response.metadata,
            securityFiltered: true,
          },
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
      engine: 'local' as const,
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
    
    // 컴포넌트 재설정
    this.promptSanitizer = new PromptSanitizer({
      enableStrictMode: this.config.strictSecurityMode,
      customBlockedPatterns: [],
      maxQueryLength: 2000,
    });
    
    this.responseFilter = new AIResponseFilter({
      enableFiltering: true,
      strictMode: this.config.strictSecurityMode,
    });
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