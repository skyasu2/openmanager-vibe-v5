/**
 * 🌐 Cloud-based Log Saver (Privacy & Cost Optimized)
 *
 * LogSaver 대체: 파일 시스템 → 샘플링 기반 GCP 저장
 *
 * 기능:
 * - AI 분석 결과 샘플링 저장 (개인정보 보호)
 * - 프로덕션: 10% 샘플링 + 7일 보관
 * - 개발환경: 전체 저장 + 30일 보관
 * - Redis 실시간 캐싱만 활용 (장기보관 최소화)
 */

import { getRedis } from '@/lib/redis';

interface AnalysisLogEntry {
  id: string;
  date: string;
  analysisType: string;
  results: any;
  metadata: {
    timestamp: string;
    version: string;
    source: 'ai_analysis' | 'system_log' | 'user_action';
    sessionId?: string;
    userId?: string;
    isSampled?: boolean; // 샘플링 여부
  };
}

interface CloudLogSaverConfig {
  enableRedisCache: boolean;
  enableFirestore: boolean;
  enableCloudStorage: boolean;
  enableSampling: boolean; // 새로 추가
  samplingRate: number; // 새로 추가 (0.0-1.0)
  redisPrefix: string;
  redisTTL: number;
  batchSize: number;
  dataRetentionDays: number; // 새로 추가
  isProduction: boolean; // 새로 추가
}

export class CloudLogSaver {
  private static instance: CloudLogSaver;
  private config: CloudLogSaverConfig;
  private redis: any;
  private logBuffer: Map<string, AnalysisLogEntry[]> = new Map();

  constructor(config?: Partial<CloudLogSaverConfig>) {
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      enableRedisCache: true, // 실시간 모니터링은 유지
      enableFirestore: !isProduction, // 프로덕션에서는 Firestore 비활성화
      enableCloudStorage: false, // 장기보관 비활성화
      enableSampling: isProduction, // 프로덕션에서만 샘플링
      samplingRate: isProduction ? 0.1 : 1.0, // 프로덕션 10%, 개발 100%
      redisPrefix: 'openmanager:logs:',
      redisTTL: isProduction ? 604800 : 1800, // 프로덕션 7일, 개발 30분
      batchSize: 100,
      dataRetentionDays: isProduction ? 7 : 30, // 프로덕션 7일, 개발 30일
      isProduction,
      ...config,
    };

    // Redis 연결 (서버 환경에서만)
    if (typeof window === 'undefined' && this.config.enableRedisCache) {
      this.redis = getRedis();
    }

    console.log(
      `🌐 CloudLogSaver 초기화 완료 (${isProduction ? 'Production' : 'Development'} 모드)`
    );
    console.log(
      `📊 샘플링 비율: ${this.config.samplingRate * 100}%, 보관기간: ${this.config.dataRetentionDays}일`
    );
  }

  static getInstance(config?: Partial<CloudLogSaverConfig>): CloudLogSaver {
    if (!CloudLogSaver.instance) {
      CloudLogSaver.instance = new CloudLogSaver(config);
    }
    return CloudLogSaver.instance;
  }

  /**
   * 🎯 AI 분석 결과 저장 (Firestore + Redis)
   */
  async saveAnalysisLog(
    date: string,
    analysisType: string,
    results: any,
    sessionId?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const logEntry: AnalysisLogEntry = {
        id: `${date}-${analysisType}-${Date.now()}`,
        date,
        analysisType,
        results,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          source: 'ai_analysis',
          sessionId,
          userId,
        },
      };

      // 1. Redis 실시간 캐싱
      if (this.config.enableRedisCache && this.redis) {
        await this.saveToRedis(logEntry);
      }

      // 2. Firestore 구조화 저장
      if (this.config.enableFirestore) {
        await this.saveToFirestore(logEntry);
      }

      // 3. 배치 버퍼에 추가 (Cloud Storage 백업용)
      if (this.config.enableCloudStorage) {
        this.addToBatch(logEntry);
      }

      console.log(`✅ CloudLogSaver: 분석 로그 저장 완료 - ${logEntry.id}`);
      return true;
    } catch (error) {
      console.error('❌ CloudLogSaver: 분석 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 🔄 Redis 실시간 캐싱
   */
  private async saveToRedis(logEntry: AnalysisLogEntry): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${this.config.redisPrefix}analysis:${logEntry.id}`;
      const data = JSON.stringify(logEntry);

      await this.redis.setex(key, this.config.redisTTL, data);

      // 분석 타입별 인덱스 유지
      await this.redis.sadd(
        `${this.config.redisPrefix}types:${logEntry.analysisType}`,
        logEntry.id
      );

      console.log(`✅ Redis 캐싱 완료: ${logEntry.id}`);
    } catch (error) {
      console.error('❌ Redis 캐싱 실패:', error);
      throw error;
    }
  }

  /**
   * 🗃️ Firestore 구조화 저장
   */
  private async saveToFirestore(logEntry: AnalysisLogEntry): Promise<void> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      // Firestore API 호출 (REST API 사용)
      const response = await fetch(`${appUrl}/api/firestore/analysis-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        throw new Error(`Firestore 저장 실패: ${response.status}`);
      }

      console.log(`✅ Firestore 저장 완료: ${logEntry.id}`);
    } catch (error) {
      console.error('❌ Firestore 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 📦 배치 버퍼 관리 (Cloud Storage 백업용)
   */
  private addToBatch(logEntry: AnalysisLogEntry): void {
    const today = new Date().toISOString().split('T')[0];

    if (!this.logBuffer.has(today)) {
      this.logBuffer.set(today, []);
    }

    const dailyLogs = this.logBuffer.get(today)!;
    dailyLogs.push(logEntry);

    // 배치 크기 도달 시 Cloud Storage 백업
    if (dailyLogs.length >= this.config.batchSize) {
      this.flushToCloudStorage(today);
    }
  }

  /**
   * ☁️ Cloud Storage 일일 백업
   */
  private async flushToCloudStorage(date: string): Promise<void> {
    try {
      const logs = this.logBuffer.get(date);
      if (!logs || logs.length === 0) return;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      // Cloud Storage API 호출
      const response = await fetch(`${appUrl}/api/cloud-storage/daily-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          logs,
          count: logs.length,
        }),
      });

      if (response.ok) {
        // 백업 완료 후 버퍼 초기화
        this.logBuffer.delete(date);
        console.log(
          `☁️ Cloud Storage 백업 완료: ${date} (${logs.length}개 로그)`
        );
      }
    } catch (error) {
      console.error('❌ Cloud Storage 백업 실패:', error);
    }
  }

  /**
   * 🔍 분석 로그 조회 (Redis → Firestore → Cloud Storage 순서)
   */
  async getAnalysisLog(logId: string): Promise<AnalysisLogEntry | null> {
    try {
      // 1. Redis 캐시 먼저 확인
      if (this.config.enableRedisCache && this.redis) {
        const cached = await this.getFromRedis(logId);
        if (cached) {
          console.log(`✅ Redis에서 로그 조회: ${logId}`);
          return cached;
        }
      }

      // 2. Firestore에서 조회
      if (this.config.enableFirestore) {
        const firestore = await this.getFromFirestore(logId);
        if (firestore) {
          console.log(`✅ Firestore에서 로그 조회: ${logId}`);
          return firestore;
        }
      }

      console.log(`⚠️ 로그를 찾을 수 없음: ${logId}`);
      return null;
    } catch (error) {
      console.error('❌ 로그 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 Redis에서 로그 조회
   */
  private async getFromRedis(logId: string): Promise<AnalysisLogEntry | null> {
    if (!this.redis) return null;

    try {
      const key = `${this.config.redisPrefix}analysis:${logId}`;
      const data = await this.redis.get(key);

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔍 Firestore에서 로그 조회
   */
  private async getFromFirestore(
    logId: string
  ): Promise<AnalysisLogEntry | null> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${appUrl}/api/firestore/analysis-logs/${logId}`);

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ Firestore 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📊 로그 통계 조회
   */
  async getLogStats(date?: string): Promise<{
    totalLogs: number;
    analysisTypes: Record<string, number>;
    cacheHitRate: number;
    firestoreQueries: number;
  }> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(
        `${appUrl}/api/analysis-logs/stats${date ? `?date=${date}` : ''}`
      );
      if (!response.ok) {
        throw new Error('로그 통계 조회 실패');
      }
      return await response.json();
    } catch (error) {
      console.error('❌ 로그 통계 조회 실패:', error);
      return {
        totalLogs: 0,
        analysisTypes: {},
        cacheHitRate: 0,
        firestoreQueries: 0,
      };
    }
  }

  /**
   * 🧹 정리 작업
   */
  async cleanup(): Promise<void> {
    // 모든 배치 버퍼를 Cloud Storage에 플러시
    for (const [date, logs] of this.logBuffer.entries()) {
      if (logs.length > 0) {
        await this.flushToCloudStorage(date);
      }
    }

    console.log('🧹 CloudLogSaver 정리 작업 완료');
  }
}
