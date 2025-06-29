import { InteractionLogger } from './logging/InteractionLogger';
import {
  QueryLogForAI,
  AIAnalysisRequest,
  UserInteractionLog,
} from '@/types/ai-learning';

export class AILogProcessor {
  private static instance: AILogProcessor;
  private interactionLogger: InteractionLogger;

  private constructor() {
    this.interactionLogger = InteractionLogger.getInstance();
  }

  public static getInstance(): AILogProcessor {
    if (!AILogProcessor.instance) {
      AILogProcessor.instance = new AILogProcessor();
    }
    return AILogProcessor.instance;
  }

  /**
   * 원본 로그를 AI 분석용 구조화된 로그로 변환
   */
  async convertToAILogs(
    originalLogs: UserInteractionLog[],
    options?: {
      maxQueryLength?: number;
      maxResponseLength?: number;
      maxContextLength?: number;
      includeFullText?: boolean;
    }
  ): Promise<QueryLogForAI[]> {
    const {
      maxQueryLength = 100,
      maxResponseLength = 200,
      maxContextLength = 50,
      includeFullText = false,
    } = options || {};

    return originalLogs.map(log => {
      const aiLog: QueryLogForAI = {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        query: this.summarizeText(log.query, maxQueryLength),
        response: this.summarizeText(log.response, maxResponseLength),
        intent: log.intent,
        confidence: log.confidence,
        responseTime: log.responseTime || 0,
        feedback: log.userFeedback || null,
        contextSummary: log.contextData
          ? this.summarizeContext(log.contextData, maxContextLength)
          : undefined,
        errorType: this.extractErrorType(log),
        priorityScore: this.calculatePriorityScore(log),
      };

      // 원본 전문 포함 (AI 분석 시 필요한 경우)
      if (includeFullText) {
        aiLog.fullQuery = log.query;
        aiLog.fullResponse = log.response;
      }

      return aiLog;
    });
  }

  /**
   * 분석 대상 로그 필터링 및 선별
   */
  async selectLogsForAnalysis(
    timeRange: { start: Date; end: Date },
    focusArea?:
      | 'low_confidence'
      | 'negative_feedback'
      | 'slow_response'
      | 'unclassified',
    limit: number = 1000
  ): Promise<QueryLogForAI[]> {
    try {
      console.log(
        `🔍 [AILogProcessor] 분석 대상 로그 선별 시작 (${focusArea || 'all'})`
      );

      // 원본 로그 조회
      const originalLogs = await this.interactionLogger.getInteractions({
        startDate: timeRange.start,
        endDate: timeRange.end,
        limit: limit * 2, // 필터링 후 줄어들 것을 고려
      });

      // 포커스 영역에 따른 필터링
      let filteredLogs = originalLogs;

      switch (focusArea) {
        case 'low_confidence':
          filteredLogs = originalLogs.filter(log => log.confidence < 0.7);
          break;
        case 'negative_feedback':
          filteredLogs = originalLogs.filter(
            log =>
              log.userFeedback === 'not_helpful' ||
              log.userFeedback === 'incorrect'
          );
          break;
        case 'slow_response':
          filteredLogs = originalLogs.filter(
            log => (log.responseTime || 0) > 3000
          );
          break;
        case 'unclassified':
          filteredLogs = originalLogs.filter(
            log => log.intent === 'unknown' || log.confidence < 0.5
          );
          break;
      }

      // 중요도 기준으로 정렬 (피드백 있는 것, 신뢰도 낮은 것 우선)
      filteredLogs.sort((a, b) => {
        const aScore = this.calculateLogImportance(a);
        const bScore = this.calculateLogImportance(b);
        return bScore - aScore;
      });

      // 제한된 수만큼 선택
      const selectedLogs = filteredLogs.slice(0, limit);

      // AI 분석용 형태로 변환
      const aiLogs = await this.convertToAILogs(selectedLogs);

      console.log(`✅ [AILogProcessor] ${aiLogs.length}개 로그 선별 완료`);
      return aiLogs;
    } catch (error) {
      console.error('❌ [AILogProcessor] 로그 선별 실패:', error);
      throw error;
    }
  }

  /**
   * AI 분석 요청 생성
   */
  createAnalysisRequest(
    analysisType: AIAnalysisRequest['analysisType'],
    logs: QueryLogForAI[],
    timeRange: { start: Date; end: Date },
    options?: {
      focusArea?: AIAnalysisRequest['focusArea'];
      maxTokens?: number;
      model?: AIAnalysisRequest['model'];
    }
  ): AIAnalysisRequest {
    return {
      analysisType,
      logs,
      timeRange: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
      },
      focusArea: options?.focusArea,
      maxTokens: options?.maxTokens || 4000,
      model: options?.model || 'gpt-4',
    };
  }

  /**
   * 토큰 수 추정
   */
  estimateTokenCount(request: AIAnalysisRequest): number {
    // 간단한 토큰 수 추정 (실제로는 더 정확한 토크나이저 사용)
    const textContent = JSON.stringify(request);
    return Math.ceil(textContent.length / 4); // 대략적인 추정
  }

  /**
   * 로그 배치 분할 (토큰 제한 고려)
   */
  splitLogsBatch(
    logs: QueryLogForAI[],
    maxTokensPerBatch: number = 3000
  ): QueryLogForAI[][] {
    const batches: QueryLogForAI[][] = [];
    let currentBatch: QueryLogForAI[] = [];
    let currentTokens = 0;

    for (const log of logs) {
      const logTokens = this.estimateLogTokens(log);

      if (
        currentTokens + logTokens > maxTokensPerBatch &&
        currentBatch.length > 0
      ) {
        batches.push(currentBatch);
        currentBatch = [log];
        currentTokens = logTokens;
      } else {
        currentBatch.push(log);
        currentTokens += logTokens;
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * 분석 결과 요약 생성
   */
  generateAnalysisSummary(logs: QueryLogForAI[], focusArea?: string): string {
    const totalLogs = logs.length;
    const withFeedback = logs.filter(log => log.feedback).length;
    const negativeFeedback = logs.filter(
      log => log.feedback === 'not_helpful' || log.feedback === 'incorrect'
    ).length;
    const lowConfidence = logs.filter(log => log.confidence < 0.7).length;
    const avgResponseTime =
      logs.reduce((sum, log) => sum + log.responseTime, 0) / totalLogs;

    const timeRange = {
      start: new Date(
        Math.min(...logs.map(log => new Date(log.timestamp).getTime()))
      ),
      end: new Date(
        Math.max(...logs.map(log => new Date(log.timestamp).getTime()))
      ),
    };

    return `분석 대상: ${totalLogs}개 로그 (${timeRange.start.toLocaleDateString()} ~ ${timeRange.end.toLocaleDateString()})
포커스 영역: ${focusArea || '전체'}
피드백 있음: ${withFeedback}개 (부정적: ${negativeFeedback}개)
낮은 신뢰도: ${lowConfidence}개
평균 응답시간: ${avgResponseTime.toFixed(0)}ms`;
  }

  // Private 헬퍼 메서드들
  private summarizeText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    // 문장 단위로 자르기 시도
    const sentences = text.split(/[.!?]\s+/);
    let result = '';

    for (const sentence of sentences) {
      if ((result + sentence).length > maxLength - 3) break;
      result += sentence + '. ';
    }

    if (result.length === 0) {
      // 문장 단위로 자를 수 없으면 단어 단위로
      const words = text.split(' ');
      for (const word of words) {
        if ((result + word).length > maxLength - 3) break;
        result += word + ' ';
      }
    }

    return result.trim() + (result.length < text.length ? '...' : '');
  }

  private summarizeContext(contextData: any, maxLength: number): string {
    try {
      const summary = [];

      if (contextData.serverState) {
        summary.push(`서버:${contextData.serverState.status || 'unknown'}`);
      }

      if (contextData.activeMetrics?.length > 0) {
        summary.push(
          `메트릭:${contextData.activeMetrics.slice(0, 2).join(',')}`
        );
      }

      if (contextData.timeOfDay) {
        summary.push(`시간:${contextData.timeOfDay}`);
      }

      const result = summary.join(' ');
      return this.summarizeText(result, maxLength);
    } catch (error) {
      return 'context_error';
    }
  }

  private extractErrorType(log: UserInteractionLog): string | undefined {
    if (log.confidence < 0.3) return 'very_low_confidence';
    if (log.confidence < 0.5) return 'low_confidence';
    if (log.userFeedback === 'incorrect') return 'incorrect_response';
    if (log.userFeedback === 'not_helpful') return 'not_helpful';
    if ((log.responseTime || 0) > 5000) return 'slow_response';
    if (log.intent === 'unknown') return 'unclassified_intent';

    return undefined;
  }

  private calculateLogImportance(log: UserInteractionLog): number {
    let score = 0;

    // 피드백이 있으면 중요도 증가
    if (log.userFeedback) score += 10;
    if (log.userFeedback === 'not_helpful' || log.userFeedback === 'incorrect')
      score += 20;

    // 낮은 신뢰도는 중요도 증가
    if (log.confidence < 0.5) score += 15;
    else if (log.confidence < 0.7) score += 10;

    // 느린 응답시간은 중요도 증가
    if ((log.responseTime || 0) > 5000) score += 10;
    else if ((log.responseTime || 0) > 3000) score += 5;

    // 분류되지 않은 의도는 중요도 증가
    if (log.intent === 'unknown') score += 15;

    // 최근 로그일수록 중요도 증가
    const daysSinceLog =
      (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLog < 1) score += 5;
    else if (daysSinceLog < 7) score += 3;

    return score;
  }

  private estimateLogTokens(log: QueryLogForAI): number {
    const text = JSON.stringify(log);
    return Math.ceil(text.length / 4);
  }

  /**
   * 로그의 개선 우선순위 점수 계산
   */
  private calculatePriorityScore(log: UserInteractionLog): number {
    let score = 0;

    // 피드백 기반 점수 (가장 중요)
    if (log.userFeedback === 'incorrect') score += 50;
    else if (log.userFeedback === 'not_helpful') score += 40;
    else if (log.userFeedback === 'helpful') score -= 10; // 성공 케이스는 우선순위 낮음

    // 신뢰도 기반 점수
    if (log.confidence < 0.3) score += 30;
    else if (log.confidence < 0.5) score += 20;
    else if (log.confidence < 0.7) score += 10;

    // 응답 시간 기반 점수
    const responseTime = log.responseTime || 0;
    if (responseTime > 5000) score += 15;
    else if (responseTime > 3000) score += 10;
    else if (responseTime > 1000) score += 5;

    // 인텐트 분류 실패
    if (log.intent === 'unknown' || log.intent === 'unclassified') score += 25;

    // 최근성 가중치 (최근 로그일수록 중요)
    const daysSinceLog =
      (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLog < 1) score += 10;
    else if (daysSinceLog < 3) score += 5;
    else if (daysSinceLog > 30) score -= 5; // 오래된 로그는 우선순위 낮음

    // 컨텍스트 데이터 부족
    if (!log.contextData || Object.keys(log.contextData).length === 0)
      score += 5;

    return Math.max(0, score); // 음수 방지
  }
}
