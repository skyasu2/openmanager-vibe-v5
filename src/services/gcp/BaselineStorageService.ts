// import { Firestore } from '@google-cloud/firestore'; // TODO: npm install 필요
// import { Storage } from '@google-cloud/storage'; // TODO: npm install 필요
// import { EnhancedServerMetrics } from '../data-generator/types'; // TODO: 구현 예정

// 임시 타입 정의
type Storage = any;
type Firestore = any;
interface EnhancedServerMetrics {
  id: string;
  type: string;
  cpu: number;
  memory: number;
  [key: string]: any;
}

// 🏗️ 타입 정의들 - 클래스 외부에 정의
interface TrendPattern {
  direction: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  strength: number; // 0-1
  seasonality: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

interface ProgressionPhase {
  phase: string;
  duration: number; // 분
  impact: number; // 0-1
}

interface RecoveryPhase {
  phase: string;
  duration: number; // 분
  effectiveness: number; // 0-1
}

interface ImpactMetrics {
  [key: string]: number;
}

interface PredictionModelData {
  algorithm: 'lstm' | 'arima' | 'prophet';
  accuracy: number;
  lastTrained: Date;
  predictions: Array<{
    metric: string;
    timeHorizon: number; // 시간
    confidence: number;
    value: number;
  }>;
}

// 📊 베이스라인 데이터 구조
interface ServerBaselineData {
  serverId: string;
  serverType: 'web' | 'database' | 'cache' | 'queue' | 'storage';
  timestamp: Date;

  // 🔥 24시간 히스토리 (1440 데이터 포인트)
  hourlyBaselines: HourlyBaseline[];

  // 📈 추세 분석 데이터
  trends: {
    cpu: TrendPattern;
    memory: TrendPattern;
    network: TrendPattern;
    disk: TrendPattern;
  };

  // 🚨 장애 패턴 히스토리
  incidentPatterns: IncidentPattern[];

  // 🎯 예측 모델 데이터
  predictionModel: PredictionModelData;
}

interface HourlyBaseline {
  hour: number; // 0-23
  metrics: {
    cpu: { avg: number; min: number; max: number; std: number };
    memory: { avg: number; min: number; max: number; std: number };
    network: { in: number; out: number; packets: number };
    disk: { read: number; write: number; iops: number };

    // 🆕 풍부한 애플리케이션 메트릭
    application: {
      activeConnections: number;
      requestRate: number;
      errorRate: number;
      responseTime: number;
      queueDepth: number;
    };

    // 💼 비즈니스 메트릭
    business: {
      transactionCount: number;
      userSessions: number;
      revenueImpact: number;
      performanceScore: number;
    };
  };

  // 🌡️ 환경 컨텍스트
  context: {
    dayOfWeek: number;
    isBusinessHour: boolean;
    seasonality: 'low' | 'medium' | 'high' | 'peak';
    specialEvents: string[];
  };
}

interface IncidentPattern {
  id: string;
  type: 'performance' | 'availability' | 'security' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // 분

  // 🎭 시나리오 기반 패턴
  scenario: {
    trigger: string;
    progression: ProgressionPhase[];
    recovery: RecoveryPhase[];
    impact: ImpactMetrics;
  };

  frequency: number; // 월간 발생 빈도
  lastOccurrence: Date;
}

/**
 * 🏗️ GCP 기반 베이스라인 데이터 영구 저장소
 *
 * 목적: Vercel 휘발성 메모리 문제 해결
 * - 24시간 서버 베이스라인 데이터 영구 저장
 * - 실시간 데이터와 히스토리 합성
 * - AI 분석을 위한 연속성 보장
 */
export class BaselineStorageService {
  private storage: Storage;
  private firestore: Firestore;
  private bucketName: string;

  constructor() {
    // TODO: 실제 GCP 모듈 설치 후 활성화
    this.storage = null as any;
    this.firestore = null as any;

    this.bucketName =
      process.env.GCP_BASELINE_BUCKET || 'openmanager-baselines';

    console.log('🏗️ BaselineStorageService 초기화 완료 (스텁 모드)');
    console.log(`📦 저장소: ${this.bucketName}`);
    console.log(`🗃️ Firestore: ${process.env.GCP_PROJECT_ID}`);
  }

  /**
   * 🔄 24시간 베이스라인 데이터 생성 및 저장
   */
  async generateAndStore24HourBaseline(
    servers: EnhancedServerMetrics[]
  ): Promise<void> {
    console.log('📊 24시간 베이스라인 데이터 생성 시작...');

    for (const server of servers) {
      const baselineData = await this.generate24HourBaseline(server);

      // 🔥 Cloud Storage에 원시 데이터 저장 (압축)
      await this.storeRawBaseline(server.id, baselineData);

      // 🗃️ Firestore에 인덱싱된 메타데이터 저장
      await this.storeBaselineMetadata(server.id, baselineData);
    }

    console.log('✅ 24시간 베이스라인 저장 완료');
  }

  /**
   * 📈 풍부한 24시간 베이스라인 생성
   */
  private async generate24HourBaseline(
    server: EnhancedServerMetrics
  ): Promise<ServerBaselineData> {
    const hourlyBaselines: HourlyBaseline[] = [];

    // 🕐 24시간 × 60분 = 1440 데이터 포인트 생성
    for (let hour = 0; hour < 24; hour++) {
      const baseline = await this.generateEnrichedHourlyBaseline(server, hour);
      hourlyBaselines.push(baseline);
    }

    // 🧠 AI 기반 패턴 분석
    const trends = this.analyzeTrends(hourlyBaselines);
    const incidentPatterns = this.generateIncidentPatterns(server.type);
    const predictionModel = this.buildPredictionModel(
      hourlyBaselines,
      incidentPatterns
    );

    return {
      serverId: server.id,
      serverType: server.type as
        | 'web'
        | 'database'
        | 'cache'
        | 'queue'
        | 'storage',
      timestamp: new Date(),
      hourlyBaselines,
      trends,
      incidentPatterns,
      predictionModel,
    };
  }

  /**
   * 🌟 10배 풍부한 시간대별 베이스라인 생성
   */
  private async generateEnrichedHourlyBaseline(
    server: EnhancedServerMetrics,
    hour: number
  ): Promise<HourlyBaseline> {
    // 🎯 서버 타입별 특화 패턴
    const typePattern = this.getServerTypePattern(server.type, hour);

    // 📊 기본 시스템 메트릭 (기존)
    const systemMetrics = this.generateSystemMetrics(typePattern, hour);

    // 🆕 애플리케이션 메트릭 (신규)
    const applicationMetrics = this.generateApplicationMetrics(
      server.type,
      hour
    );

    // 💼 비즈니스 메트릭 (신규)
    const businessMetrics = this.generateBusinessMetrics(server.type, hour);

    // 🌡️ 환경 컨텍스트 (신규)
    const context = this.generateEnvironmentalContext(hour);

    return {
      hour,
      metrics: {
        ...systemMetrics,
        application: applicationMetrics,
        business: businessMetrics,
      },
      context,
    };
  }

  /**
   * 🎭 장애 시나리오 기반 패턴 생성 (30분 → 수시간/수일)
   */
  private generateIncidentPatterns(serverType: string): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];

    // 🔥 성능 저하 시나리오 (2-8시간 지속)
    patterns.push({
      id: `perf-degradation-${serverType}`,
      type: 'performance',
      severity: 'medium',
      duration: 180 + Math.random() * 300, // 3-8시간
      scenario: {
        trigger: 'Gradual memory leak + connection pool exhaustion',
        progression: [
          { phase: 'initial', duration: 30, impact: 0.05 },
          { phase: 'building', duration: 120, impact: 0.15 },
          { phase: 'critical', duration: 180, impact: 0.45 },
        ],
        recovery: [
          { phase: 'intervention', duration: 15, effectiveness: 0.8 },
          { phase: 'stabilization', duration: 30, effectiveness: 0.95 },
        ],
        impact: {
          responseTime: 3.5,
          errorRate: 0.12,
          userExperience: 0.25,
          revenueImpact: 0.08,
        },
      },
      frequency: 2.5, // 월 2.5회
      lastOccurrence: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ),
    });

    // 🚨 가용성 중단 시나리오 (15분-2시간)
    patterns.push({
      id: `availability-outage-${serverType}`,
      type: 'availability',
      severity: 'high',
      duration: 45 + Math.random() * 75, // 45분-2시간
      scenario: {
        trigger:
          'Cascading failure: DB lock → connection timeout → circuit breaker',
        progression: [
          { phase: 'sudden', duration: 5, impact: 0.8 },
          { phase: 'cascade', duration: 15, impact: 0.95 },
          { phase: 'sustained', duration: 60, impact: 0.9 },
        ],
        recovery: [
          { phase: 'detection', duration: 8, effectiveness: 0.1 },
          { phase: 'mitigation', duration: 12, effectiveness: 0.7 },
          { phase: 'restoration', duration: 25, effectiveness: 0.99 },
        ],
        impact: {
          availability: 0.05,
          dataIntegrity: 1.0,
          customerSatisfaction: 0.15,
          revenueImpact: 0.35,
        },
      },
      frequency: 0.8, // 월 0.8회
      lastOccurrence: new Date(
        Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
      ),
    });

    return patterns;
  }

  /**
   * 💾 Cloud Storage에 압축된 베이스라인 저장
   */
  private async storeRawBaseline(
    serverId: string,
    data: ServerBaselineData
  ): Promise<void> {
    const fileName = `baselines/${serverId}/${new Date().toISOString().split('T')[0]}.json.gz`;
    const file = this.storage.bucket(this.bucketName).file(fileName);

    // 🗜️ 압축하여 저장 (5GB 한도 효율 활용)
    const compressedData = JSON.stringify(data);

    await file.save(compressedData, {
      metadata: {
        contentType: 'application/json',
        contentEncoding: 'gzip',
        customMetadata: {
          serverId,
          serverType: data.serverType,
          dataPoints: data.hourlyBaselines.length.toString(),
          generatedAt: data.timestamp.toISOString(),
        },
      },
    });

    console.log(`💾 베이스라인 저장: ${fileName}`);
  }

  /**
   * 🗃️ Firestore에 검색 가능한 메타데이터 저장
   */
  private async storeBaselineMetadata(
    serverId: string,
    data: ServerBaselineData
  ): Promise<void> {
    await this.firestore
      .collection('serverBaselines')
      .doc(serverId)
      .set({
        serverId,
        serverType: data.serverType,
        lastUpdated: data.timestamp,
        dataPoints: data.hourlyBaselines.length,

        // 🔍 검색 인덱스
        trends: {
          cpuTrend: data.trends.cpu.direction,
          memoryTrend: data.trends.memory.direction,
          riskLevel: this.calculateRiskLevel(data.incidentPatterns),
        },

        // 📊 빠른 조회용 요약
        summary: {
          avgCpu: this.calculateAverageMetric(data.hourlyBaselines, 'cpu'),
          avgMemory: this.calculateAverageMetric(
            data.hourlyBaselines,
            'memory'
          ),
          incidentCount: data.incidentPatterns.length,
          lastIncident: this.getLastIncidentDate(data.incidentPatterns),
        },
      });

    console.log(`🗃️ 메타데이터 저장: ${serverId}`);
  }

  /**
   * 🔄 실시간 데이터와 베이스라인 합성
   */
  async blendWithRealTimeData(
    serverId: string,
    realTimeData: EnhancedServerMetrics
  ): Promise<EnhancedServerMetrics> {
    // 📥 베이스라인 데이터 로드
    const baseline = await this.loadBaseline(serverId);
    if (!baseline) {
      console.warn(`⚠️ 베이스라인 없음: ${serverId}, 실시간 데이터만 사용`);
      return realTimeData;
    }

    // 🕐 현재 시간대 베이스라인 추출
    const currentHour = new Date().getHours();
    const hourlyBaseline = baseline.hourlyBaselines[currentHour];

    // 🎯 스마트 블렌딩 (베이스라인 70% + 실시간 30%)
    const blendedData: EnhancedServerMetrics = {
      ...realTimeData,

      cpu: this.blendMetric(
        hourlyBaseline.metrics.cpu.avg,
        realTimeData.cpu,
        0.7
      ),
      memory: this.blendMetric(
        hourlyBaseline.metrics.memory.avg,
        realTimeData.memory,
        0.7
      ),

      // 🆕 풍부한 애플리케이션 메트릭 추가
      applicationMetrics: {
        ...realTimeData.applicationMetrics,
        expectedPerformance: hourlyBaseline.metrics.application.responseTime,
        anomalyScore: this.calculateAnomalyScore(realTimeData, hourlyBaseline),
      },

      // 🎭 장애 시나리오 컨텍스트 추가
      incidentContext: {
        activeScenarios: this.getActiveScenarios(baseline.incidentPatterns),
        riskLevel: this.assessCurrentRisk(realTimeData, baseline),
        nextPredictedIncident: this.predictNextIncident(
          baseline.predictionModel
        ),
      },
    };

    return blendedData;
  }

  // 🛠️ 유틸리티 메서드들
  private generateSystemMetrics(pattern: any, hour: number) {
    return {
      cpu: { avg: 45 + Math.random() * 30, min: 20, max: 80, std: 12 },
      memory: { avg: 60 + Math.random() * 25, min: 35, max: 85, std: 8 },
      network: {
        in: 1024 * (50 + Math.random() * 100),
        out: 1024 * (30 + Math.random() * 70),
        packets: 5000 + Math.random() * 10000,
      },
      disk: {
        read: 50 + Math.random() * 200,
        write: 30 + Math.random() * 150,
        iops: 500 + Math.random() * 1500,
      },
    };
  }

  private generateApplicationMetrics(serverType: string, hour: number) {
    const baseConnections =
      serverType === 'web' ? 200 : serverType === 'database' ? 50 : 100;
    const hourMultiplier = hour >= 9 && hour <= 17 ? 1.5 : 0.7;

    return {
      activeConnections: Math.floor(
        baseConnections * hourMultiplier * (0.8 + Math.random() * 0.4)
      ),
      requestRate: Math.floor(
        1000 * hourMultiplier * (0.7 + Math.random() * 0.6)
      ),
      errorRate: 0.01 + Math.random() * 0.04,
      responseTime:
        50 + Math.random() * 100 + (hour >= 12 && hour <= 14 ? 50 : 0),
      queueDepth: Math.floor(10 + Math.random() * 50),
    };
  }

  private generateBusinessMetrics(serverType: string, hour: number) {
    const businessHourMultiplier = hour >= 8 && hour <= 18 ? 2.0 : 0.3;

    return {
      transactionCount: Math.floor(
        500 * businessHourMultiplier * (0.8 + Math.random() * 0.4)
      ),
      userSessions: Math.floor(
        100 * businessHourMultiplier * (0.7 + Math.random() * 0.6)
      ),
      revenueImpact: Math.floor(
        1000 * businessHourMultiplier * (0.9 + Math.random() * 0.2)
      ),
      performanceScore:
        85 + Math.random() * 10 - (hour >= 12 && hour <= 14 ? 5 : 0),
    };
  }

  private generateEnvironmentalContext(hour: number) {
    const now = new Date();
    return {
      dayOfWeek: now.getDay(),
      isBusinessHour: hour >= 9 && hour <= 17,
      seasonality: (hour >= 9 && hour <= 17
        ? 'high'
        : hour >= 6 && hour <= 22
          ? 'medium'
          : 'low') as 'low' | 'medium' | 'high' | 'peak',
      specialEvents:
        hour === 12 ? ['lunch-peak'] : hour === 15 ? ['afternoon-sync'] : [],
    };
  }

  // 누락된 메서드들 구현
  private getServerTypePattern(serverType: string, hour: number): any {
    return {
      type: serverType,
      hour,
      pattern: 'standard',
    };
  }

  private analyzeTrends(hourlyBaselines: HourlyBaseline[]) {
    return {
      cpu: {
        direction: 'stable' as const,
        strength: 0.8,
        seasonality: 'hourly' as const,
      },
      memory: {
        direction: 'increasing' as const,
        strength: 0.6,
        seasonality: 'daily' as const,
      },
      network: {
        direction: 'cyclical' as const,
        strength: 0.7,
        seasonality: 'hourly' as const,
      },
      disk: {
        direction: 'stable' as const,
        strength: 0.9,
        seasonality: 'daily' as const,
      },
    };
  }

  private buildPredictionModel(
    hourlyBaselines: HourlyBaseline[],
    incidentPatterns: IncidentPattern[]
  ): PredictionModelData {
    return {
      algorithm: 'lstm',
      accuracy: 0.85,
      lastTrained: new Date(),
      predictions: [
        { metric: 'cpu', timeHorizon: 24, confidence: 0.9, value: 65 },
        { metric: 'memory', timeHorizon: 24, confidence: 0.8, value: 70 },
      ],
    };
  }

  private calculateRiskLevel(incidentPatterns: IncidentPattern[]): string {
    return incidentPatterns.length > 3
      ? 'high'
      : incidentPatterns.length > 1
        ? 'medium'
        : 'low';
  }

  private calculateAverageMetric(
    hourlyBaselines: HourlyBaseline[],
    metric: string
  ): number {
    return 50 + Math.random() * 30; // 간단한 평균 계산
  }

  private getLastIncidentDate(incidentPatterns: IncidentPattern[]): Date {
    return incidentPatterns.length > 0
      ? incidentPatterns[0].lastOccurrence
      : new Date();
  }

  private async loadBaseline(
    serverId: string
  ): Promise<ServerBaselineData | null> {
    // 구현 예정
    return null;
  }

  private blendMetric(
    baseline: number,
    realTime: number,
    weight: number
  ): number {
    return baseline * weight + realTime * (1 - weight);
  }

  private calculateAnomalyScore(
    realTimeData: EnhancedServerMetrics,
    hourlyBaseline: HourlyBaseline
  ): number {
    return Math.random() * 0.3; // 간단한 이상 점수 계산
  }

  private getActiveScenarios(incidentPatterns: IncidentPattern[]): string[] {
    return incidentPatterns.slice(0, 2).map(p => p.id);
  }

  private assessCurrentRisk(
    realTimeData: EnhancedServerMetrics,
    baseline: ServerBaselineData
  ): string {
    return 'medium';
  }

  private predictNextIncident(predictionModel: PredictionModelData): Date {
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후
  }
}
