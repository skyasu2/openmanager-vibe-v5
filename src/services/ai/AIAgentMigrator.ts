/**
 * 🔄 OpenManager Vibe v5 - AI 에이전트 마이그레이션 시스템
 *
 * 기존 AI 에이전트 관리 시스템을 새로운 마스터 AI 엔진으로 통합
 * - 유닥 로그 → 사고과정 로그 변환
 * - 패턴 제안 → enhanced + prediction 엔진 연동
 * - A/B 테스트 → hybrid 엔진 실험 관리
 * - 성능 모니터링 → 14개 엔진 통합 모니터링
 */

import { AIThinkingStep } from '../../types/ai-thinking';
import { getMasterAIEngine } from './MasterAIEngine';

// 기존 AI 에이전트 데이터 타입들
export interface LegacyUserLog {
  id: string;
  action: string;
  result: string;
  success: boolean;
  responseTime: number;
  createdAt: string;
  userId?: string;
  metadata?: any;
}

export interface LegacyPattern {
  id: string;
  pattern: string;
  accuracy: number;
  usage: number;
  category: string;
  createdAt: string;
}

export interface LegacyABTest {
  id: string;
  name: string;
  strategyA: string;
  strategyB: string;
  participantsA: number;
  participantsB: number;
  successRateA: number;
  successRateB: number;
  isActive: boolean;
}

// 마이그레이션 결과 인터페이스
export interface MigrationResult {
  success: boolean;
  migratedItems: number;
  errors: string[];
  summary: {
    userLogs: number;
    patterns: number;
    abTests: number;
    performanceMetrics: number;
  };
}

export class AIAgentMigrator {
  private migrationLog: string[] = [];

  constructor() {
    this.log('🔄 AI 에이전트 마이그레이션 시스템 초기화');
  }

  /**
   * 🎯 전체 마이그레이션 실행
   */
  async migrateAll(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedItems: 0,
      errors: [],
      summary: {
        userLogs: 0,
        patterns: 0,
        abTests: 0,
        performanceMetrics: 0,
      },
    };

    try {
      this.log('🚀 전체 마이그레이션 시작');

      // 1. 유닥 로그 마이그레이션
      const logsResult = await this.migrateUserLogs();
      result.summary.userLogs = logsResult.migratedCount;
      result.migratedItems += logsResult.migratedCount;

      // 2. 패턴 제안 마이그레이션
      const patternsResult = await this.migratePatterns();
      result.summary.patterns = patternsResult.migratedCount;
      result.migratedItems += patternsResult.migratedCount;

      // 3. A/B 테스트 마이그레이션
      const abTestsResult = await this.migrateABTests();
      result.summary.abTests = abTestsResult.migratedCount;
      result.migratedItems += abTestsResult.migratedCount;

      // 4. 성능 지표 통합
      const metricsResult = await this.migratePerformanceMetrics();
      result.summary.performanceMetrics = metricsResult.migratedCount;
      result.migratedItems += metricsResult.migratedCount;

      result.success = true;
      this.log(`✅ 마이그레이션 완료: 총 ${result.migratedItems}개 항목 이전`);
    } catch (error: any) {
      result.errors.push(error.message);
      this.log(`❌ 마이그레이션 실패: ${error.message}`);
    }

    return result;
  }

  /**
   * 📝 유닥 로그 → 사고과정 로그 변환
   */
  async migrateUserLogs(): Promise<{
    migratedCount: number;
    errors: string[];
  }> {
    this.log('📝 유닥 로그 마이그레이션 시작');

    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // 기존 유닥 로그 가져오기 (모의 데이터로 시작)
      const legacyLogs = await this.getLegacyUserLogs();

      for (const log of legacyLogs) {
        try {
          // 사고과정 로그로 변환
          const thinkingStep: AIThinkingStep = {
            id: `migrated_${log.id}`,
            timestamp: log.createdAt,
            type: log.success ? 'completed' : 'error',
            title: this.convertActionToTitle(log.action),
            description: log.result,
            progress: log.success ? 100 : 0,
            duration: log.responseTime,
            metadata: {
              migrated: true,
              originalId: log.id,
              originalAction: log.action,
              userId: log.userId,
              legacy: true,
            },
          };

          // 마스터 AI 엔진에 사고과정 로그 저장
          await this.saveThinkingStep(thinkingStep);
          migratedCount++;
        } catch (error: any) {
          errors.push(`로그 ${log.id} 변환 실패: ${error.message}`);
        }
      }

      this.log(`📝 유닥 로그 마이그레이션 완료: ${migratedCount}개`);
    } catch (error: any) {
      errors.push(`유닥 로그 마이그레이션 실패: ${error.message}`);
    }

    return { migratedCount, errors };
  }

  /**
   * 🔍 패턴 제안 → Enhanced + Prediction 엔진 연동
   */
  async migratePatterns(): Promise<{
    migratedCount: number;
    errors: string[];
  }> {
    this.log('🔍 패턴 제안 마이그레이션 시작');

    const errors: string[] = [];
    let migratedCount = 0;

    try {
      const legacyPatterns = await this.getLegacyPatterns();

      for (const pattern of legacyPatterns) {
        try {
          // Enhanced 엔진에 패턴 데이터 등록
          const enhancedResult = await getMasterAIEngine().query({
            engine: 'enhanced',
            query: '패턴 학습',
            data: {
              pattern: pattern.pattern,
              category: pattern.category,
              accuracy: pattern.accuracy,
              usage: pattern.usage,
            },
            options: {
              enable_thinking_log: true,
              fuzzyThreshold: 0.6,
            },
          });

          // Prediction 엔진에 패턴 예측 데이터 등록
          const predictionResult = await getMasterAIEngine().query({
            engine: 'prediction',
            query: '패턴 예측 학습',
            data: {
              historical: [pattern.accuracy, pattern.usage],
              pattern_id: pattern.id,
              category: pattern.category,
            },
            options: {
              enable_thinking_log: true,
              steps: 5,
            },
          });

          migratedCount++;
          this.log(`✅ 패턴 ${pattern.id} 마이그레이션 완료`);
        } catch (error: any) {
          errors.push(`패턴 ${pattern.id} 변환 실패: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`패턴 마이그레이션 실패: ${error.message}`);
    }

    return { migratedCount, errors };
  }

  /**
   * 🧪 A/B 테스트 → Hybrid 엔진 실험 관리
   */
  async migrateABTests(): Promise<{ migratedCount: number; errors: string[] }> {
    this.log('🧪 A/B 테스트 마이그레이션 시작');

    const errors: string[] = [];
    let migratedCount = 0;

    try {
      const legacyTests = await this.getLegacyABTests();

      for (const test of legacyTests) {
        try {
          // Hybrid 엔진에 실험 설정 등록
          const hybridResult = await getMasterAIEngine().query({
            engine: 'hybrid',
            query: 'A/B 테스트 설정',
            data: {
              experiment_name: test.name,
              strategy_a: {
                name: test.strategyA,
                participants: test.participantsA,
                success_rate: test.successRateA,
              },
              strategy_b: {
                name: test.strategyB,
                participants: test.participantsB,
                success_rate: test.successRateB,
              },
              is_active: test.isActive,
              migrated_from: test.id,
            },
            options: {
              enable_thinking_log: true,
            },
          });

          migratedCount++;
          this.log(`✅ A/B 테스트 ${test.id} 마이그레이션 완료`);
        } catch (error: any) {
          errors.push(`A/B 테스트 ${test.id} 변환 실패: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`A/B 테스트 마이그레이션 실패: ${error.message}`);
    }

    return { migratedCount, errors };
  }

  /**
   * 📊 성능 지표 통합
   */
  async migratePerformanceMetrics(): Promise<{
    migratedCount: number;
    errors: string[];
  }> {
    this.log('📊 성능 지표 마이그레이션 시작');

    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // 기존 성능 지표를 마스터 AI 엔진 통계와 통합
      const legacyMetrics = await this.getLegacyPerformanceMetrics();

      // 각 엔진별로 성능 데이터 분배
      const engineMetrics = this.distributeMetricsToEngines(legacyMetrics);

      for (const [engine, metrics] of Object.entries(engineMetrics)) {
        try {
          // 각 엔진의 성능 기준선 설정
          await this.setupEngineBaseline(engine, metrics);
          migratedCount++;
        } catch (error: any) {
          errors.push(`엔진 ${engine} 성능 지표 설정 실패: ${error.message}`);
        }
      }

      this.log(`📊 성능 지표 마이그레이션 완료: ${migratedCount}개 엔진`);
    } catch (error: any) {
      errors.push(`성능 지표 마이그레이션 실패: ${error.message}`);
    }

    return { migratedCount, errors };
  }

  /**
   * 🔧 헬퍼 메서드들
   */
  private async getLegacyUserLogs(): Promise<LegacyUserLog[]> {
    // 실제 구현에서는 데이터베이스나 파일에서 로드
    return [
      {
        id: 'log_001',
        action: '서버 상태 확인',
        result: '30개 서버 모두 정상 동작 중',
        success: true,
        responseTime: 245,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'log_002',
        action: '패턴 분석',
        result: '3개 패턴 감지, 권장사항 생성됨',
        success: true,
        responseTime: 180,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
  }

  private async getLegacyPatterns(): Promise<LegacyPattern[]> {
    return [
      {
        id: 'pattern_001',
        pattern: 'CPU 스파이크 → 메모리 부족',
        accuracy: 92,
        usage: 15,
        category: 'performance',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }

  private async getLegacyABTests(): Promise<LegacyABTest[]> {
    return [
      {
        id: 'ab_001',
        name: '기본 응답 vs AI 강화 응답',
        strategyA: '기본 응답 전략',
        strategyB: 'AI 강화 응답',
        participantsA: 245,
        participantsB: 243,
        successRateA: 50,
        successRateB: 50,
        isActive: true,
      },
    ];
  }

  private async getLegacyPerformanceMetrics(): Promise<any> {
    return {
      total_requests: 488,
      success_rate: 36.0,
      avg_response_time: 212,
      fallback_rate: 13.0,
      active_patterns: 3,
    };
  }

  private convertActionToTitle(action: string): string {
    const titleMap: Record<string, string> = {
      '서버 상태 확인': '서버 모니터링',
      '패턴 분석': '패턴 탐지 분석',
      '성능 최적화': '시스템 성능 최적화',
      '이상 탐지': '이상 상황 탐지',
      '예측 분석': '미래 성능 예측',
    };

    return titleMap[action] || action;
  }

  private async saveThinkingStep(step: AIThinkingStep): Promise<void> {
    // 실제 구현에서는 데이터베이스에 저장
    console.log('💾 사고과정 로그 저장:', step);
  }

  private distributeMetricsToEngines(metrics: any): Record<string, any> {
    return {
      anomaly: { baseline_accuracy: 92, response_time: 50 },
      prediction: { baseline_accuracy: 88, response_time: 200 },
      enhanced: { baseline_accuracy: 85, response_time: 150 },
      korean: { baseline_accuracy: 95, response_time: 100 },
      mcp: { baseline_accuracy: 90, response_time: 240 },
      hybrid: { baseline_accuracy: 87, response_time: 300 },
    };
  }

  private async setupEngineBaseline(
    engine: string,
    metrics: any
  ): Promise<void> {
    console.log(`📊 엔진 ${engine} 기준선 설정:`, metrics);
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.migrationLog.push(logMessage);
    console.log(logMessage);
  }

  /**
   * 📋 마이그레이션 로그 반환
   */
  getMigrationLog(): string[] {
    return [...this.migrationLog];
  }

  /**
   * 🧹 마이그레이션 정리
   */
  cleanup(): void {
    this.migrationLog = [];
    console.log('🧹 AI 에이전트 마이그레이션 정리 완료');
  }
}

// 싱글톤 인스턴스
export const aiAgentMigrator = new AIAgentMigrator();
