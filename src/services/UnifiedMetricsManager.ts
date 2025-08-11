/**
 * 🎯 Unified Metrics Manager - Modular Architecture v2.0
 *
 * ✅ Modularization Complete: 1024 → ~200 lines (80% reduction)
 * 🏗️ Architecture: Delegation pattern with 7 specialized modules
 * 
 * Modules:
 * - UnifiedMetricsManager.types.ts (185 lines) - Type definitions
 * - UnifiedMetricsManager.serverFactory.ts (260 lines) - Server creation logic  
 * - UnifiedMetricsManager.aiAnalyzer.ts (330 lines) - AI analysis functionality
 * - UnifiedMetricsManager.autoscaler.ts (140 lines) - Autoscaling functionality
 * - UnifiedMetricsManager.scheduler.ts (170 lines) - Timer and scheduling
 * - UnifiedMetricsManager.metricsUpdater.ts (265 lines) - Metrics generation
 * - UnifiedMetricsManager.performanceMonitor.ts (265 lines) - Performance monitoring
 *
 * Benefits:
 * - Single Responsibility Principle enforced
 * - TypeScript compilation performance improved
 * - Maintainability enhanced
 * - Code reuse maximized
 */

// Import modular components
import { getDataGeneratorConfig } from '../config/environment';
import { ServerFactory } from './UnifiedMetricsManager.serverFactory';
import { AIAnalyzer } from './UnifiedMetricsManager.aiAnalyzer';
import { Autoscaler } from './UnifiedMetricsManager.autoscaler';
import { Scheduler } from './UnifiedMetricsManager.scheduler';
import { MetricsUpdater } from './UnifiedMetricsManager.metricsUpdater';
import { PerformanceMonitor } from './UnifiedMetricsManager.performanceMonitor';
import {
  DEFAULT_METRICS_CONFIG,
  type UnifiedServerMetrics,
  type UnifiedMetricsConfig,
  type MetricsPerformanceData,
  type ServerEnvironment,
  type ServerRole,
  type ServerStatus,
} from './UnifiedMetricsManager.types';

// Re-export types for backward compatibility
export type {
  UnifiedServerMetrics,
  UnifiedMetricsConfig,
  MetricsPerformanceData,
  ServerEnvironment,
  ServerRole,
  ServerStatus,
};

// Global access configuration
if (typeof globalThis !== 'undefined') {
  (globalThis as any).getDataGeneratorConfig = getDataGeneratorConfig;
}

export class UnifiedMetricsManager {
  private static instance: UnifiedMetricsManager;
  private isRunning: boolean = false;
  private servers: Map<string, UnifiedServerMetrics> = new Map();
  private config: UnifiedMetricsConfig = DEFAULT_METRICS_CONFIG;
  private metrics: MetricsPerformanceData = {
    total_updates: 0,
    last_update: Date.now(),
    avg_processing_time: 0,
    errors_count: 0,
    ai_analysis_count: 0,
    scaling_decisions: 0,
  };

  private constructor() {
    this.initializeServers();
  }

  static getInstance(): UnifiedMetricsManager {
    if (!this.instance) {
      this.instance = new UnifiedMetricsManager();
    }
    return this.instance;
  }

  /**
   * 🚀 Start unified metrics manager
   */
  async start(): Promise<void> {
    // Skip execution on client side
    if (typeof window !== 'undefined') {
      console.log('⚠️ 클라이언트 환경: UnifiedMetricsManager 시작 건너뛰기');
      return;
    }

    if (this.isRunning) {
      console.log('⚠️ 통합 메트릭 관리자가 이미 실행 중입니다');
      return;
    }

    console.log('🚀 통합 메트릭 관리자 시작...');

    try {
      // 1. Cleanup duplicate timers
      await Scheduler.cleanupDuplicateTimers();

      // 2. Start unified schedulers
      Scheduler.startUnifiedSchedulers(this.config, {
        generateMetrics: () => this.generateMetrics(),
        performAIAnalysis: () => this.performAIAnalysis(),
        performAutoscaling: () => this.performAutoscaling(),
        monitorPerformance: () => this.monitorPerformance(),
      });

      this.isRunning = true;
      console.log('✅ 통합 메트릭 관리자 시작 완료');
    } catch (error) {
      console.error('❌ 통합 메트릭 관리자 시작 실패:', error);
      throw error;
    }
  }

  // 📊 서버 초기화 (ServerFactory 위임)
  private initializeServers(): void {
    this.servers = ServerFactory.initializeServers();
  }

  // 📊 메트릭 생성 (MetricsUpdater 위임)
  private async generateMetrics(): Promise<void> {
    await MetricsUpdater.generateMetrics(
      this.servers,
      this.config,
      this.metrics,
      async (servers: UnifiedServerMetrics[]) => await Autoscaler.simulateAutoscaling(
        this.servers, servers, this.config, 
        (id: string, env: ServerEnvironment, role: ServerRole) => ServerFactory.createServer(id, env, role)
      )
    );
  }

  // 🤖 AI 분석 (AIAnalyzer 위임)
  private async performAIAnalysis(): Promise<void> {
    if (!this.isRunning || !this.config.ai_analysis.enabled) return;
    
    const servers = Array.from(this.servers.values());
    await AIAnalyzer.performAIAnalysis(servers, this.metrics);
  }

  // 📈 성능 모니터링 (PerformanceMonitor 위임)
  private async monitorPerformance(): Promise<void> {
    await PerformanceMonitor.monitorPerformance(this.servers.size, this.metrics);
  }


  // 🛑 시스템 중지 (Scheduler 위임)
  stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 통합 메트릭 관리자 중지...');
    Scheduler.stopUnifiedSchedulers();
    this.isRunning = false;
    console.log('🛑 통합 메트릭 관리자 중지 완료');
  }

  // 📊 상태 조회
  getStatus(): {
    isRunning: boolean;
    servers_count: number;
    environment?: string;
    current_config?: unknown;
    performance_metrics?: unknown;
    last_update?: number;
    error?: boolean;
  } {
    // 클라이언트 사이드에서는 기본 상태 반환
    if (typeof window !== 'undefined') {
      return {
        isRunning: false,
        servers_count: 0,
        environment: 'client',
        performance_metrics: {
          last_update: Date.now(),
        },
      };
    }

    try {
      return {
        isRunning: this.isRunning,
        servers_count: this.servers.size,
        current_config: this.config,
        performance_metrics: this.metrics,
        last_update: Date.now(),
      };
    } catch (error) {
      console.warn('⚠️ 상태 조회 실패:', error);
      return {
        isRunning: false,
        servers_count: 0,
        error: true,
      };
    }
  }

  /**
   * 📋 서버 목록 조회 (ServerDashboard 호환, ServerFactory 위임)
   */
  getServers(): UnifiedServerMetrics[] {
    if (typeof window !== 'undefined') return [];

    if (this.servers.size === 0) {
      this.initializeServers();
    }

    return ServerFactory.formatServersForDashboard(Array.from(this.servers.values()));
  }


  // 🔧 설정 업데이트
  updateConfig(newConfig: Partial<UnifiedMetricsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 통합 메트릭 관리자 설정 업데이트됨');
  }

  // ⚖️ 자동 스케일링 (Autoscaler 위임)
  private async performAutoscaling(): Promise<void> {
    await Autoscaler.performAutoscaling(
      this.servers,
      this.config,
      this.metrics,
      (id: string, env: ServerEnvironment, role: ServerRole) => ServerFactory.createServer(id, env, role)
    );
  }
}

// 싱글톤 인스턴스
export const unifiedMetricsManager = UnifiedMetricsManager.getInstance();
