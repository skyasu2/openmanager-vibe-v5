/**
 * 🔮 통합 예측 시스템 테스트 (TDD)
 *
 * Phase 4: 기존 PredictiveAnalysisEngine + AutoIncidentReportSystem 통합
 * - 장애 예측 + 자동 보고서 생성 통합
 * - ML 기반 예측 + 룰 기반 분석 결합
 * - 실시간 예측 + 히스토리 관리
 */

import { describe, expect, it, beforeEach, vi, Mock } from 'vitest';
import { IntegratedPredictionSystem } from '@/core/ai/systems/IntegratedPredictionSystem';
import type {
  IIntegratedPredictionSystem,
  MetricDataPoint,
  ServerMetrics,
  PredictionResult,
  Incident,
  IncidentReport,
  IntegratedAnalysisResult,
  PredictiveIncidentReport,
  ModelOptimizationResult,
  SystemHealthReport,
  ComponentHealth,
  IntegratedPredictionConfig,
  Anomaly,
  SystemMetrics,
  RuleBasedAnalysisResult,
  AnomalyDetectionResult,
} from '@/types/integrated-prediction-system.types';

// Mock external dependencies
vi.mock('@/core/ai/engines/RuleBasedMainEngine');
vi.mock('@/engines/PredictiveAnalysisEngine');
vi.mock('@/lib/ml/lightweight-ml-engine');
vi.mock('@/services/ai/AnomalyDetectionService');
vi.mock('@/core/ai/databases/SolutionDatabase');
vi.mock('@/core/ai/engines/IncidentDetectionEngine');
vi.mock('@/core/ai/systems/AutoIncidentReportSystem');

// Import mocked modules for setup
import { RuleBasedMainEngine } from '@/core/ai/engines/RuleBasedMainEngine';
import { PredictiveAnalysisEngine } from '@/engines/PredictiveAnalysisEngine';
import { detectAnomalies, predictServerLoad } from '@/lib/ml/lightweight-ml-engine';
import { AnomalyDetectionService } from '@/services/ai/AnomalyDetectionService';
import { SolutionDatabase } from '@/core/ai/databases/SolutionDatabase';
import { IncidentDetectionEngine } from '@/core/ai/engines/IncidentDetectionEngine';
import { AutoIncidentReportSystem } from '@/core/ai/systems/AutoIncidentReportSystem';

describe('🔮 IntegratedPredictionSystem', () => {
  let predictionSystem: IIntegratedPredictionSystem;
  let mockMetricData: MetricDataPoint;
  let mockServerMetrics: ServerMetrics;

  // Mock functions
  let mockPredictiveEngine: {
    predictFailure: Mock;
    calculateAccuracy: Mock;
  };
  let mockIncidentReportSystem: {
    detectIncident: Mock;
    generateReport: Mock;
    predictFailureTime: Mock;
  };
  let mockAnomalyDetectionService: {
    detect: Mock;
  };
  let mockRuleBasedEngine: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Console mocking to prevent logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup PredictiveAnalysisEngine mock
    mockPredictiveEngine = {
      predictFailure: vi.fn(),
      calculateAccuracy: vi.fn().mockResolvedValue({
        overall: 85,
        byServer: { 'server-001': 90 },
      }),
    };
    (PredictiveAnalysisEngine as any).mockImplementation(() => mockPredictiveEngine);

    // Setup AutoIncidentReportSystem mock
    mockIncidentReportSystem = {
      detectIncident: vi.fn(),
      generateReport: vi.fn(),
      predictFailureTime: vi.fn(),
    };
    (AutoIncidentReportSystem as any).mockImplementation(() => mockIncidentReportSystem);

    // Setup AnomalyDetectionService mock
    mockAnomalyDetectionService = {
      detect: vi.fn().mockResolvedValue([]),
    };
    (AnomalyDetectionService as any).mockImplementation(() => mockAnomalyDetectionService);

    // Setup RuleBasedMainEngine mock
    mockRuleBasedEngine = {};
    (RuleBasedMainEngine as any).mockImplementation(() => mockRuleBasedEngine);

    // Setup lightweight ML engine mocks
    (detectAnomalies as Mock).mockReturnValue([]);
    (predictServerLoad as Mock).mockReturnValue([]);

    // Setup other mocks
    (IncidentDetectionEngine as any).mockImplementation(() => ({}));
    (SolutionDatabase as any).mockImplementation(() => ({}));

    // 실제 IntegratedPredictionSystem 생성
    predictionSystem = new IntegratedPredictionSystem({
      predictionHorizon: 60,
      anomalyThreshold: 0.8,
      minDataPoints: 5,
    });

    // 초기화 완료 시뮬레이션 (타이머 사용)
    vi.advanceTimersByTime(100);

    mockMetricData = {
      timestamp: new Date(),
      cpu: 75.5,
      memory: 68.2,
      disk: 45.8,
      network: 23.4,
      errorRate: 2.1,
      responseTime: 145,
    };

    mockServerMetrics = {
      serverId: 'server-001',
      timestamp: new Date(),
      cpu: { usage: 75.5, temperature: 68 },
      memory: { usage: 68.2, available: 31.8 },
      disk: { usage: 45.8, io: 120 },
      network: { in: 1024, out: 2048 },
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('🔄 시스템 초기화', () => {
    it('시스템이 올바르게 초기화되어야 함', async () => {
      const system = new IntegratedPredictionSystem();
      vi.advanceTimersByTime(100);

      const config = system.getConfig();
      expect(config).toBeDefined();
      expect(config.predictionHorizon).toBe(60);
      expect(config.modelWeights).toBeDefined();
      expect(config.enableRealTimeLearning).toBe(true);
    });

    it('커스텀 설정으로 초기화할 수 있어야 함', async () => {
      const customConfig = {
        predictionHorizon: 120,
        anomalyThreshold: 3.0,
        minDataPoints: 20,
      };
      
      const system = new IntegratedPredictionSystem(customConfig);
      vi.advanceTimersByTime(100);
      
      const config = system.getConfig();
      expect(config.predictionHorizon).toBe(120);
      expect(config.anomalyThreshold).toBe(3.0);
      expect(config.minDataPoints).toBe(20);
    });
  });

  describe('📊 데이터 포인트 추가 및 예측', () => {
    it('데이터 포인트를 추가하고 저장해야 함', async () => {
      const result = await predictionSystem.addDataPoint('server-001', mockMetricData);
      
      // 데이터가 충분하지 않으면 null 반환
      expect(result).toBeNull();
      
      // 히스토리 데이터가 저장되었는지 확인
      const history = predictionSystem.getHistoricalData('server-001');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockMetricData);
    });

    it('충분한 데이터가 있을 때 예측을 수행해야 함', async () => {
      // PredictiveEngine mock 설정
      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 75,
        predictedTime: new Date(Date.now() + 60 * 60 * 1000),
        confidence: 80,
        triggerMetrics: ['cpu'],
        preventiveActions: ['모니터링 강화'],
        severity: 'high',
        analysisType: 'trend',
      });

      // 최소 데이터 포인트 추가
      for (let i = 0; i < 5; i++) {
        await predictionSystem.addDataPoint('server-001', {
          ...mockMetricData,
          timestamp: new Date(Date.now() + i * 60000),
        });
      }

      const prediction = await predictionSystem.predictFailure('server-001');
      expect(prediction).toBeDefined();
      expect(prediction?.failureProbability).toBeGreaterThan(0);
      expect(prediction?.triggerMetrics).toContain('cpu');
    });

    it('메모리 최적화를 위해 24시간 이상 된 데이터를 정리해야 함', async () => {
      const oldData = {
        ...mockMetricData,
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25시간 전
      };
      
      await predictionSystem.addDataPoint('server-001', oldData);
      await predictionSystem.addDataPoint('server-001', mockMetricData);
      
      const history = predictionSystem.getHistoricalData('server-001', 24);
      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toEqual(mockMetricData.timestamp);
    });
  });

  describe('🎯 앙상블 예측', () => {
    it('여러 엔진의 예측을 앙상블로 결합해야 함', async () => {
      // 각 엔진의 mock 응답 설정
      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 70,
        predictedTime: new Date(Date.now() + 60 * 60 * 1000),
        confidence: 75,
        triggerMetrics: ['cpu'],
        preventiveActions: ['CPU 최적화'],
        severity: 'high',
        analysisType: 'trend',
      });

      (predictServerLoad as Mock).mockReturnValue([{
        cpu: 85,
        memory: 70,
        timestamp: new Date().toISOString(),
      }]);

      (detectAnomalies as Mock).mockReturnValue([{
        timestamp: new Date().toISOString(),
        cpu: 95,
        memory: 80,
      }]);

      // 충분한 데이터 추가
      for (let i = 0; i < 10; i++) {
        await predictionSystem.addDataPoint('server-001', {
          ...mockMetricData,
          timestamp: new Date(Date.now() + i * 60000),
          cpu: 70 + i * 2,
        });
      }

      const prediction = await predictionSystem.predictFailure('server-001');
      expect(prediction).toBeDefined();
      expect(prediction?.analysisType).toBe('hybrid'); // 앙상블이므로 hybrid
      expect(prediction?.triggerMetrics).toContain('anomaly_detected');
    });

    it('예측 결과를 캐싱해야 함', async () => {
      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 60,
        predictedTime: new Date(),
        confidence: 70,
        triggerMetrics: [],
        preventiveActions: [],
        severity: 'medium',
        analysisType: 'trend',
      });

      // 충분한 데이터 추가
      for (let i = 0; i < 5; i++) {
        await predictionSystem.addDataPoint('server-001', mockMetricData);
      }

      // 첫 번째 예측
      const prediction1 = await predictionSystem.predictFailure('server-001');
      
      // 두 번째 예측 (캐시에서 가져와야 함)
      const prediction2 = await predictionSystem.predictFailure('server-001');
      
      expect(prediction1).toEqual(prediction2);
      expect(mockPredictiveEngine.predictFailure).toHaveBeenCalledTimes(1);
    });
  });

  describe('🔄 시스템 통합 기능', () => {
    it('ML 예측과 룰 기반 분석을 통합해야 함', async () => {
      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 65,
        predictedTime: new Date(),
        confidence: 80,
        triggerMetrics: ['cpu'],
        preventiveActions: ['모니터링'],
        severity: 'medium',
        analysisType: 'trend',
      });

      // 충분한 데이터 추가
      for (let i = 0; i < 5; i++) {
        await predictionSystem.addDataPoint('server-001', mockMetricData);
      }

      const result = await predictionSystem.performIntegratedAnalysis('server-001');

      expect(result).toBeDefined();
      expect(result.serverId).toBe('server-001');
      expect(result.mlPrediction).toBeDefined();
      expect(result.ruleBasedAnalysis).toBeDefined();
      expect(result.combinedConfidence).toBeGreaterThan(0);
      expect(result.combinedConfidence).toBeLessThanOrEqual(100);
      expect(result.alertLevel).toMatch(/^(green|yellow|orange|red)$/);
    });

    it('예측 기반 사전 보고서를 생성해야 함', async () => {
      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 85,
        predictedTime: new Date(Date.now() + 30 * 60 * 1000),
        confidence: 90,
        triggerMetrics: ['cpu', 'memory'],
        preventiveActions: ['스케일링 고려'],
        severity: 'critical',
        analysisType: 'trend',
      });

      mockIncidentReportSystem.generateReport.mockResolvedValue({
        id: 'REP_123',
        incident: {},
        analysis: '예방적 분석',
        solutions: ['해결방안'],
        generatedAt: new Date(),
      });

      // 충분한 데이터 추가
      for (let i = 0; i < 5; i++) {
        await predictionSystem.addDataPoint('server-001', mockMetricData);
      }

      const report = await predictionSystem.generatePredictiveReport('server-001');

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.serverId).toBe('server-001');
      expect(report.prediction).toBeDefined();
      expect(report.preventiveReport).toBeDefined();
      expect(report.timeline).toBeInstanceOf(Array);
      expect(report.riskAssessment).toBeDefined();
    });

    it('모델 가중치를 자동 최적화해야 함', async () => {
      const optimization = await predictionSystem.optimizeModelWeights();

      expect(optimization).toBeDefined();
      expect(optimization.previousAccuracy).toBeGreaterThan(0);
      expect(optimization.newAccuracy).toBeGreaterThanOrEqual(
        optimization.previousAccuracy
      );
      expect(optimization.improvementPercentage).toBeGreaterThanOrEqual(0);
      expect(optimization.optimizedWeights).toBeDefined();
      expect(optimization.validationResults).toBeInstanceOf(Array);
    });
  });

  describe('🚨 장애 예측 + 보고서 통합', () => {
    it('장애 예측 시 자동으로 사전 보고서를 생성해야 함', async () => {
      const highRiskMetrics = {
        ...mockServerMetrics,
        cpu: { usage: 95, temperature: 85 },
        memory: { usage: 90, available: 10 },
      };

      mockIncidentReportSystem.detectIncident.mockResolvedValue({
        id: 'INC_123',
        serverId: 'server-001',
        type: 'cpu_overload',
        severity: 'critical',
        affectedServer: 'server-001',
        detectedAt: new Date(),
      });

      mockIncidentReportSystem.generateReport.mockResolvedValue({
        id: 'REP_123',
        incident: {},
        analysis: '장애 분석',
        solutions: ['즉시 스케일링', '프로세스 최적화'],
        prediction: {},
        generatedAt: new Date(),
      });

      const incident = await predictionSystem.detectIncident(highRiskMetrics);

      if (incident) {
        const report = await predictionSystem.generateReport(incident);
        expect(report).toBeDefined();
        expect(report.solutions).toHaveLength(2);
      }
    });

    it('예측된 장애에 대한 예방 조치를 제안해야 함', async () => {
      const historicalData = Array.from({ length: 24 }, (_, i) => ({
        ...mockServerMetrics,
        timestamp: new Date(Date.now() - (24 - i) * 60 * 60 * 1000),
        cpu: { usage: 60 + i * 1.5, temperature: 65 + i * 0.8 },
      }));

      mockIncidentReportSystem.predictFailureTime.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 75,
        predictedTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        confidence: 70,
        triggerMetrics: ['cpu', 'memory'],
        preventiveActions: ['프로세스 재시작', '리소스 재분배'],
        severity: 'high',
        analysisType: 'trend',
      });

      const prediction = await predictionSystem.predictFailureTime(historicalData);

      expect(prediction).toBeDefined();
      expect(prediction.predictedTime).toBeInstanceOf(Date);
      expect(prediction.predictedTime.getTime()).toBeGreaterThan(Date.now());
      expect(prediction.confidence).toBeGreaterThan(60);
      expect(prediction.preventiveActions).toHaveLength(2);
    });
  });

  describe('📊 시스템 건강성 모니터링', () => {
    it('전체 시스템 건강 상태를 보고해야 함', async () => {
      const health = await predictionSystem.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.overallHealth).toBeGreaterThan(0);
      expect(health.overallHealth).toBeLessThanOrEqual(100);
      expect(health.predictiveAccuracy).toBeGreaterThan(0);
      expect(health.activeMonitoringServers).toBeGreaterThanOrEqual(0);
      expect(health.recommendations).toBeInstanceOf(Array);
      expect(health.componentsHealth).toBeInstanceOf(Array);
      expect(health.lastUpdateTime).toBeInstanceOf(Date);
    });

    it('컴포넌트별 건강 상태를 확인해야 함', async () => {
      const health = await predictionSystem.getSystemHealth();
      const components = health.componentsHealth;

      expect(components).toBeInstanceOf(Array);
      expect(components.length).toBeGreaterThan(0);
      
      components.forEach(component => {
        expect(component.component).toBeDefined();
        expect(component.status).toMatch(/^(healthy|warning|error)$/);
        expect(component.health).toBeGreaterThanOrEqual(0);
        expect(component.health).toBeLessThanOrEqual(100);
        expect(component.lastCheck).toBeInstanceOf(Date);
      });
    });

    it('예측 시스템 자체의 성능을 모니터링해야 함', async () => {
      const health = await predictionSystem.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.systemLoad).toBeDefined();
      expect(health.systemLoad).toBeLessThan(90);
      expect(health.predictiveAccuracy).toBeGreaterThan(0);
    });
  });

  describe('🔧 메모리 및 성능 최적화', () => {
    it('메모리 사용량을 최적화해야 함', async () => {
      // 대량 데이터 추가
      for (let i = 0; i < 50; i++) {
        await predictionSystem.addDataPoint(`server-${i % 5}`, {
          ...mockMetricData,
          timestamp: new Date(Date.now() + i * 1000),
        });
      }

      const metrics = predictionSystem.getSystemMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThan(100);
      expect(metrics.processedDataPoints).toBe(50);
    });

    it('예측 응답 시간이 1초 미만이어야 함', async () => {
      // 충분한 데이터 추가
      for (let i = 0; i < 10; i++) {
        await predictionSystem.addDataPoint('server-001', mockMetricData);
      }

      const startTime = Date.now();
      await predictionSystem.predictFailure('server-001');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('캐시 크기 제한을 준수해야 함', async () => {
      // 많은 서버에 대한 예측 수행
      for (let i = 0; i < 20; i++) {
        const serverId = `server-${i}`;
        
        // 각 서버에 충분한 데이터 추가
        for (let j = 0; j < 5; j++) {
          await predictionSystem.addDataPoint(serverId, mockMetricData);
        }
        
        await predictionSystem.predictFailure(serverId);
      }

      const metrics = predictionSystem.getSystemMetrics();
      expect(metrics.memoryUsage).toBeLessThan(100);
    });
  });

  describe('🎛️ 설정 및 튜닝', () => {
    it('런타임에 설정을 업데이트할 수 있어야 함', () => {
      const newConfig = {
        predictionHorizon: 120,
        anomalyThreshold: 2.0,
        modelWeights: {
          trendAnalysis: 0.4,
          anomalyDetection: 0.3,
          patternMatching: 0.1,
          ruleBasedEngine: 0.1,
          mlPrediction: 0.1,
        },
      };

      predictionSystem.updateConfig(newConfig);
      const config = predictionSystem.getConfig();

      expect(config.predictionHorizon).toBe(120);
      expect(config.anomalyThreshold).toBe(2.0);
      expect(config.modelWeights.trendAnalysis).toBe(0.4);
    });

    it('예측 민감도를 조정할 수 있어야 함', async () => {
      // 높은 민감도 설정
      predictionSystem.updateConfig({
        anomalyThreshold: 1.5,
        minDataPoints: 3,
      });

      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 82,
        predictedTime: new Date(Date.now() + 30 * 60 * 1000),
        confidence: 85,
        triggerMetrics: ['cpu'],
        preventiveActions: ['즉시 조치 필요'],
        severity: 'critical',
        analysisType: 'anomaly',
      });

      const sensitiveData = {
        ...mockMetricData,
        cpu: 82,
      };

      // 민감한 설정으로 3개의 데이터만으로도 예측 가능
      for (let i = 0; i < 3; i++) {
        await predictionSystem.addDataPoint('server-001', sensitiveData);
      }

      const prediction = await predictionSystem.predictFailure('server-001');
      if (prediction) {
        expect(prediction).toBeDefined();
        expect(prediction.severity).toMatch(/^(low|medium|high|critical)$/);
      }
    });

    it('다양한 예측 알고리즘의 가중치를 조정할 수 있어야 함', async () => {
      const weights = predictionSystem.getConfig().modelWeights;
      
      expect(weights).toBeDefined();
      expect(weights.trendAnalysis + 
             weights.anomalyDetection + 
             weights.patternMatching + 
             weights.ruleBasedEngine + 
             weights.mlPrediction).toBeCloseTo(1.0, 2);
    });
  });

  describe('📈 실시간 스트리밍 예측', () => {
    it('실시간 데이터 스트림을 처리해야 함', async () => {
      mockPredictiveEngine.predictFailure.mockImplementation((serverId) => {
        const history = predictionSystem.getHistoricalData(serverId);
        const avgCpu = history.reduce((sum, dp) => sum + dp.cpu, 0) / history.length;
        
        if (avgCpu > 80) {
          return Promise.resolve({
            serverId,
            failureProbability: 85,
            predictedTime: new Date(Date.now() + 30 * 60 * 1000),
            confidence: 90,
            triggerMetrics: ['cpu'],
            preventiveActions: ['즉시 스케일링'],
            severity: 'critical',
            analysisType: 'trend',
          });
        }
        return Promise.resolve(null);
      });

      const streamData = Array.from({ length: 60 }, (_, i) => ({
        ...mockMetricData,
        timestamp: new Date(Date.now() + i * 1000),
        cpu: 70 + Math.sin(i * 0.1) * 10,
      }));

      let criticalPrediction = null;
      for (const data of streamData) {
        const result = await predictionSystem.addDataPoint(
          'server-stream',
          data
        );
        if (result && result.severity === 'critical') {
          criticalPrediction = result;
          break;
        }
      }

      // 스트림 데이터가 처리되었는지 확인
      const history = predictionSystem.getHistoricalData('server-stream');
      expect(history.length).toBeGreaterThan(0);
    });

    it('스트리밍 데이터에서 패턴을 감지해야 함', async () => {
      // 주기적 패턴 데이터 생성
      const periodicData = Array.from({ length: 20 }, (_, i) => ({
        ...mockMetricData,
        timestamp: new Date(Date.now() + i * 60000),
        cpu: 50 + Math.sin(i * Math.PI / 5) * 30, // 주기적 패턴
      }));

      (detectAnomalies as Mock).mockImplementation((data) => {
        // 패턴에서 벗어난 데이터 감지
        return data.filter((d: any) => d.cpu > 75).map((d: any) => ({
          timestamp: d.timestamp,
          cpu: d.cpu,
          anomalyScore: (d.cpu - 50) / 30,
        }));
      });

      for (const data of periodicData) {
        await predictionSystem.addDataPoint('server-pattern', data);
      }

      const analysis = await predictionSystem.performIntegratedAnalysis('server-pattern');
      expect(analysis.anomalyDetection.isAnomalous).toBe(true);
    });
  });

  describe('🎯 정확도 계산 및 검증', () => {
    it('정확도를 계산할 수 있어야 함', async () => {
      const accuracy = await predictionSystem.calculateAccuracy();

      expect(accuracy).toBeDefined();
      expect(accuracy.overall).toBe(85); // mock 값
      expect(accuracy.byServer).toBeDefined();
      expect(accuracy.byServer['server-001']).toBe(90);
    });

    it('서버별 정확도를 개별적으로 계산할 수 있어야 함', async () => {
      const accuracy = await predictionSystem.calculateAccuracy('server-001');

      expect(accuracy).toBeDefined();
      expect(accuracy.byServer['server-001']).toBeDefined();
    });
  });

  describe('🚨 이상 탐지 기능', () => {
    it('시스템 메트릭에서 이상을 감지해야 함', async () => {
      const anomalousMetrics = [
        {
          ...mockServerMetrics,
          cpu: { usage: 95, temperature: 90 },
        },
        {
          ...mockServerMetrics,
          memory: { usage: 92, available: 8 },
        },
      ];

      mockAnomalyDetectionService.detect.mockResolvedValue([
        {
          timestamp: new Date(),
          metric: 'cpu',
          value: 95,
          severity: 'critical',
          description: 'CPU 사용률 이상',
          source: 'metrics',
        },
      ]);

      const anomalies = await predictionSystem.detectAnomalies(anomalousMetrics);
      
      expect(anomalies).toBeDefined();
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].metric).toBe('cpu');
    });
  });

  describe('🔧 히스토리 데이터 관리', () => {
    it('히스토리 데이터를 조회할 수 있어야 함', async () => {
      // 데이터 추가
      for (let i = 0; i < 10; i++) {
        await predictionSystem.addDataPoint('server-001', {
          ...mockMetricData,
          timestamp: new Date(Date.now() - i * 60 * 60 * 1000), // 1시간 간격
        });
      }

      const history = predictionSystem.getHistoricalData('server-001', 5);
      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
      expect(history.length).toBeLessThanOrEqual(5); // 5시간 이내 데이터만
    });

    it('특정 서버의 히스토리 데이터를 삭제할 수 있어야 함', async () => {
      await predictionSystem.addDataPoint('server-001', mockMetricData);
      await predictionSystem.addDataPoint('server-002', mockMetricData);

      predictionSystem.clearHistoricalData('server-001');

      const history1 = predictionSystem.getHistoricalData('server-001');
      const history2 = predictionSystem.getHistoricalData('server-002');

      expect(history1).toHaveLength(0);
      expect(history2).toHaveLength(1);
    });

    it('모든 히스토리 데이터를 삭제할 수 있어야 함', async () => {
      await predictionSystem.addDataPoint('server-001', mockMetricData);
      await predictionSystem.addDataPoint('server-002', mockMetricData);

      predictionSystem.clearHistoricalData();

      const servers = predictionSystem.getActiveServers();
      expect(servers).toHaveLength(0);
    });
  });

  describe('📊 시스템 메트릭 추적', () => {
    it('시스템 메트릭을 추적해야 함', async () => {
      // 여러 작업 수행
      for (let i = 0; i < 10; i++) {
        await predictionSystem.addDataPoint('server-001', mockMetricData);
      }

      const metrics = predictionSystem.getSystemMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.processedDataPoints).toBe(10);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('평균 응답 시간을 계산해야 함', async () => {
      // Mock이 실제로 예측을 반환하도록 설정
      mockPredictiveEngine.predictFailure.mockResolvedValue({
        serverId: 'server-001',
        failureProbability: 70,
        predictedTime: new Date(Date.now() + 60 * 60 * 1000),
        confidence: 75,
        triggerMetrics: ['cpu'],
        preventiveActions: ['모니터링'],
        severity: 'medium',
        analysisType: 'trend',
      });

      // minDataPoints가 5이므로 6개의 데이터 포인트를 추가해서 2번째부터 예측이 수행되도록 함
      for (let i = 0; i < 6; i++) {
        await predictionSystem.addDataPoint('server-001', {
          ...mockMetricData,
          timestamp: new Date(Date.now() + i * 60000),
        });
      }

      const metrics = predictionSystem.getSystemMetrics();
      // processedDataPoints가 6이고, 예측이 최소 1번은 수행되었으므로
      // averageResponseTime이 0 이상이어야 함
      expect(metrics.processedDataPoints).toBe(6);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🏁 엣지 케이스 처리', () => {
    it('데이터가 없는 서버에 대한 예측을 처리해야 함', async () => {
      const prediction = await predictionSystem.predictFailure('non-existent-server');
      expect(prediction).toBeNull();
    });

    it('잘못된 데이터 형식을 처리해야 함', async () => {
      const invalidData = {
        ...mockMetricData,
        cpu: NaN,
        memory: -10,
        disk: 150,
      };

      // 에러가 발생하지 않아야 함
      await expect(
        predictionSystem.addDataPoint('server-001', invalidData)
      ).resolves.not.toThrow();
    });

    it('동시 다발적인 요청을 처리해야 함', async () => {
      // 충분한 데이터 추가
      for (let i = 0; i < 5; i++) {
        await predictionSystem.addDataPoint('server-001', mockMetricData);
        await predictionSystem.addDataPoint('server-002', mockMetricData);
        await predictionSystem.addDataPoint('server-003', mockMetricData);
      }

      // 동시에 여러 예측 수행
      const predictions = await Promise.all([
        predictionSystem.predictFailure('server-001'),
        predictionSystem.predictFailure('server-002'),
        predictionSystem.predictFailure('server-003'),
        predictionSystem.performIntegratedAnalysis('server-001'),
        predictionSystem.generatePredictiveReport('server-002'),
      ]);

      // 모든 요청이 성공적으로 처리되어야 함
      expect(predictions).toHaveLength(5);
    });
  });

});
