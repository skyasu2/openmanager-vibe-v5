/**
 * 🌐 Cloud-based Version Manager (Production Optimized)
 *
 * VersionManager 대체: 파일 시스템 → 경량화된 Firestore
 *
 * 기능:
 * - 핵심 버전 정보만 기록 (Vercel 배포와 연동)
 * - 개발환경에서만 상세 메타데이터 수집
 * - 프로덕션에서는 최소한의 추적만 수행
 */

import { getRedis } from '@/lib/redis';

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

interface CloudVersionManagerConfig {
  enableRedisCache: boolean;
  enableFirestore: boolean;
  redisPrefix: string;
  redisTTL: number;
  maxVersionHistory: number;
  compressionEnabled: boolean;
  isProduction: boolean; // 새로 추가
}

export class CloudVersionManager {
  private static instance: CloudVersionManager;
  private config: CloudVersionManagerConfig;
  private redis: any;
  private currentVersion: string | null = null;

  constructor(config?: Partial<CloudVersionManagerConfig>) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      enableRedisCache: !isProduction, // 프로덕션에서는 Redis 비활성화
      enableFirestore: !isProduction, // 프로덕션에서는 Firestore 비활성화
      redisPrefix: 'openmanager:version:',
      redisTTL: 86400, // 24시간
      maxVersionHistory: isProduction ? 5 : 100, // 프로덕션에서는 최근 5개만
      compressionEnabled: true,
      isProduction,
      ...config,
    };

    // Redis 연결 (개발 환경에서만)
    if (
      typeof window === 'undefined' &&
      this.config.enableRedisCache &&
      !isProduction
    ) {
      this.redis = getRedis();
    }

    console.log(
      `🌐 CloudVersionManager 초기화 완료 (${isProduction ? 'Production' : 'Development'} 모드)`
    );
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
   * 📝 새 버전 기록 (Firestore + Redis)
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

      // 1. Firestore에 영구 저장
      if (this.config.enableFirestore) {
        await this.saveToFirestore(versionRecord);
      }

      // 2. Redis 캐싱 (최신 버전 정보)
      if (this.config.enableRedisCache && this.redis) {
        await this.updateRedisCache(versionRecord);
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
   * 🔄 Redis 캐시 업데이트
   */
  private async updateRedisCache(versionRecord: VersionRecord): Promise<void> {
    if (!this.redis) return;

    try {
      // 최신 버전 정보 저장
      const currentKey = `${this.config.redisPrefix}current`;
      await this.redis.setex(
        currentKey,
        this.config.redisTTL,
        JSON.stringify({
          version: versionRecord.version,
          timestamp: versionRecord.timestamp,
          changeType: versionRecord.changeType,
          author: versionRecord.author,
        })
      );

      // 버전별 상세 정보 저장
      const detailKey = `${this.config.redisPrefix}detail:${versionRecord.version}`;
      await this.redis.setex(
        detailKey,
        this.config.redisTTL,
        JSON.stringify(versionRecord)
      );

      // 버전 목록 업데이트 (최근 10개)
      await this.redis.lpush(
        `${this.config.redisPrefix}list`,
        versionRecord.version
      );
      await this.redis.ltrim(`${this.config.redisPrefix}list`, 0, 9); // 최근 10개만 유지

      console.log(`✅ Redis 버전 캐시 업데이트: ${versionRecord.version}`);
    } catch (error) {
      console.error('❌ Redis 버전 캐시 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 🗃️ Firestore 영구 저장
   */
  private async saveToFirestore(versionRecord: VersionRecord): Promise<void> {
    try {
      const response = await fetch('/api/firestore/version-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(versionRecord),
      });

      if (!response.ok) {
        throw new Error(`Firestore 버전 저장 실패: ${response.status}`);
      }

      console.log(`✅ Firestore 버전 저장 완료: ${versionRecord.version}`);
    } catch (error) {
      console.error('❌ Firestore 버전 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 현재 버전 조회 (Redis → Firestore)
   */
  async getCurrentVersion(): Promise<string | null> {
    try {
      // 메모리 캐시 확인
      if (this.currentVersion) {
        return this.currentVersion;
      }

      // Redis 캐시 확인
      if (this.config.enableRedisCache && this.redis) {
        const cached = await this.getFromRedisCache();
        if (cached) {
          this.currentVersion = cached.version;
          return cached.version;
        }
      }

      // Firestore에서 최신 버전 조회
      if (this.config.enableFirestore) {
        const latest = await this.getLatestFromFirestore();
        if (latest) {
          this.currentVersion = latest.version;

          // Redis 캐시 업데이트
          if (this.config.enableRedisCache && this.redis) {
            await this.updateRedisCache(latest);
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
   * 🔍 Redis에서 현재 버전 조회
   */
  private async getFromRedisCache(): Promise<{
    version: string;
    timestamp: string;
    changeType: string;
    author: string;
  } | null> {
    if (!this.redis) return null;

    try {
      const currentKey = `${this.config.redisPrefix}current`;
      const data = await this.redis.get(currentKey);

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis 버전 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 Firestore에서 최신 버전 조회
   */
  private async getLatestFromFirestore(): Promise<VersionRecord | null> {
    try {
      const response = await fetch('/api/firestore/version-history/latest');

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ Firestore 최신 버전 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📚 버전 히스토리 조회
   */
  async getVersionHistory(limit: number = 20): Promise<VersionRecord[]> {
    try {
      const response = await fetch(
        `/api/firestore/version-history?limit=${limit}`
      );

      if (response.ok) {
        return await response.json();
      }

      return [];
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
      // Redis 캐시 먼저 확인
      if (this.config.enableRedisCache && this.redis) {
        const detailKey = `${this.config.redisPrefix}detail:${version}`;
        const cached = await this.redis.get(detailKey);
        if (cached) {
          console.log(`✅ Redis에서 버전 상세 조회: ${version}`);
          return JSON.parse(cached);
        }
      }

      // Firestore에서 조회
      const response = await fetch(
        `/api/firestore/version-history/${this.generateVersionId(version)}`
      );

      if (response.ok) {
        const versionRecord = await response.json();

        // Redis 캐시 업데이트
        if (this.config.enableRedisCache && this.redis) {
          const detailKey = `${this.config.redisPrefix}detail:${version}`;
          await this.redis.setex(
            detailKey,
            this.config.redisTTL,
            JSON.stringify(versionRecord)
          );
        }

        console.log(`✅ Firestore에서 버전 상세 조회: ${version}`);
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
    try {
      const response = await fetch('/api/version-history/stats');

      if (response.ok) {
        return await response.json();
      }

      return {
        totalVersions: 0,
        changeTypes: {},
        averageTimeBeweenReleases: 0,
        lastReleaseDate: '',
        upcomingMigrations: 0,
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
   * 🔑 버전 ID 생성
   */
  private generateVersionId(version: string): string {
    return version.replace(/\./g, '-');
  }

  /**
   * 🔐 체크섬 생성
   */
  private generateChecksum(data: any): string {
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
      // package.json 정보 조회
      const response = await fetch('/api/system/dependencies');
      if (response.ok) {
        return await response.json();
      }
      return {};
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

  /**
   * 🧹 캐시 무효화
   */
  async invalidateCache(): Promise<void> {
    this.currentVersion = null;

    if (this.redis) {
      const keys = await this.redis.keys(`${this.config.redisPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }

    console.log('🧹 CloudVersionManager 캐시 무효화 완료');
  }
}
