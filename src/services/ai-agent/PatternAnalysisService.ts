import { InteractionLogger } from './logging/InteractionLogger';
import { FailureAnalyzer, QuestionGroup } from '@/modules/ai-agent/analytics/FailureAnalyzer';
import { PatternSuggester, RegexPattern } from '@/modules/ai-agent/improvement/PatternSuggester';
import { ABTestManager, TestResult, Comparison } from '@/modules/ai-agent/testing/ABTestManager';
import { 
  UserInteractionLog, 
  PatternSuggestion, 
  AnalysisResult, 
  PatternAnalysis,
  QuestionType,
  LearningMetrics 
} from '@/types/ai-learning';

export interface PatternAnalysisConfig {
  analysisInterval: number; // hours
  autoApproveThreshold: number; // 자동 승인 임계값
  enableAutoTesting: boolean;
  maxConcurrentTests: number;
}

export interface AnalysisReport {
  id: string;
  timestamp: Date;
  analysisResult: AnalysisResult;
  patternAnalysis: PatternAnalysis;
  questionTypes: QuestionType[];
  suggestions: PatternSuggestion[];
  activeTests: TestResult[];
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export class PatternAnalysisService {
  private static instance: PatternAnalysisService;
  private config: PatternAnalysisConfig;
  private interactionLogger: InteractionLogger;
  private failureAnalyzer: FailureAnalyzer;
  private patternSuggester: PatternSuggester;
  private abTestManager: ABTestManager;
  private analysisHistory: AnalysisReport[] = [];
  private isAnalyzing: boolean = false;

  private constructor(config?: Partial<PatternAnalysisConfig>) {
    this.config = {
      analysisInterval: 24, // 24시간마다
      autoApproveThreshold: 0.85,
      enableAutoTesting: true,
      maxConcurrentTests: 3,
      ...config
    };

    this.interactionLogger = InteractionLogger.getInstance();
    this.failureAnalyzer = new FailureAnalyzer();
    this.patternSuggester = new PatternSuggester();
    this.abTestManager = new ABTestManager();
  }

  public static getInstance(config?: Partial<PatternAnalysisConfig>): PatternAnalysisService {
    if (!PatternAnalysisService.instance) {
      PatternAnalysisService.instance = new PatternAnalysisService(config);
    }
    return PatternAnalysisService.instance;
  }

  /**
   * 전체 패턴 분석 실행
   */
  async runFullAnalysis(): Promise<AnalysisReport> {
    if (this.isAnalyzing) {
      throw new Error('분석이 이미 진행 중입니다.');
    }

    this.isAnalyzing = true;
    const startTime = Date.now();

    try {
      console.log('🔍 [PatternAnalysisService] 전체 패턴 분석 시작...');

      // 1. 상호작용 데이터 로드
      const interactions = await this.interactionLogger.getInteractionHistory();
      
      if (interactions.length === 0) {
        console.log('📊 [PatternAnalysisService] 분석할 데이터가 없습니다.');
        return this.createEmptyReport();
      }

      // 2. 실패 패턴 분석
      const analysisResult = await this.failureAnalyzer.analyzeLowConfidenceResponses(interactions);
      const patternAnalysis = await this.failureAnalyzer.analyzeNegativeFeedbackPatterns(interactions);
      const questionTypes = await this.failureAnalyzer.identifyUnhandledQuestionTypes(interactions);

      // 3. 패턴 제안 생성
      const questionGroups = await this.extractQuestionGroups(interactions);
      const suggestions = await this.patternSuggester.generatePatternSuggestions(interactions, questionGroups);

      // 4. 활성 테스트 상태 확인
      const activeTests = this.abTestManager.getActiveTests();

      // 5. 권장사항 생성
      const recommendations = this.generateRecommendations(
        analysisResult, 
        patternAnalysis, 
        suggestions, 
        activeTests
      );

      // 6. 우선순위 결정
      const priority = this.determinePriority(analysisResult, patternAnalysis, suggestions);

      // 7. 보고서 생성
      const report: AnalysisReport = {
        id: this.generateReportId(),
        timestamp: new Date(),
        analysisResult,
        patternAnalysis,
        questionTypes,
        suggestions,
        activeTests,
        recommendations,
        priority
      };

      // 8. 자동 테스트 시작 (설정된 경우)
      if (this.config.enableAutoTesting) {
        await this.startAutoTests(suggestions);
      }

      this.analysisHistory.push(report);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ [PatternAnalysisService] 전체 분석 완료 (${processingTime}ms):`, {
        interactions: interactions.length,
        suggestions: suggestions.length,
        activeTests: activeTests.length,
        priority
      });

      return report;

    } catch (error) {
      console.error('❌ [PatternAnalysisService] 분석 실패:', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * 패턴 제안 승인
   */
  async approvePatternSuggestion(suggestionId: string): Promise<boolean> {
    try {
      // 실제 패턴 저장소에 적용
      console.log(`✅ [PatternAnalysisService] 패턴 제안 승인 처리: ${suggestionId}`);
      
      // 1. 제안 내용 조회
      const suggestion = await this.findSuggestionById(suggestionId);
      if (!suggestion) {
        console.error(`패턴 제안을 찾을 수 없습니다: ${suggestionId}`);
        return false;
      }
      
      // 2. 패턴 저장소에 새 패턴 추가
      const newPattern: RegexPattern = {
        id: `pattern_${Date.now()}`,
        pattern: suggestion.suggestedPattern,
        description: suggestion.description,
        category: 'approved_suggestion',
        confidence: suggestion.confidenceScore,
        testCases: [],
        expectedMatches: suggestion.estimatedMatches || 0,
        metadata: {
          suggestionId: suggestionId,
          approvedAt: new Date().toISOString(),
          source: 'pattern_analysis_service'
        }
      };
      
      // 3. Supabase 또는 로컬 저장소에 저장
      const stored = await this.storePattern(newPattern);
      if (!stored) {
        console.error(`패턴 저장 실패: ${suggestionId}`);
        return false;
      }
      
      // 4. 제안 상태 업데이트
      await this.updateSuggestionStatus(suggestionId, 'approved');
      
      // 5. AI 엔진에 새 패턴 알림
      await this.notifyAIEnginePatternUpdate(newPattern);
      
      console.log(`✅ [PatternAnalysisService] 패턴 제안 승인 완료: ${suggestionId} -> 패턴 ID: ${newPattern.id}`);
      return true;
    } catch (error) {
      console.error(`❌ [PatternAnalysisService] 패턴 승인 실패: ${suggestionId}`, error);
      return false;
    }
  }

  /**
   * 패턴 제안 거부
   */
  async rejectPatternSuggestion(suggestionId: string, reason?: string): Promise<boolean> {
    try {
      console.log(`❌ [PatternAnalysisService] 패턴 제안 거부 처리: ${suggestionId}`, reason);
      
      // 1. 제안 상태 업데이트
      await this.updateSuggestionStatus(suggestionId, 'rejected', reason);
      
      // 2. 거부 이유를 학습 데이터로 활용
      if (reason) {
        await this.learnFromRejection(suggestionId, reason);
      }
      
      console.log(`✅ [PatternAnalysisService] 패턴 제안 거부 완료: ${suggestionId}`);
      return true;
    } catch (error) {
      console.error(`❌ [PatternAnalysisService] 패턴 거부 실패: ${suggestionId}`, error);
      return false;
    }
  }

  /**
   * A/B 테스트 시작
   */
  async startPatternTest(suggestion: PatternSuggestion): Promise<TestResult | null> {
    try {
      const activeTests = this.abTestManager.getActiveTests();
      
      if (activeTests.length >= this.config.maxConcurrentTests) {
        console.log(`⚠️ [PatternAnalysisService] 최대 동시 테스트 수 초과 (${activeTests.length}/${this.config.maxConcurrentTests})`);
        return null;
      }

      // 패턴 객체 생성
      const pattern: RegexPattern = {
        id: suggestion.id,
        pattern: suggestion.suggestedPattern,
        description: `자동 생성된 패턴 (제안 ID: ${suggestion.id})`,
        category: 'auto_generated',
        confidence: suggestion.confidenceScore,
        testCases: [],
        expectedMatches: 0
      };

      const testResult = await this.abTestManager.testNewPattern(pattern);
      
      console.log(`🧪 [PatternAnalysisService] A/B 테스트 시작:`, {
        suggestionId: suggestion.id,
        testId: testResult.testId,
        pattern: suggestion.suggestedPattern
      });

      return testResult;
    } catch (error) {
      console.error(`❌ [PatternAnalysisService] 테스트 시작 실패:`, error);
      return null;
    }
  }

  /**
   * 패턴 성능 비교
   */
  async comparePatterns(oldPatternId: string, newPatternId: string): Promise<Comparison | null> {
    try {
      // 실제 패턴 저장소에서 패턴 조회
      const [oldPattern, newPattern] = await Promise.all([
        this.getPatternById(oldPatternId),
        this.getPatternById(newPatternId)
      ]);
      
      if (!oldPattern || !newPattern) {
        console.error('패턴 조회 실패:', { oldPatternId, newPatternId });
        return null;
      }
      
      const interactions = await this.interactionLogger.getInteractionHistory();
      
      const comparison = await this.abTestManager.comparePatternPerformance(
        oldPattern, 
        newPattern, 
        interactions
      );

      console.log(`📊 [PatternAnalysisService] 패턴 비교 완료:`, {
        comparisonId: comparison.comparisonId,
        recommendation: comparison.recommendation,
        improvement: comparison.improvement.overall
      });

      return comparison;
    } catch (error) {
      console.error(`❌ [PatternAnalysisService] 패턴 비교 실패:`, error);
      return null;
    }
  }

  /**
   * 학습 메트릭 조회
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    return await this.interactionLogger.getLearningMetrics();
  }

  /**
   * 분석 히스토리 조회
   */
  getAnalysisHistory(): AnalysisReport[] {
    return [...this.analysisHistory];
  }

  /**
   * 최신 분석 보고서 조회
   */
  getLatestReport(): AnalysisReport | null {
    return this.analysisHistory.length > 0 ? 
      this.analysisHistory[this.analysisHistory.length - 1] : null;
  }

  /**
   * 질문 그룹 추출
   */
  private async extractQuestionGroups(interactions: UserInteractionLog[]): Promise<QuestionGroup[]> {
    const problematicInteractions = interactions.filter(
      i => i.confidence < 0.6 || 
           i.userFeedback === 'not_helpful' || 
           i.userFeedback === 'incorrect'
    );

    const questions = problematicInteractions.map(i => i.query);
    return await this.patternSuggester.groupSimilarQuestions(questions);
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    analysisResult: AnalysisResult,
    patternAnalysis: PatternAnalysis,
    suggestions: PatternSuggestion[],
    activeTests: TestResult[]
  ): string[] {
    const recommendations: string[] = [];

    // 분석 결과 기반 권장사항
    if (analysisResult.lowConfidenceCount > analysisResult.totalInteractions * 0.3) {
      recommendations.push('낮은 신뢰도 응답이 30% 이상입니다. 패턴 매칭 알고리즘 개선이 시급합니다.');
    }

    // 패턴 분석 기반 권장사항
    if (patternAnalysis.priorityLevel === 'high') {
      recommendations.push('높은 우선순위의 실패 패턴이 발견되었습니다. 즉시 개선 작업을 시작하세요.');
    }

    // 제안 기반 권장사항
    const highConfidenceSuggestions = suggestions.filter(s => s.confidenceScore > 0.8);
    if (highConfidenceSuggestions.length > 0) {
      recommendations.push(`${highConfidenceSuggestions.length}개의 고신뢰도 패턴 제안이 있습니다. 검토 후 적용을 고려하세요.`);
    }

    // 테스트 기반 권장사항
    if (activeTests.length === 0 && suggestions.length > 0) {
      recommendations.push('새로운 패턴 제안이 있지만 활성 테스트가 없습니다. A/B 테스트를 시작하세요.');
    }

    // 자동 승인 가능한 제안
    const autoApprovable = suggestions.filter(s => s.confidenceScore >= this.config.autoApproveThreshold);
    if (autoApprovable.length > 0) {
      recommendations.push(`${autoApprovable.length}개의 제안이 자동 승인 기준을 만족합니다.`);
    }

    return recommendations;
  }

  /**
   * 우선순위 결정
   */
  private determinePriority(
    analysisResult: AnalysisResult,
    patternAnalysis: PatternAnalysis,
    suggestions: PatternSuggestion[]
  ): 'high' | 'medium' | 'low' {
    // 높은 우선순위 조건
    if (
      analysisResult.lowConfidenceCount > analysisResult.totalInteractions * 0.4 ||
      patternAnalysis.priorityLevel === 'high' ||
      suggestions.filter(s => s.estimatedImprovement > 30).length > 0
    ) {
      return 'high';
    }

    // 중간 우선순위 조건
    if (
      analysisResult.lowConfidenceCount > analysisResult.totalInteractions * 0.2 ||
      patternAnalysis.priorityLevel === 'medium' ||
      suggestions.filter(s => s.estimatedImprovement > 15).length > 0
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 자동 테스트 시작
   */
  private async startAutoTests(suggestions: PatternSuggestion[]): Promise<void> {
    const activeTests = this.abTestManager.getActiveTests();
    const availableSlots = this.config.maxConcurrentTests - activeTests.length;

    if (availableSlots <= 0) return;

    // 높은 신뢰도 제안부터 테스트
    const sortedSuggestions = suggestions
      .filter(s => s.confidenceScore >= 0.7)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, availableSlots);

    for (const suggestion of sortedSuggestions) {
      await this.startPatternTest(suggestion);
    }

    if (sortedSuggestions.length > 0) {
      console.log(`🤖 [PatternAnalysisService] 자동 테스트 시작: ${sortedSuggestions.length}개 패턴`);
    }
  }

  /**
   * 빈 보고서 생성
   */
  private createEmptyReport(): AnalysisReport {
    return {
      id: this.generateReportId(),
      timestamp: new Date(),
      analysisResult: {
        totalInteractions: 0,
        lowConfidenceCount: 0,
        averageConfidence: 0,
        commonFailurePatterns: [],
        recommendedActions: ['데이터가 충분하지 않습니다. 더 많은 상호작용 데이터를 수집하세요.'],
        analysisDate: new Date()
      },
      patternAnalysis: {
        negativePatterns: [],
        improvementOpportunities: [],
        priorityLevel: 'low',
        estimatedImpact: 0
      },
      questionTypes: [],
      suggestions: [],
      activeTests: [],
      recommendations: ['데이터 수집을 계속하여 의미 있는 분석을 위한 충분한 샘플을 확보하세요.'],
      priority: 'low'
    };
  }

  /**
   * 유틸리티 메서드
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 활성 테스트 목록 조회
   */
  async getActiveTests(): Promise<TestResult[]> {
    return this.abTestManager.getActiveTests();
  }

  /**
   * 완료된 테스트 목록 조회
   */
  async getCompletedTests(): Promise<TestResult[]> {
    return this.abTestManager.getCompletedTests();
  }

  /**
   * 자동 테스트 시작 (지정된 수만큼)
   */
  async startAutomaticTests(maxTests: number): Promise<void> {
    const latestReport = this.getLatestReport();
    if (!latestReport) return;

    const pendingSuggestions = latestReport.suggestions.filter(s => 
      !this.abTestManager.getActiveTests().some(t => t.patternId === s.id)
    );

    const testsToStart = pendingSuggestions.slice(0, maxTests);
    
    for (const suggestion of testsToStart) {
      await this.startPatternTest(suggestion);
    }
  }

  /**
   * 최신 분석 보고서 조회
   */
  getLatestAnalysisReport(): AnalysisReport | null {
    return this.getLatestReport();
  }

  /**
   * 제안 ID로 제안 찾기
   */
  private async findSuggestionById(suggestionId: string): Promise<PatternSuggestion | null> {
    try {
      // 최근 분석 보고서에서 제안 찾기
      for (const report of this.analysisHistory.reverse()) {
        const suggestion = report.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          return suggestion;
        }
      }
      
      // 저장소에서 직접 조회 (Supabase)
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const response = await fetch('/api/ai-agent/patterns/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', suggestionId })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.suggestion;
        }
      }
      
      return null;
    } catch (error) {
      console.error('제안 조회 실패:', error);
      return null;
    }
  }

  /**
   * 패턴 저장소에 저장
   */
  private async storePattern(pattern: RegexPattern): Promise<boolean> {
    try {
      // 1. 로컬 메모리 캐시에 저장
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__pattern_store = (globalThis as any).__pattern_store || new Map();
        (globalThis as any).__pattern_store.set(pattern.id, pattern);
      }
      
      // 2. Supabase에 저장 (가능한 경우)
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const response = await fetch('/api/ai-agent/patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern })
        });
        
        if (!response.ok) {
          console.warn('Supabase 패턴 저장 실패, 로컬 저장만 유지');
        }
      }
      
      // 3. LocalStorage 백업 (브라우저 환경)
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('ai-patterns') || '[]';
        const patterns = JSON.parse(stored);
        patterns.push(pattern);
        localStorage.setItem('ai-patterns', JSON.stringify(patterns));
      }
      
      console.log(`💾 패턴 저장 완료: ${pattern.id}`);
      return true;
    } catch (error) {
      console.error('패턴 저장 실패:', error);
      return false;
    }
  }

  /**
   * 제안 상태 업데이트
   */
  private async updateSuggestionStatus(suggestionId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    try {
      // 로컬 메모리 업데이트
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__suggestion_status = (globalThis as any).__suggestion_status || new Map();
        (globalThis as any).__suggestion_status.set(suggestionId, {
          status,
          reason,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Supabase 업데이트 (가능한 경우)
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await fetch('/api/ai-agent/patterns/suggestions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestionId, status, reason })
        });
      }
      
      console.log(`📝 제안 상태 업데이트: ${suggestionId} -> ${status}`);
    } catch (error) {
      console.error('제안 상태 업데이트 실패:', error);
    }
  }

  /**
   * AI 엔진에 패턴 업데이트 알림
   */
  private async notifyAIEnginePatternUpdate(pattern: RegexPattern): Promise<void> {
    try {
      // AI 엔진 API 호출
      if (typeof window !== 'undefined') {
        await fetch('/api/ai/enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pattern_update',
            pattern: pattern
          })
        });
      }
      
      // 이벤트 발송 (브라우저 환경)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai-pattern-updated', {
          detail: { pattern }
        }));
      }
      
      console.log(`🔄 AI 엔진 패턴 업데이트 알림: ${pattern.id}`);
    } catch (error) {
      console.error('AI 엔진 알림 실패:', error);
    }
  }

  /**
   * 거부 사유 학습
   */
  private async learnFromRejection(suggestionId: string, reason: string): Promise<void> {
    try {
      const learningData = {
        suggestionId,
        reason,
        timestamp: new Date().toISOString(),
        type: 'rejection_feedback'
      };
      
      // 학습 데이터 저장
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('rejection-learning') || '[]';
        const learnings = JSON.parse(stored);
        learnings.push(learningData);
        localStorage.setItem('rejection-learning', JSON.stringify(learnings));
      }
      
      // PatternSuggester에 피드백 제공
      await this.patternSuggester.learnFromFeedback('rejection', reason);
      
      console.log(`🧠 거부 사유 학습: ${suggestionId} - ${reason}`);
    } catch (error) {
      console.error('거부 사유 학습 실패:', error);
    }
  }

  /**
   * 패턴 ID로 패턴 조회
   */
  private async getPatternById(patternId: string): Promise<RegexPattern | null> {
    try {
      // 1. 메모리 캐시 확인
      if (typeof globalThis !== 'undefined' && (globalThis as any).__pattern_store) {
        const pattern = (globalThis as any).__pattern_store.get(patternId);
        if (pattern) return pattern;
      }
      
      // 2. Supabase 조회
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const response = await fetch(`/api/ai-agent/patterns/${patternId}`);
        if (response.ok) {
          const data = await response.json();
          return data.pattern;
        }
      }
      
      // 3. LocalStorage 폴백
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('ai-patterns') || '[]';
        const patterns = JSON.parse(stored);
        return patterns.find((p: RegexPattern) => p.id === patternId) || null;
      }
      
      return null;
    } catch (error) {
      console.error('패턴 조회 실패:', error);
      return null;
    }
  }
} 