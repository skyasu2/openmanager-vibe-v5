/**
 * 🤖 API v1 - AI 학습용 데이터셋 생성
 *
 * AI 모델 훈련을 위한 라벨링된 데이터셋 제공
 * - 분류 학습용 데이터
 * - 이상 탐지 학습용 데이터
 * - 예측 모델 학습용 시계열 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  RealisticDataGenerator,
  DemoScenario,
  ServerMetrics,
  DemoLogEntry,
} from '@/services/data-generator/RealisticDataGenerator';

// 🤖 AI 학습용 데이터 생성기
const aiTrainingGenerator = new RealisticDataGenerator();

// 🎯 AI 학습 타입 정의
type TrainingType =
  | 'classification'
  | 'anomaly_detection'
  | 'prediction'
  | 'clustering'
  | 'mixed';

interface TrainingDataset {
  features: number[][];
  labels: (string | number)[];
  metadata: {
    featureNames: string[];
    labelMapping?: Record<string, number>;
    datasetInfo: {
      totalSamples: number;
      featureCount: number;
      classCount?: number;
      anomalyRate?: number;
    };
  };
  scenarios: Array<{
    scenario: DemoScenario;
    samples: number;
    timeRange: { start: string; end: string };
  }>;
}

/**
 * 🎯 AI 학습용 데이터셋 생성
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      trainingType = 'classification',
      samplesPerScenario = 100,
      includeAnomalies = true,
      normalizationMode = 'standard',
      timeSeriesLength = 50,
      testSplit = 0.2,
    } = body;

    console.log(
      `🤖 AI 학습 데이터셋 생성: ${trainingType}, 시나리오당 ${samplesPerScenario}개 샘플`
    );

    // 시나리오별 데이터 생성
    const scenarios: DemoScenario[] = [
      'normal',
      'spike',
      'memory_leak',
      'ddos',
      'performance_degradation',
    ];
    const trainingData: TrainingDataset = {
      features: [],
      labels: [],
      metadata: {
        featureNames: [],
        datasetInfo: {
          totalSamples: 0,
          featureCount: 0,
        },
      },
      scenarios: [],
    };

    for (const scenario of scenarios) {
      aiTrainingGenerator.setScenario(scenario);

      const scenarioMetrics =
        aiTrainingGenerator.generateTimeSeriesData(samplesPerScenario);
      const scenarioLogs = aiTrainingGenerator.generateLogEntries(
        Math.floor(samplesPerScenario / 3)
      );

      // 학습 타입에 따른 특성 추출 및 라벨링
      const processedData = processDataForTraining(
        scenarioMetrics,
        scenarioLogs,
        scenario,
        trainingType
      );

      trainingData.features.push(...processedData.features);
      trainingData.labels.push(...processedData.labels);

      trainingData.scenarios.push({
        scenario,
        samples: processedData.features.length,
        timeRange: {
          start: scenarioMetrics[0]?.timestamp || '',
          end: scenarioMetrics[scenarioMetrics.length - 1]?.timestamp || '',
        },
      });
    }

    // 메타데이터 설정
    trainingData.metadata.featureNames = getFeatureNames(trainingType);
    trainingData.metadata.datasetInfo.totalSamples =
      trainingData.features.length;
    trainingData.metadata.datasetInfo.featureCount =
      trainingData.features[0]?.length || 0;

    if (trainingType === 'classification') {
      const uniqueLabels = [...new Set<string | number>(trainingData.labels)];
      trainingData.metadata.datasetInfo.classCount = uniqueLabels.length;
      trainingData.metadata.labelMapping = Object.fromEntries(
        uniqueLabels.map((label, index) => [label.toString(), index])
      );
    }

    // 데이터 정규화
    const normalizedData = normalizeData(
      trainingData.features,
      normalizationMode
    );

    // Train/Test 분할
    const splitData = splitTrainTest(
      [...normalizedData],
      [...trainingData.labels],
      testSplit
    );

    // 응답 구성
    const response = {
      success: true,
      dataset: {
        type: trainingType,
        train: {
          features: splitData.trainFeatures,
          labels: splitData.trainLabels,
          size: splitData.trainFeatures.length,
        },
        test: {
          features: splitData.testFeatures,
          labels: splitData.testLabels,
          size: splitData.testFeatures.length,
        },
        metadata: trainingData.metadata,
        scenarios: trainingData.scenarios,
      },
      config: {
        samplesPerScenario,
        normalizationMode,
        testSplit,
        includeAnomalies,
        timeSeriesLength,
      },
      stats: {
        classDistribution: getClassDistribution(trainingData.labels),
        featureStatistics: getFeatureStatistics(normalizedData),
        dataQuality: assessDataQuality(normalizedData, trainingData.labels),
      },
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: 'v1.0.0',
        generator: 'AI Training Dataset Generator',
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`✅ AI 학습 데이터셋 생성 완료`, {
      type: trainingType,
      totalSamples: trainingData.metadata.datasetInfo.totalSamples,
      features: trainingData.metadata.datasetInfo.featureCount,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ AI 학습 데이터셋 생성 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'AI 학습 데이터셋 생성 중 오류가 발생했습니다',
        code: 'TRAINING_DATA_ERROR',
        message: error.message,
        meta: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 AI 학습 데이터 정보 및 템플릿
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'templates':
        return NextResponse.json({
          trainingTypes: {
            classification: {
              description: '시나리오 분류 모델 학습용 데이터',
              features: [
                'cpu',
                'memory',
                'disk',
                'network',
                'responseTime',
                'errorRate',
              ],
              labels: [
                'normal',
                'spike',
                'memory_leak',
                'ddos',
                'performance_degradation',
              ],
              useCase: '실시간 서버 상태 분류',
            },
            anomaly_detection: {
              description: '이상 탐지 모델 학습용 데이터',
              features: [
                'cpu',
                'memory',
                'disk',
                'network',
                'responseTime',
                'patterns',
              ],
              labels: [0, 1], // 0: normal, 1: anomaly
              useCase: '비정상 서버 동작 탐지',
            },
            prediction: {
              description: '시계열 예측 모델 학습용 데이터',
              features: [
                'sequence_data',
                'temporal_patterns',
                'seasonal_effects',
              ],
              labels: ['future_values'],
              useCase: '서버 부하 예측',
            },
            clustering: {
              description: '클러스터링 분석용 데이터',
              features: ['cpu', 'memory', 'disk', 'patterns'],
              labels: [], // 무감독 학습
              useCase: '서버 동작 패턴 그룹화',
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'sample':
        // 샘플 데이터 생성
        const sampleType =
          (url.searchParams.get('type') as TrainingType) || 'classification';
        const sampleSize = parseInt(url.searchParams.get('size') || '10');

        aiTrainingGenerator.setScenario('normal');
        const sampleMetrics =
          aiTrainingGenerator.generateTimeSeriesData(sampleSize);
        const processed = processDataForTraining(
          sampleMetrics,
          [],
          'normal',
          sampleType
        );

        return NextResponse.json({
          type: sampleType,
          sampleData: {
            features: processed.features.slice(0, 3), // 첫 3개만
            labels: processed.labels.slice(0, 3),
            featureNames: getFeatureNames(sampleType),
          },
          metadata: {
            totalSamples: processed.features.length,
            featureCount: processed.features[0]?.length || 0,
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          name: 'AI Training Dataset API v1',
          version: 'v1.0.0',
          description: 'AI 모델 학습용 라벨링된 데이터셋 생성',
          supportedTypes: [
            'classification',
            'anomaly_detection',
            'prediction',
            'clustering',
            'mixed',
          ],
          endpoints: {
            'POST /api/v1/demo/ai-training': '학습 데이터셋 생성',
            'GET /api/v1/demo/ai-training?action=templates': '학습 타입 템플릿',
            'GET /api/v1/demo/ai-training?action=sample&type=<type>&size=<n>':
              '샘플 데이터',
          },
          usage: {
            generateDataset:
              'POST { "trainingType": "classification", "samplesPerScenario": 100 }',
            getSample: 'GET ?action=sample&type=anomaly_detection&size=5',
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process AI training request',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 학습 타입별 데이터 처리
 */
function processDataForTraining(
  metrics: ServerMetrics[],
  logs: DemoLogEntry[],
  scenario: DemoScenario,
  trainingType: TrainingType
) {
  const features: number[][] = [];
  const labels: (string | number)[] = [];

  for (const metric of metrics) {
    let featureVector: number[] = [];
    let label: string | number = '';

    switch (trainingType) {
      case 'classification':
        featureVector = [
          metric.cpu,
          metric.memory,
          metric.disk,
          metric.networkIn / 1000, // 정규화
          metric.networkOut / 1000,
          metric.responseTime / 100,
          metric.errorRate || 0,
          metric.throughput || 0,
        ];
        label = scenario;
        break;

      case 'anomaly_detection':
        featureVector = [
          metric.cpu,
          metric.memory,
          metric.disk,
          metric.responseTime,
          metric.errorRate || 0,
          calculateAnomalyScore(metric),
        ];
        label = scenario === 'normal' ? 0 : 1;
        break;

      case 'prediction':
        // 시계열 특성 추출
        featureVector = [
          metric.cpu,
          metric.memory,
          metric.responseTime,
          metric.activeConnections / 100,
          // 추가 시계열 특성들
          Math.sin((new Date(metric.timestamp).getHours() / 24) * 2 * Math.PI), // 시간 주기성
          Math.cos((new Date(metric.timestamp).getHours() / 24) * 2 * Math.PI),
        ];
        label = metric.cpu; // 다음 CPU 사용률 예측
        break;

      case 'clustering':
        featureVector = [
          metric.cpu,
          metric.memory,
          metric.disk,
          metric.responseTime,
          metric.activeConnections / 100,
        ];
        label = ''; // 무감독 학습
        break;

      default:
        featureVector = [metric.cpu, metric.memory, metric.disk];
        label = scenario;
    }

    features.push(featureVector);
    labels.push(label);
  }

  return { features, labels };
}

/**
 * 📊 이상 점수 계산
 */
function calculateAnomalyScore(metric: ServerMetrics): number {
  // 간단한 이상 점수 계산 (복합 메트릭 기반)
  const cpuWeight = metric.cpu > 80 ? 1 : 0;
  const memoryWeight = metric.memory > 85 ? 1 : 0;
  const responseWeight = metric.responseTime > 500 ? 1 : 0;
  const errorWeight = (metric.errorRate || 0) > 5 ? 1 : 0;

  return (cpuWeight + memoryWeight + responseWeight + errorWeight) / 4;
}

/**
 * 🏷️ 특성 이름 반환
 */
function getFeatureNames(trainingType: TrainingType): string[] {
  switch (trainingType) {
    case 'classification':
      return [
        'cpu',
        'memory',
        'disk',
        'networkIn',
        'networkOut',
        'responseTime',
        'errorRate',
        'throughput',
      ];
    case 'anomaly_detection':
      return [
        'cpu',
        'memory',
        'disk',
        'responseTime',
        'errorRate',
        'anomalyScore',
      ];
    case 'prediction':
      return [
        'cpu',
        'memory',
        'responseTime',
        'activeConnections',
        'hourSin',
        'hourCos',
      ];
    case 'clustering':
      return ['cpu', 'memory', 'disk', 'responseTime', 'activeConnections'];
    default:
      return ['cpu', 'memory', 'disk'];
  }
}

/**
 * 📈 데이터 정규화
 */
function normalizeData(features: number[][], mode: string): number[][] {
  if (features.length === 0) return [];

  const featureCount = features[0].length;
  const normalized: number[][] = [];

  for (let i = 0; i < featureCount; i++) {
    const column = features.map(row => row[i]);
    const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
    const std = Math.sqrt(
      column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        column.length
    );

    for (let j = 0; j < features.length; j++) {
      if (!normalized[j]) normalized[j] = [];
      normalized[j][i] =
        mode === 'standard'
          ? (features[j][i] - mean) / (std || 1)
          : features[j][i];
    }
  }

  return normalized;
}

/**
 * ✂️ Train/Test 분할
 */
function splitTrainTest(
  features: number[][],
  labels: (string | number)[],
  testSplit: number
) {
  const totalSamples = features.length;
  const testSize = Math.floor(totalSamples * testSplit);
  const trainSize = totalSamples - testSize;

  // 셔플을 위한 인덱스 배열
  const indices = Array.from({ length: totalSamples }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const trainIndices = indices.slice(0, trainSize);
  const testIndices = indices.slice(trainSize);

  return {
    trainFeatures: trainIndices.map(i => features[i]),
    trainLabels: trainIndices.map(i => labels[i]),
    testFeatures: testIndices.map(i => features[i]),
    testLabels: testIndices.map(i => labels[i]),
  };
}

/**
 * 📊 클래스 분포 계산
 */
function getClassDistribution(
  labels: (string | number)[]
): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const label of labels) {
    const key = label.toString();
    distribution[key] = (distribution[key] || 0) + 1;
  }
  return distribution;
}

/**
 * 📈 특성 통계 계산
 */
function getFeatureStatistics(features: number[][]): Record<string, any> {
  if (features.length === 0) return {};

  const featureCount = features[0].length;
  const stats: Record<string, any> = {};

  for (let i = 0; i < featureCount; i++) {
    const column = features.map(row => row[i]);
    const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
    const min = Math.min(...column);
    const max = Math.max(...column);
    const std = Math.sqrt(
      column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        column.length
    );

    stats[`feature_${i}`] = { mean, min, max, std };
  }

  return stats;
}

/**
 * ✅ 데이터 품질 평가
 */
function assessDataQuality(
  features: number[][],
  labels: (string | number)[]
): Record<string, any> {
  const totalSamples = features.length;
  const featureCount = features[0]?.length || 0;

  // 결측값 확인
  let missingValues = 0;
  for (const row of features) {
    for (const value of row) {
      if (isNaN(value) || value === null || value === undefined) {
        missingValues++;
      }
    }
  }

  // 라벨 완성도
  const missingLabels = labels.filter(
    label => label === null || label === undefined || label === ''
  ).length;

  return {
    completeness: 1 - missingValues / (totalSamples * featureCount),
    labelCompleteness: 1 - missingLabels / totalSamples,
    balanceScore: calculateClassBalance(labels),
    featureVariance: calculateFeatureVariance(features),
    overallScore: calculateOverallQuality(features, labels),
  };
}

/**
 * ⚖️ 클래스 균형 점수
 */
function calculateClassBalance(labels: (string | number)[]): number {
  const distribution = getClassDistribution(labels);
  const counts = Object.values(distribution);
  const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
    counts.length;

  return 1 / (1 + variance / mean); // 0-1 사이 값, 1이 완벽한 균형
}

/**
 * 📊 특성 분산 계산
 */
function calculateFeatureVariance(features: number[][]): number {
  if (features.length === 0) return 0;

  const featureCount = features[0].length;
  let totalVariance = 0;

  for (let i = 0; i < featureCount; i++) {
    const column = features.map(row => row[i]);
    const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
    const variance =
      column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      column.length;
    totalVariance += variance;
  }

  return totalVariance / featureCount;
}

/**
 * 🎯 전체 품질 점수
 */
function calculateOverallQuality(
  features: number[][],
  labels: (string | number)[]
): number {
  const completeness = 1; // 생성된 데이터이므로 완전
  const balance = calculateClassBalance(labels);
  const variance = calculateFeatureVariance(features);
  const normalizedVariance = Math.min(variance / 100, 1); // 정규화

  return completeness * 0.4 + balance * 0.4 + normalizedVariance * 0.2;
}
