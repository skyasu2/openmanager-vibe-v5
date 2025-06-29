import { InteractionLogger } from './logging/InteractionLogger';
import { AILogProcessor } from './AILogProcessor';
import {
  QueryLogForAI,
  FailurePriority,
  QueryGroup,
  UserInteractionLog,
} from '@/types/ai-learning';

/**
 * 실패 로그 우선순위 분석 및 유사 질의 그룹핑 서비스
 */
export class FailurePriorityAnalyzer {
  private static instance: FailurePriorityAnalyzer;
  private interactionLogger: InteractionLogger;
  private logProcessor: AILogProcessor;

  private constructor() {
    this.interactionLogger = InteractionLogger.getInstance();
    this.logProcessor = AILogProcessor.getInstance();
  }

  public static getInstance(): FailurePriorityAnalyzer {
    if (!FailurePriorityAnalyzer.instance) {
      FailurePriorityAnalyzer.instance = new FailurePriorityAnalyzer();
    }
    return FailurePriorityAnalyzer.instance;
  }

  /**
   * 우선 검토가 필요한 실패 로그 조회
   */
  async getTopFailuresForReview(
    timeRange: { start: Date; end: Date },
    limit: number = 50
  ): Promise<FailurePriority[]> {
    try {
      console.log(`🔍 [FailurePriorityAnalyzer] 우선순위 실패 로그 분석 시작`);

      // 실패 로그 조회 (부정적 피드백 또는 낮은 신뢰도)
      const allLogs = await this.interactionLogger.getInteractions({
        startDate: timeRange.start,
        endDate: timeRange.end,
        limit: limit * 3, // 충분한 데이터 확보
      });

      const failureLogs = allLogs.filter(
        log =>
          log.userFeedback === 'not_helpful' ||
          log.userFeedback === 'incorrect' ||
          log.confidence < 0.6 ||
          log.intent === 'unknown'
      );

      // AI 로그로 변환 (우선순위 점수 포함)
      const aiLogs = await this.logProcessor.convertToAILogs(failureLogs);

      // 우선순위 분석 결과 생성
      const priorities = aiLogs.map(log =>
        this.createFailurePriority(log, allLogs)
      );

      // 우선순위 점수 기준 정렬
      priorities.sort((a, b) => b.priorityScore - a.priorityScore);

      console.log(
        `✅ [FailurePriorityAnalyzer] ${priorities.length}개 우선순위 분석 완료`
      );
      return priorities.slice(0, limit);
    } catch (error) {
      console.error('❌ [FailurePriorityAnalyzer] 우선순위 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 유사 질의 자동 그룹핑
   */
  async groupSimilarQueries(
    logs: QueryLogForAI[],
    similarityThreshold: number = 0.7
  ): Promise<QueryGroup[]> {
    try {
      console.log(
        `🔗 [FailurePriorityAnalyzer] 유사 질의 그룹핑 시작 (${logs.length}개)`
      );

      const groups = new Map<string, QueryGroup>();
      const processedLogs = new Set<string>();

      for (const log of logs) {
        if (processedLogs.has(log.id)) continue;

        // 기존 그룹과의 유사도 검사
        let assignedGroup: QueryGroup | null = null;

        for (const group of groups.values()) {
          if (
            this.calculateQuerySimilarity(
              log.query,
              group.representativeQuery
            ) >= similarityThreshold
          ) {
            assignedGroup = group;
            break;
          }
        }

        if (assignedGroup) {
          // 기존 그룹에 추가
          assignedGroup.queries.push(log);
          assignedGroup.totalCount++;

          // 그룹 통계 업데이트
          this.updateGroupStatistics(assignedGroup);

          // 그룹 ID 할당
          log.groupId = assignedGroup.id;
        } else {
          // 새 그룹 생성
          const newGroup: QueryGroup = {
            id: this.generateGroupId(),
            intent: log.intent,
            representativeQuery: log.query,
            queries: [log],
            commonPatterns: this.extractCommonPatterns([log.query]),
            failureRate: 0,
            totalCount: 1,
            avgConfidence: log.confidence,
            suggestedImprovement: this.generateGroupImprovement(log),
          };

          groups.set(newGroup.id, newGroup);
          log.groupId = newGroup.id;
        }

        processedLogs.add(log.id);
      }

      // 최종 그룹 통계 계산
      const finalGroups = Array.from(groups.values()).map(group => {
        this.updateGroupStatistics(group);
        return group;
      });

      // 실패율 기준 정렬
      finalGroups.sort((a, b) => b.failureRate - a.failureRate);

      console.log(
        `✅ [FailurePriorityAnalyzer] ${finalGroups.length}개 그룹 생성 완료`
      );
      return finalGroups;
    } catch (error) {
      console.error('❌ [FailurePriorityAnalyzer] 그룹핑 실패:', error);
      throw error;
    }
  }

  /**
   * 그룹별 개선 제안 생성
   */
  generateGroupImprovements(groups: QueryGroup[]): Array<{
    groupId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    suggestions: string[];
    estimatedImpact: number;
  }> {
    return groups.map(group => {
      const priority = this.calculateGroupPriority(group);
      const suggestions = this.generateGroupSuggestions(group);
      const estimatedImpact = this.calculateGroupImpact(group);

      return {
        groupId: group.id,
        priority,
        suggestions,
        estimatedImpact,
      };
    });
  }

  // Private 헬퍼 메서드들
  private createFailurePriority(
    log: QueryLogForAI,
    allLogs: UserInteractionLog[]
  ): FailurePriority {
    const reasons = this.analyzeFailureReasons(log);
    const urgencyLevel = this.calculateUrgencyLevel(log.priorityScore || 0);
    const failureCount = this.countSimilarFailures(log, allLogs);

    return {
      logId: log.id,
      priorityScore: log.priorityScore || 0,
      reasons,
      urgencyLevel,
      estimatedImpact: this.calculateEstimatedImpact(log),
      failureCount,
      lastFailure: log.timestamp,
    };
  }

  private analyzeFailureReasons(log: QueryLogForAI): string[] {
    const reasons: string[] = [];

    if (log.feedback === 'incorrect') reasons.push('부정확한 응답');
    if (log.feedback === 'not_helpful') reasons.push('도움이 되지 않는 응답');
    if (log.confidence < 0.5) reasons.push('낮은 신뢰도');
    if (log.responseTime > 3000) reasons.push('느린 응답 시간');
    if (log.intent === 'unknown') reasons.push('인텐트 분류 실패');
    if (log.errorType) reasons.push(`오류 유형: ${log.errorType}`);

    return reasons;
  }

  private calculateUrgencyLevel(
    priorityScore: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (priorityScore >= 80) return 'critical';
    if (priorityScore >= 60) return 'high';
    if (priorityScore >= 40) return 'medium';
    return 'low';
  }

  private calculateEstimatedImpact(log: QueryLogForAI): number {
    let impact = 20; // 기본 영향도

    if (log.feedback === 'incorrect') impact += 40;
    if (log.feedback === 'not_helpful') impact += 30;
    if (log.confidence < 0.3) impact += 30;
    if (log.intent === 'unknown') impact += 25;

    return Math.min(100, impact);
  }

  private countSimilarFailures(
    log: QueryLogForAI,
    allLogs: UserInteractionLog[]
  ): number {
    return allLogs.filter(
      otherLog =>
        otherLog.intent === log.intent &&
        (otherLog.userFeedback === 'not_helpful' ||
          otherLog.userFeedback === 'incorrect')
    ).length;
  }

  private calculateQuerySimilarity(query1: string, query2: string): number {
    // 간단한 유사도 계산 (실제로는 더 정교한 NLP 기법 사용 가능)
    const words1 = this.extractKeywords(query1);
    const words2 = this.extractKeywords(query2);

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(
        word =>
          ![
            '은',
            '는',
            '이',
            '가',
            '을',
            '를',
            '의',
            '에',
            '서',
            '로',
            '와',
            '과',
          ].includes(word)
      );
  }

  private extractCommonPatterns(queries: string[]): string[] {
    const patterns = new Set<string>();

    queries.forEach(query => {
      const keywords = this.extractKeywords(query);
      keywords.forEach(keyword => patterns.add(keyword));
    });

    return Array.from(patterns).slice(0, 5); // 상위 5개 패턴
  }

  private updateGroupStatistics(group: QueryGroup): void {
    const queries = group.queries;

    // 평균 신뢰도 계산
    group.avgConfidence =
      queries.reduce((sum, q) => sum + q.confidence, 0) / queries.length;

    // 실패율 계산
    const failureCount = queries.filter(
      q =>
        q.feedback === 'not_helpful' ||
        q.feedback === 'incorrect' ||
        q.confidence < 0.6
    ).length;
    group.failureRate = failureCount / queries.length;

    // 공통 패턴 업데이트
    group.commonPatterns = this.extractCommonPatterns(
      queries.map(q => q.query)
    );
  }

  private generateGroupImprovement(log: QueryLogForAI): string {
    if (log.confidence < 0.5) {
      return `"${log.intent}" 인텐트의 패턴 매칭 정확도 개선 필요`;
    }
    if (log.feedback === 'not_helpful') {
      return `"${log.intent}" 인텐트의 응답 템플릿 개선 필요`;
    }
    if (log.intent === 'unknown') {
      return '새로운 인텐트 정의 및 패턴 추가 필요';
    }
    return '일반적인 응답 품질 개선 필요';
  }

  private calculateGroupPriority(
    group: QueryGroup
  ): 'critical' | 'high' | 'medium' | 'low' {
    const score =
      group.failureRate * 100 +
      (1 - group.avgConfidence) * 50 +
      group.totalCount * 5;

    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateGroupSuggestions(group: QueryGroup): string[] {
    const suggestions: string[] = [];

    if (group.failureRate > 0.5) {
      suggestions.push(`${group.intent} 인텐트의 패턴 매칭 규칙 재검토`);
    }

    if (group.avgConfidence < 0.7) {
      suggestions.push(
        `${group.intent} 인텐트의 신뢰도 개선을 위한 추가 패턴 정의`
      );
    }

    if (group.totalCount > 10) {
      suggestions.push(
        `고빈도 질의 "${group.representativeQuery}"에 대한 전용 응답 템플릿 개발`
      );
    }

    suggestions.push(
      `공통 패턴 "${group.commonPatterns.join(', ')}" 활용한 정규식 최적화`
    );

    return suggestions;
  }

  private calculateGroupImpact(group: QueryGroup): number {
    return Math.min(
      100,
      group.failureRate * 60 +
        group.totalCount * 2 +
        (1 - group.avgConfidence) * 30
    );
  }

  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}
