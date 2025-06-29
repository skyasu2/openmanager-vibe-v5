/**
 * 🔄 백그라운드 서버 데이터 스케줄러
 *
 * Function Duration 최적화의 핵심:
 * - 데이터 생성과 전송 완전 분리
 * - Redis/Supabase에 미리 저장
 * - SSE는 단순 조회만 수행
 * - 변경 감지 기반 델타 업데이트
 */

import { getRedisClient } from '@/lib/redis';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { createClient } from '@supabase/supabase-js';

interface StoredServerData {
  servers: any[];
  summary: any;
  timestamp: string;
  version: number;
  changes: {
    added: string[];
    updated: string[];
    removed: string[];
  };
}

export class ServerDataScheduler {
  private static instance: ServerDataScheduler;
  private generator: RealServerDataGenerator;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastVersion = 0;
  private lastData: StoredServerData | null = null;

  // 🎯 Vercel Pro 최적화 설정
  private readonly GENERATION_INTERVAL = 45000; // 45초 (기존 20초에서 증가)
  private readonly REDIS_EXPIRY = 300; // 5분
  private readonly MAX_STORAGE_SIZE = 1000; // 최대 저장 크기

  private constructor() {
    this.generator = RealServerDataGenerator.getInstance();
  }

  public static getInstance(): ServerDataScheduler {
    if (!ServerDataScheduler.instance) {
      ServerDataScheduler.instance = new ServerDataScheduler();
    }
    return ServerDataScheduler.instance;
  }

  /**
   * 🚀 백그라운드 스케줄러 시작
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ 스케줄러가 이미 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('🚀 백그라운드 서버 데이터 스케줄러 시작');

    // 즉시 첫 데이터 생성
    await this.generateAndStore();

    // 정기 업데이트 시작
    this.intervalId = setInterval(async () => {
      try {
        await this.generateAndStore();
      } catch (error) {
        console.error('❌ 백그라운드 데이터 생성 오류:', error);
      }
    }, this.GENERATION_INTERVAL);

    console.log(
      `📅 스케줄러 활성화: ${this.GENERATION_INTERVAL / 1000}초 간격`
    );
  }

  /**
   * ⏹️ 백그라운드 스케줄러 중지
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ 백그라운드 서버 데이터 스케줄러 중지');
  }

  /**
   * 🔄 데이터 생성 및 저장 (핵심 로직)
   */
  private async generateAndStore(): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. 새로운 데이터 생성
      const servers = this.generator.getAllServers();
      const summary = this.generateSummary(servers);

      // 2. 변경 감지
      const changes = this.detectChanges(servers);

      // 3. 버전 증가
      this.lastVersion++;

      const newData: StoredServerData = {
        servers,
        summary,
        timestamp: new Date().toISOString(),
        version: this.lastVersion,
        changes,
      };

      // 4. 병렬 저장 (성능 최적화)
      await Promise.allSettled([
        this.storeInRedis(newData),
        this.storeInSupabase(newData),
        this.publishChanges(changes),
      ]);

      this.lastData = newData;

      const duration = Date.now() - startTime;
      console.log(
        `📊 데이터 생성/저장 완료: ${servers.length}개 서버, ${duration}ms`
      );

      // 변경사항이 있으면 알림
      if (
        changes.added.length ||
        changes.updated.length ||
        changes.removed.length
      ) {
        console.log(
          `🔄 변경 감지: +${changes.added.length} ~${changes.updated.length} -${changes.removed.length}`
        );
      }
    } catch (error) {
      console.error('❌ 데이터 생성/저장 실패:', error);
    }
  }

  /**
   * 🔍 변경사항 감지 (델타 업데이트용)
   */
  private detectChanges(newServers: any[]): StoredServerData['changes'] {
    if (!this.lastData) {
      return {
        added: newServers.map(s => s.id),
        updated: [],
        removed: [],
      };
    }

    const oldServers = this.lastData.servers;
    const oldIds = new Set(oldServers.map(s => s.id));
    const newIds = new Set(newServers.map(s => s.id));

    const added = newServers.filter(s => !oldIds.has(s.id)).map(s => s.id);
    const removed = oldServers.filter(s => !newIds.has(s.id)).map(s => s.id);

    // 상태나 메트릭이 변경된 서버 감지
    const updated = newServers
      .filter(newServer => {
        const oldServer = oldServers.find(s => s.id === newServer.id);
        if (!oldServer) return false;

        return (
          newServer.status !== oldServer.status ||
          Math.abs(newServer.metrics.cpu - oldServer.metrics.cpu) > 5 ||
          Math.abs(newServer.metrics.memory - oldServer.metrics.memory) > 5
        );
      })
      .map(s => s.id);

    return { added, updated, removed };
  }

  /**
   * 🔴 Redis 저장 (빠른 접근용)
   */
  private async storeInRedis(data: StoredServerData): Promise<void> {
    try {
      const redis = await getRedisClient('server-scheduler');
      if (!redis) {
        console.warn('⚠️ Redis 클라이언트 없음 - 저장 건너뛰기');
        return;
      }

      const key = 'openmanager:servers:current';
      const compressed = JSON.stringify(data);

      if (compressed.length > this.MAX_STORAGE_SIZE * 1024) {
        console.warn(`⚠️ 데이터 크기 초과: ${compressed.length} bytes`);
        // 크기 초과시 요약 데이터만 저장
        const lightData = {
          ...data,
          servers: data.servers.slice(0, 10), // 상위 10개만
        };
        await redis.setex(key, this.REDIS_EXPIRY, JSON.stringify(lightData));
      } else {
        await redis.setex(key, this.REDIS_EXPIRY, compressed);
      }

      // 변경사항 별도 저장 (SSE 최적화용)
      await redis.setex(
        'openmanager:servers:changes',
        this.REDIS_EXPIRY,
        JSON.stringify(data.changes)
      );

      console.log(`💾 Redis 저장 완료: v${data.version}`);
    } catch (error) {
      console.error('❌ Redis 저장 실패:', error);
    }
  }

  /**
   * 💾 Supabase 저장 (영구 보관용)
   */
  private async storeInSupabase(data: StoredServerData): Promise<void> {
    try {
      // 환경변수가 없으면 건너뛰기
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.log('⏭️ Supabase 환경변수 없음 - 건너뛰기');
        return;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 최근 데이터만 유지 (100개 제한)
      const { error: deleteError } = await supabase
        .from('server_snapshots')
        .delete()
        .lt('version', data.version - 100);

      // 새 데이터 저장
      const { error: insertError } = await supabase
        .from('server_snapshots')
        .insert({
          version: data.version,
          data: data,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      console.log(`💾 Supabase 저장 완료: v${data.version}`);
    } catch (error) {
      console.error('❌ Supabase 저장 실패:', error);
    }
  }

  /**
   * 📡 변경사항 발행 (Redis Pub/Sub)
   */
  private async publishChanges(
    changes: StoredServerData['changes']
  ): Promise<void> {
    if (
      !changes.added.length &&
      !changes.updated.length &&
      !changes.removed.length
    ) {
      return; // 변경사항 없으면 발행 안함
    }

    try {
      const redis = await getRedisClient('server-scheduler');
      if (!redis) {
        console.warn('⚠️ Redis 클라이언트 없음 - 발행 건너뛰기');
        return;
      }

      const message = {
        type: 'server_changes',
        changes,
        timestamp: new Date().toISOString(),
      };

      // TODO: Redis publish 기능 구현 필요
      // await redis.publish('openmanager:updates', JSON.stringify(message));
      console.log(`📡 변경사항 감지 (발행 준비): ${JSON.stringify(changes)}`);
    } catch (error) {
      console.error('❌ 변경사항 발행 실패:', error);
    }
  }

  /**
   * 📊 요약 데이터 생성
   */
  private generateSummary(servers: any[]): any {
    return {
      totalServers: servers.length,
      onlineServers: servers.filter(s => s.status === 'running').length,
      warningServers: servers.filter(s => s.status === 'warning').length,
      errorServers: servers.filter(s => s.status === 'error').length,
      avgCpu:
        servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length,
      avgMemory:
        servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * 📖 저장된 데이터 조회 (SSE용)
   */
  public async getStoredData(): Promise<StoredServerData | null> {
    try {
      const redis = await getRedisClient('server-scheduler');
      if (!redis) {
        console.warn('⚠️ Redis 클라이언트 없음 - 조회 건너뛰기');
        return null;
      }

      const data = await redis.get('openmanager:servers:current');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ 저장된 데이터 조회 실패:', error);
      return null;
    }
  }

  /**
   * 🔄 변경사항만 조회 (델타 업데이트용)
   */
  public async getChanges(): Promise<StoredServerData['changes'] | null> {
    try {
      const redis = await getRedisClient('server-scheduler');
      if (!redis) {
        console.warn('⚠️ Redis 클라이언트 없음 - 변경사항 조회 건너뛰기');
        return null;
      }

      const changes = await redis.get('openmanager:servers:changes');
      return changes ? JSON.parse(changes) : null;
    } catch (error) {
      console.error('❌ 변경사항 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📊 스케줄러 상태 조회
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.GENERATION_INTERVAL,
      lastVersion: this.lastVersion,
      lastUpdate: this.lastData?.timestamp,
      optimization: {
        separatedGeneration: true,
        deltaUpdates: true,
        functionDurationOptimized: true,
        storageBackends: ['Redis', 'Supabase'],
      },
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const serverDataScheduler = ServerDataScheduler.getInstance();
