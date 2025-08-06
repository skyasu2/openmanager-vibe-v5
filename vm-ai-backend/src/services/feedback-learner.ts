/**
 * 📚 Feedback Learning Service
 * 
 * 사용자 피드백을 수집하고 학습하여 AI 품질 개선
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Feedback {
  id: string;
  sessionId?: string;
  queryId: string;
  query: string;
  response: string;
  rating: number; // 1-5
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[];
  comment?: string;
  improvements?: string[];
  metadata: {
    userId?: string;
    timestamp: Date;
    responseTime: number;
    model?: string;
    confidence?: number;
  };
}

export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  avgRating: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonImprovements: Map<string, number>;
  examples: string[];
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  totalFeedbacks: number;
  averageRating: number;
  satisfactionRate: number; // % of ratings >= 4
  responseTimeP50: number;
  responseTimeP95: number;
  topIssues: Array<{ issue: string; count: number }>;
  topSuccesses: Array<{ pattern: string; avgRating: number }>;
}

export class FeedbackLearner {
  private feedbacks: Map<string, Feedback>;
  private patterns: Map<string, LearningPattern>;
  private metrics: PerformanceMetrics;
  private readonly MAX_FEEDBACKS = 10000;
  private readonly LEARNING_THRESHOLD = 10; // 최소 피드백 수
  private readonly DATA_DIR = './data/feedback';

  constructor() {
    this.feedbacks = new Map();
    this.patterns = new Map();
    this.metrics = this.initializeMetrics();
    
    // 데이터 디렉토리 생성
    this.ensureDataDirectory();
    
    // 저장된 데이터 로드
    this.loadPersistedData();
    
    // 주기적으로 학습 및 저장
    setInterval(() => this.performLearning(), 30 * 60 * 1000); // 30분마다
    setInterval(() => this.persistData(), 60 * 60 * 1000); // 1시간마다
  }

  /**
   * 피드백 수집
   */
  async collectFeedback(
    queryId: string,
    query: string,
    response: string,
    rating: number,
    comment?: string,
    metadata?: Partial<Feedback['metadata']>
  ): Promise<Feedback> {
    const feedbackId = uuidv4();
    
    // 감정 분석
    const sentiment = this.analyzeSentiment(rating, comment);
    
    // 카테고리 분류
    const categories = this.categorizeQuery(query);
    
    // 개선점 추출
    const improvements = comment ? this.extractImprovements(comment) : [];
    
    const feedback: Feedback = {
      id: feedbackId,
      queryId,
      query,
      response,
      rating,
      sentiment,
      categories,
      comment,
      improvements,
      metadata: {
        timestamp: new Date(),
        responseTime: metadata?.responseTime || 0,
        model: metadata?.model,
        confidence: metadata?.confidence,
        userId: metadata?.userId
      }
    };
    
    this.feedbacks.set(feedbackId, feedback);
    
    // 메트릭 업데이트
    this.updateMetrics(feedback);
    
    // 패턴 학습
    this.updatePatterns(feedback);
    
    console.log(`📝 Feedback collected: ${feedbackId} (Rating: ${rating})`);
    
    // 메모리 관리
    if (this.feedbacks.size > this.MAX_FEEDBACKS) {
      this.pruneOldFeedbacks();
    }
    
    return feedback;
  }

  /**
   * 감정 분석
   */
  private analyzeSentiment(rating: number, comment?: string): Feedback['sentiment'] {
    // 평점 기반 기본 감정
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    
    // 코멘트가 있으면 추가 분석
    if (comment) {
      const positiveWords = ['좋', '훌륭', '완벽', '감사', '최고', 'good', 'great', 'excellent'];
      const negativeWords = ['나쁘', '실망', '오류', '느리', '부정확', 'bad', 'poor', 'wrong'];
      
      const hasPositive = positiveWords.some(word => comment.includes(word));
      const hasNegative = negativeWords.some(word => comment.includes(word));
      
      if (hasPositive && !hasNegative) return 'positive';
      if (hasNegative && !hasPositive) return 'negative';
    }
    
    return 'neutral';
  }

  /**
   * 쿼리 카테고리 분류
   */
  private categorizeQuery(query: string): string[] {
    const categories: string[] = [];
    
    const categoryPatterns = [
      { pattern: /서버|server|cpu|메모리|memory|디스크|disk/i, category: '시스템 모니터링' },
      { pattern: /에러|error|오류|장애|fail/i, category: '장애 분석' },
      { pattern: /최적화|성능|performance|optimize/i, category: '성능 최적화' },
      { pattern: /예측|predict|forecast|추세|trend/i, category: '예측 분석' },
      { pattern: /보안|security|인증|auth/i, category: '보안' },
      { pattern: /설정|config|configuration|세팅/i, category: '설정' }
    ];
    
    categoryPatterns.forEach(({ pattern, category }) => {
      if (pattern.test(query)) {
        categories.push(category);
      }
    });
    
    if (categories.length === 0) {
      categories.push('일반');
    }
    
    return categories;
  }

  /**
   * 개선점 추출
   */
  private extractImprovements(comment: string): string[] {
    const improvements: string[] = [];
    
    const improvementPatterns = [
      /더 (.*?)하면 좋/g,
      /개선.*?: (.*?)(?:\.|$)/g,
      /suggest.*?: (.*?)(?:\.|$)/gi,
      /could be (.*?)(?:\.|$)/gi,
      /should (.*?)(?:\.|$)/gi
    ];
    
    improvementPatterns.forEach(pattern => {
      const matches = comment.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          improvements.push(match[1].trim());
        }
      }
    });
    
    // 키워드 기반 개선점
    if (comment.includes('느리') || comment.includes('slow')) {
      improvements.push('응답 속도 개선');
    }
    if (comment.includes('부정확') || comment.includes('incorrect')) {
      improvements.push('정확도 향상');
    }
    if (comment.includes('이해') || comment.includes('understand')) {
      improvements.push('컨텍스트 이해 개선');
    }
    
    return improvements;
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(feedback: Feedback): void {
    const allFeedbacks = Array.from(this.feedbacks.values());
    
    // 기본 메트릭
    this.metrics.totalFeedbacks = allFeedbacks.length;
    this.metrics.averageRating = 
      allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;
    this.metrics.satisfactionRate = 
      allFeedbacks.filter(f => f.rating >= 4).length / allFeedbacks.length;
    
    // 응답 시간 분위수
    const responseTimes = allFeedbacks
      .map(f => f.metadata.responseTime)
      .filter(t => t > 0)
      .sort((a, b) => a - b);
    
    if (responseTimes.length > 0) {
      this.metrics.responseTimeP50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
      this.metrics.responseTimeP95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    }
    
    // 주요 이슈 (낮은 평점의 패턴)
    const issues = new Map<string, number>();
    allFeedbacks
      .filter(f => f.rating <= 2)
      .forEach(f => {
        f.improvements?.forEach(imp => {
          issues.set(imp, (issues.get(imp) || 0) + 1);
        });
      });
    
    this.metrics.topIssues = Array.from(issues.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // 성공 패턴 (높은 평점의 패턴)
    const successes = new Map<string, number[]>();
    allFeedbacks
      .filter(f => f.rating >= 4)
      .forEach(f => {
        f.categories.forEach(cat => {
          if (!successes.has(cat)) {
            successes.set(cat, []);
          }
          successes.get(cat)!.push(f.rating);
        });
      });
    
    this.metrics.topSuccesses = Array.from(successes.entries())
      .map(([pattern, ratings]) => ({
        pattern,
        avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);
  }

  /**
   * 패턴 업데이트
   */
  private updatePatterns(feedback: Feedback): void {
    feedback.categories.forEach(category => {
      let pattern = this.patterns.get(category);
      
      if (!pattern) {
        pattern = {
          id: uuidv4(),
          pattern: category,
          frequency: 0,
          avgRating: 0,
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          commonImprovements: new Map(),
          examples: [],
          lastUpdated: new Date()
        };
        this.patterns.set(category, pattern);
      }
      
      // 빈도 및 평점 업데이트
      pattern.frequency++;
      pattern.avgRating = 
        (pattern.avgRating * (pattern.frequency - 1) + feedback.rating) / pattern.frequency;
      
      // 감정 분포 업데이트
      pattern.sentiment[feedback.sentiment]++;
      
      // 개선점 빈도 업데이트
      feedback.improvements?.forEach(imp => {
        pattern.commonImprovements.set(
          imp,
          (pattern.commonImprovements.get(imp) || 0) + 1
        );
      });
      
      // 예시 추가 (최대 10개)
      if (pattern.examples.length < 10) {
        pattern.examples.push(feedback.query);
      }
      
      pattern.lastUpdated = new Date();
    });
  }

  /**
   * 학습 수행
   */
  private async performLearning(): Promise<void> {
    console.log('🧠 Performing feedback learning...');
    
    // 충분한 데이터가 있는 패턴 분석
    const significantPatterns = Array.from(this.patterns.values())
      .filter(p => p.frequency >= this.LEARNING_THRESHOLD);
    
    for (const pattern of significantPatterns) {
      // 주요 개선점 식별
      const topImprovements = Array.from(pattern.commonImprovements.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      // 학습 결과 로깅
      console.log(`📊 Pattern: ${pattern.pattern}`);
      console.log(`   Avg Rating: ${pattern.avgRating.toFixed(2)}`);
      console.log(`   Sentiment: +${pattern.sentiment.positive} =${pattern.sentiment.neutral} -${pattern.sentiment.negative}`);
      if (topImprovements.length > 0) {
        console.log(`   Top Improvements: ${topImprovements.map(i => i[0]).join(', ')}`);
      }
    }
    
    // 학습 결과 저장
    await this.saveLearningResults();
  }

  /**
   * 권장사항 생성
   */
  getRecommendations(query: string): any {
    const categories = this.categorizeQuery(query);
    const recommendations: any[] = [];
    
    categories.forEach(category => {
      const pattern = this.patterns.get(category);
      if (pattern && pattern.frequency >= this.LEARNING_THRESHOLD) {
        // 평균 평점이 낮으면 주의 필요
        if (pattern.avgRating < 3) {
          recommendations.push({
            type: 'warning',
            message: `이 유형의 질문은 평균 만족도가 낮습니다 (${pattern.avgRating.toFixed(1)}/5)`,
            improvements: Array.from(pattern.commonImprovements.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([imp]) => imp)
          });
        }
        
        // 성공 패턴
        if (pattern.avgRating >= 4) {
          recommendations.push({
            type: 'success',
            message: `이 유형의 질문은 높은 만족도를 보입니다 (${pattern.avgRating.toFixed(1)}/5)`,
            confidence: 0.8 + (pattern.frequency / 100) * 0.2
          });
        }
      }
    });
    
    return {
      categories,
      recommendations,
      metrics: this.getMetrics()
    };
  }

  /**
   * 메트릭 조회
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 피드백 조회
   */
  getFeedback(feedbackId: string): Feedback | null {
    return this.feedbacks.get(feedbackId) || null;
  }

  /**
   * 세션별 피드백 조회
   */
  getSessionFeedbacks(sessionId: string): Feedback[] {
    return Array.from(this.feedbacks.values())
      .filter(f => f.sessionId === sessionId);
  }

  /**
   * 데이터 디렉토리 확인
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.DATA_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  /**
   * 데이터 영속화
   */
  private async persistData(): Promise<void> {
    try {
      // 피드백 저장
      const feedbacksData = Array.from(this.feedbacks.entries());
      await fs.writeFile(
        path.join(this.DATA_DIR, 'feedbacks.json'),
        JSON.stringify(feedbacksData, null, 2)
      );
      
      // 패턴 저장
      const patternsData = Array.from(this.patterns.entries()).map(([key, value]) => ({
        key,
        value: {
          ...value,
          commonImprovements: Array.from(value.commonImprovements.entries())
        }
      }));
      await fs.writeFile(
        path.join(this.DATA_DIR, 'patterns.json'),
        JSON.stringify(patternsData, null, 2)
      );
      
      // 메트릭 저장
      await fs.writeFile(
        path.join(this.DATA_DIR, 'metrics.json'),
        JSON.stringify(this.metrics, null, 2)
      );
      
      console.log('💾 Feedback data persisted');
    } catch (error) {
      console.error('Failed to persist data:', error);
    }
  }

  /**
   * 저장된 데이터 로드
   */
  private async loadPersistedData(): Promise<void> {
    try {
      // 피드백 로드
      const feedbacksPath = path.join(this.DATA_DIR, 'feedbacks.json');
      const feedbacksData = await fs.readFile(feedbacksPath, 'utf-8');
      const feedbacks: Array<[string, Feedback]> = JSON.parse(feedbacksData);
      feedbacks.forEach(([id, feedback]) => {
        this.feedbacks.set(id, {
          ...feedback,
          metadata: {
            ...feedback.metadata,
            timestamp: new Date(feedback.metadata.timestamp)
          }
        });
      });
      
      // 패턴 로드
      const patternsPath = path.join(this.DATA_DIR, 'patterns.json');
      const patternsData = await fs.readFile(patternsPath, 'utf-8');
      const patterns = JSON.parse(patternsData);
      patterns.forEach((item: any) => {
        this.patterns.set(item.key, {
          ...item.value,
          commonImprovements: new Map(item.value.commonImprovements),
          lastUpdated: new Date(item.value.lastUpdated)
        });
      });
      
      console.log(`📂 Loaded ${this.feedbacks.size} feedbacks, ${this.patterns.size} patterns`);
    } catch (error) {
      console.log('No persisted data found or failed to load:', error);
    }
  }

  /**
   * 학습 결과 저장
   */
  private async saveLearningResults(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsPath = path.join(this.DATA_DIR, `learning-${timestamp}.json`);
    
    const results = {
      timestamp: new Date(),
      patterns: Array.from(this.patterns.values()),
      metrics: this.metrics,
      insights: this.generateInsights()
    };
    
    try {
      await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
      console.log(`📝 Learning results saved: ${resultsPath}`);
    } catch (error) {
      console.error('Failed to save learning results:', error);
    }
  }

  /**
   * 인사이트 생성
   */
  private generateInsights(): any {
    const insights = {
      strongAreas: [] as string[],
      weakAreas: [] as string[],
      trends: [] as string[],
      recommendations: [] as string[]
    };
    
    // 강점 영역
    this.patterns.forEach((pattern, category) => {
      if (pattern.avgRating >= 4 && pattern.frequency >= this.LEARNING_THRESHOLD) {
        insights.strongAreas.push(`${category} (평균 ${pattern.avgRating.toFixed(1)}점)`);
      }
    });
    
    // 약점 영역
    this.patterns.forEach((pattern, category) => {
      if (pattern.avgRating < 3 && pattern.frequency >= this.LEARNING_THRESHOLD) {
        insights.weakAreas.push(`${category} (평균 ${pattern.avgRating.toFixed(1)}점)`);
      }
    });
    
    // 트렌드
    if (this.metrics.satisfactionRate > 0.8) {
      insights.trends.push('전반적인 만족도가 높음 (80% 이상)');
    } else if (this.metrics.satisfactionRate < 0.6) {
      insights.trends.push('만족도 개선 필요 (60% 미만)');
    }
    
    // 권장사항
    this.metrics.topIssues.forEach(issue => {
      if (issue.count >= 5) {
        insights.recommendations.push(`"${issue.issue}" 개선 필요 (${issue.count}회 언급)`);
      }
    });
    
    return insights;
  }

  /**
   * 오래된 피드백 정리
   */
  private pruneOldFeedbacks(): void {
    const sorted = Array.from(this.feedbacks.entries())
      .sort((a, b) => a[1].metadata.timestamp.getTime() - b[1].metadata.timestamp.getTime());
    
    const toRemove = sorted.slice(0, this.MAX_FEEDBACKS / 10);
    toRemove.forEach(([id]) => {
      this.feedbacks.delete(id);
    });
    
    console.log(`🧹 Pruned ${toRemove.length} old feedbacks`);
  }

  /**
   * 메트릭 초기화
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      satisfactionRate: 0,
      responseTimeP50: 0,
      responseTimeP95: 0,
      topIssues: [],
      topSuccesses: []
    };
  }
}