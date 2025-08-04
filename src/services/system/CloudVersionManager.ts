/**
 * 🌐 Cloud-based Version Manager (Redis-Free Production)
 *
 * VersionManager 대체: 메모리 기반 캐시 + Supabase
 *
 * 기능:
 * - 핵심 버전 정보만 기록 (Vercel 배포와 연동)
 * - 개발환경에서만 상세 메타데이터 수집
 * - 프로덕션에서는 최소한의 추적만 수행
 * - Redis 완전 제거, 메모리 기반 LRU 캐시 사용
 */

import { createClient } from '@supabase/supabase-js';

interface VersionRecord {
  id: string;
  version: string;
  previousVersion?: string;
  changeType: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
  timestamp: string;
  author: string;
  description: string;
  changes: {
    added: string[];
    modified: string[];
    removed: string[];
    deprecated: string[];
  };
  migration?: {
    required: boolean;
    scripts: string[];
    rollbackScripts: string[];
  };
  deploymentInfo?: {
    environment: 'development' | 'staging' | 'production';
    buildId?: string;
    commitHash?: string;
    deployedAt?: string;
  };
  metadata: {
    source: string;
    checksum: string;
    size: number;
    dependencies: Record<string, string>;
  };
}

// Database row interface (snake_case columns)
interface VersionHistoryRow {
  id: string;
  version: string;
  previous_version?: string;
  change_type: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
  timestamp: string;
  author: string;
  description: string;
  changes: {
    added: string[];
    modified: string[];
    removed: string[];
    deprecated: string[];
  };
  migration?: {
    required: boolean;
    scripts: string[];
    rollbackScripts: string[];
  };
  deployment_info?: {
    environment: 'development' | 'staging' | 'production';
    buildId?: string;
    commitHash?: string;
    deployedAt?: string;
  };
  metadata: {
    source: string;
    checksum: string;
    size: number;
    dependencies: Record<string, string>;
  };
}

interface CloudVersionManagerConfig {
  enableMemoryCache: boolean;
  enableSupabase: boolean;
  cachePrefix: string;
  cacheTTL: number;
  maxVersionHistory: number;
  compressionEnabled: boolean;
  isProduction: boolean;
}

// 메모리 기반 LRU 캐시 구현
class MemoryCache {
  private cache = new Map<string, { value: unknown; expires: number }>();
  private maxSize = 100;

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expires = Date.now() + ttlSeconds * 1000;
    
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
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

  keys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }
}

export class CloudVersionManager {
  private static instance: CloudVersionManager;
  private config: CloudVersionManagerConfig;
  private memoryCache: MemoryCache;
  private supabase: ReturnType<typeof createClient> | null = null;
  private currentVersion: string | null = null;

  constructor(config?: Partial<CloudVersionManagerConfig>) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      enableMemoryCache: true, // 항상 활성화
      enableSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL, // Supabase 설정 시만
      cachePrefix: 'openmanager:version:',
      cacheTTL: 86400, // 24시간
      maxVersionHistory: isProduction ? 5 : 100, // 프로덕션에서는 최근 5개만
      compressionEnabled: true,
      isProduction,
      ...config,
    };

    // 메모리 캐시 초기화
    this.memoryCache = new MemoryCache();

    // Supabase 연결 (환경변수 있을 때만)
    if (this.config.enableSupabase && 
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }

    console.log(
      `🌐 CloudVersionManager 초기화 완료 (${isProduction ? 'Production' : 'Development'} 모드)`
    );
    console.log(`📦 캐시: Memory${this.supabase ? ' + Supabase' : ' Only'}`);
  }

  static getInstance(
    config?: Partial<CloudVersionManagerConfig>
  ): CloudVersionManager {
    if (!CloudVersionManager.instance) {
      CloudVersionManager.instance = new CloudVersionManager(config);
    }
    return CloudVersionManager.instance;
  }

  /**
   * 📝 새 버전 기록 (Supabase + Memory Cache)
   */
  async recordVersion(
    version: string,
    changeType: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX',
    author: string,
    description: string,
    changes: {
      added: string[];
      modified: string[];
      removed: string[];
      deprecated: string[];
    },
    migration?: {
      required: boolean;
      scripts: string[];
      rollbackScripts: string[];
    },
    deploymentInfo?: {
      environment: 'development' | 'staging' | 'production';
      buildId?: string;
      commitHash?: string;
      deployedAt?: string;
    }
  ): Promise<boolean> {
    try {
      const previousVersion = await this.getCurrentVersion();

      const versionRecord: VersionRecord = {
        id: this.generateVersionId(version),
        version,
        previousVersion: previousVersion || undefined,
        changeType,
        timestamp: new Date().toISOString(),
        author,
        description,
        changes,
        migration,
        deploymentInfo,
        metadata: {
          source: 'cloud_deployment',
          checksum: this.generateChecksum({ version, changes, migration }),
          size: JSON.stringify({ changes, migration }).length,
          dependencies: await this.extractDependencies(),
        },
      };

      // 1. Supabase에 영구 저장
      if (this.config.enableSupabase && this.supabase) {
        await this.saveToSupabase(versionRecord);
      }

      // 2. 메모리 캐시 업데이트
      if (this.config.enableMemoryCache) {
        await this.updateMemoryCache(versionRecord);
      }

      // 3. 현재 버전 업데이트
      this.currentVersion = version;

      console.log(`📝 버전 기록 완료: ${version} (${changeType})`);
      return true;
    } catch (error) {
      console.error('❌ 버전 기록 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 메모리 캐시 업데이트
   */
  private async updateMemoryCache(versionRecord: VersionRecord): Promise<void> {
    try {
      // 최신 버전 정보 저장
      const currentKey = `${this.config.cachePrefix}current`;
      this.memoryCache.set<{
        version: string;
        timestamp: string;
        changeType: string;
        author: string;
      }>(
        currentKey,
        {
          version: versionRecord.version,
          timestamp: versionRecord.timestamp,
          changeType: versionRecord.changeType,
          author: versionRecord.author,
        },
        this.config.cacheTTL
      );

      // 버전별 상세 정보 저장
      const detailKey = `${this.config.cachePrefix}detail:${versionRecord.version}`;
      this.memoryCache.set<VersionRecord>(
        detailKey,
        versionRecord,
        this.config.cacheTTL
      );

      // 버전 목록 업데이트 (최근 10개)
      const listKey = `${this.config.cachePrefix}list`;
      const existingList = this.memoryCache.get<string[]>(listKey) || [];
      const updatedList = [versionRecord.version, ...existingList.slice(0, 9)];
      this.memoryCache.set<string[]>(listKey, updatedList, this.config.cacheTTL);

      console.log(`✅ Memory 버전 캐시 업데이트: ${versionRecord.version}`);
    } catch (error) {
      console.error('❌ Memory 버전 캐시 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 🗃️ Supabase 영구 저장
   */
  private async saveToSupabase(versionRecord: VersionRecord): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('version_history')
        .insert([{
          id: versionRecord.id,
          version: versionRecord.version,
          previous_version: versionRecord.previousVersion,
          change_type: versionRecord.changeType,
          timestamp: versionRecord.timestamp,
          author: versionRecord.author,
          description: versionRecord.description,
          changes: versionRecord.changes,
          migration: versionRecord.migration,
          deployment_info: versionRecord.deploymentInfo,
          metadata: versionRecord.metadata,
        }]);

      if (error) throw error;

      console.log(`✅ Supabase 버전 저장 완료: ${versionRecord.version}`);
    } catch (error) {
      console.error('❌ Supabase 버전 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 현재 버전 조회 (Memory Cache → Supabase)
   */
  async getCurrentVersion(): Promise<string | null> {
    try {
      // 메모리 캐시 확인
      if (this.currentVersion) {
        return this.currentVersion;
      }

      // 메모리 캐시에서 확인
      if (this.config.enableMemoryCache) {
        const cached = this.getFromMemoryCache();
        if (cached) {
          this.currentVersion = cached.version;
          return cached.version;
        }
      }

      // Supabase에서 최신 버전 조회
      if (this.config.enableSupabase && this.supabase) {
        const latest = await this.getLatestFromSupabase();
        if (latest) {
          this.currentVersion = latest.version;

          // 메모리 캐시 업데이트
          if (this.config.enableMemoryCache) {
            await this.updateMemoryCache(latest);
          }

          return latest.version;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ 현재 버전 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 메모리 캐시에서 현재 버전 조회
   */
  private getFromMemoryCache(): {
    version: string;
    timestamp: string;
    changeType: string;
    author: string;
  } | null {
    try {
      const currentKey = `${this.config.cachePrefix}current`;
      return this.memoryCache.get<{
        version: string;
        timestamp: string;
        changeType: string;
        author: string;
      }>(currentKey);
    } catch (error) {
      console.error('❌ Memory 캐시 버전 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 Supabase에서 최신 버전 조회
   */
  private async getLatestFromSupabase(): Promise<VersionRecord | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('version_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) return null;

      if (!this.isValidVersionHistoryRow(data)) {
        throw new Error('Invalid version history data format');
      }
      
      return {
        id: data.id,
        version: data.version,
        previousVersion: data.previous_version,
        changeType: data.change_type,
        timestamp: data.timestamp,
        author: data.author,
        description: data.description,
        changes: data.changes,
        migration: data.migration,
        deploymentInfo: data.deployment_info,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('❌ Supabase 최신 버전 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📚 버전 히스토리 조회
   */
  async getVersionHistory(limit: number = 20): Promise<VersionRecord[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('version_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      // Type-safe processing with validation
      const validRows: VersionHistoryRow[] = [];
      const dataArray = Array.isArray(data) ? data : [data];
      
      for (const item of dataArray) {
        if (this.isValidVersionHistoryRow(item)) {
          validRows.push(item);
        } else {
          console.warn('❌ Invalid version history row data:', item);
        }
      }

      return validRows.map(item => ({
        id: item.id,
        version: item.version,
        previousVersion: item.previous_version,
        changeType: item.change_type,
        timestamp: item.timestamp,
        author: item.author,
        description: item.description,
        changes: item.changes,
        migration: item.migration,
        deploymentInfo: item.deployment_info,
        metadata: item.metadata,
      }));
    } catch (error) {
      console.error('❌ 버전 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 🔍 특정 버전 상세 조회
   */
  async getVersionDetails(version: string): Promise<VersionRecord | null> {
    try {
      // 메모리 캐시 먼저 확인
      if (this.config.enableMemoryCache) {
        const detailKey = `${this.config.cachePrefix}detail:${version}`;
        const cached = this.memoryCache.get<VersionRecord>(detailKey);
        if (cached) {
          console.log(`✅ Memory에서 버전 상세 조회: ${version}`);
          return cached;
        }
      }

      // Supabase에서 조회
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('version_history')
          .select('*')
          .eq('id', this.generateVersionId(version))
          .single();

        if (error) throw error;
        if (!data) return null;

        if (!this.isValidVersionHistoryRow(data)) {
          console.error('❌ Invalid version history row data format:', data);
          return null;
        }

        const versionRecord: VersionRecord = {
          id: data.id,
          version: data.version,
          previousVersion: data.previous_version,
          changeType: data.change_type,
          timestamp: data.timestamp,
          author: data.author,
          description: data.description,
          changes: data.changes,
          migration: data.migration,
          deploymentInfo: data.deployment_info,
          metadata: data.metadata,
        };

        // 메모리 캐시 업데이트
        if (this.config.enableMemoryCache) {
          const detailKey = `${this.config.cachePrefix}detail:${version}`;
          this.memoryCache.set<VersionRecord>(detailKey, versionRecord, this.config.cacheTTL);
        }

        console.log(`✅ Supabase에서 버전 상세 조회: ${version}`);
        return versionRecord;
      }

      return null;
    } catch (error) {
      console.error('❌ 버전 상세 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔄 버전 비교
   */
  async compareVersions(
    version1: string,
    version2: string
  ): Promise<{
    version1: VersionRecord | null;
    version2: VersionRecord | null;
    differences: {
      added: string[];
      removed: string[];
      modified: string[];
    };
    migrationRequired: boolean;
  }> {
    try {
      const [v1, v2] = await Promise.all([
        this.getVersionDetails(version1),
        this.getVersionDetails(version2),
      ]);

      if (!v1 || !v2) {
        return {
          version1: v1,
          version2: v2,
          differences: { added: [], removed: [], modified: [] },
          migrationRequired: false,
        };
      }

      // 변경사항 비교 계산
      const differences = this.calculateDifferences(v1.changes, v2.changes);
      const migrationRequired =
        v1.migration?.required || v2.migration?.required || false;

      return {
        version1: v1,
        version2: v2,
        differences,
        migrationRequired,
      };
    } catch (error) {
      console.error('❌ 버전 비교 실패:', error);
      return {
        version1: null,
        version2: null,
        differences: { added: [], removed: [], modified: [] },
        migrationRequired: false,
      };
    }
  }

  /**
   * 📊 버전 통계
   */
  async getVersionStats(): Promise<{
    totalVersions: number;
    changeTypes: Record<string, number>;
    averageTimeBeweenReleases: number;
    lastReleaseDate: string;
    upcomingMigrations: number;
  }> {
    if (!this.supabase) {
      return {
        totalVersions: 0,
        changeTypes: {},
        averageTimeBeweenReleases: 0,
        lastReleaseDate: '',
        upcomingMigrations: 0,
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('version_history')
        .select('change_type, timestamp, migration')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      if (!data) return {
        totalVersions: 0,
        changeTypes: {},
        averageTimeBeweenReleases: 0,
        lastReleaseDate: '',
        upcomingMigrations: 0,
      };

      // Type-safe processing for stats data
      const rows: Array<{
        change_type: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
        timestamp: string;
        migration?: { required: boolean };
      }> = [];

      const dataArray = Array.isArray(data) ? data : [data];
      for (const item of dataArray) {
        if (
          item &&
          typeof item === 'object' &&
          'change_type' in item &&
          'timestamp' in item &&
          typeof item.change_type === 'string' &&
          typeof item.timestamp === 'string' &&
          ['MAJOR', 'MINOR', 'PATCH', 'HOTFIX'].includes(item.change_type as string)
        ) {
          rows.push(item as {
            change_type: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
            timestamp: string;
            migration?: { required: boolean };
          });
        }
      }
      
      const totalVersions = rows.length;
      const changeTypes: Record<string, number> = {};
      let upcomingMigrations = 0;

      rows.forEach(item => {
        changeTypes[item.change_type] = (changeTypes[item.change_type] || 0) + 1;
        if (item.migration?.required) {
          upcomingMigrations++;
        }
      });

      const lastReleaseDate = rows[0]?.timestamp || '';
      
      // 평균 릴리스 간격 계산
      let averageTimeBeweenReleases = 0;
      if (rows.length > 1) {
        const totalTime = new Date(rows[0].timestamp).getTime() - 
                         new Date(rows[rows.length - 1].timestamp).getTime();
        averageTimeBeweenReleases = totalTime / (rows.length - 1) / (1000 * 60 * 60 * 24); // days
      }

      return {
        totalVersions,
        changeTypes,
        averageTimeBeweenReleases,
        lastReleaseDate,
        upcomingMigrations,
      };
    } catch (error) {
      console.error('❌ 버전 통계 조회 실패:', error);
      return {
        totalVersions: 0,
        changeTypes: {},
        averageTimeBeweenReleases: 0,
        lastReleaseDate: '',
        upcomingMigrations: 0,
      };
    }
  }

  /**
   * 🔄 롤백 정보 생성
   */
  async generateRollbackPlan(targetVersion: string): Promise<{
    success: boolean;
    rollbackSteps: string[];
    migrationScripts: string[];
    warnings: string[];
  }> {
    try {
      const currentVersion = await this.getCurrentVersion();
      if (!currentVersion) {
        return {
          success: false,
          rollbackSteps: [],
          migrationScripts: [],
          warnings: ['현재 버전을 확인할 수 없습니다.'],
        };
      }

      const comparison = await this.compareVersions(
        currentVersion,
        targetVersion
      );

      const rollbackPlan = {
        success: true,
        rollbackSteps: [
          `현재 버전 ${currentVersion}에서 ${targetVersion}으로 롤백`,
          '데이터베이스 백업 생성',
          '롤백 스크립트 실행',
          '시스템 재시작',
          '헬스체크 수행',
        ],
        migrationScripts: comparison.version2?.migration?.rollbackScripts || [],
        warnings: comparison.migrationRequired
          ? ['마이그레이션이 필요한 버전입니다. 데이터 손실 가능성이 있습니다.']
          : [],
      };

      console.log(
        `🔄 롤백 계획 생성 완료: ${currentVersion} → ${targetVersion}`
      );
      return rollbackPlan;
    } catch (error) {
      console.error('❌ 롤백 계획 생성 실패:', error);
      return {
        success: false,
        rollbackSteps: [],
        migrationScripts: [],
        warnings: ['롤백 계획 생성에 실패했습니다.'],
      };
    }
  }

  /**
   * 🧹 캐시 무효화
   */
  async invalidateCache(): Promise<void> {
    this.currentVersion = null;
    this.memoryCache.clear();
    console.log('🧹 CloudVersionManager 캐시 무효화 완료');
  }

  /**
   * 🔑 버전 ID 생성
   */
  private generateVersionId(version: string): string {
    return version.replace(/\./g, '-');
  }

  /**
   * 🔐 체크섬 생성
   */
  /**
   * 🔍 VersionHistoryRow 타입 가드
   */
  private isValidVersionHistoryRow(data: unknown): data is VersionHistoryRow {
    if (!data || typeof data !== 'object') return false;
    
    const row = data as Record<string, unknown>;
    
    return (
      typeof row.id === 'string' &&
      typeof row.version === 'string' &&
      typeof row.change_type === 'string' &&
      ['MAJOR', 'MINOR', 'PATCH', 'HOTFIX'].includes(row.change_type as string) &&
      typeof row.timestamp === 'string' &&
      typeof row.author === 'string' &&
      typeof row.description === 'string' &&
      typeof row.changes === 'object' &&
      typeof row.metadata === 'object'
    );
  }

  private generateChecksum(data: Record<string, unknown>): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 📦 종속성 추출
   */
  private async extractDependencies(): Promise<Record<string, string>> {
    try {
      // 메모리에서 기본 의존성 정보 제공
      return {
        'next': '^15.0.0',
        'react': '^18.2.0',
        'typescript': '^5.0.0',
      };
    } catch (error) {
      console.warn('종속성 정보 추출 실패:', error);
      return {};
    }
  }

  /**
   * 🔍 변경사항 차이 계산
   */
  private calculateDifferences(
    changes1: VersionRecord['changes'],
    changes2: VersionRecord['changes']
  ): { added: string[]; removed: string[]; modified: string[] } {
    const added = changes2.added.filter(item => !changes1.added.includes(item));
    const removed = changes1.added.filter(
      item => !changes2.added.includes(item)
    );
    const modified = changes2.modified.filter(
      item => !changes1.modified.includes(item)
    );

    return { added, removed, modified };
  }
}