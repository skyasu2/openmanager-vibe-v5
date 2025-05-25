/**
 * AI Agent Database Schema & Management
 * 
 * 🗄️ AI 에이전트 로깅 및 학습 데이터 관리 시스템
 * - 성공/실패 답변 로깅
 * - 질문-답변 패턴 분석
 * - 학습 데이터 수집
 * - 성능 메트릭 추적
 */

export interface AIInteractionRecord {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: number;
  
  // 질문 정보
  query: string;
  queryType: string;
  detectedMode: 'basic' | 'advanced';
  confidence: number;
  
  // 응답 정보
  response: string;
  responseTime: number;
  success: boolean;
  
  // 품질 평가
  userRating?: number; // 1-5 점수
  userFeedback?: string;
  isCorrect?: boolean; // 관리자 검증
  
  // 메타데이터
  intent: string;
  triggers: string[];
  serverData?: any;
  errorMessage?: string;
  
  // 학습 데이터
  isTrainingData: boolean;
  category: string;
  tags: string[];
}

export interface AIErrorRecord {
  id: string;
  sessionId: string;
  timestamp: number;
  
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  
  query: string;
  context?: any;
  
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
}

export interface AILearningPattern {
  id: string;
  pattern: string;
  category: string;
  successRate: number;
  totalQueries: number;
  avgResponseTime: number;
  lastUpdated: number;
  
  examples: {
    query: string;
    response: string;
    rating: number;
  }[];
}

export interface AIPerformanceMetric {
  id: string;
  timestamp: number;
  
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  modeDistribution: {
    basic: number;
    advanced: number;
  };
  
  topQueries: {
    query: string;
    count: number;
    avgRating: number;
  }[];
  
  topErrors: {
    error: string;
    count: number;
  }[];
}

export class AIDatabase {
  private interactions: Map<string, AIInteractionRecord> = new Map();
  private errors: Map<string, AIErrorRecord> = new Map();
  private patterns: Map<string, AILearningPattern> = new Map();
  private metrics: AIPerformanceMetric[] = [];
  
  private readonly MAX_RECORDS = 10000;
  private readonly MAX_METRICS = 1000;

  /**
   * 상호작용 기록 저장
   */
  async saveInteraction(record: Omit<AIInteractionRecord, 'id'>): Promise<string> {
    const id = this.generateId();
    const fullRecord: AIInteractionRecord = {
      id,
      ...record
    };
    
    this.interactions.set(id, fullRecord);
    
    // 메모리 관리
    if (this.interactions.size > this.MAX_RECORDS) {
      const oldestKey = this.interactions.keys().next().value;
      if (oldestKey) {
        this.interactions.delete(oldestKey);
      }
    }
    
    // 패턴 업데이트
    await this.updateLearningPatterns(fullRecord);
    
    console.log(`💾 AI Interaction saved: ${id}`);
    return id;
  }

  /**
   * 에러 기록 저장
   */
  async saveError(record: Omit<AIErrorRecord, 'id'>): Promise<string> {
    const id = this.generateId();
    const fullRecord: AIErrorRecord = {
      id,
      ...record
    };
    
    this.errors.set(id, fullRecord);
    
    // 메모리 관리
    if (this.errors.size > this.MAX_RECORDS) {
      const oldestKey = this.errors.keys().next().value;
      if (oldestKey) {
        this.errors.delete(oldestKey);
      }
    }
    
    console.log(`❌ AI Error saved: ${id}`);
    return id;
  }

  /**
   * 사용자 피드백 업데이트
   */
  async updateUserFeedback(
    interactionId: string, 
    rating: number, 
    feedback?: string
  ): Promise<boolean> {
    const record = this.interactions.get(interactionId);
    if (!record) return false;
    
    record.userRating = rating;
    record.userFeedback = feedback;
    
    // 패턴 재계산
    await this.updateLearningPatterns(record);
    
    console.log(`👍 User feedback updated: ${interactionId} (${rating}/5)`);
    return true;
  }

  /**
   * 관리자 검증 업데이트
   */
  async updateAdminVerification(
    interactionId: string, 
    isCorrect: boolean, 
    adminNotes?: string
  ): Promise<boolean> {
    const record = this.interactions.get(interactionId);
    if (!record) return false;
    
    record.isCorrect = isCorrect;
    if (adminNotes) {
      record.userFeedback = (record.userFeedback || '') + `\n[관리자] ${adminNotes}`;
    }
    
    // 학습 데이터로 마킹
    record.isTrainingData = true;
    
    console.log(`🔍 Admin verification: ${interactionId} (${isCorrect ? 'Correct' : 'Incorrect'})`);
    return true;
  }

  /**
   * 학습 패턴 업데이트
   */
  private async updateLearningPatterns(record: AIInteractionRecord): Promise<void> {
    const patternKey = this.extractPattern(record.query);
    
    let pattern = this.patterns.get(patternKey);
    if (!pattern) {
      pattern = {
        id: this.generateId(),
        pattern: patternKey,
        category: record.category,
        successRate: 0,
        totalQueries: 0,
        avgResponseTime: 0,
        lastUpdated: Date.now(),
        examples: []
      };
    }
    
    // 통계 업데이트
    pattern.totalQueries++;
    pattern.avgResponseTime = (
      (pattern.avgResponseTime * (pattern.totalQueries - 1) + record.responseTime) / 
      pattern.totalQueries
    );
    
    if (record.success && (record.userRating || 0) >= 3) {
      pattern.successRate = (
        (pattern.successRate * (pattern.totalQueries - 1) + 1) / 
        pattern.totalQueries
      );
    }
    
    // 예시 추가 (최대 10개)
    if (record.userRating && record.userRating >= 4) {
      pattern.examples.push({
        query: record.query,
        response: record.response,
        rating: record.userRating
      });
      
      if (pattern.examples.length > 10) {
        pattern.examples = pattern.examples
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10);
      }
    }
    
    pattern.lastUpdated = Date.now();
    this.patterns.set(patternKey, pattern);
  }

  /**
   * 성능 메트릭 생성
   */
  async generatePerformanceMetrics(): Promise<AIPerformanceMetric> {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    const recentInteractions = Array.from(this.interactions.values())
      .filter(record => record.timestamp >= last24h);
    
    const recentErrors = Array.from(this.errors.values())
      .filter(record => record.timestamp >= last24h);
    
    // 응답 시간 분석
    const responseTimes = recentInteractions.map(r => r.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    // 인기 질문 분석
    const queryCount = new Map<string, { count: number; totalRating: number; ratingCount: number }>();
    recentInteractions.forEach(record => {
      const key = this.extractPattern(record.query);
      const existing = queryCount.get(key) || { count: 0, totalRating: 0, ratingCount: 0 };
      existing.count++;
      if (record.userRating) {
        existing.totalRating += record.userRating;
        existing.ratingCount++;
      }
      queryCount.set(key, existing);
    });
    
    const topQueries = Array.from(queryCount.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 에러 분석
    const errorCount = new Map<string, number>();
    recentErrors.forEach(error => {
      errorCount.set(error.errorType, (errorCount.get(error.errorType) || 0) + 1);
    });
    
    const topErrors = Array.from(errorCount.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const metric: AIPerformanceMetric = {
      id: this.generateId(),
      timestamp: now,
      
      totalQueries: recentInteractions.length,
      successfulQueries: recentInteractions.filter(r => r.success).length,
      failedQueries: recentInteractions.filter(r => !r.success).length,
      
      avgResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      
      modeDistribution: {
        basic: recentInteractions.filter(r => r.detectedMode === 'basic').length,
        advanced: recentInteractions.filter(r => r.detectedMode === 'advanced').length
      },
      
      topQueries,
      topErrors
    };
    
    this.metrics.push(metric);
    
    // 메트릭 개수 제한
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    return metric;
  }

  /**
   * 학습 데이터 조회
   */
  getTrainingData(category?: string): AIInteractionRecord[] {
    return Array.from(this.interactions.values())
      .filter(record => {
        if (!record.isTrainingData) return false;
        if (category && record.category !== category) return false;
        return record.isCorrect === true && (record.userRating || 0) >= 4;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 성능이 좋은 응답 패턴 조회
   */
  getBestPatterns(limit: number = 20): AILearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.totalQueries >= 5 && pattern.successRate >= 0.8)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  /**
   * 개선이 필요한 패턴 조회
   */
  getWorstPatterns(limit: number = 20): AILearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.totalQueries >= 3 && pattern.successRate < 0.6)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, limit);
  }

  /**
   * 관리자 대시보드 데이터
   */
  getAdminDashboardData() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);
    
    const allInteractions = Array.from(this.interactions.values());
    const recent24h = allInteractions.filter(r => r.timestamp >= last24h);
    const recent7d = allInteractions.filter(r => r.timestamp >= last7d);
    
    return {
      overview: {
        totalInteractions: allInteractions.length,
        totalErrors: this.errors.size,
        last24hInteractions: recent24h.length,
        last7dInteractions: recent7d.length,
        successRate: allInteractions.length > 0 
          ? (allInteractions.filter(r => r.success).length / allInteractions.length) * 100 
          : 0,
        avgUserRating: this.calculateAverageRating(allInteractions)
      },
      
      recentInteractions: allInteractions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50),
      
      recentErrors: Array.from(this.errors.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20),
      
      bestPatterns: this.getBestPatterns(10),
      worstPatterns: this.getWorstPatterns(10),
      
      trainingData: this.getTrainingData().slice(0, 100),
      
      metrics: this.metrics.slice(-30) // 최근 30개 메트릭
    };
  }

  /**
   * 데이터 내보내기
   */
  exportData(type: 'interactions' | 'errors' | 'patterns' | 'all') {
    const data: any = {};
    
    if (type === 'interactions' || type === 'all') {
      data.interactions = Array.from(this.interactions.values());
    }
    
    if (type === 'errors' || type === 'all') {
      data.errors = Array.from(this.errors.values());
    }
    
    if (type === 'patterns' || type === 'all') {
      data.patterns = Array.from(this.patterns.values());
    }
    
    if (type === 'all') {
      data.metrics = this.metrics;
      data.exportedAt = new Date().toISOString();
      data.version = '1.0.0';
    }
    
    return data;
  }

  /**
   * 데이터 가져오기
   */
  importData(data: any): boolean {
    try {
      if (data.interactions) {
        data.interactions.forEach((record: AIInteractionRecord) => {
          this.interactions.set(record.id, record);
        });
      }
      
      if (data.errors) {
        data.errors.forEach((record: AIErrorRecord) => {
          this.errors.set(record.id, record);
        });
      }
      
      if (data.patterns) {
        data.patterns.forEach((pattern: AILearningPattern) => {
          this.patterns.set(pattern.pattern, pattern);
        });
      }
      
      if (data.metrics) {
        this.metrics = [...this.metrics, ...data.metrics];
      }
      
      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Data import failed:', error);
      return false;
    }
  }

  /**
   * 헬퍼 메서드들
   */
  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractPattern(query: string): string {
    // 간단한 패턴 추출 (실제로는 더 정교한 NLP 처리 필요)
    return query
      .toLowerCase()
      .replace(/[0-9]/g, '#')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  private calculateAverageRating(interactions: AIInteractionRecord[]): number {
    const rated = interactions.filter(r => r.userRating);
    if (rated.length === 0) return 0;
    
    const sum = rated.reduce((total, r) => total + (r.userRating || 0), 0);
    return Math.round((sum / rated.length) * 100) / 100;
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    // 오래된 데이터 정리 (30일 이상)
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const [id, record] of this.interactions.entries()) {
      if (record.timestamp < cutoff && !record.isTrainingData) {
        this.interactions.delete(id);
      }
    }
    
    for (const [id, record] of this.errors.entries()) {
      if (record.timestamp < cutoff && record.resolved) {
        this.errors.delete(id);
      }
    }
    
    console.log('🧹 AI Database cleanup completed');
  }
}

// 싱글톤 인스턴스
export const aiDatabase = new AIDatabase(); 