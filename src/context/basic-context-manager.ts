/**
 * 🔧 기본 컨텍스트 관리자 (Redis-Free Level 1)
 *
 * ✅ CPU/메모리/디스크/알림 상태 실시간 수집
 * ✅ 메모리 기반 캐시 사용 (Redis 대체)
 * ✅ Supabase 영구 저장 옵션
 * ✅ 자동 갱신 & 만료 처리
 */

import { createClient } from '@supabase/supabase-js';

export interface BasicSystemMetrics {
  cpu: {
    usage: number;
    load: number[];
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
    swap?: {
      used: number;
      total: number;
    };
  };
  disk: {
    used: number;
    total: number;
    available: number;
    percentage: number;
    iops?: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    latency?: number;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
    recent: Alert[];
  };
  timestamp: number;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  source: string;
  timestamp: number;
  resolved?: boolean;
}

export interface BasicContextCache {
  current: BasicSystemMetrics;
  history: BasicSystemMetrics[];
  trends: {
    cpu: number[];
    memory: number[];
    disk: number[];
  };
  lastUpdate: number;
}

// 메모리 기반 캐시 클래스
class MemoryCache {
  private cache = new Map<string, { value: unknown; expires: number }>();

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class BasicContextManager {
  private memoryCache: MemoryCache;
  private supabase: ReturnType<typeof createClient> | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_KEY = 'openmanager:basic_context';
  private readonly TTL = 300; // 5분
  private readonly MAX_HISTORY = 100; // 최대 100개 히스토리 유지

  constructor() {
    // 메모리 캐시 초기화
    this.memoryCache = new MemoryCache();

    // Supabase 연결 (환경변수 있을 때만)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }

    console.log('🔧 BasicContextManager 초기화 완료');
    console.log(`📦 캐시: Memory${this.supabase ? ' + Supabase' : ' Only'}`);
  }

  /**
   * 🚀 기본 컨텍스트 수집 시작
   */
  async startCollection(intervalMs: number = 30000): Promise<void> {
    console.log('🔄 [BasicContext] 기본 컨텍스트 수집 시작');

    // 초기 수집
    await this.updateBasicContext();

    // 정기 업데이트 설정
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateBasicContext();
      } catch (error) {
        console.error('❌ [BasicContext] 정기 업데이트 실패:', error);
      }
    }, intervalMs);
  }

  /**
   * 🛑 수집 중지
   */
  stopCollection(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ [BasicContext] 기본 컨텍스트 수집 중지');
    }
  }

  /**
   * 📊 시스템 메트릭 수집
   */
  private async collectSystemMetrics(): Promise<BasicSystemMetrics> {
    const timestamp = Date.now();

    // Node.js 프로세스 정보 기반 메트릭 수집
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // 기본 메트릭 구성 (실제 시스템 모니터링 도구와 연동 필요)
    const metrics: BasicSystemMetrics = {
      cpu: {
        usage: this.calculateCpuUsage(cpuUsage),
        load: [0.5, 0.7, 0.9], // 1분, 5분, 15분 로드
        cores: 4, // 기본값
        temperature: undefined,
      },
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        available: memUsage.heapTotal - memUsage.heapUsed,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        swap: {
          used: 0,
          total: 0,
        },
      },
      disk: {
        used: 0,
        total: 100 * 1024 * 1024 * 1024, // 100GB 기본값
        available: 50 * 1024 * 1024 * 1024, // 50GB 기본값
        percentage: 50,
        iops: undefined,
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
        latency: undefined,
      },
      alerts: {
        active: 0,
        critical: 0,
        warning: 0,
        recent: [],
      },
      timestamp,
    };

    // 실제 시스템 정보 수집 (가능한 경우)
    await this.enrichWithSystemInfo(metrics);

    return metrics;
  }

  /**
   * 🔍 시스템 정보 보강
   */
  private async enrichWithSystemInfo(
    metrics: BasicSystemMetrics
  ): Promise<void> {
    try {
      // 실제 시스템 API 호출로 메트릭 수집
      const response = await fetch('/api/system/metrics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const systemData = await response.json();

        // 수집된 시스템 데이터로 메트릭 업데이트
        if (systemData.cpu) {
          metrics.cpu = { ...metrics.cpu, ...systemData.cpu };
        }
        if (systemData.memory) {
          metrics.memory = { ...metrics.memory, ...systemData.memory };
        }
        if (systemData.disk) {
          metrics.disk = { ...metrics.disk, ...systemData.disk };
        }
        if (systemData.network) {
          metrics.network = { ...metrics.network, ...systemData.network };
        }
      }
    } catch (error) {
      // 시스템 API 실패 시 기본값 사용
      console.warn(
        '⚠️ [BasicContext] 시스템 API 호출 실패, 기본값 사용:',
        error
      );
    }
  }

  /**
   * 💾 기본 컨텍스트 업데이트
   */
  private async updateBasicContext(): Promise<void> {
    try {
      const newMetrics = await this.collectSystemMetrics();

      // 기존 캐시 조회
      const cachedData = this.memoryCache.get<BasicContextCache>(this.CACHE_KEY);

      let contextCache: BasicContextCache;

      if (cachedData) {
        // 기존 데이터 업데이트
        contextCache = {
          current: newMetrics,
          history: [...cachedData.history, newMetrics].slice(-this.MAX_HISTORY),
          trends: this.updateTrends(cachedData.trends, newMetrics),
          lastUpdate: Date.now(),
        };
      } else {
        // 새로운 데이터 생성
        contextCache = {
          current: newMetrics,
          history: [newMetrics],
          trends: {
            cpu: [newMetrics.cpu.usage],
            memory: [newMetrics.memory.percentage],
            disk: [newMetrics.disk.percentage],
          },
          lastUpdate: Date.now(),
        };
      }

      // 메모리 캐시에 저장
      this.memoryCache.set(this.CACHE_KEY, contextCache, this.TTL);

      // Supabase에 영구 저장 (선택사항)
      if (this.supabase) {
        await this.saveToSupabase(newMetrics);
      }

      console.log('✅ [BasicContext] 기본 컨텍스트 업데이트 완료');
    } catch (error) {
      console.error('❌ [BasicContext] 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 💾 Supabase 영구 저장
   */
  private async saveToSupabase(metrics: BasicSystemMetrics): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('system_metrics')
        .insert([{
          timestamp: new Date(metrics.timestamp).toISOString(),
          cpu_usage: metrics.cpu.usage,
          cpu_load: metrics.cpu.load,
          memory_used: metrics.memory.used,
          memory_total: metrics.memory.total,
          memory_percentage: metrics.memory.percentage,
          disk_used: metrics.disk.used,
          disk_total: metrics.disk.total,
          disk_percentage: metrics.disk.percentage,
          network_bytes_in: metrics.network.bytesIn,
          network_bytes_out: metrics.network.bytesOut,
          alerts_active: metrics.alerts.active,
          alerts_critical: metrics.alerts.critical,
          alerts_warning: metrics.alerts.warning,
        }]);

      if (error) {
        console.warn('⚠️ [BasicContext] Supabase 저장 실패:', error);
      }
    } catch (error) {
      console.warn('⚠️ [BasicContext] Supabase 저장 오류:', error);
    }
  }

  /**
   * 📈 트렌드 데이터 업데이트
   */
  private updateTrends(
    currentTrends: BasicContextCache['trends'],
    newMetrics: BasicSystemMetrics
  ): BasicContextCache['trends'] {
    const maxTrendPoints = 35; // 무료 티어 최적화: 실용성과 효율성 균형

    return {
      cpu: [...currentTrends.cpu, newMetrics.cpu.usage].slice(-maxTrendPoints),
      memory: [...currentTrends.memory, newMetrics.memory.percentage].slice(
        -maxTrendPoints
      ),
      disk: [...currentTrends.disk, newMetrics.disk.percentage].slice(
        -maxTrendPoints
      ),
    };
  }

  /**
   * 🔄 CPU 사용률 계산
   */
  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // Node.js CPU 사용률을 백분율로 변환
    const total = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (total / 1000000) % 100); // 마이크로초를 백분율로 변환
  }

  /**
   * 📖 현재 기본 컨텍스트 조회
   */
  async getCurrentContext(): Promise<BasicContextCache | null> {
    try {
      const cached = this.memoryCache.get<BasicContextCache>(this.CACHE_KEY);
      return cached || null;
    } catch (error) {
      console.error('❌ [BasicContext] 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🚨 알림 추가
   */
  async addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<void> {
    try {
      const newAlert: Alert = {
        ...alert,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      const contextCache = await this.getCurrentContext();
      if (contextCache) {
        contextCache.current.alerts.recent.unshift(newAlert);
        contextCache.current.alerts.recent =
          contextCache.current.alerts.recent.slice(0, 20); // 최대 20개 유지

        // 알림 카운트 업데이트
        contextCache.current.alerts.active++;
        if (alert.level === 'critical') {
          contextCache.current.alerts.critical++;
        } else if (alert.level === 'warning') {
          contextCache.current.alerts.warning++;
        }

        this.memoryCache.set(this.CACHE_KEY, contextCache, this.TTL);
      }

      console.log(
        `🚨 [BasicContext] ${alert.level} 알림 추가: ${alert.message}`
      );
    } catch (error) {
      console.error('❌ [BasicContext] 알림 추가 실패:', error);
    }
  }

  /**
   * 📊 시스템 상태 요약
   */
  async getSystemSummary(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const context = await this.getCurrentContext();

    if (!context) {
      return {
        status: 'critical',
        score: 0,
        issues: ['기본 컨텍스트 데이터를 조회할 수 없음'],
        recommendations: ['시스템 모니터링을 다시 시작하세요'],
      };
    }

    const { current } = context;
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // CPU 상태 확인
    if (current.cpu.usage > 90) {
      issues.push(`CPU 사용률 높음 (${current.cpu.usage.toFixed(1)}%)`);
      recommendations.push(
        '불필요한 프로세스를 종료하거나 스케일링을 고려하세요'
      );
      score -= 30;
    } else if (current.cpu.usage > 70) {
      issues.push(`CPU 사용률 주의 필요 (${current.cpu.usage.toFixed(1)}%)`);
      recommendations.push('CPU 사용률을 모니터링하세요');
      score -= 15;
    }

    // 메모리 상태 확인
    if (current.memory.percentage > 90) {
      issues.push(
        `메모리 사용률 높음 (${current.memory.percentage.toFixed(1)}%)`
      );
      recommendations.push('메모리 정리 또는 추가 메모리를 고려하세요');
      score -= 25;
    } else if (current.memory.percentage > 80) {
      issues.push(
        `메모리 사용률 주의 필요 (${current.memory.percentage.toFixed(1)}%)`
      );
      recommendations.push('메모리 사용률을 모니터링하세요');
      score -= 10;
    }

    // 디스크 상태 확인
    if (current.disk.percentage > 95) {
      issues.push(
        `디스크 사용률 위험 (${current.disk.percentage.toFixed(1)}%)`
      );
      recommendations.push('즉시 디스크 공간을 확보하세요');
      score -= 20;
    } else if (current.disk.percentage > 85) {
      issues.push(
        `디스크 사용률 높음 (${current.disk.percentage.toFixed(1)}%)`
      );
      recommendations.push('디스크 정리를 고려하세요');
      score -= 10;
    }

    // 알림 상태 확인
    if (current.alerts.critical > 0) {
      issues.push(`${current.alerts.critical}개의 중요 알림`);
      recommendations.push('중요 알림을 즉시 확인하고 조치하세요');
      score -= 15;
    }
    if (current.alerts.warning > 5) {
      issues.push(`${current.alerts.warning}개의 경고 알림`);
      recommendations.push('경고 알림을 검토하세요');
      score -= 5;
    }

    // 상태 결정
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 60) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  /**
   * 🧹 캐시 정리
   */
  async clearCache(): Promise<void> {
    try {
      this.memoryCache.delete(this.CACHE_KEY);
      console.log('🧹 [BasicContext] 캐시 정리 완료');
    } catch (error) {
      console.error('❌ [BasicContext] 캐시 정리 실패:', error);
    }
  }
}