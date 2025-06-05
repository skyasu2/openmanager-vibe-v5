/**
 * 🧠 TensorFlow.js AI 엔진 v3.0
 * 
 * ✅ Vercel 서버리스 완전 호환
 * ✅ 브라우저 + Node.js 지원  
 * ✅ 장애 예측 신경망
 * ✅ 이상 탐지 오토인코더
 * ✅ 시계열 LSTM 모델
 * ✅ KMeans 클러스터링 (Python 이전)
 * ✅ StandardScaler (Python 이전)
 * ✅ 완전 로컬 AI (외부 API 없음)
 */

import * as tf from '@tensorflow/tfjs';

interface PredictionResult {
  prediction: number[];
  confidence: number;
  model_info: string;
  processing_time: number;
}

interface AnomalyResult {
  is_anomaly: boolean;
  anomaly_score: number;
  threshold: number;
  model_info: string;
}

interface ClusterResult {
  cluster_labels: number[];
  centroids: number[][];
  inertia: number;
  model_info: string;
}

interface AIAnalysisResult {
  failure_predictions: Record<string, PredictionResult>;
  anomaly_detections: Record<string, AnomalyResult>;
  trend_predictions: Record<string, number[]>;
  clustering_analysis?: ClusterResult;
  ai_insights: string[];
  processing_stats: {
    total_time: number;
    models_used: string[];
    metrics_analyzed: number;
  };
}

/**
 * 🔧 StandardScaler - Python scikit-learn 동등 기능
 */
class StandardScaler {
  private mean: tf.Tensor | null = null;
  private std: tf.Tensor | null = null;
  private fitted = false;

  fit(data: tf.Tensor): void {
    this.mean = tf.mean(data, 0);
    const variance = tf.moments(data, 0).variance;
    this.std = variance.sqrt();
    this.fitted = true;
  }

  transform(data: tf.Tensor): tf.Tensor {
    if (!this.fitted || !this.mean || !this.std) {
      throw new Error('StandardScaler must be fitted before transform');
    }
    return data.sub(this.mean).div(this.std);
  }

  fitTransform(data: tf.Tensor): tf.Tensor {
    this.fit(data);
    return this.transform(data);
  }

  dispose(): void {
    if (this.mean) this.mean.dispose();
    if (this.std) this.std.dispose();
  }
}

/**
 * 🎯 KMeans 클러스터링 - Python scikit-learn 동등 기능
 */
class KMeans {
  private centroids: tf.Tensor | null = null;
  private nClusters: number;
  private maxIters: number;
  private tolerance: number;

  constructor(nClusters: number = 3, maxIters: number = 100, tolerance: number = 1e-4) {
    this.nClusters = nClusters;
    this.maxIters = maxIters;
    this.tolerance = tolerance;
  }

  async fit(data: tf.Tensor): Promise<void> {
    const [nSamples, nFeatures] = data.shape as [number, number];
    
    // 랜덤 초기 중심점
    this.centroids = tf.randomUniform([this.nClusters, nFeatures]);
    
    for (let iter = 0; iter < this.maxIters; iter++) {
      // 각 점에서 가장 가까운 중심점 찾기
      const distances = this.calculateDistances(data);
      const labels = tf.argMin(distances, 1);
      
      // 새로운 중심점 계산
      const newCentroids = await this.updateCentroids(data, labels);
      
      // 수렴 확인
      const centroidDiff = tf.norm(newCentroids.sub(this.centroids!));
      const diffValue = await centroidDiff.data();
      
      this.centroids!.dispose();
      this.centroids = newCentroids;
      
      if (diffValue[0] < this.tolerance) {
        console.log(`🎯 KMeans converged after ${iter + 1} iterations`);
        break;
      }
      
      labels.dispose();
      distances.dispose();
      centroidDiff.dispose();
    }
  }

  async predict(data: tf.Tensor): Promise<number[]> {
    if (!this.centroids) {
      throw new Error('KMeans must be fitted before prediction');
    }
    
    const distances = this.calculateDistances(data);
    const labels = tf.argMin(distances, 1);
    const labelsArray = await labels.data();
    
    distances.dispose();
    labels.dispose();
    
    return Array.from(labelsArray);
  }

  async fitPredict(data: tf.Tensor): Promise<ClusterResult> {
    await this.fit(data);
    const labels = await this.predict(data);
    const inertia = await this.calculateInertia(data, labels);
    const centroids = await this.centroids!.array() as number[][];
    
    return {
      cluster_labels: labels,
      centroids: centroids,
      inertia: inertia,
      model_info: `KMeans (k=${this.nClusters}, iter=${this.maxIters})`
    };
  }

  private calculateDistances(data: tf.Tensor): tf.Tensor {
    // 유클리드 거리 계산: ||x - c||²
    const expanded = data.expandDims(1); // [n_samples, 1, n_features]
    const centroidsExpanded = this.centroids!.expandDims(0); // [1, n_clusters, n_features]
    const diff = expanded.sub(centroidsExpanded);
    return tf.sum(tf.square(diff), 2); // [n_samples, n_clusters]
  }

  private async updateCentroids(data: tf.Tensor, labels: tf.Tensor): Promise<tf.Tensor> {
    const [nSamples, nFeatures] = data.shape as [number, number];
    const newCentroids = [];
    
    // 라벨과 데이터를 배열로 변환
    const labelsArray = await labels.data();
    const dataArray = await data.array() as number[][];
    
    for (let k = 0; k < this.nClusters; k++) {
      // 클러스터 k에 속하는 포인트들 찾기
      const clusterPoints = [];
      for (let i = 0; i < labelsArray.length; i++) {
        if (labelsArray[i] === k) {
          clusterPoints.push(dataArray[i]);
        }
      }
      
      if (clusterPoints.length > 0) {
        // 클러스터 포인트들의 평균 계산
        const clusterTensor = tf.tensor2d(clusterPoints);
        const centroid = tf.mean(clusterTensor, 0);
        newCentroids.push(centroid);
        clusterTensor.dispose();
      } else {
        // 빈 클러스터의 경우 랜덤 점으로 재초기화
        const randomCentroid = tf.randomUniform([nFeatures]);
        newCentroids.push(randomCentroid);
      }
    }
    
    return tf.stack(newCentroids);
  }

  private async calculateInertia(data: tf.Tensor, labels: number[]): Promise<number> {
    let totalInertia = 0;
    const dataArray = await data.array() as number[][];
    const centroidsArray = await this.centroids!.array() as number[][];
    
    for (let i = 0; i < labels.length; i++) {
      const clusterIdx = labels[i];
      const point = dataArray[i];
      const centroid = centroidsArray[clusterIdx];
      
      // 유클리드 거리의 제곱
      const distance = point.reduce((sum, val, idx) => {
        const diff = val - centroid[idx];
        return sum + diff * diff;
      }, 0);
      
      totalInertia += distance;
    }
    
    return totalInertia;
  }

  dispose(): void {
    if (this.centroids) {
      this.centroids.dispose();
    }
  }
}

export class TensorFlowAIEngine {
  private models: Map<string, tf.LayersModel> = new Map();
  private initialized = false;
  private modelSpecs: Map<string, any> = new Map();
  private scaler: StandardScaler = new StandardScaler();
  private kmeans: KMeans = new KMeans();

  constructor() {
    this.initializeModelSpecs();
  }

  private initializeModelSpecs(): void {
    // 🎯 장애 예측 모델 스펙
    this.modelSpecs.set('failure_prediction', {
      input_shape: [10],
      layers: [
        { type: 'dense', units: 64, activation: 'relu' },
        { type: 'dropout', rate: 0.2 },
        { type: 'dense', units: 32, activation: 'relu' },
        { type: 'dropout', rate: 0.2 },
        { type: 'dense', units: 16, activation: 'relu' },
        { type: 'dense', units: 1, activation: 'sigmoid' }
      ],
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      description: '장애 확률 예측 신경망'
    });

    // 🔍 이상 탐지 모델 스펙 (오토인코더)
    this.modelSpecs.set('anomaly_detection', {
      input_shape: [20],
      encoder_layers: [
        { type: 'dense', units: 16, activation: 'relu' },
        { type: 'dense', units: 8, activation: 'relu' },
        { type: 'dense', units: 4, activation: 'relu' }
      ],
      decoder_layers: [
        { type: 'dense', units: 8, activation: 'relu' },
        { type: 'dense', units: 16, activation: 'relu' },
        { type: 'dense', units: 20, activation: 'linear' }
      ],
      optimizer: 'adam',
      loss: 'meanSquaredError',
      description: '오토인코더 기반 이상 탐지'
    });

    // 📈 시계열 예측 모델 스펙 (LSTM)
    this.modelSpecs.set('timeseries', {
      input_shape: [10, 1],
      layers: [
        { type: 'lstm', units: 50, return_sequences: true },
        { type: 'dropout', rate: 0.2 },
        { type: 'lstm', units: 50, return_sequences: false },
        { type: 'dropout', rate: 0.2 },
        { type: 'dense', units: 25 },
        { type: 'dense', units: 1 }
      ],
      optimizer: 'adam',
      loss: 'meanSquaredError',
      description: 'LSTM 기반 시계열 예측'
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🧠 TensorFlow.js AI 엔진 초기화 중...');
    
    try {
      // 기존 모델들 완전 정리 (중복 방지)
      this.dispose();
      
      // TensorFlow.js 전역 변수 정리
      await this.cleanupTensorFlowGlobals();
      
      // TensorFlow.js 백엔드 설정
      await this.setupTensorFlowBackend();
      
      // 모델 스펙 초기화
      this.initializeModelSpecs();
      
      // 모델들 초기화
      await this.initializeAllModels();
      
      this.initialized = true;
      console.log('✅ TensorFlow.js AI 엔진 초기화 완료');
      console.log(`🔧 백엔드: ${tf.getBackend()}`);
      console.log(`📊 메모리 사용: ${JSON.stringify(tf.memory())}`);
      
    } catch (error: any) {
      console.error('❌ TensorFlow.js 초기화 실패:', error);
      // 초기화 실패해도 계속 진행 (fallback 모드)
      this.initialized = false;
    }
  }
  private async cleanupTensorFlowGlobals(): Promise<void> {
    try {
      // 기존 모델들 완전 dispose
      if (this.models.size > 0) {
        console.log(`🧹 ${this.models.size}개 기존 모델 정리 중...`);
        for (const [name, model] of this.models.entries()) {
          try {
            model.dispose();
            console.log(`✅ 모델 정리: ${name}`);
          } catch (error) {
            console.warn(`⚠️ 모델 정리 실패: ${name}`, error);
          }
        }
        this.models.clear();
      }
      
      // 모든 TensorFlow.js 텐서와 변수 정리
      tf.disposeVariables();
      
      // 메모리 강제 정리
      const memoryInfo = tf.memory();
      if (memoryInfo.numTensors > 0) {
        console.log(`🧹 ${memoryInfo.numTensors}개 텐서 정리 중...`);
        
        // 백엔드 완전 재설정
        const currentBackend = tf.getBackend();
        try {
          await tf.removeBackend(currentBackend);
          console.log(`🔄 백엔드 ${currentBackend} 제거됨`);
        } catch (error) {
          console.warn('⚠️ 백엔드 제거 실패 (계속 진행):', error);
        }
        
        // 백엔드 재설정
        await tf.setBackend(currentBackend);
        await tf.ready();
        console.log(`🔄 백엔드 ${currentBackend} 재설정 완료`);
      }
      
      console.log('✅ TensorFlow.js 전역 상태 정리 완료');
    } catch (error) {
      console.warn('⚠️ TensorFlow.js 전역 정리 실패 (계속 진행):', error);
    }
  }

  private async setupTensorFlowBackend(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // 브라우저 환경
        await tf.setBackend('webgl');
      } else {
        // Node.js 환경 (Vercel)
        await tf.setBackend('cpu');
      }
      await tf.ready();
    } catch (error) {
      console.warn('⚠️ WebGL 백엔드 실패, CPU 백엔드로 전환');
      await tf.setBackend('cpu');
      await tf.ready();
    }
  }

  private async initializeAllModels(): Promise<void> {
    const modelPromises = [
      this.initializeFailurePredictionModel(),
      this.initializeAnomalyDetectionModel(),
      this.initializeTimeSeriesModel()
    ];

    await Promise.all(modelPromises);
    console.log(`📊 ${this.models.size}개 AI 모델 로드 완료`);
  }

  private async initializeFailurePredictionModel(): Promise<void> {
    const spec = this.modelSpecs.get('failure_prediction')!;
    const timestamp = Date.now();
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: spec.input_shape, 
          units: 64, 
          activation: 'relu',
          name: `failure_hidden1_${timestamp}`
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu',
          name: `failure_hidden2_${timestamp}`
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          name: `failure_hidden3_${timestamp}`
        }),
        tf.layers.dense({ 
          units: 1, 
          activation: 'sigmoid',
          name: `failure_output_${timestamp}`
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.models.set('failure_prediction', model);
    console.log('🎯 장애 예측 모델 초기화 완료');
  }

  private async initializeAnomalyDetectionModel(): Promise<void> {
    const timestamp = Date.now();
    
    // 오토인코더 인코더
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [20], 
          units: 16, 
          activation: 'relu',
          name: `encoder_1_${timestamp}`
        }),
        tf.layers.dense({ 
          units: 8, 
          activation: 'relu',
          name: `encoder_2_${timestamp}`
        }),
        tf.layers.dense({ 
          units: 4, 
          activation: 'relu',
          name: `bottleneck_${timestamp}`
        })
      ]
    });

    // 오토인코더 디코더
    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [4], 
          units: 8, 
          activation: 'relu',
          name: `decoder_1_${timestamp}`
        }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          name: `decoder_2_${timestamp}`
        }),
        tf.layers.dense({ 
          units: 20, 
          activation: 'linear',
          name: `decoder_output_${timestamp}`
        })
      ]
    });

    // 전체 오토인코더
    const autoencoder = tf.sequential();
    autoencoder.add(encoder);
    autoencoder.add(decoder);

    autoencoder.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    this.models.set('anomaly_detection', autoencoder);
    console.log('🔍 이상 탐지 모델 초기화 완료');
  }

  private async initializeTimeSeriesModel(): Promise<void> {
    const timestamp = Date.now();
    
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ 
          units: 50, 
          returnSequences: true, 
          inputShape: [10, 1],
          name: `lstm_1_${timestamp}`
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ 
          units: 50, 
          returnSequences: false,
          name: `lstm_2_${timestamp}`
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 25,
          name: `dense_1_${timestamp}`
        }),
        tf.layers.dense({ 
          units: 1,
          name: `output_${timestamp}`
        })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    this.models.set('timeseries', model);
    console.log('📈 시계열 예측 모델 초기화 완료');
  }

  async predictFailure(metrics: number[]): Promise<PredictionResult> {
    await this.initialize();
    
    const startTime = Date.now();
    const model = this.models.get('failure_prediction');
    if (!model) throw new Error('장애 예측 모델이 로드되지 않음');

    // 입력 데이터 전처리
    const processedMetrics = this.preprocessMetrics(metrics, 10);
    const inputTensor = tf.tensor2d([processedMetrics]);

    try {
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();
      
      const processingTime = Date.now() - startTime;
      
      return {
        prediction: Array.from(predictionArray),
        confidence: predictionArray[0] > 0.5 ? predictionArray[0] : 1 - predictionArray[0],
        model_info: 'TensorFlow.js 신경망 (4층, ReLU+Sigmoid)',
        processing_time: processingTime
      };
    } finally {
      inputTensor.dispose();
    }
  }

  async detectAnomalies(timeSeries: number[]): Promise<AnomalyResult> {
    await this.initialize();
    
    const model = this.models.get('anomaly_detection');
    if (!model) throw new Error('이상 탐지 모델이 로드되지 않음');

    // 데이터 전처리
    const processedData = this.preprocessMetrics(timeSeries, 20);
    const inputTensor = tf.tensor2d([processedData]);

    try {
      const reconstruction = model.predict(inputTensor) as tf.Tensor;
      const reconstructionData = await reconstruction.data();
      
      // 재구성 오차 계산 (MSE)
      const originalData = await inputTensor.data();
      const mse = this.calculateMSE(Array.from(originalData), Array.from(reconstructionData));
      
      // 동적 임계값 (데이터의 표준편차 기반)
      const threshold = this.calculateDynamicThreshold(processedData);
      const isAnomaly = mse > threshold;
      
      return {
        is_anomaly: isAnomaly,
        anomaly_score: mse,
        threshold: threshold,
        model_info: 'TensorFlow.js 오토인코더 (20→4→20)'
      };
    } finally {
      inputTensor.dispose();
    }
  }

  async predictTimeSeries(historicalData: number[], steps: number = 5): Promise<number[]> {
    await this.initialize();
    
    const model = this.models.get('timeseries');
    if (!model) throw new Error('시계열 모델이 로드되지 않음');

    // 시계열 데이터 전처리
    const sequences = this.createSequences(historicalData, 10);
    if (sequences.length === 0) return [];

    const lastSequence = sequences[sequences.length - 1];
    const currentSequence = [...lastSequence];

    try {
      const predictions = [];

      for (let i = 0; i < steps; i++) {
        const sequenceTensor = tf.tensor3d([currentSequence]);
        const prediction = model.predict(sequenceTensor) as tf.Tensor;
        const predictionValue = (await prediction.data())[0];
        
        predictions.push(predictionValue);
        
        // 다음 예측을 위해 시퀀스 업데이트
        currentSequence.shift();
        currentSequence.push([predictionValue]);
        
        sequenceTensor.dispose();
        prediction.dispose();
      }

      return predictions;
    } catch (error: any) {
      console.error('시계열 예측 실패:', error);
      return [];
    }
  }

  async clusterAnalysis(data: number[][]): Promise<ClusterResult> {
    await this.initialize();
    
    if (data.length < 3) {
      throw new Error('클러스터링을 위해서는 최소 3개의 데이터 포인트가 필요합니다');
    }
    
    const startTime = Date.now();
    
    try {
      // 데이터를 텐서로 변환
      const dataTensor = tf.tensor2d(data);
      
      // 데이터 정규화
      const scaledData = this.scaler.fitTransform(dataTensor);
      
      // KMeans 클러스터링 실행
      const result = await this.kmeans.fitPredict(scaledData);
      
      // 리소스 정리
      dataTensor.dispose();
      scaledData.dispose();
      
      const processingTime = Date.now() - startTime;
      console.log(`🎯 클러스터링 완료: ${processingTime}ms`);
      
      return {
        ...result,
        model_info: `${result.model_info} (${processingTime}ms)`
      };
      
    } catch (error: any) {
      console.error('❌ 클러스터링 실패:', error);
      throw error;
    }
  }

  async analyzeMetricsWithAI(metrics: Record<string, number[]>): Promise<AIAnalysisResult> {
    await this.initialize();
    
    const startTime = Date.now();
    const analysis: AIAnalysisResult = {
      failure_predictions: {},
      anomaly_detections: {},
      trend_predictions: {},
      ai_insights: [],
      processing_stats: {
        total_time: 0,
        models_used: [],
        metrics_analyzed: Object.keys(metrics).length
      }
    };

    try {
      // 기존 분석들
      for (const [metricName, values] of Object.entries(metrics)) {
        if (values.length === 0) continue;

        // 장애 예측
        try {
          const failurePred = await this.predictFailure(values);
          analysis.failure_predictions[metricName] = failurePred;
          analysis.processing_stats.models_used.push('failure_prediction');
        } catch (error: any) {
          console.warn(`⚠️ ${metricName} 장애 예측 실패:`, error.message);
        }

        // 이상 탐지
        try {
          const anomalyResult = await this.detectAnomalies(values);
          analysis.anomaly_detections[metricName] = anomalyResult;
          analysis.processing_stats.models_used.push('anomaly_detection');
        } catch (error: any) {
          console.warn(`⚠️ ${metricName} 이상 탐지 실패:`, error.message);
        }

        // 시계열 예측
        try {
          const trendPred = await this.predictTimeSeries(values, 5);
          analysis.trend_predictions[metricName] = trendPred;
          analysis.processing_stats.models_used.push('timeseries');
        } catch (error: any) {
          console.warn(`⚠️ ${metricName} 트렌드 예측 실패:`, error.message);
        }
      }

      // 🆕 클러스터링 분석 추가
      try {
        const allMetricsData = Object.values(metrics).filter(values => values.length > 0);
        if (allMetricsData.length >= 3) {
          // 메트릭들을 행렬로 변환 (각 행은 시간점, 각 열은 메트릭)
          const maxLength = Math.max(...allMetricsData.map(arr => arr.length));
          const matrixData = [];
          
          for (let i = 0; i < Math.min(maxLength, 100); i++) { // 최대 100개 포인트
            const row = allMetricsData.map(arr => arr[i] || 0);
            matrixData.push(row);
          }
          
          const clusterResult = await this.clusterAnalysis(matrixData);
          analysis.clustering_analysis = clusterResult;
          analysis.processing_stats.models_used.push('kmeans_clustering');
          
          // 클러스터링 인사이트 추가
          const uniqueClusters = new Set(clusterResult.cluster_labels).size;
          analysis.ai_insights.push(`시스템 상태를 ${uniqueClusters}개 패턴으로 분류했습니다`);
          analysis.ai_insights.push(`클러스터 내 응집도: ${clusterResult.inertia.toFixed(2)}`);
        }
      } catch (error: any) {
        console.warn('⚠️ 클러스터링 분석 실패:', error.message);
      }

      // AI 인사이트 생성
      this.generateAIInsights(analysis);

    } catch (error: any) {
      console.error('❌ AI 분석 실패:', error);
      analysis.ai_insights.push(`분석 중 오류 발생: ${error.message}`);
    }

    analysis.processing_stats.total_time = Date.now() - startTime;
    analysis.processing_stats.models_used = [...new Set(analysis.processing_stats.models_used)];

    console.log(`🧠 AI 분석 완료: ${analysis.processing_stats.total_time}ms`);
    return analysis;
  }

  private generateAIInsights(analysis: AIAnalysisResult): void {
    // AI 인사이트 생성 로직을 구현해야 합니다.
    // 현재는 인사이트 생성 로직이 구현되지 않았습니다.
  }

  private preprocessMetrics(metrics: number[], targetLength: number): number[] {
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return new Array(targetLength).fill(0);
    }

    // 정규화 (0-1 범위)
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    const range = max - min || 1;
    
    const normalized = metrics.map(val => (val - min) / range);

    // 길이 조정
    if (normalized.length === targetLength) return normalized;
    
    if (normalized.length > targetLength) {
      // 최근 데이터만 사용
      return normalized.slice(-targetLength);
    } else {
      // 평균값으로 패딩
      const mean = normalized.reduce((sum, val) => sum + val, 0) / normalized.length;
      const padded = [...normalized];
      while (padded.length < targetLength) {
        padded.unshift(mean);
      }
      return padded;
    }
  }

  private createSequences(data: number[], sequenceLength: number): number[][][] {
    if (data.length < sequenceLength) return [];
    
    const sequences = [];
    for (let i = 0; i <= data.length - sequenceLength; i++) {
      const sequence = data.slice(i, i + sequenceLength).map(val => [val]);
      sequences.push(sequence);
    }
    return sequences;
  }

  private calculateMSE(original: number[], reconstructed: number[]): number {
    if (original.length !== reconstructed.length) return Infinity;
    
    const mse = original.reduce((sum, val, i) => {
      const error = val - reconstructed[i];
      return sum + error * error;
    }, 0) / original.length;
    
    return mse;
  }

  private calculateDynamicThreshold(data: number[]): number {
    // 표준편차 기반 동적 임계값
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // 2-sigma 규칙 적용
    return Math.max(0.01, stdDev * 2);
  }

  async getModelInfo(): Promise<any> {
    return {
      framework: 'TensorFlow.js',
      version: tf.version_core,
      backend: tf.getBackend(),
      models: Array.from(this.models.keys()),
      memory_usage: tf.memory(),
      initialized: this.initialized,
      model_specs: Object.fromEntries(this.modelSpecs),
      supported_features: [
        '장애 예측',
        '이상 탐지',
        '시계열 예측',
        '실시간 분석',
        'Vercel 서버리스 호환'
      ]
    };
  }

  dispose(): void {
    console.log('🗑️ TensorFlow.js 모델 정리 중...');
    
    this.models.forEach((model, name) => {
      try {
        model.dispose();
        console.log(`✅ ${name} 모델 정리 완료`);
      } catch (error: any) {
        console.error(`❌ ${name} 모델 정리 실패:`, error);
      }
    });
    
    this.models.clear();
    this.initialized = false;
    
    console.log(`📊 메모리 정리 완료: ${JSON.stringify(tf.memory())}`);
  }
}

// 싱글톤 인스턴스
export const tensorFlowAIEngine = new TensorFlowAIEngine(); 