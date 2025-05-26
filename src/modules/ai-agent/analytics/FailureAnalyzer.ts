import { 
  UserInteractionLog, 
  FailurePattern, 
  AnalysisResult, 
  PatternAnalysis,
  QuestionType 
} from '@/types/ai-learning';

export interface FailureAnalysisConfig {
  lowConfidenceThreshold: number;
  minPatternFrequency: number;
  analysisTimeWindow: number; // days
  maxPatternsToAnalyze: number;
}

export interface QuestionGroup {
  id: string;
  pattern: string;
  questions: string[];
  frequency: number;
  averageConfidence: number;
  commonKeywords: string[];
  suggestedCategory: string;
}

export class FailureAnalyzer {
  private config: FailureAnalysisConfig;

  constructor(config?: Partial<FailureAnalysisConfig>) {
    this.config = {
      lowConfidenceThreshold: 0.6,
      minPatternFrequency: 3,
      analysisTimeWindow: 30,
      maxPatternsToAnalyze: 50,
      ...config
    };
  }

  /**
   * 낮은 신뢰도 응답 분석
   */
  async analyzeLowConfidenceResponses(interactions: UserInteractionLog[]): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    // 분석 기간 필터링
    const cutoffDate = new Date(Date.now() - this.config.analysisTimeWindow * 24 * 60 * 60 * 1000);
    const recentInteractions = interactions.filter(i => i.timestamp > cutoffDate);
    
    // 낮은 신뢰도 상호작용 필터링
    const lowConfidenceInteractions = recentInteractions.filter(
      i => i.confidence < this.config.lowConfidenceThreshold
    );

    const totalInteractions = recentInteractions.length;
    const lowConfidenceCount = lowConfidenceInteractions.length;
    const averageConfidence = recentInteractions.reduce((sum, i) => sum + i.confidence, 0) / totalInteractions;

    // 실패 패턴 추출
    const failurePatterns = this.extractFailurePatterns(lowConfidenceInteractions);
    
    // 개선 권장사항 생성
    const recommendedActions = this.generateRecommendations(failurePatterns, lowConfidenceInteractions);

    const processingTime = Date.now() - startTime;
    
    console.log(`🔍 [FailureAnalyzer] 낮은 신뢰도 분석 완료 (${processingTime}ms):`, {
      totalInteractions,
      lowConfidenceCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      patternsFound: failurePatterns.length
    });

    return {
      totalInteractions,
      lowConfidenceCount,
      averageConfidence,
      commonFailurePatterns: failurePatterns,
      recommendedActions,
      analysisDate: new Date()
    };
  }

  /**
   * 부정적 피드백 패턴 분석
   */
  async analyzeNegativeFeedbackPatterns(interactions: UserInteractionLog[]): Promise<PatternAnalysis> {
    const negativeInteractions = interactions.filter(
      i => i.userFeedback === 'not_helpful' || i.userFeedback === 'incorrect'
    );

    if (negativeInteractions.length === 0) {
      return {
        negativePatterns: [],
        improvementOpportunities: [],
        priorityLevel: 'low',
        estimatedImpact: 0
      };
    }

    // 부정적 피드백 패턴 추출
    const negativePatterns = this.extractFailurePatterns(negativeInteractions);
    
    // 개선 기회 식별
    const improvementOpportunities = this.identifyImprovementOpportunities(negativeInteractions);
    
    // 우선순위 계산
    const priorityLevel = this.calculatePriorityLevel(negativePatterns);
    
    // 예상 개선 효과 계산
    const estimatedImpact = this.calculateEstimatedImpact(negativeInteractions, interactions);

    console.log(`📊 [FailureAnalyzer] 부정적 피드백 분석 완료:`, {
      negativeInteractions: negativeInteractions.length,
      patternsFound: negativePatterns.length,
      opportunities: improvementOpportunities.length,
      priorityLevel,
      estimatedImpact
    });

    return {
      negativePatterns,
      improvementOpportunities,
      priorityLevel,
      estimatedImpact
    };
  }

  /**
   * 미처리 질문 유형 식별
   */
  async identifyUnhandledQuestionTypes(interactions: UserInteractionLog[]): Promise<QuestionType[]> {
    // 낮은 신뢰도 또는 부정적 피드백을 받은 질문들
    const problematicInteractions = interactions.filter(
      i => i.confidence < this.config.lowConfidenceThreshold || 
           i.userFeedback === 'not_helpful' || 
           i.userFeedback === 'incorrect'
    );

    // 질문 그룹핑
    const questionGroups = this.groupSimilarQuestions(problematicInteractions.map(i => i.query));
    
    // QuestionType으로 변환
    const questionTypes: QuestionType[] = questionGroups.map(group => ({
      category: group.suggestedCategory,
      examples: group.questions.slice(0, 3), // 상위 3개 예시
      frequency: group.frequency,
      currentCoverage: this.calculateCurrentCoverage(group, interactions),
      suggestedPatterns: this.generateSuggestedPatterns(group)
    }));

    // 빈도순으로 정렬
    questionTypes.sort((a, b) => b.frequency - a.frequency);

    console.log(`🎯 [FailureAnalyzer] 미처리 질문 유형 식별 완료:`, {
      totalTypes: questionTypes.length,
      topCategories: questionTypes.slice(0, 5).map(qt => qt.category)
    });

    return questionTypes.slice(0, this.config.maxPatternsToAnalyze);
  }

  /**
   * 실패 패턴 추출
   */
  private extractFailurePatterns(interactions: UserInteractionLog[]): FailurePattern[] {
    const patternMap = new Map<string, FailurePattern>();

    interactions.forEach(interaction => {
      const pattern = this.extractPatternFromQuery(interaction.query);
      const existing = patternMap.get(pattern);

      if (existing) {
        existing.frequency++;
        existing.commonQueries.push(interaction.query);
        if (interaction.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = interaction.timestamp;
        }
      } else {
        patternMap.set(pattern, {
          id: this.generatePatternId(),
          pattern,
          frequency: 1,
          commonQueries: [interaction.query],
          suggestedImprovement: this.generateImprovementSuggestion(pattern, interaction),
          confidence: interaction.confidence,
          lastOccurrence: interaction.timestamp
        });
      }
    });

    // 최소 빈도 이상인 패턴만 반환
    return Array.from(patternMap.values())
      .filter(pattern => pattern.frequency >= this.config.minPatternFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 질문에서 패턴 추출
   */
  private extractPatternFromQuery(query: string): string {
    // 한국어 키워드 추출 및 정규화
    const normalizedQuery = query.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 주요 키워드 추출 (서버 모니터링 도메인 특화)
    const serverKeywords = ['서버', 'cpu', '메모리', '네트워크', '디스크', '로그', '에러', '장애', '모니터링'];
    const actionKeywords = ['확인', '조회', '분석', '해결', '수정', '재시작', '중지'];
    
    const foundServerKeywords = serverKeywords.filter(keyword => normalizedQuery.includes(keyword));
    const foundActionKeywords = actionKeywords.filter(keyword => normalizedQuery.includes(keyword));
    
    // 패턴 생성
    const serverPart = foundServerKeywords.length > 0 ? foundServerKeywords[0] : 'general';
    const actionPart = foundActionKeywords.length > 0 ? foundActionKeywords[0] : 'query';
    
    return `${serverPart}_${actionPart}`;
  }

  /**
   * 유사 질문 그룹핑
   */
  private groupSimilarQuestions(questions: string[]): QuestionGroup[] {
    const groups = new Map<string, QuestionGroup>();

    questions.forEach(question => {
      const pattern = this.extractPatternFromQuery(question);
      const keywords = this.extractKeywords(question);
      
      if (groups.has(pattern)) {
        const group = groups.get(pattern)!;
        group.questions.push(question);
        group.frequency++;
        group.commonKeywords = this.mergeKeywords(group.commonKeywords, keywords);
      } else {
        groups.set(pattern, {
          id: this.generatePatternId(),
          pattern,
          questions: [question],
          frequency: 1,
          averageConfidence: 0, // 나중에 계산
          commonKeywords: keywords,
          suggestedCategory: this.categorizePattern(pattern)
        });
      }
    });

    return Array.from(groups.values())
      .filter(group => group.frequency >= this.config.minPatternFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 불용어 제거
    const stopWords = ['은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '만', '부터', '까지'];
    return words.filter(word => !stopWords.includes(word));
  }

  /**
   * 키워드 병합
   */
  private mergeKeywords(existing: string[], newKeywords: string[]): string[] {
    const merged = [...existing];
    newKeywords.forEach(keyword => {
      if (!merged.includes(keyword)) {
        merged.push(keyword);
      }
    });
    return merged.slice(0, 10); // 상위 10개만 유지
  }

  /**
   * 패턴 분류
   */
  private categorizePattern(pattern: string): string {
    if (pattern.includes('서버')) return '서버 관리';
    if (pattern.includes('cpu')) return 'CPU 모니터링';
    if (pattern.includes('메모리')) return '메모리 관리';
    if (pattern.includes('네트워크')) return '네트워크 모니터링';
    if (pattern.includes('디스크')) return '스토리지 관리';
    if (pattern.includes('로그')) return '로그 분석';
    if (pattern.includes('에러') || pattern.includes('장애')) return '장애 대응';
    return '일반 질의';
  }

  /**
   * 개선 제안 생성
   */
  private generateImprovementSuggestion(pattern: string, interaction: UserInteractionLog): string {
    const category = this.categorizePattern(pattern);
    
    switch (category) {
      case 'CPU 모니터링':
        return 'CPU 관련 질문에 대한 더 상세한 응답 템플릿과 실시간 데이터 연동 개선 필요';
      case '메모리 관리':
        return '메모리 사용량 분석 및 최적화 가이드 템플릿 추가 필요';
      case '네트워크 모니터링':
        return '네트워크 지연 및 연결 상태 분석 패턴 강화 필요';
      case '장애 대응':
        return '장애 상황별 단계적 대응 가이드 및 자동화 스크립트 제안 기능 추가 필요';
      default:
        return `"${pattern}" 패턴에 대한 응답 품질 개선 및 컨텍스트 이해도 향상 필요`;
    }
  }

  /**
   * 개선 기회 식별
   */
  private identifyImprovementOpportunities(interactions: UserInteractionLog[]): any[] {
    // TODO: PatternSuggestion 타입으로 구현
    return [];
  }

  /**
   * 우선순위 계산
   */
  private calculatePriorityLevel(patterns: FailurePattern[]): 'high' | 'medium' | 'low' {
    const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
    
    if (totalFrequency > 20) return 'high';
    if (totalFrequency > 10) return 'medium';
    return 'low';
  }

  /**
   * 예상 개선 효과 계산
   */
  private calculateEstimatedImpact(negativeInteractions: UserInteractionLog[], allInteractions: UserInteractionLog[]): number {
    if (allInteractions.length === 0) return 0;
    
    const negativeRatio = negativeInteractions.length / allInteractions.length;
    return Math.round((1 - negativeRatio) * 100);
  }

  /**
   * 현재 커버리지 계산
   */
  private calculateCurrentCoverage(group: QuestionGroup, allInteractions: UserInteractionLog[]): number {
    const successfulInteractions = allInteractions.filter(
      i => i.confidence >= this.config.lowConfidenceThreshold && 
           i.userFeedback !== 'not_helpful' && 
           i.userFeedback !== 'incorrect'
    );
    
    const groupPattern = group.pattern;
    const successfulInGroup = successfulInteractions.filter(
      i => this.extractPatternFromQuery(i.query) === groupPattern
    );
    
    if (group.frequency === 0) return 0;
    return Math.round((successfulInGroup.length / group.frequency) * 100);
  }

  /**
   * 제안 패턴 생성
   */
  private generateSuggestedPatterns(group: QuestionGroup): string[] {
    const patterns: string[] = [];
    
    // 공통 키워드 기반 정규식 패턴 생성
    if (group.commonKeywords.length > 0) {
      const keywordPattern = group.commonKeywords.slice(0, 3).join('|');
      patterns.push(`(${keywordPattern})`);
    }
    
    // 카테고리 기반 패턴
    patterns.push(`${group.suggestedCategory.replace(/\s+/g, '_').toLowerCase()}_.*`);
    
    return patterns;
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(patterns: FailurePattern[], interactions: UserInteractionLog[]): string[] {
    const recommendations: string[] = [];
    
    if (patterns.length > 0) {
      recommendations.push(`${patterns.length}개의 실패 패턴이 발견되었습니다. 우선순위에 따라 개선이 필요합니다.`);
    }
    
    const lowConfidenceRate = interactions.length > 0 ? 
      (interactions.filter(i => i.confidence < 0.6).length / interactions.length) * 100 : 0;
    
    if (lowConfidenceRate > 30) {
      recommendations.push('낮은 신뢰도 응답이 30% 이상입니다. 패턴 매칭 알고리즘 개선이 필요합니다.');
    }
    
    if (patterns.some(p => p.frequency > 10)) {
      recommendations.push('빈번한 실패 패턴이 있습니다. 해당 패턴에 대한 전용 응답 템플릿 추가를 고려하세요.');
    }
    
    return recommendations;
  }

  /**
   * 유틸리티 메서드들
   */
  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 