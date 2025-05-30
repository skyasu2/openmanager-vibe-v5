/**
 * 📊 메트릭 저장소 - 시계열 데이터베이스 통합
 * 
 * InfluxDB, Redis, Supabase를 통합한 다중 저장소 시스템
 * - InfluxDB: 고성능 시계열 데이터 저장
 * - Redis: 실시간 캐싱 및 빠른 조회
 * - Supabase: 관계형 데이터 및 백업
 */

import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import { ServerMetrics } from '../../types/server';
import { redis, CacheService } from '../redis';
import { supabase, supabaseAdmin } from '../supabase';
import { env } from '../env';

// 🎯 InfluxDB 설정
interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

// 📊 통합 메트릭 데이터 구조
export interface TimeSeriesMetrics extends ServerMetrics {
  measurement_time: Date;
  tags: {
    server_id: string;
    environment: string;
    role: string;
    location?: string;
  };
  fields: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    response_time: number;
  };
}

export class MetricsStorage {
  private influxDB: InfluxDB | null = null;
  private writeApi: WriteApi | null = null;
  private isInfluxEnabled = false;
  private bucket = 'server_metrics';
  private org = 'openmanager';

  constructor() {
    this.initializeInfluxDB();
  }

  /**
   * 🔌 InfluxDB 초기화
   */
  private async initializeInfluxDB() {
    try {
      // 개발 환경에서는 InfluxDB 비활성화 (옵션)
      if (env.NODE_ENV === 'development') {
        console.log('🔧 개발 환경: InfluxDB 시뮬레이션 모드');
        return;
      }

      // 환경변수에서 InfluxDB 설정 확인
      const influxUrl = process.env.INFLUXDB_URL;
      const influxToken = process.env.INFLUXDB_TOKEN;

      if (!influxUrl || !influxToken) {
        console.log('⚠️ InfluxDB 환경변수 없음, 시뮬레이션 모드로 실행');
        return;
      }

      this.influxDB = new InfluxDB({
        url: influxUrl,
        token: influxToken,
      });

      this.writeApi = this.influxDB.getWriteApi(this.org, this.bucket, 'ms');
      this.writeApi.useDefaultTags({ service: 'openmanager' });

      this.isInfluxEnabled = true;
      console.log('✅ InfluxDB 연결 완료');

    } catch (error) {
      console.error('❌ InfluxDB 초기화 실패:', error);
      this.isInfluxEnabled = false;
    }
  }

  /**
   * 📊 메트릭 저장 (다중 저장소)
   */
  async storeMetrics(metrics: ServerMetrics[]): Promise<void> {
    const operations = await Promise.allSettled([
      this.storeToInfluxDB(metrics),
      this.storeToRedis(metrics),
      this.storeToSupabase(metrics)
    ]);

    // 결과 로깅
    const [influxResult, redisResult, supabaseResult] = operations;
    
    console.log('📊 메트릭 저장 결과:', {
      influxDB: influxResult.status,
      redis: redisResult.status,
      supabase: supabaseResult.status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 🕐 InfluxDB에 시계열 데이터 저장
   */
  private async storeToInfluxDB(metrics: ServerMetrics[]): Promise<void> {
    if (!this.isInfluxEnabled || !this.writeApi) {
      // 개발 환경에서는 로컬 파일에 저장 시뮬레이션
      console.log('🔧 InfluxDB 시뮬레이션: 메트릭 저장됨', metrics.length);
      return;
    }

    try {
      const points = metrics.map(metric => {
        const point = new Point('server_metrics')
          .tag('server_id', metric.id)
          .tag('hostname', metric.hostname)
          .tag('environment', metric.environment)
          .tag('role', metric.role)
          .tag('status', metric.status)
          .floatField('cpu_usage', metric.cpu_usage)
          .floatField('memory_usage', metric.memory_usage)
          .floatField('disk_usage', metric.disk_usage)
          .floatField('network_in', metric.network_in)
          .floatField('network_out', metric.network_out)
          .floatField('response_time', metric.response_time)
          .timestamp(new Date());

        return point;
      });

      this.writeApi.writePoints(points);
      await this.writeApi.flush();

      console.log(`✅ InfluxDB: ${metrics.length}개 메트릭 저장 완료`);
    } catch (error) {
      console.error('❌ InfluxDB 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 🔄 Redis에 최신 메트릭 캐싱
   */
  private async storeToRedis(metrics: ServerMetrics[]): Promise<void> {
    try {
      for (const metric of metrics) {
        const key = `server:${metric.id}:latest`;
        await CacheService.set(key, metric, 300); // 5분 TTL
      }

      // 서버 목록도 캐싱
      const serverList = metrics.map(m => ({ id: m.id, hostname: m.hostname, status: m.status }));
      await CacheService.set('servers:list', serverList, 60); // 1분 TTL

      console.log(`✅ Redis: ${metrics.length}개 메트릭 캐싱 완료`);
    } catch (error) {
      console.error('❌ Redis 캐싱 실패:', error);
      throw error;
    }
  }

  /**
   * 🗄️ Supabase에 백업 저장
   */
  private async storeToSupabase(metrics: ServerMetrics[]): Promise<void> {
    if (!supabaseAdmin) {
      console.log('🔧 Supabase 시뮬레이션: 메트릭 저장됨', metrics.length);
      return;
    }

    try {
      const transformedMetrics = metrics.map(metric => ({
        id: metric.id,
        hostname: metric.hostname,
        environment: metric.environment,
        role: metric.role,
        status: metric.status,
        cpu_usage: metric.cpu_usage,
        memory_usage: metric.memory_usage,
        disk_usage: metric.disk_usage,
        network_in: metric.network_in,
        network_out: metric.network_out,
        response_time: metric.response_time,
        uptime: metric.uptime,
        last_updated: metric.last_updated,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabaseAdmin
        .from('server_metrics_history')
        .insert(transformedMetrics);

      if (error) throw error;

      console.log(`✅ Supabase: ${metrics.length}개 메트릭 백업 완료`);
    } catch (error) {
      console.error('❌ Supabase 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 📈 시계열 데이터 조회 (InfluxDB)
   */
  async queryTimeSeriesData(
    serverId: string,
    timeRange: string = '1h',
    metrics: string[] = ['cpu_usage', 'memory_usage', 'disk_usage']
  ): Promise<any[]> {
    if (!this.isInfluxEnabled || !this.influxDB) {
      // 개발 환경에서는 mock 데이터 반환
      return this.generateMockTimeSeriesData(serverId, timeRange, metrics);
    }

    try {
      const queryApi = this.influxDB.getQueryApi(this.org);
      
      const fluxQuery = `
        from(bucket: "${this.bucket}")
        |> range(start: -${timeRange})
        |> filter(fn: (r) => r._measurement == "server_metrics")
        |> filter(fn: (r) => r.server_id == "${serverId}")
        |> filter(fn: (r) => contains(value: r._field, set: ${JSON.stringify(metrics)}))
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
      `;

      const result: any[] = [];
      
      await queryApi.queryRows(fluxQuery, {
        next(row: string[], tableMeta: any) {
          const o = tableMeta.toObject(row);
          result.push({
            time: o._time,
            field: o._field,
            value: o._value,
            server_id: o.server_id
          });
        },
        error(error: any) {
          console.error('❌ InfluxDB 쿼리 오류:', error);
        },
        complete() {
          console.log('✅ InfluxDB 쿼리 완료');
        }
      });

      return result;
    } catch (error) {
      console.error('❌ InfluxDB 쿼리 실패:', error);
      return this.generateMockTimeSeriesData(serverId, timeRange, metrics);
    }
  }

  /**
   * 🎲 Mock 시계열 데이터 생성 (개발/테스트용)
   */
  private generateMockTimeSeriesData(
    serverId: string,
    timeRange: string,
    metrics: string[]
  ): any[] {
    const now = new Date();
    const points = parseInt(timeRange) || 60; // 기본 60개 데이터 포인트
    const interval = 60000; // 1분 간격

    const data: any[] = [];

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(now.getTime() - (points - i - 1) * interval);
      
      metrics.forEach(metric => {
        let value = 0;
        
        switch (metric) {
          case 'cpu_usage':
            value = 30 + Math.random() * 40 + Math.sin(i / 10) * 20;
            break;
          case 'memory_usage':
            value = 50 + Math.random() * 30 + Math.sin(i / 15) * 15;
            break;
          case 'disk_usage':
            value = 20 + Math.random() * 10 + i * 0.1; // 점진적 증가
            break;
          case 'response_time':
            value = 100 + Math.random() * 200;
            break;
          default:
            value = Math.random() * 100;
        }

        data.push({
          time: timestamp.toISOString(),
          field: metric,
          value: Math.max(0, Math.min(100, value)),
          server_id: serverId
        });
      });
    }

    return data;
  }

  /**
   * 🔍 데이터베이스 연결 상태 확인
   */
  async checkConnections(): Promise<{
    influxdb: { status: string; message: string };
    redis: { status: string; message: string };
    supabase: { status: string; message: string };
  }> {
    const results = await Promise.allSettled([
      this.checkInfluxDBConnection(),
      this.checkRedisConnection(),
      this.checkSupabaseConnection()
    ]);

    const [influxResult, redisResult, supabaseResult] = results;

    return {
      influxdb: influxResult.status === 'fulfilled' 
        ? influxResult.value 
        : { status: 'error', message: 'Connection check failed' },
      redis: redisResult.status === 'fulfilled' 
        ? redisResult.value 
        : { status: 'error', message: 'Connection check failed' },
      supabase: supabaseResult.status === 'fulfilled' 
        ? supabaseResult.value 
        : { status: 'error', message: 'Connection check failed' }
    };
  }

  /**
   * 🔌 InfluxDB 연결 상태 확인
   */
  private async checkInfluxDBConnection(): Promise<{ status: string; message: string }> {
    if (!this.isInfluxEnabled) {
      return { status: 'simulated', message: 'InfluxDB simulated (development mode)' };
    }

    try {
      if (!this.influxDB) {
        return { status: 'error', message: 'InfluxDB client not initialized' };
      }

      // InfluxDB 연결 상태를 간단한 쿼리로 확인
      const queryApi = this.influxDB.getQueryApi(this.org);
      const query = `buckets() |> limit(n:1)`;
      
      // 타임아웃을 설정하여 연결 확인
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('InfluxDB connection timeout')), 5000)
      );
      
      await Promise.race([
        queryApi.collectRows(query),
        timeout
      ]);
      
      return { 
        status: 'connected',
        message: 'InfluxDB connected successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'InfluxDB connection failed'
      };
    }
  }

  /**
   * 🔄 Redis 연결 상태 확인
   */
  private async checkRedisConnection(): Promise<{ status: string; message: string }> {
    try {
      if (!redis) {
        return { status: 'simulated', message: 'Redis simulated (development mode)' };
      }

      await redis.ping();
      return { status: 'connected', message: 'Redis connected successfully' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Redis connection failed'
      };
    }
  }

  /**
   * 🗄️ Supabase 연결 상태 확인
   */
  private async checkSupabaseConnection(): Promise<{ status: string; message: string }> {
    try {
      if (!supabase) {
        return { status: 'simulated', message: 'Supabase simulated (development mode)' };
      }

      const { error } = await supabase.from('servers').select('count').limit(1);
      return {
        status: error ? 'error' : 'connected',
        message: error?.message || 'Supabase connected successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Supabase connection failed'
      };
    }
  }

  /**
   * 🔄 리소스 정리
   */
  async close(): Promise<void> {
    try {
      if (this.writeApi) {
        await this.writeApi.close();
      }
      
      if (this.influxDB) {
        // InfluxDB 클라이언트 정리
        this.influxDB = null;
      }

      console.log('✅ MetricsStorage 리소스 정리 완료');
    } catch (error) {
      console.error('❌ 리소스 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
export const metricsStorage = new MetricsStorage(); 