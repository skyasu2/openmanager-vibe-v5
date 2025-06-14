/**
 * 📊 AI Engine Statistics Manager
 *
 * ⚠️ 중요: 이 파일은 UnifiedAIEngine 핵심 모듈입니다 - 삭제 금지!
 *
 * AI 엔진 통계 관리 전용 서비스
 * - 엔진별 성능 통계 추적
 * - 응답 시간 및 성공률 모니터링
 * - 메모리 사용량 추적
 *
 * 📍 사용처:
 * - src/core/ai/UnifiedAIEngine.ts (메인 엔진)
 * - src/core/ai/components/EngineManager.ts
 *
 * 🔄 의존성:
 * - ../types/unified-ai.types (타입 정의)
 *
 * 📅 생성일: 2025.06.14 (UnifiedAIEngine 1102줄 분리 작업)
 */

import { EngineStatus, EngineStats } from '../types/unified-ai.types';

export class EngineStatsManager {
  private static instance: EngineStatsManager | null = null;
  private engineStats: Map<string, EngineStats> = new Map();
  private engineList: string[] = [
    'google-ai',
    'mcp',
    'rag',
    'custom-intent',
    'custom-analysis',
    'custom-recommendation',
    'opensource-nlp',
    'opensource-sentiment',
    'opensource-classification',
    'opensource-summarization',
    'opensource-qa',
  ];

  private constructor() {
    this.initializeEngineStats();
  }

  public static getInstance(): EngineStatsManager {
    if (!EngineStatsManager.instance) {
      EngineStatsManager.instance = new EngineStatsManager();
    }
    return EngineStatsManager.instance;
  }

  /**
   * 엔진 통계 초기화
   */
  private initializeEngineStats(): void {
    this.engineList.forEach(engine => {
      this.engineStats.set(engine, {
        calls: 0,
        successes: 0,
        totalTime: 0,
        lastUsed: 0,
      });
    });
    console.log(`📊 ${this.engineList.length}개 엔진 통계 초기화 완료`);
  }

  /**
   * 엔진 통계 업데이트
   */
  public updateEngineStats(
    engine: string,
    responseTime: number,
    success: boolean
  ): void {
    const stats = this.engineStats.get(engine);
    if (!stats) {
      // 새로운 엔진이면 초기화
      this.engineStats.set(engine, {
        calls: 1,
        successes: success ? 1 : 0,
        totalTime: responseTime,
        lastUsed: Date.now(),
      });
      return;
    }

    stats.calls++;
    if (success) stats.successes++;
    stats.totalTime += responseTime;
    stats.lastUsed = Date.now();

    console.log(
      `📈 ${engine} 통계 업데이트: ${stats.successes}/${stats.calls} (${Math.round((stats.successes / stats.calls) * 100)}%)`
    );
  }

  /**
   * 모든 엔진 상태 조회
   */
  public getEngineStatuses(): EngineStatus[] {
    return this.engineList.map(engine => {
      const stats = this.engineStats.get(engine);
      if (!stats) {
        return {
          name: engine,
          status: 'disabled',
          last_used: 0,
          success_rate: 0,
          avg_response_time: 0,
          memory_usage: '0MB',
        };
      }

      return {
        name: engine,
        status: this.getEngineStatus(engine),
        last_used: stats.lastUsed,
        success_rate: stats.calls > 0 ? stats.successes / stats.calls : 0,
        avg_response_time: stats.calls > 0 ? stats.totalTime / stats.calls : 0,
        memory_usage: this.getEngineMemoryUsage(engine),
      };
    });
  }

  /**
   * 개별 엔진 상태 확인
   */
  private getEngineStatus(
    engine: string
  ): 'ready' | 'loading' | 'error' | 'disabled' {
    const stats = this.engineStats.get(engine);
    if (!stats) return 'disabled';

    // 최근 5분 내 사용되었고 성공률이 50% 이상이면 ready
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (
      stats.lastUsed > fiveMinutesAgo &&
      stats.successes / stats.calls >= 0.5
    ) {
      return 'ready';
    }

    // 성공률이 낮으면 error
    if (stats.calls > 5 && stats.successes / stats.calls < 0.3) {
      return 'error';
    }

    return 'ready';
  }

  /**
   * 엔진별 메모리 사용량 추정
   */
  private getEngineMemoryUsage(engine: string): string {
    const memoryMap: Record<string, string> = {
      'google-ai': '15MB',
      mcp: '12MB',
      rag: '25MB',
      'custom-intent': '8MB',
      'custom-analysis': '10MB',
      'custom-recommendation': '6MB',
      'opensource-nlp': '20MB',
      'opensource-sentiment': '5MB',
      'opensource-classification': '7MB',
      'opensource-summarization': '12MB',
      'opensource-qa': '15MB',
    };

    return memoryMap[engine] || '5MB';
  }

  /**
   * 전체 통계 요약
   */
  public getOverallStats(): {
    totalCalls: number;
    totalSuccesses: number;
    overallSuccessRate: number;
    averageResponseTime: number;
    activeEngines: number;
  } {
    let totalCalls = 0;
    let totalSuccesses = 0;
    let totalTime = 0;
    let activeEngines = 0;

    for (const stats of this.engineStats.values()) {
      totalCalls += stats.calls;
      totalSuccesses += stats.successes;
      totalTime += stats.totalTime;
      if (stats.calls > 0) activeEngines++;
    }

    return {
      totalCalls,
      totalSuccesses,
      overallSuccessRate: totalCalls > 0 ? totalSuccesses / totalCalls : 0,
      averageResponseTime: totalCalls > 0 ? totalTime / totalCalls : 0,
      activeEngines,
    };
  }

  /**
   * 특정 엔진 통계 조회
   */
  public getEngineStats(engine: string): EngineStats | null {
    return this.engineStats.get(engine) || null;
  }

  /**
   * 통계 초기화
   */
  public resetStats(): void {
    this.engineStats.clear();
    this.initializeEngineStats();
    console.log('📊 모든 엔진 통계 초기화 완료');
  }

  /**
   * 인스턴스 정리
   */
  public destroy(): void {
    this.engineStats.clear();
    EngineStatsManager.instance = null;
  }
}
