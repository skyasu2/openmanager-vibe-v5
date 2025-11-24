/**
 * 🌐 클라우드 버전 관리자
 *
 * ✅ 버전 동기화, 배포 추적, 롤백 관리
 * ✅ Memory + Supabase 하이브리드 저장
 * ✅ 프로덕션/개발 모드 지원
 * ✅ 자동 버전 감지 및 알림
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

// 버전 관리 인터페이스
export interface CloudVersion {
  id: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  deployTime: number;
  commitHash: string;
  releaseNotes: string;
  isActive: boolean;
  performance: {
    buildTime: number;
    bundleSize: number;
    lighthouse: number;
  };
  status: 'deploying' | 'active' | 'failed' | 'rolled-back';
}

export interface DeploymentMetrics {
  successRate: number;
  averageDeployTime: number;
  rollbackRate: number;
  lastDeployment: number;
  totalDeployments: number;
}

export interface VersionComparison {
  current: CloudVersion;
  previous: CloudVersion;
  changes: Array<{
    type: 'feature' | 'bugfix' | 'performance' | 'breaking';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  compatibility: boolean;
}

// 메모리 캐시 관리
class MemoryCache {
  private cache = new Map<string, { data: unknown; expires: number }>();
  private readonly MAX_SIZE = 500;

  set(key: string, data: unknown, ttlSeconds: number = 600): void {
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

interface CloudVersionConfig {
  enableSupabase: boolean;
  autoSync: boolean;
  syncInterval: number;
  retentionDays: number;
  enableMetrics: boolean;
  enableNotifications: boolean;
}

export class CloudVersionManager {
  private static instance: CloudVersionManager;
  private memoryCache: MemoryCache;
  private supabase: SupabaseClient | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private config: CloudVersionConfig;

  private constructor(config: Partial<CloudVersionConfig> = {}) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      enableSupabase: true,
      autoSync: isProduction, // 프로덕션에서만 자동 동기화
      syncInterval: 10 * 60 * 1000, // 10분
      retentionDays: 30,
      enableMetrics: true,
      enableNotifications: isProduction,
      ...config,
    };

    // 메모리 캐시 초기화
    this.memoryCache = new MemoryCache();

    // 통합 Supabase 싱글톤 사용
    if (this.config.enableSupabase) {
      try {
        this.supabase = getSupabaseClient();
        console.log('✅ CloudVersionManager - Supabase 싱글톤 연결 성공');
      } catch (error) {
        console.warn(
          '⚠️ CloudVersionManager - Supabase 연결 실패, 메모리 캐시만 사용:',
          error
        );
      }
    }

    console.log(
      `🌐 CloudVersionManager 초기화 완료 (${isProduction ? 'Production' : 'Development'} 모드)`
    );
    console.log(`📦 캐시: Memory${this.supabase ? ' + Supabase' : ' Only'}`);
  }

  static getInstance(
    config?: Partial<CloudVersionConfig>
  ): CloudVersionManager {
    if (!CloudVersionManager.instance) {
      CloudVersionManager.instance = new CloudVersionManager(config);
    }
    return CloudVersionManager.instance;
  }

  /**
   * 🚀 버전 관리 시작
   */
  async startVersionTracking(): Promise<void> {
    console.log('🚀 CloudVersionManager 버전 추적 시작');

    // 현재 버전 감지 및 등록
    await this.detectAndRegisterCurrentVersion();

    // 자동 동기화 설정
    if (this.config.autoSync && this.supabase) {
      this.syncInterval = setInterval(() => {
        void (async () => {
          try {
            await this.syncVersions();
          } catch (error) {
            console.error('❌ CloudVersionManager 자동 동기화 실패:', error);
          }
        })();
      }, this.config.syncInterval);

      console.log('✅ CloudVersionManager 자동 동기화 시작');
    }
  }

  /**
   * 🛑 버전 추적 중지
   */
  stopVersionTracking(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 CloudVersionManager 자동 동기화 중지');
    }
  }

  /**
   * 📦 현재 버전 감지 및 등록
   */
  async detectAndRegisterCurrentVersion(): Promise<CloudVersion> {
    try {
      console.log('🔍 현재 버전 감지 중...');

      // package.json에서 버전 정보 추출
      const packageJson = await this.getPackageInfo();
      const gitInfo = await this.getGitInfo();
      const buildInfo = await this.getBuildInfo();

      const currentVersion: CloudVersion = {
        id: `version_${Date.now()}`,
        version: packageJson.version || '0.0.0',
        environment: this.getEnvironment(),
        deployTime: Date.now(),
        commitHash: gitInfo.commitHash,
        releaseNotes: gitInfo.commitMessage,
        isActive: true,
        performance: {
          buildTime: buildInfo.buildTime,
          bundleSize: buildInfo.bundleSize,
          lighthouse: buildInfo.lighthouse,
        },
        status: 'active',
      };

      // 캐시에 저장
      this.memoryCache.set('current_version', currentVersion, 3600);

      // Supabase에 저장
      if (this.supabase) {
        await this.saveVersionToSupabase(currentVersion);
      }

      console.log(`✅ 현재 버전 등록 완료: v${currentVersion.version}`);
      return currentVersion;
    } catch (error) {
      console.error('❌ 현재 버전 감지 실패:', error);
      throw error;
    }
  }

  /**
   * 📋 버전 목록 조회
   */
  async getVersionHistory(limit: number = 10): Promise<CloudVersion[]> {
    try {
      // 캐시에서 먼저 확인
      const cacheKey = `version_history_${limit}`;
      const cached = this.memoryCache.get<CloudVersion[]>(cacheKey);
      if (cached) {
        return cached;
      }

      let versions: CloudVersion[] = [];

      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('cloud_versions')
          .select('*')
          .order('deploy_time', { ascending: false })
          .limit(limit);

        if (error) throw error;

        versions = (data || []).map((item) => ({
          id: item.id,
          version: item.version,
          environment: item.environment,
          deployTime: new Date(item.deploy_time).getTime(),
          commitHash: item.commit_hash,
          releaseNotes: item.release_notes,
          isActive: item.is_active,
          performance: item.performance_data,
          status: item.status,
        }));
      }

      // 캐시에 저장
      this.memoryCache.set(cacheKey, versions, 300);

      console.log(`📋 버전 히스토리 조회 완료: ${versions.length}개`);
      return versions;
    } catch (error) {
      console.error('❌ 버전 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * ⚡ 버전 비교
   */
  async compareVersions(
    currentVersionId: string,
    previousVersionId: string
  ): Promise<VersionComparison | null> {
    try {
      const versions = await this.getVersionHistory(50);
      const current = versions.find((v) => v.id === currentVersionId);
      const previous = versions.find((v) => v.id === previousVersionId);

      if (!current || !previous) {
        throw new Error('버전을 찾을 수 없습니다');
      }

      const comparison: VersionComparison = {
        current,
        previous,
        changes: await this.analyzeChanges(current, previous),
        compatibility: await this.checkCompatibility(current, previous),
      };

      console.log(
        `⚡ 버전 비교 완료: ${current.version} vs ${previous.version}`
      );
      return comparison;
    } catch (error) {
      console.error('❌ 버전 비교 실패:', error);
      return null;
    }
  }

  /**
   * 🔄 버전 롤백
   */
  async rollbackToVersion(versionId: string): Promise<boolean> {
    try {
      console.log(`🔄 버전 롤백 시작: ${versionId}`);

      const versions = await this.getVersionHistory(50);
      const targetVersion = versions.find((v) => v.id === versionId);

      if (!targetVersion) {
        throw new Error('대상 버전을 찾을 수 없습니다');
      }

      // 현재 활성 버전 비활성화
      await this.deactivateCurrentVersion();

      // 대상 버전 활성화
      targetVersion.isActive = true;
      targetVersion.status = 'active';

      if (this.supabase) {
        const { error } = await this.supabase
          .from('cloud_versions')
          .update({
            is_active: true,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', versionId);

        if (error) throw error;
      }

      // 캐시 무효화
      this.memoryCache.clear();

      console.log(`✅ 버전 롤백 완료: v${targetVersion.version}`);
      return true;
    } catch (error) {
      console.error('❌ 버전 롤백 실패:', error);
      return false;
    }
  }

  /**
   * 📊 배포 메트릭 조회
   */
  async getDeploymentMetrics(): Promise<DeploymentMetrics> {
    try {
      const cacheKey = 'deployment_metrics';
      const cached = this.memoryCache.get<DeploymentMetrics>(cacheKey);
      if (cached) {
        return cached;
      }

      let metrics: DeploymentMetrics = {
        successRate: 0,
        averageDeployTime: 0,
        rollbackRate: 0,
        lastDeployment: 0,
        totalDeployments: 0,
      };

      if (this.supabase) {
        // 최근 30일 데이터 분석
        const thirtyDaysAgo = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data, error } = await this.supabase
          .from('cloud_versions')
          .select('status, deploy_time, performance_data')
          .gte('deploy_time', thirtyDaysAgo);

        if (error) throw error;

        const deployments = data || [];
        const successful = deployments.filter(
          (d) => d.status === 'active'
        ).length;
        const rolledBack = deployments.filter(
          (d) => d.status === 'rolled-back'
        ).length;

        metrics = {
          successRate:
            deployments.length > 0
              ? (successful / deployments.length) * 100
              : 0,
          averageDeployTime: this.calculateAverageDeployTime(deployments),
          rollbackRate:
            deployments.length > 0
              ? (rolledBack / deployments.length) * 100
              : 0,
          lastDeployment:
            deployments.length > 0
              ? Math.max(
                  ...deployments.map((d) => new Date(d.deploy_time).getTime())
                )
              : 0,
          totalDeployments: deployments.length,
        };
      }

      // 캐시에 저장
      this.memoryCache.set(cacheKey, metrics, 600);

      console.log('📊 배포 메트릭 조회 완료');
      return metrics;
    } catch (error) {
      console.error('❌ 배포 메트릭 조회 실패:', error);
      return {
        successRate: 0,
        averageDeployTime: 0,
        rollbackRate: 0,
        lastDeployment: 0,
        totalDeployments: 0,
      };
    }
  }

  /**
   * 🔧 도우미 메서드들
   */
  private async getPackageInfo() {
    try {
      // Node.js 환경에서만 파일 시스템 접근
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const packageJson = JSON.parse(
          fs.readFileSync('package.json', 'utf-8')
        );
        return packageJson;
      }
    } catch (error) {
      console.warn('package.json 읽기 실패:', error);
    }
    return { version: '0.0.0' };
  }

  private async getGitInfo() {
    try {
      if (typeof window === 'undefined') {
        const { execSync } = await import('child_process');
        const commitHash = execSync('git rev-parse HEAD', {
          encoding: 'utf-8',
        }).trim();
        const commitMessage = execSync('git log -1 --pretty=%B', {
          encoding: 'utf-8',
        }).trim();
        return { commitHash, commitMessage };
      }
    } catch (error) {
      console.warn('Git 정보 읽기 실패:', error);
    }
    return { commitHash: 'unknown', commitMessage: 'Unknown commit' };
  }

  private async getBuildInfo() {
    // 실제 환경에서는 빌드 시간과 번들 크기를 측정
    return {
      buildTime: Math.random() * 60000, // 임시값
      bundleSize: Math.random() * 1000000, // 임시값
      lighthouse: 90 + Math.random() * 10, // 임시값
    };
  }

  private getEnvironment(): 'production' | 'staging' | 'development' {
    const env = process.env.NODE_ENV;
    const envStage = process.env.VERCEL_ENV as string | undefined;
    if (env === 'production') return 'production';
    if (envStage === 'preview' || envStage === 'staging') return 'staging';
    return 'development';
  }

  private async saveVersionToSupabase(version: CloudVersion): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase.from('cloud_versions').upsert({
      id: version.id,
      version: version.version,
      environment: version.environment,
      deploy_time: new Date(version.deployTime).toISOString(),
      commit_hash: version.commitHash,
      release_notes: version.releaseNotes,
      is_active: version.isActive,
      performance_data: version.performance,
      status: version.status,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase 버전 저장 실패:', error);
    }
  }

  private async syncVersions(): Promise<void> {
    // 정기적인 버전 동기화 로직
    console.log('🔄 버전 동기화 실행');
    await this.detectAndRegisterCurrentVersion();
  }

  private async analyzeChanges(
    _current: CloudVersion,
    _previous: CloudVersion
  ) {
    // 실제로는 Git diff 분석 등을 통해 변경사항 추출
    return [
      {
        type: 'feature' as const,
        description: '새로운 성능 모니터링 모듈 추가',
        impact: 'medium' as const,
      },
    ];
  }

  private async checkCompatibility(
    _current: CloudVersion,
    _previous: CloudVersion
  ): Promise<boolean> {
    // 실제로는 API 호환성, 데이터베이스 스키마 등을 확인
    const versionDiff = _current.version.localeCompare(
      _previous.version,
      undefined,
      { numeric: true }
    );
    return versionDiff >= 0; // 상위 버전이면 호환
  }

  private async deactivateCurrentVersion(): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from('cloud_versions')
      .update({ is_active: false, status: 'rolled-back' })
      .eq('is_active', true);

    if (error) {
      console.warn('현재 버전 비활성화 실패:', error);
    }
  }

  private calculateAverageDeployTime(
    deployments: Array<{ performance_data?: { buildTime?: number } }>
  ): number {
    if (deployments.length === 0) return 0;

    const totalTime = deployments.reduce((sum, d) => {
      return sum + (d.performance_data?.buildTime || 0);
    }, 0);

    return totalTime / deployments.length;
  }

  /**
   * 📈 상태 정보
   */
  getStatus() {
    return {
      isInitialized: true,
      hasSupabase: this.supabase !== null,
      autoSync: this.config.autoSync,
      cacheSize: this.memoryCache.getStats().size,
      environment: this.getEnvironment(),
    };
  }

  /**
   * 🧹 정리 작업
   */
  dispose(): void {
    this.stopVersionTracking();
    this.memoryCache.clear();
    console.log('🧹 CloudVersionManager 정리 완료');
  }
}
