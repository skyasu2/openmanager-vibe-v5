import {
  UserInteractionLog,
  UserFeedback,
  FailurePattern,
  LogFilter,
  LearningMetrics,
} from '@/types/ai-learning';

export class InteractionLogger {
  private interactions: Map<string, UserInteractionLog> = new Map();
  private feedbacks: Map<string, UserFeedback> = new Map();
  private static instance: InteractionLogger;

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): InteractionLogger {
    if (!InteractionLogger.instance) {
      InteractionLogger.instance = new InteractionLogger();
    }
    return InteractionLogger.instance;
  }

  /**
   * 사용자 상호작용 로깅
   */
  async logInteraction(
    interaction: Omit<UserInteractionLog, 'id' | 'timestamp'>
  ): Promise<string> {
    const id = this.generateId();
    const logEntry: UserInteractionLog = {
      ...interaction,
      id,
      timestamp: new Date(),
    };

    this.interactions.set(id, logEntry);

    // 콘솔 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [InteractionLogger] 새로운 상호작용 로깅:', {
        id,
        query: interaction.query.substring(0, 50) + '...',
        intent: interaction.intent,
        confidence: interaction.confidence,
        responseTime: interaction.responseTime,
      });
    }

    // 로컬 스토리지에 저장 (브라우저 환경)
    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }

    return id;
  }

  /**
   * 사용자 피드백 기록
   */
  async logFeedback(feedback: UserFeedback): Promise<void> {
    this.feedbacks.set(feedback.interactionId, feedback);

    // 해당 상호작용에 피드백 업데이트
    const interaction = this.interactions.get(feedback.interactionId);
    if (interaction) {
      interaction.userFeedback = feedback.feedback;
      this.interactions.set(feedback.interactionId, interaction);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('👍 [InteractionLogger] 피드백 기록:', {
        interactionId: feedback.interactionId,
        feedback: feedback.feedback,
        reason: feedback.detailedReason,
      });
    }

    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }
  }

  /**
   * 상호작용 히스토리 조회
   */
  async getInteractionHistory(
    filters?: LogFilter
  ): Promise<UserInteractionLog[]> {
    let interactions = Array.from(this.interactions.values());

    if (filters) {
      interactions = this.applyFilters(interactions, filters);
    }

    // 최신순 정렬
    return interactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * 상호작용 조회 (날짜 범위 필터 포함)
   */
  async getInteractions(filters?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<UserInteractionLog[]> {
    let interactions = Array.from(this.interactions.values());

    if (filters) {
      if (filters.startDate) {
        interactions = interactions.filter(
          i => i.timestamp >= filters.startDate!
        );
      }
      if (filters.endDate) {
        interactions = interactions.filter(
          i => i.timestamp <= filters.endDate!
        );
      }
    }

    // 최신순 정렬
    interactions = interactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // 제한된 수만큼 반환
    if (filters?.limit) {
      interactions = interactions.slice(0, filters.limit);
    }

    return interactions;
  }

  /**
   * 실패 패턴 분석
   */
  async getFailurePatterns(): Promise<FailurePattern[]> {
    const negativeInteractions = Array.from(this.interactions.values()).filter(
      interaction =>
        interaction.userFeedback === 'not_helpful' ||
        interaction.userFeedback === 'incorrect' ||
        interaction.confidence < 0.6
    );

    const patternMap = new Map<string, FailurePattern>();

    negativeInteractions.forEach(interaction => {
      const pattern = this.extractPattern(interaction.query);
      const existing = patternMap.get(pattern);

      if (existing) {
        existing.frequency++;
        existing.commonQueries.push(interaction.query);
        if (interaction.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = interaction.timestamp;
        }
      } else {
        patternMap.set(pattern, {
          id: this.generateId(),
          pattern,
          frequency: 1,
          commonQueries: [interaction.query],
          suggestedImprovement: this.generateImprovement(pattern),
          confidence: this.calculatePatternConfidence([interaction]),
          lastOccurrence: interaction.timestamp,
        });
      }
    });

    return Array.from(patternMap.values()).sort(
      (a, b) => b.frequency - a.frequency
    );
  }

  /**
   * 학습 메트릭 계산
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    const interactions = Array.from(this.interactions.values());
    const totalInteractions = interactions.length;

    if (totalInteractions === 0) {
      return {
        totalInteractions: 0,
        successRate: 0,
        averageResponseTime: 0,
        userSatisfactionScore: 0,
        patternCoverage: 0,
        newPatternsDiscovered: 0,
        improvementsImplemented: 0,
        lastUpdated: new Date(),
      };
    }

    const successfulInteractions = interactions.filter(
      i => i.userFeedback === 'helpful'
    ).length;
    const successRate = (successfulInteractions / totalInteractions) * 100;

    const averageResponseTime =
      interactions.reduce((sum, i) => sum + i.responseTime, 0) /
      totalInteractions;

    const feedbackInteractions = interactions.filter(i => i.userFeedback);
    const helpfulCount = feedbackInteractions.filter(
      i => i.userFeedback === 'helpful'
    ).length;
    const userSatisfactionScore =
      feedbackInteractions.length > 0
        ? (helpfulCount / feedbackInteractions.length) * 100
        : 0;

    return {
      totalInteractions,
      successRate,
      averageResponseTime,
      userSatisfactionScore,
      patternCoverage: this.calculatePatternCoverage(interactions),
      newPatternsDiscovered: this.countNewPatterns(interactions),
      improvementsImplemented: 0, // 추후 구현
      lastUpdated: new Date(),
    };
  }

  /**
   * 데이터 내보내기 (CSV 형식)
   */
  async exportData(): Promise<string> {
    const interactions = Array.from(this.interactions.values());
    const headers = [
      'ID',
      'Timestamp',
      'Query',
      'Intent',
      'Confidence',
      'Response',
      'UserFeedback',
      'ResponseTime',
      'ServerState',
    ];

    const csvData = [
      headers.join(','),
      ...interactions.map(interaction =>
        [
          interaction.id,
          interaction.timestamp.toISOString(),
          `"${interaction.query.replace(/"/g, '""')}"`,
          interaction.intent,
          interaction.confidence,
          `"${interaction.response.substring(0, 100).replace(/"/g, '""')}"`,
          interaction.userFeedback || '',
          interaction.responseTime,
          JSON.stringify(interaction.contextData.serverState),
        ].join(',')
      ),
    ];

    return csvData.join('\n');
  }

  /**
   * 로컬 스토리지에 데이터 저장
   */
  private saveToLocalStorage(): void {
    try {
      const data = {
        interactions: Array.from(this.interactions.entries()),
        feedbacks: Array.from(this.feedbacks.entries()),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem('ai-learning-data', JSON.stringify(data));
    } catch (error) {
      console.warn('로컬 스토리지 저장 실패:', error);
    }
  }

  /**
   * 로컬 스토리지에서 데이터 로드
   */
  public loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('ai-learning-data');
      if (data) {
        const parsed = JSON.parse(data);
        this.interactions = new Map(parsed.interactions);
        this.feedbacks = new Map(parsed.feedbacks);

        console.log('📚 [InteractionLogger] 로컬 데이터 로드 완료:', {
          interactions: this.interactions.size,
          feedbacks: this.feedbacks.size,
        });
      }
    } catch (error) {
      console.warn('로컬 스토리지 로드 실패:', error);
    }
  }

  // 유틸리티 메서드들
  private generateId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyFilters(
    interactions: UserInteractionLog[],
    filters: LogFilter
  ): UserInteractionLog[] {
    return interactions.filter(interaction => {
      if (filters.startDate && interaction.timestamp < filters.startDate)
        return false;
      if (filters.endDate && interaction.timestamp > filters.endDate)
        return false;
      if (filters.intent && interaction.intent !== filters.intent) return false;
      if (filters.confidence) {
        if (
          interaction.confidence < filters.confidence.min ||
          interaction.confidence > filters.confidence.max
        )
          return false;
      }
      if (filters.feedback && interaction.userFeedback !== filters.feedback)
        return false;
      if (filters.userId && interaction.userId !== filters.userId) return false;
      return true;
    });
  }

  private extractPattern(query: string): string {
    // 간단한 패턴 추출 (키워드 기반)
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

    return keywords.slice(0, 3).join('_');
  }

  private generateImprovement(pattern: string): string {
    return `패턴 "${pattern}"에 대한 응답 템플릿 개선 필요`;
  }

  private calculatePatternConfidence(
    interactions: UserInteractionLog[]
  ): number {
    const avgConfidence =
      interactions.reduce((sum, i) => sum + i.confidence, 0) /
      interactions.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private calculatePatternCoverage(interactions: UserInteractionLog[]): number {
    const uniquePatterns = new Set(
      interactions.map(i => this.extractPattern(i.query))
    );
    // 예상 패턴 수 대비 커버리지 (임시로 100개 기준)
    return Math.min((uniquePatterns.size / 100) * 100, 100);
  }

  private countNewPatterns(interactions: UserInteractionLog[]): number {
    // 최근 7일간 새로 발견된 패턴 수
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentInteractions = interactions.filter(i => i.timestamp > weekAgo);
    const recentPatterns = new Set(
      recentInteractions.map(i => this.extractPattern(i.query))
    );
    return recentPatterns.size;
  }
}
