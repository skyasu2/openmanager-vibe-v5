/**
 * 🤖 Gemini 기반 실패 분석 및 컨텍스트 보강 엔진
 *
 * ✅ Google AI Studio (Gemini) 무료 티어 최적화
 * ✅ 실패 로그 분석 → 문서 개선 제안
 * ✅ 할당량 관리 및 배치 처리
 * ✅ 관리자 승인 기반 제안 시스템
 */

import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import { ContextUpdateEngine, ContextUpdate } from './ContextUpdateEngine';
import { UserInteractionLog } from '@/types/ai-learning';

export interface GeminiLearningConfig {
  enabled: boolean;
  batchSize: number; // 한 번에 처리할 실패 로그 수
  requestInterval: number; // 요청 간격 (초)
  maxDailyRequests: number; // 일일 최대 요청 수
  confidenceThreshold: number; // 제안 생성 임계값
  requireAdminApproval: boolean; // 관리자 승인 필수
}

export interface FailureAnalysisRequest {
  query: string;
  response: string;
  confidence: number;
  userFeedback?: string;
  errorType?: string;
  contextData?: any;
}

export interface ContextSuggestion {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'pattern' | 'template' | 'knowledge';
  confidence: number;
  reasoning: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImprovement: number;
  sourceLogIds: string[];
  timestamp: Date;
}

export class GeminiLearningEngine {
  private static instance: GeminiLearningEngine;
  private config: GeminiLearningConfig;
  private googleAI: GoogleAIService;
  private interactionLogger: InteractionLogger;
  private contextEngine: ContextUpdateEngine;
  private requestCount = { daily: 0, lastReset: new Date() };
  private pendingSuggestions: Map<string, ContextSuggestion> = new Map();

  private constructor(config?: Partial<GeminiLearningConfig>) {
    this.config = {
      enabled: process.env.GEMINI_LEARNING_ENABLED === 'true',
      batchSize: 5, // 한 번에 5개 실패 로그 처리
      requestInterval: 10, // 10초 간격
      maxDailyRequests: 100, // 하루 100회 제한
      confidenceThreshold: 0.7,
      requireAdminApproval: true,
      ...config,
    };

    this.googleAI = new GoogleAIService();
    this.interactionLogger = InteractionLogger.getInstance();
    this.contextEngine = ContextUpdateEngine.getInstance();
  }

  public static getInstance(
    config?: Partial<GeminiLearningConfig>
  ): GeminiLearningEngine {
    if (!GeminiLearningEngine.instance) {
      GeminiLearningEngine.instance = new GeminiLearningEngine(config);
    }
    return GeminiLearningEngine.instance;
  }

  /**
   * 🔄 주기적 실패 로그 분석 및 컨텍스트 보강 제안
   */
  public async runPeriodicAnalysis(): Promise<ContextSuggestion[]> {
    if (!this.config.enabled) {
      console.log(
        '🔒 [GeminiLearningEngine] 학습 엔진이 비활성화되어 있습니다.'
      );
      return [];
    }

    if (!this.canMakeRequest()) {
      console.log(
        '⏳ [GeminiLearningEngine] 일일 할당량 초과 또는 요청 간격 미충족'
      );
      return [];
    }

    try {
      console.log('🚀 [GeminiLearningEngine] 주기적 실패 분석 시작...');

      // 1. 최근 실패 로그 가져오기
      const failureLogs = await this.getUnanalyzedFailureLogs();

      if (failureLogs.length === 0) {
        console.log('📊 [GeminiLearningEngine] 분석할 실패 로그가 없습니다.');
        return [];
      }

      console.log(
        `📋 [GeminiLearningEngine] ${failureLogs.length}개의 실패 로그 발견`
      );

      // 2. 배치로 나누어 처리
      const batches = this.splitIntoBatches(failureLogs, this.config.batchSize);
      const allSuggestions: ContextSuggestion[] = [];

      for (const batch of batches) {
        if (!this.canMakeRequest()) break;

        const suggestions = await this.analyzeBatch(batch);
        allSuggestions.push(...suggestions);

        // 요청 간격 준수
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.sleep(this.config.requestInterval * 1000);
        }
      }

      // 3. 제안을 컨텍스트 엔진에 등록 (관리자 승인 대기)
      for (const suggestion of allSuggestions) {
        await this.submitSuggestionForApproval(suggestion);
      }

      console.log(
        `✅ [GeminiLearningEngine] ${allSuggestions.length}개의 컨텍스트 개선 제안 생성 완료`
      );
      return allSuggestions;
    } catch (error) {
      console.error('❌ [GeminiLearningEngine] 주기적 분석 실패:', error);
      return [];
    }
  }

  /**
   * 📊 단일 실패 로그 분석
   */
  public async analyzeSingleFailure(
    log: UserInteractionLog
  ): Promise<ContextSuggestion | null> {
    if (!this.config.enabled || !this.canMakeRequest()) {
      return null;
    }

    try {
      const request: FailureAnalysisRequest = {
        query: log.query,
        response: log.response,
        confidence: log.confidence,
        userFeedback: log.userFeedback,
        contextData: log.contextData,
      };

      const suggestion = await this.generateContextSuggestion([request]);

      if (
        suggestion &&
        suggestion.confidence >= this.config.confidenceThreshold
      ) {
        await this.submitSuggestionForApproval(suggestion);
        return suggestion;
      }

      return null;
    } catch (error) {
      console.error('❌ [GeminiLearningEngine] 단일 실패 분석 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 분석되지 않은 실패 로그 조회
   */
  private async getUnanalyzedFailureLogs(): Promise<UserInteractionLog[]> {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간 이내

    const allLogs = await this.interactionLogger.getInteractions({
      startDate: cutoffDate,
      endDate: new Date(),
    });

    // 실패로 간주되는 조건
    return allLogs.filter(
      log =>
        log.confidence < 0.6 ||
        log.userFeedback === 'not_helpful' ||
        log.userFeedback === 'incorrect' ||
        log.intent === 'unknown'
    );
  }

  /**
   * 📦 배치 분석
   */
  private async analyzeBatch(
    logs: UserInteractionLog[]
  ): Promise<ContextSuggestion[]> {
    try {
      console.log(
        `🔍 [GeminiLearningEngine] ${logs.length}개 로그 배치 분석 중...`
      );

      const requests: FailureAnalysisRequest[] = logs.map(log => ({
        query: log.query,
        response: log.response,
        confidence: log.confidence,
        userFeedback: log.userFeedback,
        contextData: log.contextData,
      }));

      const suggestion = await this.generateContextSuggestion(requests);

      if (
        suggestion &&
        suggestion.confidence >= this.config.confidenceThreshold
      ) {
        suggestion.sourceLogIds = logs.map(log => log.id);
        return [suggestion];
      }

      return [];
    } catch (error) {
      console.error('❌ [GeminiLearningEngine] 배치 분석 실패:', error);
      return [];
    }
  }

  /**
   * 🤖 Gemini API로 컨텍스트 제안 생성
   */
  private async generateContextSuggestion(
    requests: FailureAnalysisRequest[]
  ): Promise<ContextSuggestion | null> {
    try {
      const prompt = this.buildAnalysisPrompt(requests);

      this.incrementRequestCount();

      const response = await this.googleAI.generateContent(prompt);

      if (!response.success) {
        throw new Error('Gemini API 호출 실패');
      }

      const suggestion = this.parseGeminiResponse(response.content);

      if (suggestion) {
        suggestion.id = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        suggestion.timestamp = new Date();
      }

      return suggestion;
    } catch (error) {
      console.error('❌ [GeminiLearningEngine] Gemini 제안 생성 실패:', error);
      return null;
    }
  }

  /**
   * 📝 Gemini용 분석 프롬프트 구성
   */
  private buildAnalysisPrompt(requests: FailureAnalysisRequest[]): string {
    const failureContext = requests
      .map(
        (req, idx) => `
실패 케이스 ${idx + 1}:
- 질문: "${req.query}"
- AI 응답: "${req.response}"
- 신뢰도: ${req.confidence}
- 사용자 피드백: ${req.userFeedback || '없음'}
- 오류 유형: ${req.errorType || '불명'}
`
      )
      .join('\n');

    return `
당신은 AI 시스템 개선 전문가입니다. 다음 실패 케이스들을 분석하여 컨텍스트 개선 제안을 해주세요.

**실패 케이스 분석:**
${failureContext}

**요청사항:**
위 실패 케이스들을 종합적으로 분석하여, 향후 유사한 질문에 더 나은 답변을 제공할 수 있도록 하는 컨텍스트 개선 제안을 다음 JSON 형식으로 제공해주세요:

{
  "title": "개선 제안 제목",
  "content": "구체적인 문서/패턴/템플릿 내용",
  "type": "document|pattern|template|knowledge",
  "confidence": 0.0-1.0,
  "reasoning": "왜 이 개선이 필요한지 상세 설명",
  "priority": "critical|high|medium|low", 
  "estimatedImprovement": 0.0-1.0
}

**분석 기준:**
1. 실패의 근본 원인 파악
2. 누락된 지식/패턴 식별
3. 재발 방지를 위한 구체적 제안
4. 개선 효과 예측

응답은 반드시 유효한 JSON 형태로만 제공해주세요.
`;
  }

  /**
   * 🔍 Gemini 응답 파싱
   */
  private parseGeminiResponse(content: string): ContextSuggestion | null {
    try {
      // JSON 부분만 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없음');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 필수 필드 검증
      const required = ['title', 'content', 'type', 'confidence', 'reasoning'];
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`필수 필드 누락: ${field}`);
        }
      }

      return {
        id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: parsed.title,
        content: parsed.content,
        type: parsed.type,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        reasoning: parsed.reasoning,
        priority: parsed.priority || 'medium',
        estimatedImprovement: Math.max(
          0,
          Math.min(1, parsed.estimatedImprovement || 0.5)
        ),
        sourceLogIds: [],
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ [GeminiLearningEngine] Gemini 응답 파싱 실패:', error);
      return null;
    }
  }

  /**
   * 📝 제안을 관리자 승인 시스템에 등록
   */
  private async submitSuggestionForApproval(
    suggestion: ContextSuggestion
  ): Promise<void> {
    try {
      const contextUpdate: ContextUpdate = {
        id: suggestion.id,
        type: this.mapSuggestionTypeToContextType(suggestion.type),
        content: JSON.stringify({
          title: suggestion.title,
          content: suggestion.content,
          reasoning: suggestion.reasoning,
          priority: suggestion.priority,
          estimatedImprovement: suggestion.estimatedImprovement,
          sourceLogIds: suggestion.sourceLogIds,
        }),
        confidence: suggestion.confidence,
        source: 'learning',
        timestamp: suggestion.timestamp,
        status: 'pending_admin_approval',
        metadata: {
          geminiGenerated: true,
          priority: suggestion.priority,
          estimatedImprovement: suggestion.estimatedImprovement,
          sourceLogCount: suggestion.sourceLogIds.length,
        },
      };

      this.pendingSuggestions.set(suggestion.id, suggestion);

      console.log(
        `📝 [GeminiLearningEngine] 제안 등록: ${suggestion.title} (신뢰도: ${suggestion.confidence})`
      );
    } catch (error) {
      console.error('❌ [GeminiLearningEngine] 제안 등록 실패:', error);
    }
  }

  /**
   * 🔄 타입 매핑
   */
  private mapSuggestionTypeToContextType(type: string): ContextUpdate['type'] {
    const mapping: Record<string, ContextUpdate['type']> = {
      document: 'knowledge_base',
      pattern: 'pattern_addition',
      template: 'response_template',
      knowledge: 'knowledge_base',
    };
    return mapping[type] || 'knowledge_base';
  }

  /**
   * ⏱️ 할당량 관리
   */
  private canMakeRequest(): boolean {
    this.resetDailyCountIfNeeded();
    return this.requestCount.daily < this.config.maxDailyRequests;
  }

  private incrementRequestCount(): void {
    this.resetDailyCountIfNeeded();
    this.requestCount.daily++;
  }

  private resetDailyCountIfNeeded(): void {
    const now = new Date();
    const lastReset = this.requestCount.lastReset;

    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      this.requestCount.daily = 0;
      this.requestCount.lastReset = now;
    }
  }

  /**
   * 🛠️ 유틸리티 메서드
   */
  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 학습 엔진 상태 조회
   */
  public getStatus() {
    return {
      enabled: this.config.enabled,
      dailyRequestCount: this.requestCount.daily,
      maxDailyRequests: this.config.maxDailyRequests,
      remainingRequests: this.config.maxDailyRequests - this.requestCount.daily,
      pendingSuggestions: this.pendingSuggestions.size,
      lastReset: this.requestCount.lastReset,
      config: {
        batchSize: this.config.batchSize,
        requestInterval: this.config.requestInterval,
        confidenceThreshold: this.config.confidenceThreshold,
      },
    };
  }

  /**
   * 📋 대기 중인 제안 조회
   */
  public getPendingSuggestions(): ContextSuggestion[] {
    return Array.from(this.pendingSuggestions.values());
  }
}
