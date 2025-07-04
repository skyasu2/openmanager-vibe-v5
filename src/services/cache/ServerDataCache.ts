/**
 * 🚀 Server Data Cache Service (GCP Functions 기반)
 *
 * 서버 데이터를 효율적으로 캐싱하고 관리하는 서비스
 * - 백그라운드에서 데이터 준비
 * - 차분 업데이트로 성능 최적화
 * - 페이지네이션 데이터 미리 준비
 * - ☁️ GCP Functions 전환 완료
 */

import { fetchGCPServers } from '@/config/gcp-functions';
import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';
import { ServerInstance } from '@/types/data-generator';

// GCP Functions 설정은 중앙에서 관리

/**
 * ☁️ GCP Functions에서 서버 데이터 가져오기
 */
async function getGCPServers() {
  try {
    const servers = await fetchGCPServers();

    // GCP Functions 데이터를 기존 형식으로 변환
    return servers.map((server: any) => ({
      id: server.serverId,
      name: server.serverName,
      type: server.serverType,
      status:
        server.systemHealth?.serviceHealthScore > 80
          ? 'running'
          : server.systemHealth?.serviceHealthScore > 60
            ? 'warning'
            : 'error',
      metrics: {
        cpu: server.systemResources?.cpuUsage || 0,
        memory: server.systemResources?.memoryUsage || 0,
        disk: server.systemResources?.diskUsage || 0,
        requests: server.applicationPerformance?.requestsPerSecond || 0,
      },
    }));
  } catch (error) {
    console.error('GCP Functions 호출 실패:', error);
    // 폴백: 기본 서버 8개 반환
    return Array.from({ length: 8 }, (_, i) => ({
      id: `server-${i + 1}`,
      name: `Server ${i + 1}`,
      type: ['web', 'database', 'api', 'cache'][i % 4],
      status:
        i % 4 === 0
          ? 'running'
          : i % 4 === 1
            ? 'warning'
            : i % 4 === 2
              ? 'error'
              : 'running',
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        requests: Math.random() * 1000,
      },
    }));
  }
}

interface CachedServerData {
  servers: ServerInstance[];
  summary: {
    total: number;
    online: number;
    warning: number;
    offline: number;
    avgCpu: number;
    avgMemory: number;
  };
  lastUpdated: number;
  version: number;
}

interface PaginatedCache {
  page: number;
  pageSize: number;
  data: ServerInstance[];
  totalPages: number;
  filters?: {
    status?: string;
    search?: string;
    location?: string;
  };
}

export class ServerDataCache {
  private static instance: ServerDataCache | null = null;
  private cache: CachedServerData | null = null;
  private paginatedCache: Map<string, PaginatedCache> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private subscribers: Set<(data: CachedServerData) => void> = new Set();

  // 🎯 중앙 설정에서 성능 최적화 설정 가져오기
  private readonly UPDATE_INTERVAL = ACTIVE_SERVER_CONFIG.cache.updateInterval; // 중앙 설정에서 업데이트 간격
  private readonly MAX_CACHE_AGE = ACTIVE_SERVER_CONFIG.cache.expireTime; // 중앙 설정에서 캐시 만료 시간
  private readonly DEFAULT_PAGE_SIZE =
    ACTIVE_SERVER_CONFIG.pagination.defaultPageSize; // 중앙 설정에서 페이지 크기

  private constructor() {
    console.log(`🎯 ServerDataCache 설정:`);
    console.log(`  🔄 업데이트 간격: ${this.UPDATE_INTERVAL / 1000}초`);
    console.log(`  ⏰ 캐시 만료: ${this.MAX_CACHE_AGE / 1000}초`);
    console.log(`  📄 페이지 크기: ${this.DEFAULT_PAGE_SIZE}개`);

    this.initializeCache();
  }

  public static getInstance(): ServerDataCache {
    if (!ServerDataCache.instance) {
      ServerDataCache.instance = new ServerDataCache();
    }
    return ServerDataCache.instance;
  }

  /**
   * 🔄 캐시 초기화 및 백그라운드 업데이트 시작
   */
  private async initializeCache(): Promise<void> {
    console.log('🚀 ServerDataCache 초기화 시작...');

    try {
      // 초기 데이터 로드
      await this.updateCache();

      // 백그라운드 업데이트 시작
      this.startBackgroundUpdates();

      console.log('✅ ServerDataCache 초기화 완료');
    } catch (error) {
      console.error('❌ ServerDataCache 초기화 실패:', error);
    }
  }

  /**
   * 🔄 백그라운드에서 주기적으로 캐시 업데이트
   */
  private startBackgroundUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // 🔨 빌드 환경에서는 백그라운드 타이머 생성 금지
    if (
      process.env.NODE_ENV === 'production' &&
      (process.env.VERCEL === '1' || process.env.BUILD_TIME === 'true')
    ) {
      console.log(
        '🔨 빌드 환경 감지 - 백그라운드 업데이트 건너뜀 (타이머 차단)'
      );
      return;
    }

    this.updateInterval = setInterval(async () => {
      if (!this.isUpdating) {
        await this.updateCache();
      }
    }, this.UPDATE_INTERVAL);

    console.log(`🔄 백그라운드 업데이트 시작 (${this.UPDATE_INTERVAL}ms 간격)`);
  }

  /**
   * 📊 캐시 데이터 업데이트 (GCP Functions 기반)
   */
  private async updateCache(): Promise<void> {
    if (this.isUpdating) {
      console.log('⚠️ 이미 업데이트 중입니다.');
      return;
    }

    this.isUpdating = true;

    try {
      // 🚀 GCP Functions에서 서버 데이터 가져오기
      const servers = await getGCPServers();

      if (!Array.isArray(servers)) {
        throw new Error('Invalid server data format');
      }

      // 대시보드 요약 계산
      const summary = this.calculateSummary(servers);

      // 🎯 차분 업데이트: 변경된 서버만 감지
      const hasChanges = this.detectChanges(servers);

      if (hasChanges || !this.cache) {
        const newCache: CachedServerData = {
          servers: [...servers], // 깊은 복사로 불변성 보장
          summary: {
            total: servers.length,
            online: servers.filter(s => s.status === 'running').length,
            warning: servers.filter(s => s.status === 'warning').length,
            offline: servers.filter(s => s.status === 'error').length,
            avgCpu: summary.avgCpu,
            avgMemory: summary.avgMemory,
          },
          lastUpdated: Date.now(),
          version: (this.cache?.version || 0) + 1,
        };

        this.cache = newCache;

        // 페이지네이션 캐시 무효화
        this.invalidatePaginatedCache();

        // 구독자들에게 업데이트 알림
        this.notifySubscribers(newCache);

        console.log(
          `📊 캐시 업데이트 완료 (v${newCache.version}): ${servers.length}개 서버 (GCP Functions)`
        );
      } else {
        console.log('📊 변경사항 없음 - 캐시 유지');
      }
    } catch (error) {
      console.error('❌ 캐시 업데이트 실패:', error);

      // 폴백: 기존 캐시가 없으면 빈 데이터로 초기화
      if (!this.cache) {
        this.cache = {
          servers: [],
          summary: {
            total: 0,
            online: 0,
            warning: 0,
            offline: 0,
            avgCpu: 0,
            avgMemory: 0,
          },
          lastUpdated: Date.now(),
          version: 1,
        };
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * 📊 서버 요약 정보 계산
   */
  private calculateSummary(servers: any[]): any {
    const total = servers.length;
    const online = servers.filter(s => s.status === 'running').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const offline = servers.filter(s => s.status === 'error').length;

    const avgCpu =
      servers.reduce((sum, s) => sum + (s.metrics?.cpu || 0), 0) / total || 0;
    const avgMemory =
      servers.reduce((sum, s) => sum + (s.metrics?.memory || 0), 0) / total ||
      0;

    return {
      total,
      online,
      running: online,
      warning,
      offline,
      error: offline,
      avgCpu,
      avgMemory,
    };
  }

  /**
   * 🔍 서버 데이터 변경 감지
   */
  private detectChanges(newServers: any[]): boolean {
    if (!this.cache) return true;

    const oldServers = this.cache.servers;

    // 서버 개수 변경
    if (oldServers.length !== newServers.length) return true;

    // 각 서버의 주요 메트릭 변경 감지
    for (let i = 0; i < newServers.length; i++) {
      const oldServer = oldServers[i];
      const newServer = newServers[i];

      if (
        oldServer.id !== newServer.id ||
        oldServer.status !== newServer.status ||
        Math.abs(
          (oldServer.metrics?.cpu || 0) - (newServer.metrics?.cpu || 0)
        ) > 1 ||
        Math.abs(
          (oldServer.metrics?.memory || 0) - (newServer.metrics?.memory || 0)
        ) > 1
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 📄 페이지네이션된 서버 데이터 조회
   */
  public getPaginatedServers(
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE,
    filters?: {
      status?: string;
      search?: string;
      location?: string;
      sortBy?: string;
    }
  ): PaginatedCache | null {
    if (!this.cache) return null;

    const cacheKey = this.generateCacheKey(page, pageSize, filters);

    // 캐시된 페이지네이션 데이터가 있으면 반환
    if (this.paginatedCache.has(cacheKey)) {
      return this.paginatedCache.get(cacheKey)!;
    }

    // 필터링 및 정렬 적용
    let filteredServers = [...this.cache.servers];

    // 상태 필터
    if (filters?.status && filters.status !== 'all') {
      filteredServers = filteredServers.filter(server => {
        if (filters.status === 'healthy') return server.status === 'running';
        if (filters.status === 'warning') return server.status === 'warning';
        if (filters.status === 'offline') return server.status === 'error';
        return true;
      });
    }

    // 검색 필터
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredServers = filteredServers.filter(
        server =>
          server.name.toLowerCase().includes(searchTerm) ||
          (server.id || '').toLowerCase().includes(searchTerm)
      );
    }

    // 위치 필터
    if (filters?.location && filters.location !== 'all') {
      filteredServers = filteredServers.filter(
        server => server.location === filters.location
      );
    }

    // 정렬
    if (filters?.sortBy) {
      filteredServers.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'cpu':
            return b.metrics.cpu - a.metrics.cpu;
          case 'memory':
            return b.metrics.memory - a.metrics.memory;
          case 'status':
            return a.status.localeCompare(b.status);
          case 'priority':
          default:
            const statusPriority = { error: 3, warning: 2, running: 1 };
            return (
              (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0)
            );
        }
      });
    }

    // 페이지네이션 적용
    const totalPages = Math.ceil(filteredServers.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredServers.slice(startIndex, endIndex);

    const result: PaginatedCache = {
      page,
      pageSize,
      data: paginatedData,
      totalPages,
      filters,
    };

    // 캐시에 저장
    this.paginatedCache.set(cacheKey, result);

    return result;
  }

  /**
   * 📊 캐시된 서버 데이터 조회
   */
  public getCachedData(): CachedServerData | null {
    // 캐시가 너무 오래되었으면 null 반환
    if (
      this.cache &&
      Date.now() - this.cache.lastUpdated > this.MAX_CACHE_AGE
    ) {
      console.log('⚠️ 캐시가 만료되었습니다. 새로운 데이터를 요청하세요.');
      return null;
    }

    return this.cache;
  }

  /**
   * 🔔 데이터 변경 구독
   */
  public subscribe(callback: (data: CachedServerData) => void): () => void {
    this.subscribers.add(callback);

    // 현재 캐시 데이터가 있으면 즉시 콜백 호출
    if (this.cache) {
      callback(this.cache);
    }

    // 구독 해제 함수 반환
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 🔔 구독자들에게 업데이트 알림
   */
  private notifySubscribers(data: CachedServerData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ 구독자 콜백 오류:', error);
      }
    });
  }

  /**
   * 🗑️ 페이지네이션 캐시 무효화
   */
  private invalidatePaginatedCache(): void {
    this.paginatedCache.clear();
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(
    page: number,
    pageSize: number,
    filters?: any
  ): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${page}-${pageSize}-${filterStr}`;
  }

  /**
   * 🔄 수동 캐시 새로고침
   */
  public async refreshCache(): Promise<void> {
    console.log('🔄 수동 캐시 새로고침 요청');
    await this.updateCache();
  }

  /**
   * 📊 캐시 상태 정보
   */
  public getCacheStatus() {
    return {
      hasCache: !!this.cache,
      lastUpdated: this.cache?.lastUpdated || 0,
      version: this.cache?.version || 0,
      isUpdating: this.isUpdating,
      subscriberCount: this.subscribers.size,
      paginatedCacheSize: this.paginatedCache.size,
      serverCount: this.cache?.servers.length || 0,
    };
  }

  /**
   * 🛑 캐시 정리 및 중지
   */
  public dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.cache = null;
    this.paginatedCache.clear();
    this.subscribers.clear();
    this.isUpdating = false;

    console.log('🛑 ServerDataCache 정리 완료');
  }
}

// 싱글톤 인스턴스 내보내기
export const serverDataCache = ServerDataCache.getInstance();
