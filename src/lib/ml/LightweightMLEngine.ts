/**
 * 🧠 경량 머신러닝 엔진 v2.0
 *
 * ✅ Vercel 서버리스 환경 완전 호환
 * ✅ Python 없이 순수 TypeScript/JavaScript 구현
 * ✅ 자동 장애보고서 학습 시스템
 * ✅ 자연어 질의 로그 기반 학습
 * ✅ 실시간 성능 최적화
 */

// 기본 타입 정의
interface DataPoint {
  features: number[];
  label?: number | string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface MLModel {
  type: 'regression' | 'classification' | 'clustering' | 'anomaly';
  weights?: number[];
  bias?: number;
  clusters?: number[][];
  threshold?: number;
  accuracy?: number;
  lastTrained: number;
  trainingData: DataPoint[];
}

export interface PredictionResult {
  prediction: number | string;
  confidence: number;
  explanation?: string;
  features: number[];
  timestamp: number;
}

interface LearningConfig {
  learningRate: number;
  maxIterations: number;
  convergenceThreshold: number;
  regularization: number;
  batchSize: number;
  autoRetrain: boolean;
  retrainThreshold: number; // 새 데이터 개수
}

// 수학 유틸리티 함수들
class MathUtils {
  // 벡터 내적
  static dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  }

  // 벡터 정규화
  static normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return magnitude === 0 ? vector : vector.map(val => val / magnitude);
  }

  // 평균 계산
  static mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // 표준편차 계산
  static standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  // 유클리드 거리
  static euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0)
    );
  }

  // 시그모이드 함수
  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); // 오버플로우 방지
  }

  // 소프트맥스 함수
  static softmax(values: number[]): number[] {
    const maxVal = Math.max(...values);
    const expValues = values.map(val => Math.exp(val - maxVal));
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);
    return expValues.map(val => val / sumExp);
  }
}

// 특성 추출기
class FeatureExtractor {
  // 자동 장애보고서에서 특성 추출
  static extractIncidentFeatures(incidentData: any): number[] {
    const features: number[] = [];

    // 시간 기반 특성
    const timestamp = new Date(incidentData.timestamp || Date.now()).getTime();
    features.push(timestamp % (24 * 60 * 60 * 1000)); // 하루 중 시간
    features.push(new Date(timestamp).getDay()); // 요일

    // 서버 메트릭 특성
    features.push(incidentData.cpuUsage || 0);
    features.push(incidentData.memoryUsage || 0);
    features.push(incidentData.diskUsage || 0);
    features.push(incidentData.networkLatency || 0);

    // 에러 관련 특성
    features.push(incidentData.errorCount || 0);
    features.push(incidentData.warningCount || 0);
    features.push(incidentData.responseTime || 0);

    // 텍스트 특성 (간단한 키워드 기반)
    const description = (incidentData.description || '').toLowerCase();
    features.push(description.includes('memory') ? 1 : 0);
    features.push(description.includes('cpu') ? 1 : 0);
    features.push(description.includes('disk') ? 1 : 0);
    features.push(description.includes('network') ? 1 : 0);
    features.push(description.includes('timeout') ? 1 : 0);
    features.push(description.includes('connection') ? 1 : 0);

    return features;
  }

  // 자연어 질의에서 특성 추출
  static extractQueryFeatures(queryData: any): number[] {
    const features: number[] = [];

    const query = (queryData.query || '').toLowerCase();
    const queryLength = query.length;

    // 기본 텍스트 특성
    features.push(queryLength);
    features.push(query.split(' ').length); // 단어 수
    features.push(query.split('?').length - 1); // 질문 개수

    // 카테고리 특성 (키워드 기반)
    const categories = [
      'status',
      'performance',
      'error',
      'log',
      'system',
      'ai',
      'engine',
      'database',
      'network',
      'memory',
      'cpu',
      'disk',
      'alert',
      'monitoring',
      'analysis',
    ];

    categories.forEach(category => {
      features.push(query.includes(category) ? 1 : 0);
    });

    // 시간 관련 특성
    features.push(queryData.responseTime || 0);
    features.push(queryData.success ? 1 : 0);
    features.push(queryData.confidence || 0);

    // 엔진 사용 특성
    features.push(queryData.engineUsed === 'google-ai' ? 1 : 0);
    features.push(queryData.engineUsed === 'supabase-rag' ? 1 : 0);
    features.push(queryData.engineUsed === 'mcp-context' ? 1 : 0);
    features.push(queryData.fallbackUsed ? 1 : 0);

    return features;
  }

  // 성능 메트릭에서 특성 추출
  static extractPerformanceFeatures(performanceData: any): number[] {
    const features: number[] = [];

    features.push(performanceData.responseTime || 0);
    features.push(performanceData.successRate || 0);
    features.push(performanceData.errorRate || 0);
    features.push(performanceData.throughput || 0);
    features.push(performanceData.memoryUsage || 0);
    features.push(performanceData.cpuUsage || 0);
    features.push(performanceData.activeConnections || 0);
    features.push(performanceData.queueLength || 0);

    // 시간 기반 특성
    const timestamp = new Date(performanceData.timestamp || Date.now());
    features.push(timestamp.getHours());
    features.push(timestamp.getDay());
    features.push(timestamp.getTime() % (60 * 60 * 1000)); // 시간 내 분

    return features;
  }
}

// 메인 경량 ML 엔진
export class LightweightMLEngine {
  private models: Map<string, MLModel> = new Map();
  private config: LearningConfig;
  private isTraining: boolean = false;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      learningRate: 0.01,
      maxIterations: 1000,
      convergenceThreshold: 0.001,
      regularization: 0.01,
      batchSize: 32,
      autoRetrain: true,
      retrainThreshold: 100,
      ...config,
    };
  }

  // 선형 회귀 모델 훈련
  async trainLinearRegression(
    modelName: string,
    trainingData: DataPoint[]
  ): Promise<void> {
    if (trainingData.length === 0) return;

    const features = trainingData.map(d => d.features);
    const labels = trainingData.map(d => Number(d.label) || 0);

    const featureCount = features[0].length;
    let weights = new Array(featureCount).fill(0);
    let bias = 0;

    // 경사하강법
    for (
      let iteration = 0;
      iteration < this.config.maxIterations;
      iteration++
    ) {
      let totalError = 0;
      const weightGradients = new Array(featureCount).fill(0);
      let biasGradient = 0;

      // 배치 처리
      for (let i = 0; i < features.length; i++) {
        const prediction = MathUtils.dotProduct(features[i], weights) + bias;
        const error = prediction - labels[i];
        totalError += error * error;

        // 그라디언트 계산
        for (let j = 0; j < featureCount; j++) {
          weightGradients[j] += error * features[i][j];
        }
        biasGradient += error;
      }

      // 가중치 업데이트 (정규화 포함)
      for (let j = 0; j < featureCount; j++) {
        weights[j] -=
          this.config.learningRate *
          (weightGradients[j] / features.length +
            this.config.regularization * weights[j]);
      }
      bias -= this.config.learningRate * (biasGradient / features.length);

      // 수렴 확인
      const avgError = totalError / features.length;
      if (avgError < this.config.convergenceThreshold) {
        console.log(
          `✅ 모델 수렴: ${iteration}회 반복, 오차: ${avgError.toFixed(6)}`
        );
        break;
      }
    }

    // 정확도 계산
    const predictions = features.map(
      f => MathUtils.dotProduct(f, weights) + bias
    );
    const mse =
      labels.reduce(
        (sum, label, i) => sum + Math.pow(label - predictions[i], 2),
        0
      ) / labels.length;
    const accuracy = Math.max(0, 1 - Math.sqrt(mse) / Math.max(...labels));

    this.models.set(modelName, {
      type: 'regression',
      weights,
      bias,
      accuracy,
      lastTrained: Date.now(),
      trainingData: trainingData.slice(-1000), // 최근 1000개만 보관
    });

    console.log(
      `📊 선형 회귀 모델 '${modelName}' 훈련 완료 - 정확도: ${(accuracy * 100).toFixed(2)}%`
    );
  }

  // 로지스틱 회귀 (분류) 모델 훈련
  async trainLogisticRegression(
    modelName: string,
    trainingData: DataPoint[]
  ): Promise<void> {
    if (trainingData.length === 0) return;

    const features = trainingData.map(d => d.features);
    const labels = trainingData.map(d => Number(d.label) || 0);

    const featureCount = features[0].length;
    let weights = new Array(featureCount).fill(0);
    let bias = 0;

    // 경사하강법 (로지스틱 회귀)
    for (
      let iteration = 0;
      iteration < this.config.maxIterations;
      iteration++
    ) {
      const weightGradients = new Array(featureCount).fill(0);
      let biasGradient = 0;

      for (let i = 0; i < features.length; i++) {
        const z = MathUtils.dotProduct(features[i], weights) + bias;
        const prediction = MathUtils.sigmoid(z);
        const error = prediction - labels[i];

        for (let j = 0; j < featureCount; j++) {
          weightGradients[j] += error * features[i][j];
        }
        biasGradient += error;
      }

      // 가중치 업데이트
      for (let j = 0; j < featureCount; j++) {
        weights[j] -=
          this.config.learningRate *
          (weightGradients[j] / features.length +
            this.config.regularization * weights[j]);
      }
      bias -= this.config.learningRate * (biasGradient / features.length);
    }

    // 정확도 계산
    const correctPredictions = features.reduce((count, feature, i) => {
      const z = MathUtils.dotProduct(feature, weights) + bias;
      const prediction = MathUtils.sigmoid(z) > 0.5 ? 1 : 0;
      return count + (prediction === labels[i] ? 1 : 0);
    }, 0);
    const accuracy = correctPredictions / features.length;

    this.models.set(modelName, {
      type: 'classification',
      weights,
      bias,
      accuracy,
      lastTrained: Date.now(),
      trainingData: trainingData.slice(-1000),
    });

    console.log(
      `🎯 로지스틱 회귀 모델 '${modelName}' 훈련 완료 - 정확도: ${(accuracy * 100).toFixed(2)}%`
    );
  }

  // K-Means 클러스터링
  async trainKMeansClustering(
    modelName: string,
    trainingData: DataPoint[],
    k: number = 3
  ): Promise<void> {
    if (trainingData.length === 0) return;

    const features = trainingData.map(d => d.features);
    const featureCount = features[0].length;

    // 초기 클러스터 중심점 랜덤 선택
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * features.length);
      centroids.push([...features[randomIndex]]);
    }

    let converged = false;
    let iterations = 0;

    while (!converged && iterations < this.config.maxIterations) {
      // 각 점을 가장 가까운 클러스터에 할당
      const clusters: number[][] = Array(k)
        .fill(null)
        .map((): number[] => []);

      features.forEach((feature, index) => {
        let minDistance = Infinity;
        let closestCluster = 0;

        for (let i = 0; i < k; i++) {
          const distance = MathUtils.euclideanDistance(feature, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCluster = i;
          }
        }

        clusters[closestCluster].push(index);
      });

      // 새로운 중심점 계산
      const newCentroids: number[][] = [];
      let totalMovement = 0;

      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) {
          newCentroids.push([...centroids[i]]);
          continue;
        }

        const newCentroid = new Array(featureCount).fill(0);
        clusters[i].forEach(pointIndex => {
          features[pointIndex].forEach((value, featureIndex) => {
            newCentroid[featureIndex] += value;
          });
        });

        newCentroid.forEach((value, index) => {
          newCentroid[index] = value / clusters[i].length;
        });

        totalMovement += MathUtils.euclideanDistance(centroids[i], newCentroid);
        newCentroids.push(newCentroid);
      }

      centroids = newCentroids;
      converged = totalMovement < this.config.convergenceThreshold;
      iterations++;
    }

    this.models.set(modelName, {
      type: 'clustering',
      clusters: centroids,
      lastTrained: Date.now(),
      trainingData: trainingData.slice(-1000),
    });

    console.log(
      `🔍 K-Means 클러스터링 모델 '${modelName}' 훈련 완료 - ${iterations}회 반복`
    );
  }

  // 이상 탐지 모델 훈련 (통계 기반)
  async trainAnomalyDetection(
    modelName: string,
    trainingData: DataPoint[]
  ): Promise<void> {
    if (trainingData.length === 0) return;

    const features = trainingData.map(d => d.features);
    const featureCount = features[0].length;

    // 각 특성의 평균과 표준편차 계산
    const means: number[] = [];
    const stds: number[] = [];

    for (let i = 0; i < featureCount; i++) {
      const featureValues = features.map(f => f[i]);
      means.push(MathUtils.mean(featureValues));
      stds.push(MathUtils.standardDeviation(featureValues));
    }

    // 임계값 설정 (2 표준편차)
    const threshold = 2.0;

    this.models.set(modelName, {
      type: 'anomaly',
      weights: means,
      bias: threshold,
      clusters: [stds], // 표준편차를 clusters에 저장
      lastTrained: Date.now(),
      trainingData: trainingData.slice(-1000),
    });

    console.log(`🚨 이상 탐지 모델 '${modelName}' 훈련 완료`);
  }

  // 예측 수행
  async predict(
    modelName: string,
    features: number[]
  ): Promise<PredictionResult | null> {
    const model = this.models.get(modelName);
    if (!model) {
      console.warn(`⚠️ 모델 '${modelName}'을 찾을 수 없습니다`);
      return null;
    }

    let prediction: number | string;
    let confidence: number;
    let explanation: string;

    switch (model.type) {
      case 'regression':
        prediction =
          MathUtils.dotProduct(features, model.weights!) + (model.bias || 0);
        confidence = Math.min(1, model.accuracy || 0.5);
        explanation = `선형 회귀 예측값: ${prediction.toFixed(2)}`;
        break;

      case 'classification':
        const z =
          MathUtils.dotProduct(features, model.weights!) + (model.bias || 0);
        const probability = MathUtils.sigmoid(z);
        prediction = probability > 0.5 ? 1 : 0;
        confidence = Math.abs(probability - 0.5) * 2;
        explanation = `분류 결과: ${prediction} (확률: ${(probability * 100).toFixed(1)}%)`;
        break;

      case 'clustering':
        let minDistance = Infinity;
        let closestCluster = 0;

        model.clusters!.forEach((centroid, index) => {
          const distance = MathUtils.euclideanDistance(features, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            closestCluster = index;
          }
        });

        prediction = closestCluster;
        confidence = Math.max(0, 1 - minDistance / 10); // 거리 기반 신뢰도
        explanation = `클러스터 ${closestCluster} (거리: ${minDistance.toFixed(2)})`;
        break;

      case 'anomaly':
        const means = model.weights!;
        const stds = model.clusters![0];
        const threshold = model.bias!;

        let anomalyScore = 0;
        for (let i = 0; i < features.length; i++) {
          const zScore = Math.abs((features[i] - means[i]) / (stds[i] || 1));
          anomalyScore = Math.max(anomalyScore, zScore);
        }

        prediction = anomalyScore > threshold ? 1 : 0; // 1: 이상, 0: 정상
        confidence = Math.min(1, anomalyScore / threshold);
        explanation = `이상 점수: ${anomalyScore.toFixed(2)} (임계값: ${threshold})`;
        break;

      default:
        return null;
    }

    return {
      prediction,
      confidence,
      explanation,
      features,
      timestamp: Date.now(),
    };
  }

  // 자동 장애보고서 학습
  async learnFromIncidentReports(incidentReports: any[]): Promise<void> {
    console.log(
      `📚 자동 장애보고서 학습 시작: ${incidentReports.length}개 보고서`
    );

    // 특성 추출
    const trainingData: DataPoint[] = incidentReports.map(report => ({
      features: FeatureExtractor.extractIncidentFeatures(report),
      label: report.severity || report.priority || 1, // 심각도를 라벨로 사용
      timestamp: new Date(report.timestamp || Date.now()).getTime(),
      metadata: { reportId: report.id, type: 'incident' },
    }));

    // 여러 모델 훈련
    await this.trainLinearRegression(
      'incident-severity-predictor',
      trainingData
    );
    await this.trainKMeansClustering('incident-clustering', trainingData, 3);
    await this.trainAnomalyDetection('incident-anomaly-detector', trainingData);

    console.log('✅ 자동 장애보고서 학습 완료');
  }

  // 자연어 질의 로그 학습
  async learnFromQueryLogs(queryLogs: any[]): Promise<void> {
    console.log(`📚 자연어 질의 로그 학습 시작: ${queryLogs.length}개 로그`);

    // 특성 추출
    const trainingData: DataPoint[] = queryLogs.map(log => ({
      features: FeatureExtractor.extractQueryFeatures(log),
      label: log.responseTime || log.success ? 1 : 0,
      timestamp: new Date(log.timestamp || Date.now()).getTime(),
      metadata: { queryId: log.id, type: 'query' },
    }));

    // 응답 시간 예측 모델
    const responseTimeData = trainingData.map(d => ({
      ...d,
      label: d.metadata?.responseTime || 1000,
    }));
    await this.trainLinearRegression(
      'query-response-time-predictor',
      responseTimeData
    );

    // 성공률 예측 모델
    const successData = trainingData.map(d => ({
      ...d,
      label: d.metadata?.success ? 1 : 0,
    }));
    await this.trainLogisticRegression('query-success-predictor', successData);

    // 질의 클러스터링
    await this.trainKMeansClustering('query-clustering', trainingData, 5);

    console.log('✅ 자연어 질의 로그 학습 완료');
  }

  // 성능 데이터 학습
  async learnFromPerformanceData(performanceData: any[]): Promise<void> {
    console.log(`📚 성능 데이터 학습 시작: ${performanceData.length}개 데이터`);

    const trainingData: DataPoint[] = performanceData.map(data => ({
      features: FeatureExtractor.extractPerformanceFeatures(data),
      label: data.responseTime || 0,
      timestamp: new Date(data.timestamp || Date.now()).getTime(),
      metadata: { type: 'performance' },
    }));

    // 성능 예측 모델들
    await this.trainLinearRegression('performance-predictor', trainingData);
    await this.trainAnomalyDetection(
      'performance-anomaly-detector',
      trainingData
    );

    console.log('✅ 성능 데이터 학습 완료');
  }

  // 모델 상태 조회
  getModelStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    this.models.forEach((model, name) => {
      status[name] = {
        type: model.type,
        accuracy: model.accuracy,
        lastTrained: new Date(model.lastTrained).toISOString(),
        trainingDataSize: model.trainingData.length,
        isReady: true,
      };
    });

    return status;
  }

  // 모델 저장 (JSON 형태)
  exportModels(): string {
    const exportData = {
      models: Object.fromEntries(this.models),
      config: this.config,
      exportTime: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // 모델 불러오기
  importModels(data: string): void {
    try {
      const importData = JSON.parse(data);

      if (importData.models) {
        this.models = new Map(Object.entries(importData.models));
      }

      if (importData.config) {
        this.config = { ...this.config, ...importData.config };
      }

      console.log(`✅ 모델 불러오기 완료: ${this.models.size}개 모델`);
    } catch (error) {
      console.error('❌ 모델 불러오기 실패:', error);
    }
  }

  // 자동 재훈련 확인
  async checkAutoRetrain(): Promise<void> {
    if (!this.config.autoRetrain || this.isTraining) return;

    for (const [modelName, model] of this.models) {
      if (model.trainingData.length >= this.config.retrainThreshold) {
        console.log(`🔄 모델 '${modelName}' 자동 재훈련 시작`);
        this.isTraining = true;

        try {
          switch (model.type) {
            case 'regression':
              await this.trainLinearRegression(modelName, model.trainingData);
              break;
            case 'classification':
              await this.trainLogisticRegression(modelName, model.trainingData);
              break;
            case 'clustering':
              await this.trainKMeansClustering(modelName, model.trainingData);
              break;
            case 'anomaly':
              await this.trainAnomalyDetection(modelName, model.trainingData);
              break;
          }
        } finally {
          this.isTraining = false;
        }
      }
    }
  }
}

// 싱글톤 인스턴스
let mlEngineInstance: LightweightMLEngine | null = null;

export function getLightweightMLEngine(): LightweightMLEngine {
  if (!mlEngineInstance) {
    mlEngineInstance = new LightweightMLEngine({
      learningRate: 0.01,
      maxIterations: 500, // Vercel 환경에서 빠른 실행을 위해 줄임
      convergenceThreshold: 0.001,
      regularization: 0.01,
      batchSize: 16,
      autoRetrain: true,
      retrainThreshold: 50,
    });
  }
  return mlEngineInstance;
}

export default LightweightMLEngine;
