/**
 * 🗂️ 기본 컨텍스트 관리자 (Level 1) - Mock 시스템 기반
 *
 * ✅ 서버 목록, 기본 설정, FAQ, 가이드 수집
 * ✅ Memory + Mock 시스템 하이브리드 캐싱
 * ✅ 실시간 업데이트 (5분 간격)
 * ✅ 자동 컨텍스트 최적화
 */

import { getMockSystem } from '@/mock';

// 컨텍스트 인터페이스
export interface BasicContextData {
  servers: {
    total: number;
    online: number;
    offline: number;
    warning: number;
    critical: number;
    list: Array<{
      id: string;
      name: string;
      status: 'online' | 'offline' | 'warning' | 'critical';
      ip: string;
      os: string;
      lastUpdate: number;
    }>;
  };
  alerts: {
    total: number;
    recent: Array<{
      id: string;
      type: 'cpu' | 'memory' | 'disk' | 'network';
      severity: 'warning' | 'critical';
      message: string;
      server: string;
      timestamp: number;
    }>;
  };
  guides: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    priority: number;
    lastUpdate: number;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    popularity: number;
  }>;
  settings: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
    notifications: boolean;
    refreshInterval: number;
  };
  lastUpdated: number;
  version: string;
}

// 메모리 캐시 관리
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly MAX_SIZE = 1000;

  set(key: string, data: any, ttlSeconds: number = 300): void {
    // LRU 정책으로 크기 제한
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export class BasicContextManager {
  private memoryCache: MemoryCache;
  private mockSystem: ReturnType<typeof getMockSystem>;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_KEY = 'openmanager:basic_context';
  private readonly TTL = 300; // 5분
  private readonly MAX_HISTORY = 100; // 최대 100개 히스토리 유지

  constructor() {
    // 메모리 캐시 초기화
    this.memoryCache = new MemoryCache();

    // Mock 시스템 초기화
    try {
      this.mockSystem = getMockSystem();
      console.log('✅ BasicContextManager - Mock 시스템 연결 성공');
    } catch (error) {
      console.warn(
        '⚠️ BasicContextManager - Mock 시스템 초기화 실패, 기본 데이터 사용:',
        error
      );
      // 폴백으로 다시 시도
      this.mockSystem = getMockSystem();
    }

    console.log('🔧 BasicContextManager 초기화 완료');
    console.log('📦 캐시: Memory + Mock System');
  }

  /**
   * 🚀 기본 컨텍스트 수집 시작
   */
  async startContextCollection(): Promise<void> {
    console.log('🚀 BasicContextManager 컨텍스트 수집 시작');

    // 즉시 한 번 실행
    await this.collectBasicContext();

    // 주기적 업데이트 (5분마다)
    this.updateInterval = setInterval(
      async () => {
        try {
          await this.collectBasicContext();
        } catch (error) {
          console.error('❌ BasicContextManager 주기적 업데이트 실패:', error);
        }
      },
      5 * 60 * 1000
    ); // 5분

    console.log('✅ BasicContextManager 주기적 업데이트 시작 (5분 간격)');
  }

  /**
   * 🛑 컨텍스트 수집 중지
   */
  stopContextCollection(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('🛑 BasicContextManager 주기적 업데이트 중지');
    }
  }

  /**
   * 📦 기본 컨텍스트 수집
   */
  async collectBasicContext(): Promise<BasicContextData> {
    try {
      console.log('📦 BasicContextManager 기본 컨텍스트 수집 중...');

      // 먼저 캐시에서 확인
      const cached = this.memoryCache.get<BasicContextData>(this.CACHE_KEY);
      if (cached && this.isCacheValid(cached)) {
        console.log('💨 캐시된 컨텍스트 반환');
        return cached;
      }

      // 새로운 컨텍스트 수집
      const context = await this.gatherFreshContext();

      // 캐시에 저장
      this.memoryCache.set(this.CACHE_KEY, context, this.TTL);

      console.log('✅ 기본 컨텍스트 수집 완료 (Mock 시스템 기반)');
      return context;
    } catch (error) {
      console.error('❌ 기본 컨텍스트 수집 실패:', error);

      // 폴백: 오래된 캐시라도 반환
      const fallbackCache = this.memoryCache.get<BasicContextData>(
        this.CACHE_KEY
      );
      if (fallbackCache) {
        console.log('🔄 폴백: 오래된 캐시 데이터 반환');
        return fallbackCache;
      }

      // 최후 폴백: 기본 데이터
      return this.getDefaultContext();
    }
  }

  /**
   * 🆕 신선한 컨텍스트 수집
   */
  private async gatherFreshContext(): Promise<BasicContextData> {
    // 병렬 데이터 수집으로 성능 최적화
    const [servers, alerts, guides, faqs, settings] = await Promise.allSettled([
      this.collectServersData(),
      this.collectAlertsData(),
      this.collectGuidesData(),
      this.collectFaqsData(),
      this.collectSettingsData(),
    ]);

    return {
      servers: this.extractResult(servers, this.getDefaultServersData()),
      alerts: this.extractResult(alerts, this.getDefaultAlertsData()),
      guides: this.extractResult(guides, []),
      faqs: this.extractResult(faqs, []),
      settings: this.extractResult(settings, this.getDefaultSettings()),
      lastUpdated: Date.now(),
      version: '1.0.0',
    };
  }

  /**
   * 🔍 Promise.allSettled 결과 추출
   */
  private extractResult<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }

  /**
   * 🖥️ 서버 데이터 수집 (Mock 시스템 기반)
   */
  private async collectServersData() {
    try {
      const servers = this.mockSystem.getServers();
      console.log(`📊 Mock 시스템에서 ${servers.length}개 서버 데이터 로드됨`);

      const statusCounts = {
        online: servers.filter((s) => s.status === 'online').length,
        offline: servers.filter((s) => s.status === 'offline').length,
        warning: servers.filter((s) => s.status === 'warning').length,
        critical: servers.filter((s) => s.status === 'critical').length,
      };

      return {
        total: servers.length,
        ...statusCounts,
        list: servers.slice(0, 100).map((server) => ({  // 최대 100개만
          id: server.id,
          name: server.name || 'Unknown',
          status: server.status || 'offline',
          ip: server.ip || 'N/A',
          os: server.os || 'Unknown',
          lastUpdate: server.lastUpdate ? new Date(server.lastUpdate).getTime() : Date.now(),
        })),
      };
    } catch (error) {
      console.warn('⚠️ Mock 시스템 서버 데이터 수집 실패, 기본 데이터 사용:', error);
      return this.getDefaultServersData();
    }
  }

  /**
   * 🚨 알림 데이터 수집 (Mock 데이터 기반)
   */
  private async collectAlertsData() {
    try {
      // Mock 시스템에서 critical/warning 서버를 기반으로 알림 생성
      const servers = this.mockSystem.getServers();
      const problematicServers = servers.filter(s =>
        s.status === 'critical' || s.status === 'warning'
      );

      const mockAlerts = problematicServers.slice(0, 10).map((server, index) => ({
        id: `alert-${server.id}-${Date.now()}-${index}`,
        type: ['cpu', 'memory', 'disk', 'network'][Math.floor(Math.random() * 4)] as 'cpu' | 'memory' | 'disk' | 'network',
        severity: server.status === 'critical' ? 'critical' as const : 'warning' as const,
        message: server.status === 'critical'
          ? `${server.name} 서버에서 심각한 성능 문제 감지됨`
          : `${server.name} 서버 성능 경고`,
        server: server.name,
        timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000, // 최근 24시간 내
      }));

      console.log(`🚨 ${mockAlerts.length}개 모의 알림 생성됨`);

      return {
        total: mockAlerts.length,
        recent: mockAlerts,
      };
    } catch (error) {
      console.warn('⚠️ Mock 알림 데이터 생성 실패, 기본 데이터 사용:', error);
      return this.getDefaultAlertsData();
    }
  }

  /**
   * 📚 가이드 데이터 수집 (정적 Mock 데이터)
   */
  private async collectGuidesData() {
    const mockGuides = [
      {
        id: 'guide-1',
        title: 'OpenManager VIBE 서버 모니터링 시작하기',
        content: 'Mock 시스템을 활용한 실시간 서버 모니터링 방법을 안내합니다.',
        category: 'getting-started',
        priority: 10,
        lastUpdate: Date.now(),
      },
      {
        id: 'guide-2',
        title: '알림 설정 및 관리',
        content: '서버 알림을 효과적으로 설정하고 관리하는 방법을 설명합니다.',
        category: 'alerts',
        priority: 8,
        lastUpdate: Date.now(),
      },
      {
        id: 'guide-3',
        title: '대시보드 사용법',
        content: '대시보드의 각 기능과 활용 방법을 상세히 안내합니다.',
        category: 'dashboard',
        priority: 7,
        lastUpdate: Date.now(),
      },
    ];

    console.log(`📚 ${mockGuides.length}개 모의 가이드 로드됨`);
    return mockGuides;
  }

  /**
   * ❓ FAQ 데이터 수집 (정적 Mock 데이터)
   */
  private async collectFaqsData() {
    const mockFaqs = [
      {
        id: 'faq-1',
        question: 'Mock 시스템은 어떻게 작동하나요?',
        answer: 'FNV-1a 해시 기반으로 현실적인 서버 메트릭을 시뮬레이션합니다.',
        category: 'system',
        popularity: 25,
      },
      {
        id: 'faq-2',
        question: '서버 상태가 Critical일 때 어떻게 해야 하나요?',
        answer: '서버 로그를 확인하고 필요시 재시작을 고려해보세요.',
        category: 'troubleshooting',
        popularity: 18,
      },
      {
        id: 'faq-3',
        question: '실시간 데이터 업데이트 주기는 얼마나 되나요?',
        answer: 'Mock 시스템은 30초마다 자동으로 메트릭을 업데이트합니다.',
        category: 'monitoring',
        popularity: 12,
      },
    ];

    console.log(`❓ ${mockFaqs.length}개 모의 FAQ 로드됨`);
    return mockFaqs;
  }

  /**
   * ⚙️ 설정 데이터 수집 (기본 설정 사용)
   */
  private async collectSettingsData() {
    // Mock 환경에서는 기본 설정 사용
    const settings = this.getDefaultSettings();
    console.log('⚙️ 기본 설정 로드됨');
    return settings;
  }


  /**
   * 📊 현재 컨텍스트 조회
   */
  async getCurrentContext(): Promise<BasicContextData> {
    // 캐시된 데이터 먼저 확인
    const cached = this.memoryCache.get<BasicContextData>(this.CACHE_KEY);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // 캐시가 만료되었으면 새로 수집
    return await this.collectBasicContext();
  }

  /**
   * 🔄 강제 컨텍스트 갱신
   */
  async refreshContext(): Promise<BasicContextData> {
    console.log('🔄 강제 컨텍스트 갱신');
    this.memoryCache.delete(this.CACHE_KEY);
    return await this.collectBasicContext();
  }

  /**
   * 🚨 알림 업데이트 (실시간)
   */
  async updateAlerts(): Promise<void> {
    try {
      const currentContext = await this.getCurrentContext();
      const newAlerts = await this.collectAlertsData();

      currentContext.alerts.recent = newAlerts.recent.slice(0, 10); // 최신 10개만
      currentContext.lastUpdated = Date.now();

      // 캐시 업데이트
      this.memoryCache.set(this.CACHE_KEY, currentContext, this.TTL);

      console.log('🚨 실시간 알림 업데이트 완료');
    } catch (error) {
      console.error('❌ 실시간 알림 업데이트 실패:', error);
    }
  }

  /**
   * 📈 컨텍스트 통계
   */
  getStatistics() {
    const cacheStats = this.memoryCache.getStats();
    const currentContext = this.memoryCache.get<BasicContextData>(
      this.CACHE_KEY
    );

    return {
      cache: cacheStats,
      context: currentContext
        ? {
            lastUpdated: new Date(currentContext.lastUpdated),
            serversTotal: currentContext.servers.total,
            alertsTotal: currentContext.alerts.total,
            guidesTotal: currentContext.guides.length,
            faqsTotal: currentContext.faqs.length,
          }
        : null,
      mockSystemConnected: this.mockSystem !== null,
      updateInterval: this.updateInterval !== null,
    };
  }

  /**
   * 🔍 캐시 유효성 검사
   */
  private isCacheValid(context: BasicContextData): boolean {
    const age = Date.now() - context.lastUpdated;
    return age < this.TTL * 1000;
  }

  /**
   * 🏭 기본 데이터 생성기들
   */
  private getDefaultContext(): BasicContextData {
    return {
      servers: this.getDefaultServersData(),
      alerts: this.getDefaultAlertsData(),
      guides: [],
      faqs: [],
      settings: this.getDefaultSettings(),
      lastUpdated: Date.now(),
      version: '1.0.0',
    };
  }

  private getDefaultServersData() {
    return {
      total: 0,
      online: 0,
      offline: 0,
      warning: 0,
      critical: 0,
      list: [],
    };
  }

  private getDefaultAlertsData() {
    return {
      total: 0,
      recent: [],
    };
  }

  private getDefaultSettings() {
    return {
      theme: 'auto' as const,
      language: 'ko' as const,
      notifications: true,
      refreshInterval: 300,
    };
  }

  /**
   * 🧹 정리 작업
   */
  dispose(): void {
    this.stopContextCollection();
    this.memoryCache.clear();
    console.log('🧹 BasicContextManager 정리 완료');
  }
}
