/**
 * 🛠️ SimplifiedQueryEngine Utilities
 * 
 * Utility functions for caching, command detection, fallback responses,
 * and other helper methods used by the SimplifiedQueryEngine
 */

import type { Entity, IntentResult } from '@/modules/ai-agent/processors/IntentClassifier';
import type { CommandRequestContext } from './UnifiedAIEngineRouter';
import type { AIQueryContext } from '@/types/ai-service-types';
import {
  createCacheKey,
  getTTL,
  validateDataSize,
} from '@/config/free-tier-cache-config';
import type {
  QueryResponse,
  CacheEntry,
  CommandContext,
  MockContext,
  NLPAnalysis,
  ThinkingStep,
  HealthCheckResult,
} from './SimplifiedQueryEngine.types';

/**
 * 🧰 SimplifiedQueryEngine 유틸리티 클래스
 */
export class SimplifiedQueryEngineUtils {
  private responseCache: Map<string, CacheEntry> = new Map();

  /**
   * 🔑 캐시 키 생성
   */
  generateCacheKey(
    query: string,
    mode: string,
    context?: AIQueryContext
  ): string {
    const normalizedQuery = query.toLowerCase().trim();
    const contextKey = context?.servers ? 'with-servers' : 'no-context';
    return createCacheKey('ai', `${mode}:${normalizedQuery}:${contextKey}`);
  }

  /**
   * 📦 캐시된 응답 가져오기
   */
  getCachedResponse(key: string): QueryResponse | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;

    const ttl = getTTL('aiResponse'); // 15분
    const age = Date.now() - cached.timestamp;

    if (age > ttl * 1000) {
      this.responseCache.delete(key);
      return null;
    }

    // 캐시 히트 카운트 증가
    cached.hits++;
    return cached.response;
  }

  /**
   * 💾 응답 캐싱
   */
  setCachedResponse(key: string, response: QueryResponse): void {
    // 캐시 크기 제한 체크
    if (this.responseCache.size >= 100) {
      // 가장 오래된 항목 삭제
      const oldestKey = Array.from(this.responseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.responseCache.delete(oldestKey);
    }

    // 데이터 크기 검증
    if (validateDataSize(response, 'aiResponse')) {
      this.responseCache.set(key, {
        response,
        timestamp: Date.now(),
        hits: 0,
      });
    }
  }

  /**
   * 🧹 캐시 정리
   */
  cleanupCache(): void {
    const now = Date.now();
    const ttl = getTTL('aiResponse') * 1000;

    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > ttl) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * 🚨 폴백 응답 생성
   */
  generateFallbackResponse(
    query: string,
    thinkingSteps: QueryResponse['thinkingSteps'],
    startTime: number
  ): QueryResponse {
    thinkingSteps.push({
      step: '폴백 모드',
      description: '모든 엔진 실패, 기본 응답 생성',
      status: 'completed',
      timestamp: Date.now(),
    });

    return {
      success: true,
      response:
        '죄송합니다. 일시적으로 응답을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      engine: 'fallback',
      confidence: 0.1,
      thinkingSteps,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 🔍 명령어 쿼리 감지
   */
  detectCommandQuery(
    query: string, 
    commandContext?: CommandContext
  ): boolean {
    // 1. commandContext가 명시적으로 제공된 경우
    if (commandContext?.isCommandRequest) {
      return true;
    }

    // 2. 명령어 관련 키워드 패턴 감지
    const commandKeywords = [
      // 한국어 패턴
      /명령어?\s*(어떻?게|어떤|무엇|뭐|추천|알려)/i,
      /어떤?\s*명령어?/i,
      /(실행|사용|입력)해야?\s*할?\s*명령어?/i,
      /(서버|시스템)\s*(관리|모니터링|점검|확인)\s*명령어?/i,
      /리눅스|윈도우|도커|쿠버네티스.*명령어?/i,
      
      // 영어 패턴
      /what\s+(command|cmd)/i,
      /how\s+to\s+(run|execute|use)/i,
      /(server|system)\s+(command|cmd)/i,
      /(linux|windows|docker|k8s|kubectl)\s+(command|cmd)/i,
      
      // 구체적 명령어 언급
      /\b(top|htop|ps|grep|find|df|free|netstat|systemctl|docker|kubectl)\b/i,
    ];

    // 3. 키워드 매칭
    const hasKeyword = commandKeywords.some(pattern => pattern.test(query));
    if (hasKeyword) {
      return true;
    }

    // 4. 서버 ID + 명령어 패턴 감지
    const serverCommandPattern = /(web-prd|app-prd|db-main|db-repl|file-nas|backup).*명령어?/i;
    if (serverCommandPattern.test(query)) {
      return true;
    }

    return false;
  }

  /**
   * 🚨 명령어 폴백 응답 생성
   */
  generateCommandFallbackResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // 서버 유형별 기본 명령어 제안
    if (lowerQuery.includes('linux') || lowerQuery.includes('ubuntu')) {
      return `Linux 시스템 관리 기본 명령어:\n\n` +
             `📊 모니터링:\n` +
             `• top - 실시간 프로세스 모니터링\n` +
             `• htop - 향상된 프로세스 뷰어\n` +
             `• free -h - 메모리 사용량 확인\n` +
             `• df -h - 디스크 사용량 확인\n\n` +
             `🔍 검색 및 관리:\n` +
             `• ps aux | grep [프로세스명] - 프로세스 검색\n` +
             `• systemctl status [서비스명] - 서비스 상태 확인\n` +
             `• netstat -tuln - 네트워크 포트 확인\n\n` +
             `자세한 명령어는 "web-prd-01 명령어" 같이 서버를 지정해서 물어보세요.`;
    }

    if (lowerQuery.includes('windows')) {
      return `Windows 시스템 관리 기본 명령어:\n\n` +
             `📊 모니터링 (PowerShell):\n` +
             `• Get-Process | Sort-Object CPU -Descending - 프로세스 정렬\n` +
             `• Get-Counter "\\Processor(_Total)\\% Processor Time" - CPU 사용률\n` +
             `• Get-WmiObject Win32_LogicalDisk - 디스크 사용량\n\n` +
             `🔍 네트워크 및 서비스:\n` +
             `• netstat -an | findstr LISTENING - 열린 포트 확인\n` +
             `• Get-Service | Where-Object {$_.Status -eq "Running"} - 실행 중인 서비스\n\n` +
             `자세한 명령어는 "file-nas-01 명령어"를 물어보세요.`;
    }

    // 일반적인 명령어 질문
    return `서버 관리 명령어를 찾고 계시는군요! 🛠️\n\n` +
           `다음과 같이 구체적으로 물어보시면 더 정확한 답변을 드릴 수 있습니다:\n\n` +
           `📋 예시:\n` +
           `• "web-prd-01 서버 명령어" - Nginx 웹서버 관리 명령어\n` +
           `• "db-main-01 PostgreSQL 명령어" - 데이터베이스 관리 명령어\n` +
           `• "app-prd-01 Java 명령어" - Tomcat 애플리케이션 서버 명령어\n` +
           `• "Docker 컨테이너 명령어" - 컨테이너 관리 명령어\n\n` +
           `💡 현재 관리 중인 서버: web-prd-01, web-prd-02, app-prd-01, app-prd-02, ` +
           `db-main-01, db-repl-01, file-nas-01, backup-01`;
  }

  /**
   * 🇰🇷 Korean NLP GCP Function 호출
   * Enhanced Korean NLP 엔진을 통한 한국어 자연어 처리
   */
  async callKoreanNLPFunction(query: string, context?: MockContext): Promise<{
    success: boolean;
    intent?: string;
    entities?: Entity[];
    confidence?: number;
    analysis?: NLPAnalysis;
  }> {
    try {
      // GCP Functions 엔드포인트
      const GCP_FUNCTION_URL = process.env.NEXT_PUBLIC_GCP_KOREAN_NLP_URL || 
        'https://us-central1-openmanager-free-tier.cloudfunctions.net/enhanced-korean-nlp';
      
      // 타임아웃 설정 (5초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(GCP_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://openmanager-vibe-v5.vercel.app',
        },
        body: JSON.stringify({
          query,
          context: context || {},
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Korean NLP API 응답 오류: ${response.status}`);
        return { success: false };
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // GCP Function 응답 데이터 구조 매핑
        const nlpData = result.data;
        
        return {
          success: true,
          intent: nlpData.nlu_result?.intent || 'general',
          entities: nlpData.domain_analysis?.entities || [],
          confidence: nlpData.quality_metrics?.confidence || 0.5,
          analysis: {
            intent: nlpData.nlu_result?.intent || 'general',
            semantic: nlpData.semantic_analysis,
            context: nlpData.context_analysis,
            guidance: nlpData.response_guidance,
            metadata: {
              performance: result.performance,
            },
          } as NLPAnalysis,
        };
      }
      
      return { success: false };
      
    } catch (error) {
      // 타임아웃 또는 네트워크 에러
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Korean NLP 타임아웃 (5초)');
      } else {
        console.error('Korean NLP 호출 실패:', error);
      }
      
      // 폴백: 기본 의도 분석
      return {
        success: false,
        intent: this.detectBasicIntent(query),
        confidence: 0.3,
      };
    }
  }
  
  /**
   * 기본 의도 감지 (폴백용)
   */
  detectBasicIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('확인') || lowerQuery.includes('조회') || lowerQuery.includes('보여')) {
      return 'query';
    } else if (lowerQuery.includes('실행') || lowerQuery.includes('시작') || lowerQuery.includes('재시작')) {
      return 'action';
    } else if (lowerQuery.includes('분석') || lowerQuery.includes('비교')) {
      return 'analysis';
    } else if (lowerQuery.includes('설정') || lowerQuery.includes('변경')) {
      return 'configuration';
    }
    
    return 'general';
  }

  /**
   * 🇰🇷 한국어 비율 계산
   */
  calculateKoreanRatio(text: string): number {
    if (!text) return 0;

    const koreanChars = text.match(/[가-힣]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;

    if (totalChars === 0) return 0;

    return koreanChars.length / totalChars;
  }

  /**
   * 📊 캐시 상태 조회
   */
  getCacheStatus(): {
    size: number;
    hitRate: number;
    totalHits: number;
    totalRequests: number;
  } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.responseCache.values()) {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 for initial cache miss
    }

    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      size: this.responseCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits,
      totalRequests,
    };
  }

  /**
   * 🧹 캐시 클리어
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * 🔄 thinking step 생성 헬퍼
   */
  createThinkingStep(
    step: string,
    description?: string,
    status: 'pending' | 'completed' | 'failed' = 'pending'
  ): ThinkingStep {
    return {
      step,
      description,
      status,
      timestamp: Date.now(),
    };
  }

  /**
   * 📝 thinking step 업데이트 헬퍼
   */
  updateThinkingStep(
    thinkingStep: ThinkingStep,
    status: 'completed' | 'failed',
    description?: string
  ): void {
    thinkingStep.status = status;
    if (description) {
      thinkingStep.description = description;
    }
    thinkingStep.duration = Date.now() - thinkingStep.timestamp;
  }
}