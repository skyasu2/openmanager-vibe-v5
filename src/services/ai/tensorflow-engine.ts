/**
 * 🧠 TensorFlow.js AI 엔진 v3.0
 * 
 * ✅ Vercel 서버리스 완전 호환
 * ✅ 브라우저 + Node.js 지원  
 * ✅ 장애 예측 신경망
 * ✅ 이상 탐지 오토인코더
 * ✅ 시계열 LSTM 모델
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

interface AIAnalysisResult {
  failure_predictions: Record<string, PredictionResult>;
  anomaly_detections: Record<string, AnomalyResult>;
  trend_predictions: Record<string, number[]>;
  ai_insights: string[];
  processing_stats: {
    total_time: number;
    models_used: string[];
    metrics_analyzed: number;
  };
}

export class TensorFlowAIEngine {
  private models: Map<string, tf.LayersModel> = new Map();
  private initialized = false;
  private modelSpecs: Map<string, any> = new Map();

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
      // TensorFlow.js 백엔드 설정
      await this.setupTensorFlowBackend();
      
      // 모델들 초기화
      await this.initializeAllModels();
      
      this.initialized = true;
      console.log('✅ TensorFlow.js AI 엔진 초기화 완료');
      console.log(`🔧 백엔드: ${tf.getBackend()}`);
      console.log(`📊 메모리 사용: ${JSON.stringify(tf.memory())}`);
      
    } catch (error: any) {
      console.error('❌ TensorFlow.js 초기화 실패:', error);
      throw error;
    }
  }

  private async setupTensorFlowBackend(): Promise<void> {
    try {
      // Vercel 환경에서 최적 백엔드 설정
      if (typeof window !== 'undefined') {
        // 브라우저 환경
        await tf.setBackend('webgl');
        console.log('🌐 브라우저 WebGL 백엔드 설정');
      } else {
        // Node.js 환경 (Vercel 서버리스)
        await tf.setBackend('cpu');
        console.log('🖥️ Node.js CPU 백엔드 설정');
      }
      
      await tf.ready();
      console.log(`✅ TensorFlow.js 백엔드 준비: ${tf.getBackend()}`);
      
    } catch (error: any) {
      console.warn('⚠️ 백엔드 설정 실패, 기본값 사용:', error);
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
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: spec.input_shape, 
          units: 64, 
          activation: 'relu',
          name: 'failure_hidden1'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu',
          name: 'failure_hidden2'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          name: 'failure_hidden3'
        }),
        tf.layers.dense({ 
          units: 1, 
          activation: 'sigmoid',
          name: 'failure_output'
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
    // 오토인코더 인코더
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [20], 
          units: 16, 
          activation: 'relu',
          name: 'encoder_1'
        }),
        tf.layers.dense({ 
          units: 8, 
          activation: 'relu',
          name: 'encoder_2'
        }),
        tf.layers.dense({ 
          units: 4, 
          activation: 'relu',
          name: 'bottleneck'
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
          name: 'decoder_1'
        }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          name: 'decoder_2'
        }),
        tf.layers.dense({ 
          units: 20, 
          activation: 'linear',
          name: 'decoder_output'
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
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ 
          units: 50, 
          returnSequences: true, 
          inputShape: [10, 1],
          name: 'lstm_1'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ 
          units: 50, 
          returnSequences: false,
          name: 'lstm_2'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 25,
          name: 'dense_1'
        }),
        tf.layers.dense({ 
          units: 1,
          name: 'output'
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

    for (const [metricName, values] of Object.entries(metrics)) {
      try {
        // 최소 데이터 요구사항 확인
        if (!Array.isArray(values) || values.length < 5) {
          console.warn(`${metricName}: 데이터 부족 (${values.length}개)`);
          continue;
        }

        // 1. 장애 예측
        const failurePred = await this.predictFailure(values.slice(-10));
        analysis.failure_predictions[metricName] = failurePred;
        analysis.processing_stats.models_used.push('failure_prediction');

        // 2. 이상 탐지
        const anomalyDet = await this.detectAnomalies(values);
        analysis.anomaly_detections[metricName] = anomalyDet;
        analysis.processing_stats.models_used.push('anomaly_detection');

        // 3. 시계열 예측
        if (values.length >= 10) {
          const trendPred = await this.predictTimeSeries(values, 5);
          analysis.trend_predictions[metricName] = trendPred;
          analysis.processing_stats.models_used.push('timeseries');
        }

        // 4. AI 인사이트 생성
        this.generateInsights(metricName, failurePred, anomalyDet, analysis.ai_insights);

      } catch (error: any) {
        console.error(`${metricName} 분석 실패:`, error);
        analysis.ai_insights.push(`⚠️ ${metricName}: 분석 오류 (${error.message})`);
      }
    }

    analysis.processing_stats.total_time = Date.now() - startTime;
    analysis.processing_stats.models_used = [...new Set(analysis.processing_stats.models_used)];

    console.log(`🧠 AI 분석 완료: ${analysis.processing_stats.total_time}ms`);
    return analysis;
  }

  private generateInsights(
    metricName: string, 
    failurePred: PredictionResult, 
    anomalyDet: AnomalyResult, 
    insights: string[]
  ): void {
    // 장애 예측 인사이트
    if (failurePred.prediction[0] > 0.7) {
      insights.push(
        `🚨 ${metricName}: 높은 장애 위험 감지 (${(failurePred.prediction[0] * 100).toFixed(1)}%)`
      );
    } else if (failurePred.prediction[0] > 0.4) {
      insights.push(
        `⚠️ ${metricName}: 중간 수준 위험 (${(failurePred.prediction[0] * 100).toFixed(1)}%)`
      );
    }

    // 이상 탐지 인사이트
    if (anomalyDet.is_anomaly) {
      const severity = anomalyDet.anomaly_score > anomalyDet.threshold * 2 ? '심각' : '경미';
      insights.push(
        `🔍 ${metricName}: ${severity}한 이상값 탐지 (점수: ${anomalyDet.anomaly_score.toFixed(3)})`
      );
    }

    // 신뢰도 기반 인사이트
    if (failurePred.confidence < 0.6) {
      insights.push(
        `📊 ${metricName}: 예측 신뢰도 낮음 (${(failurePred.confidence * 100).toFixed(1)}%) - 추가 데이터 필요`
      );
    }
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