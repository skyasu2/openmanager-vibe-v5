/**
 * 🎯 통합 데이터 게이트웨이
 * 
 * 목적: 모든 데이터 소스에 대한 단일 진입점 제공
 * - StaticDataLoader (더미 데이터)
 * - Google AI API (자연어 처리)
 * - Supabase (RAG + 대화 이력)
 * 
 * 장점:
 * - 데이터 흐름 추적 용이
 * - 로깅 및 에러 처리 중앙화
 * - 캐싱 전략 통합 관리
 */

import { StaticDataLoader } from '@/services/data/StaticDataLoader';
import type { EnhancedServerMetrics } from '@/types/server';

export type DataSourceType = 'static' | 'ai' | 'database';

export interface DataRequest {
  type: DataSourceType;
  operation: string;
  params?: Record<string, unknown>;
}

export interface DataResponse<T = unknown> {
  data: T;
  source: DataSourceType;
  cached: boolean;
  timestamp: number;
  responseTime: number;
}

export class DataGateway {
  private static instance: DataGateway;
  private staticLoader: StaticDataLoader;
  private requestLog: Array<{ request: DataRequest; timestamp: number }> = [];

  private constructor() {
    this.staticLoader = StaticDataLoader.getInstance();
  }

  static getInstance(): DataGateway {
    if (!DataGateway.instance) {
      DataGateway.instance = new DataGateway();
    }
    return DataGateway.instance;
  }

  /**
   * 통합 쿼리 메서드
   */
  async query<T>(request: DataRequest): Promise<DataResponse<T>> {
    const startTime = Date.now();
    
    // 요청 로깅
    this.logRequest(request);

    try {
      let data: T;
      const cached = false;

      // 데이터 소스별 라우팅
      switch (request.type) {
        case 'static':
          data = await this.queryStatic<T>(request);
          break;
        case 'ai':
          data = await this.queryAI<T>(request);
          break;
        case 'database':
          data = await this.queryDatabase<T>(request);
          break;
        default: {
          const exhaustiveCheck: never = request.type;
          throw new Error(`Unknown data source: ${exhaustiveCheck}`);
        }
      }

      return {
        data,
        source: request.type,
        cached,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('DataGateway query failed:', error);
      throw error;
    }
  }

  /**
   * 정적 데이터 쿼리
   */
  private async queryStatic<T>(request: DataRequest): Promise<T> {
    switch (request.operation) {
      case 'getServers':
        // StaticDataLoader는 직접 메서드 제공하지 않음
        // 향후 구현 필요
        throw new Error('getServers not implemented yet');
      case 'getServerById':
        throw new Error('getServerById not implemented yet');
      case 'getHourlyData':
        throw new Error('getHourlyData not implemented yet');
      default:
        throw new Error(`Unknown static operation: ${request.operation}`);
    }
  }

  /**
   * AI 쿼리 (향후 구현)
   */
  private async queryAI<T>(request: DataRequest): Promise<T> {
    // TODO: AI 엔진 통합
    throw new Error('AI query not implemented yet');
  }

  /**
   * 데이터베이스 쿼리 (향후 구현)
   */
  private async queryDatabase<T>(request: DataRequest): Promise<T> {
    // TODO: Supabase 통합
    throw new Error('Database query not implemented yet');
  }

  /**
   * 요청 로깅
   */
  private logRequest(request: DataRequest): void {
    this.requestLog.push({
      request,
      timestamp: Date.now(),
    });

    // 최근 100개만 유지
    if (this.requestLog.length > 100) {
      this.requestLog.shift();
    }
  }

  /**
   * 통계 조회
   */
  getStats() {
    const now = Date.now();
    const last5min = this.requestLog.filter(
      log => now - log.timestamp < 5 * 60 * 1000
    );

    return {
      totalRequests: this.requestLog.length,
      last5minRequests: last5min.length,
      bySource: {
        static: last5min.filter(l => l.request.type === 'static').length,
        ai: last5min.filter(l => l.request.type === 'ai').length,
        database: last5min.filter(l => l.request.type === 'database').length,
      },
    };
  }
}

// 편의 함수
export async function queryData<T>(request: DataRequest): Promise<DataResponse<T>> {
  return DataGateway.getInstance().query<T>(request);
}

// 타입 안전한 헬퍼 함수
export async function getServers(): Promise<EnhancedServerMetrics[]> {
  const response = await queryData<EnhancedServerMetrics[]>({
    type: 'static',
    operation: 'getServers',
  });
  return response.data;
}

export async function getServerById(id: string): Promise<EnhancedServerMetrics | null> {
  const response = await queryData<EnhancedServerMetrics | null>({
    type: 'static',
    operation: 'getServerById',
    params: { id },
  });
  return response.data;
}
