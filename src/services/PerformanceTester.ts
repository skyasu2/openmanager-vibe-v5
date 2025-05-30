/**
 * 🚀 Performance Tester v2.0
 * 
 * OpenManager AI v5.12.0 - 고성능 부하 테스트 도구
 * - 메모리 사용률 모니터링
 * - Redis 성능 테스트
 * - API 응답시간 측정
 * - 동시 접속 부하 테스트
 * - 자동 성능 최적화 권장사항
 */

import { memoryOptimizer } from '../utils/MemoryOptimizer';
import { cacheService } from './cacheService';
import { redisConnectionManager } from './RedisConnectionManager';

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    usagePercent: number;
  };
  apiResponseTimes: {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  redisMetrics?: {
    connected: boolean;
    responseTime: number;
    memoryUsage?: number;
    connectedClients?: number;
  };
  throughput: {
    requestsPerSecond: number;
    totalRequests: number;
  };
}

interface LoadTestConfig {
  duration: number; // 테스트 지속 시간 (초)
  concurrency: number; // 동시 요청 수
  requestsPerSecond: number; // 초당 요청 수
  endpoints: string[]; // 테스트할 엔드포인트
}

interface LoadTestResult {
  config: LoadTestConfig;
  metrics: PerformanceMetrics[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  recommendations: string[];
}

export class PerformanceTester {
  private static instance: PerformanceTester;
  private isRunning: boolean = false;
  private metrics: PerformanceMetrics[] = [];
  private responseTimes: number[] = [];

  static getInstance(): PerformanceTester {
    if (!this.instance) {
      this.instance = new PerformanceTester();
    }
    return this.instance;
  }

  /**
   * 🔍 현재 성능 메트릭 수집
   */
  async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    const memoryStats = memoryOptimizer.getCurrentMemoryStats();
    
    // Redis 메트릭 수집
    let redisMetrics;
    try {
      if (redisConnectionManager.isRedisConnected()) {
        const healthCheck = await redisConnectionManager.performHealthCheck();
        redisMetrics = {
          connected: true,
          responseTime: healthCheck.responseTime,
          memoryUsage: healthCheck.memoryUsage,
          connectedClients: healthCheck.connectedClients
        };
      } else {
        redisMetrics = { connected: false, responseTime: 0 };
      }
    } catch (error) {
      redisMetrics = { connected: false, responseTime: 0 };
    }

    // API 응답시간 통계
    const apiResponseTimes = this.calculateResponseTimeStats();

    return {
      timestamp: Date.now(),
      memoryUsage: {
        heapUsed: memoryStats.heapUsed,
        heapTotal: memoryStats.heapTotal,
        rss: memoryStats.rss,
        usagePercent: memoryStats.usagePercent
      },
      apiResponseTimes,
      redisMetrics,
      throughput: {
        requestsPerSecond: this.calculateCurrentThroughput(),
        totalRequests: this.responseTimes.length
      }
    };
  }

  /**
   * 📊 응답시간 통계 계산
   */
  private calculateResponseTimeStats(): {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    if (this.responseTimes.length === 0) {
      return { average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      average: sorted.reduce((a, b) => a + b, 0) / len,
      min: sorted[0],
      max: sorted[len - 1],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  /**
   * 📈 현재 처리량 계산
   */
  private calculateCurrentThroughput(): number {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // 최근 1초간의 요청 수 계산
    const recentRequests = this.metrics.filter(m => m.timestamp > oneSecondAgo);
    return recentRequests.length;
  }

  /**
   * 🚀 부하 테스트 실행
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('🚀 부하 테스트 시작:', config);
    
    this.isRunning = true;
    this.metrics = [];
    this.responseTimes = [];

    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const allResponseTimes: number[] = [];

    // 메트릭 수집 인터벌 - 성능 최적화
    const metricsInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      const metrics = await this.collectCurrentMetrics();
      this.metrics.push(metrics);
    }, 5000); // 5초마다 수집 (1초 → 5초로 최적화)

    // 부하 생성
    const loadPromises: Promise<void>[] = [];
    
    for (let i = 0; i < config.concurrency; i++) {
      const promise = this.generateLoad(config, endTime, (responseTime, success) => {
        totalRequests++;
        allResponseTimes.push(responseTime);
        
        if (success) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      });
      
      loadPromises.push(promise);
    }

    // 모든 부하 생성 완료 대기
    await Promise.all(loadPromises);
    
    clearInterval(metricsInterval);
    this.isRunning = false;

    // 최종 메트릭 수집
    const finalMetrics = await this.collectCurrentMetrics();
    this.metrics.push(finalMetrics);

    // 결과 분석
    const summary = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length,
      maxResponseTime: Math.max(...allResponseTimes),
      minResponseTime: Math.min(...allResponseTimes),
      throughput: totalRequests / config.duration,
      errorRate: (failedRequests / totalRequests) * 100
    };

    const recommendations = this.generateRecommendations(summary, this.metrics);

    console.log('✅ 부하 테스트 완료:', summary);

    return {
      config,
      metrics: this.metrics,
      summary,
      recommendations
    };
  }

  /**
   * ⚡ 부하 생성
   */
  private async generateLoad(
    config: LoadTestConfig,
    endTime: number,
    onRequest: (responseTime: number, success: boolean) => void
  ): Promise<void> {
    const requestInterval = 1000 / config.requestsPerSecond;
    
    while (Date.now() < endTime && this.isRunning) {
      const startTime = Date.now();
      
      try {
        // 랜덤 엔드포인트 선택
        const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
        
        // API 요청 실행
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const responseTime = Date.now() - startTime;
        const success = response.ok;
        
        onRequest(responseTime, success);
        this.responseTimes.push(responseTime);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        onRequest(responseTime, false);
        console.error('❌ 요청 실패:', error);
      }
      
      // 요청 간격 조절
      await new Promise(resolve => setTimeout(resolve, requestInterval));
    }
  }

  /**
   * 💡 성능 최적화 권장사항 생성
   */
  private generateRecommendations(
    summary: LoadTestResult['summary'],
    metrics: PerformanceMetrics[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 메모리 사용률 분석
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage.usagePercent, 0) / metrics.length;
    if (avgMemoryUsage > 80) {
      recommendations.push('🧠 메모리 사용률이 높습니다. 메모리 최적화를 실행하세요.');
    }
    
    // 응답시간 분석
    if (summary.averageResponseTime > 1000) {
      recommendations.push('⏱️ 평균 응답시간이 1초를 초과합니다. API 최적화가 필요합니다.');
    }
    
    // 에러율 분석
    if (summary.errorRate > 5) {
      recommendations.push('❌ 에러율이 5%를 초과합니다. 시스템 안정성을 점검하세요.');
    }
    
    // 처리량 분석
    if (summary.throughput < 100) {
      recommendations.push('📈 처리량이 낮습니다. 서버 스케일링을 고려하세요.');
    }
    
    // Redis 성능 분석
    const redisMetrics = metrics.filter(m => m.redisMetrics?.connected);
    if (redisMetrics.length > 0) {
      const avgRedisResponseTime = redisMetrics.reduce((sum, m) => sum + (m.redisMetrics?.responseTime || 0), 0) / redisMetrics.length;
      if (avgRedisResponseTime > 100) {
        recommendations.push('🔥 Redis 응답시간이 느립니다. Redis 최적화가 필요합니다.');
      }
    } else {
      recommendations.push('🔌 Redis 연결이 불안정합니다. 연결 상태를 확인하세요.');
    }
    
    // 일반적인 권장사항
    if (recommendations.length === 0) {
      recommendations.push('✅ 시스템 성능이 양호합니다. 현재 설정을 유지하세요.');
    }
    
    return recommendations;
  }

  /**
   * 🔧 자동 성능 최적화 실행
   */
  async performAutoOptimization(): Promise<{
    memoryOptimization: any;
    cacheOptimization: boolean;
    redisReconnection: boolean;
  }> {
    console.log('🔧 자동 성능 최적화 시작...');
    
    const results = {
      memoryOptimization: null as any,
      cacheOptimization: false,
      redisReconnection: false
    };

    try {
      // 1. 메모리 최적화
      const memoryStats = memoryOptimizer.getCurrentMemoryStats();
      if (memoryStats.usagePercent > 75) {
        console.log('🧠 메모리 최적화 실행...');
        results.memoryOptimization = await memoryOptimizer.performAggressiveOptimization();
      }

      // 2. 캐시 최적화
      try {
        await cacheService.invalidateCache('*temp*');
        await cacheService.invalidateCache('*old*');
        results.cacheOptimization = true;
        console.log('🗑️ 캐시 최적화 완료');
      } catch (error) {
        console.error('❌ 캐시 최적화 실패:', error);
      }

      // 3. Redis 재연결 (필요시)
      if (!redisConnectionManager.isRedisConnected()) {
        console.log('🔄 Redis 재연결 시도...');
        results.redisReconnection = await redisConnectionManager.reconnect();
      }

      console.log('✅ 자동 성능 최적화 완료:', results);
      return results;

    } catch (error) {
      console.error('❌ 자동 성능 최적화 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 성능 리포트 생성
   */
  generatePerformanceReport(testResult: LoadTestResult): string {
    const { config, summary, recommendations } = testResult;
    
    return `
# 🚀 OpenManager 성능 테스트 리포트

## 📋 테스트 설정
- **지속 시간**: ${config.duration}초
- **동시 접속**: ${config.concurrency}명
- **초당 요청**: ${config.requestsPerSecond}req/s
- **테스트 엔드포인트**: ${config.endpoints.length}개

## 📊 성능 결과
- **총 요청 수**: ${summary.totalRequests.toLocaleString()}
- **성공 요청**: ${summary.successfulRequests.toLocaleString()} (${((summary.successfulRequests/summary.totalRequests)*100).toFixed(1)}%)
- **실패 요청**: ${summary.failedRequests.toLocaleString()} (${summary.errorRate.toFixed(1)}%)
- **평균 응답시간**: ${summary.averageResponseTime.toFixed(0)}ms
- **최대 응답시간**: ${summary.maxResponseTime.toFixed(0)}ms
- **최소 응답시간**: ${summary.minResponseTime.toFixed(0)}ms
- **처리량**: ${summary.throughput.toFixed(1)} req/s

## 💡 최적화 권장사항
${recommendations.map(rec => `- ${rec}`).join('\n')}

## 📈 성능 등급
${this.calculatePerformanceGrade(summary)}
    `.trim();
  }

  /**
   * 🏆 성능 등급 계산
   */
  private calculatePerformanceGrade(summary: LoadTestResult['summary']): string {
    let score = 100;
    
    // 응답시간 점수 (40점)
    if (summary.averageResponseTime > 2000) score -= 40;
    else if (summary.averageResponseTime > 1000) score -= 20;
    else if (summary.averageResponseTime > 500) score -= 10;
    
    // 에러율 점수 (30점)
    if (summary.errorRate > 10) score -= 30;
    else if (summary.errorRate > 5) score -= 15;
    else if (summary.errorRate > 1) score -= 5;
    
    // 처리량 점수 (30점)
    if (summary.throughput < 50) score -= 30;
    else if (summary.throughput < 100) score -= 15;
    else if (summary.throughput < 200) score -= 5;
    
    if (score >= 90) return '🏆 **A등급** - 우수한 성능';
    if (score >= 80) return '🥈 **B등급** - 양호한 성능';
    if (score >= 70) return '🥉 **C등급** - 보통 성능';
    if (score >= 60) return '⚠️ **D등급** - 개선 필요';
    return '❌ **F등급** - 심각한 성능 문제';
  }

  /**
   * 🛑 테스트 중지
   */
  stopTest(): void {
    this.isRunning = false;
    console.log('🛑 부하 테스트 중지됨');
  }

  /**
   * 📈 실시간 메트릭 조회
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * 🔍 테스트 상태 확인
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }
}

// 싱글톤 인스턴스 export
export const performanceTester = PerformanceTester.getInstance(); 