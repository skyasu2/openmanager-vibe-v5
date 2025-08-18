/**
 * 🗂️ 기본 컨텍스트 관리자 (Level 1)
 *
 * ✅ 서버 목록, 기본 설정, FAQ, 가이드 수집
 * ✅ Memory + Supabase 하이브리드 캐싱
 * ✅ 실시간 업데이트 (5분 간격)
 * ✅ 자동 컨텍스트 최적화
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase-singleton';

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
  private supabase: SupabaseClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_KEY = 'openmanager:basic_context';
  private readonly TTL = 300; // 5분
  private readonly MAX_HISTORY = 100; // 최대 100개 히스토리 유지

  constructor() {
    // 메모리 캐시 초기화
    this.memoryCache = new MemoryCache();

    // 통합 Supabase 싱글톤 사용
    try {
      this.supabase = getSupabaseClient();
      console.log('✅ BasicContextManager - Supabase 싱글톤 연결 성공');
    } catch (error) {
      console.warn(
        '⚠️ BasicContextManager - Supabase 연결 실패, 메모리 캐시만 사용:',
        error
      );
    }

    console.log('🔧 BasicContextManager 초기화 완료');
    console.log(`📦 캐시: Memory${this.supabase ? ' + Supabase' : ' Only'}`);
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

      // Supabase에도 저장 (실패해도 계속 진행)
      if (this.supabase) {
        try {
          await this.saveContextToSupabase(context);
        } catch (supabaseError) {
          console.warn(
            '⚠️ Supabase 저장 실패, 메모리 캐시는 유지:',
            supabaseError
          );
        }
      }

      console.log('✅ 기본 컨텍스트 수집 완료');
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
   * 🖥️ 서버 데이터 수집
   */
  private async collectServersData() {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('servers')
        .select('id, name, status, ip, os, updated_at')
        .limit(100);

      if (error) throw error;

      const servers = data || [];
      const statusCounts = {
        online: servers.filter((s) => s.status === 'online').length,
        offline: servers.filter((s) => s.status === 'offline').length,
        warning: servers.filter((s) => s.status === 'warning').length,
        critical: servers.filter((s) => s.status === 'critical').length,
      };

      return {
        total: servers.length,
        ...statusCounts,
        list: servers.map((server) => ({
          id: server.id,
          name: server.name || 'Unknown',
          status: server.status || 'offline',
          ip: server.ip || 'N/A',
          os: server.os || 'Unknown',
          lastUpdate: new Date(server.updated_at || Date.now()).getTime(),
        })),
      };
    }

    return this.getDefaultServersData();
  }

  /**
   * 🚨 알림 데이터 수집
   */
  private async collectAlertsData() {
    if (this.supabase) {
      // 최근 24시간 알림만 조회
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await this.supabase
        .from('alerts')
        .select('id, type, severity, message, server_name, created_at')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const alerts = data || [];

      return {
        total: alerts.length,
        recent: alerts.map((alert) => ({
          id: alert.id,
          type: alert.type || 'cpu',
          severity: alert.severity || 'warning',
          message: alert.message || '알림 메시지 없음',
          server: alert.server_name || 'Unknown',
          timestamp: new Date(alert.created_at || Date.now()).getTime(),
        })),
      };
    }

    return this.getDefaultAlertsData();
  }

  /**
   * 📚 가이드 데이터 수집
   */
  private async collectGuidesData() {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('guides')
        .select('id, title, content, category, priority, updated_at')
        .eq('active', true)
        .order('priority', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((guide) => ({
        id: guide.id,
        title: guide.title || '제목 없음',
        content: guide.content || '',
        category: guide.category || 'general',
        priority: guide.priority || 0,
        lastUpdate: new Date(guide.updated_at || Date.now()).getTime(),
      }));
    }

    return [];
  }

  /**
   * ❓ FAQ 데이터 수집
   */
  private async collectFaqsData() {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('faqs')
        .select('id, question, answer, category, view_count')
        .eq('active', true)
        .order('view_count', { ascending: false })
        .limit(15);

      if (error) throw error;

      return (data || []).map((faq) => ({
        id: faq.id,
        question: faq.question || '질문 없음',
        answer: faq.answer || '답변 없음',
        category: faq.category || 'general',
        popularity: faq.view_count || 0,
      }));
    }

    return [];
  }

  /**
   * ⚙️ 설정 데이터 수집
   */
  private async collectSettingsData() {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const settings = data?.settings_data || {};
      return {
        theme: settings.theme || 'auto',
        language: settings.language || 'ko',
        notifications: settings.notifications ?? true,
        refreshInterval: settings.refreshInterval || 300,
      };
    }

    return this.getDefaultSettings();
  }

  /**
   * 💾 Supabase에 컨텍스트 저장
   */
  private async saveContextToSupabase(
    context: BasicContextData
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      const contextCache = {
        cache_key: this.CACHE_KEY,
        data: context,
        expires_at: new Date(Date.now() + this.TTL * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('context_cache')
        .upsert(contextCache);

      if (error) {
        console.warn('⚠️ Supabase 컨텍스트 저장 실패:', error);
      }

      // 히스토리 관리 (최대 MAX_HISTORY개만 유지)
      await this.cleanupContextHistory();
    } catch (error) {
      console.warn('⚠️ Supabase 컨텍스트 저장 중 오류:', error);
    }
  }

  /**
   * 🧹 컨텍스트 히스토리 정리
   */
  private async cleanupContextHistory(): Promise<void> {
    if (!this.supabase) return;

    try {
      // 오래된 컨텍스트 삭제 (MAX_HISTORY개 초과하는 것들)
      const { data, error } = await this.supabase
        .from('context_cache')
        .select('id')
        .order('updated_at', { ascending: false })
        .range(this.MAX_HISTORY, this.MAX_HISTORY + 50);

      if (error) return;

      if (data && data.length > 0) {
        const idsToDelete = data.map((item) => item.id);
        await this.supabase
          .from('context_cache')
          .delete()
          .in('id', idsToDelete);

        console.log(`🧹 컨텍스트 히스토리 정리: ${idsToDelete.length}개 삭제`);
      }
    } catch (error) {
      console.warn('⚠️ 컨텍스트 히스토리 정리 실패:', error);
    }
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
      supabaseConnected: this.supabase !== null,
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
