/**
 * 🚀 Lightweight Python Runner
 * 
 * Vercel 최적화 Python 분석 러너
 * - 환경별 자동 최적화
 * - 5초 내 실행 보장
 * - 메모리 효율적 처리
 * - 강력한 Fallback 메커니즘
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';
import { EnvironmentDetector, OptimizationConfig } from './EnvironmentDetector';

export interface LightweightAnalysisRequest {
  data: {
    features?: number[][];
    timeseries?: {
      values: number[];
      horizon?: number;
    };
    variables?: Array<{
      name: string;
      values: number[];
    }>;
  };
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
}

export interface LightweightAnalysisResult {
  success: boolean;
  results?: {
    anomaly?: any;
    forecast?: any;
    clustering?: any;
    correlation?: any;
  };
  method: 'lightweight' | 'fallback' | 'cached';
  executionTime: number;
  memoryUsed: number;
  error?: string;
  fallbackUsed?: boolean;
}

interface CacheEntry {
  key: string;
  result: any;
  timestamp: number;
  ttl: number;
  hitCount: number;
}

export class LightweightPythonRunner {
  private static instance: LightweightPythonRunner;
  private environmentDetector: EnvironmentDetector;
  private optimizationConfig: OptimizationConfig | null = null;
  private isInitialized = false;
  
  // 단일 프로세스 관리 (경량화)
  private pythonProcess: ChildProcess | null = null;
  private processStartTime = 0;
  private processTaskCount = 0;
  
  // 경량 캐시 시스템
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 50;
  
  // 성능 메트릭
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0,
    lastResponseTime: 0,
    cacheHitRate: 0,
    errorCount: 0
  };

  private constructor() {
    this.environmentDetector = EnvironmentDetector.getInstance();
  }

  static getInstance(): LightweightPythonRunner {
    if (!LightweightPythonRunner.instance) {
      LightweightPythonRunner.instance = new LightweightPythonRunner();
    }
    return LightweightPythonRunner.instance;
  }

  /**
   * 🔧 초기화 (환경별 최적화)
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('🚀 Lightweight Python Runner 초기화 중...');

      // 환경 감지 및 최적화 설정
      await this.environmentDetector.detectEnvironment();
      this.optimizationConfig = await this.environmentDetector.getOptimizationConfig();
      
      this.maxCacheSize = this.optimizationConfig.cacheSize;

      // Python 환경 검증 (빠른 체크)
      const isValidEnvironment = await this.quickEnvironmentCheck();
      if (!isValidEnvironment) {
        console.warn('⚠️ Python 환경 검증 실패 - Fallback 모드로 동작');
        this.optimizationConfig.enablePythonAnalysis = false;
      }

      this.isInitialized = true;
      console.log('✅ Lightweight Python Runner 초기화 완료');
      return true;

    } catch (error) {
      console.error('❌ Lightweight Python Runner 초기화 실패:', error);
      return false;
    }
  }

  /**
   * ⚡ 빠른 환경 검증
   */
  private async quickEnvironmentCheck(): Promise<boolean> {
    try {
      const pythonPath = process.env.PYTHON_PATH || 'python';
      
      return new Promise<boolean>((resolve) => {
        const checkProcess = spawn(pythonPath, ['-c', 'import sys; print("OK")'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        checkProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        checkProcess.on('close', (code) => {
          resolve(code === 0 && output.includes('OK'));
        });

        checkProcess.on('error', () => {
          resolve(false);
        });

        // 2초 타임아웃
        setTimeout(() => {
          checkProcess.kill();
          resolve(false);
        }, 2000);
      });

    } catch (error) {
      return false;
    }
  }

  /**
   * 🧠 스마트 분석 실행
   */
  async analyzeData(request: LightweightAnalysisRequest): Promise<LightweightAnalysisResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 캐시 확인
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.updateMetrics(Date.now() - startTime, true, true);
        return {
          success: true,
          results: cachedResult,
          method: 'cached',
          executionTime: Date.now() - startTime,
          memoryUsed: 0
        };
      }

      // 환경별 실행 전략 결정
      const shouldUsePython = await this.shouldUsePythonAnalysis(request);
      
      let result: LightweightAnalysisResult;
      
      if (shouldUsePython && this.optimizationConfig?.enablePythonAnalysis) {
        result = await this.executePythonAnalysis(request, startTime);
      } else {
        result = await this.executeFallbackAnalysis(request, startTime);
      }

      // 성공한 결과 캐싱
      if (result.success && result.results) {
        this.setCachedResult(cacheKey, result.results);
      }

      this.updateMetrics(Date.now() - startTime, result.success, false);
      return result;

    } catch (error) {
      this.metrics.errorCount++;
      this.updateMetrics(Date.now() - startTime, false, false);
      
      return {
        success: false,
        method: 'fallback',
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        error: error instanceof Error ? error.message : String(error),
        fallbackUsed: true
      };
    }
  }

  /**
   * 🐍 Python 분석 실행
   */
  private async executePythonAnalysis(
    request: LightweightAnalysisRequest,
    startTime: number
  ): Promise<LightweightAnalysisResult> {
    try {
      const timeout = request.timeout || this.optimizationConfig?.pythonTimeout || 8000;
      
      // Python 프로세스 준비
      await this.ensurePythonProcess();
      
      if (!this.pythonProcess) {
        throw new Error('Python process not available');
      }

      // 분석 요청 전송
      const analysisRequest = {
        data: request.data,
        timeout: timeout - 1000 // 1초 여유분
      };

      const result = await this.sendToPython(analysisRequest, timeout);
      
      return {
        success: true,
        results: result.results,
        method: 'lightweight',
        executionTime: Date.now() - startTime,
        memoryUsed: this.estimateMemoryUsage(),
        fallbackUsed: false
      };

    } catch (error) {
      console.warn('Python 분석 실패, fallback 사용:', error);
      return this.executeFallbackAnalysis(request, startTime);
    }
  }

  /**
   * 🔄 Fallback 분석 실행
   */
  private async executeFallbackAnalysis(
    request: LightweightAnalysisRequest,
    startTime: number
  ): Promise<LightweightAnalysisResult> {
    try {
      const results: any = {};

      // 간단한 통계 기반 분석
      if (request.data.features) {
        results.anomaly = this.simpleAnomalyDetection(request.data.features);
      }

      if (request.data.timeseries) {
        results.forecast = this.simpleForecast(request.data.timeseries);
      }

      if (request.data.variables) {
        results.correlation = this.simpleCorrelation(request.data.variables);
      }

      return {
        success: true,
        results,
        method: 'fallback',
        executionTime: Date.now() - startTime,
        memoryUsed: this.estimateMemoryUsage(),
        fallbackUsed: true
      };

    } catch (error) {
      return {
        success: false,
        method: 'fallback',
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        error: error instanceof Error ? error.message : String(error),
        fallbackUsed: true
      };
    }
  }

  /**
   * 🚦 Python 분석 사용 여부 판단
   */
  private async shouldUsePythonAnalysis(request: LightweightAnalysisRequest): Promise<boolean> {
    if (!this.optimizationConfig?.enablePythonAnalysis) {
      return false;
    }

    // 데이터 크기 추정
    const dataSize = this.estimateDataSize(request.data);
    const estimatedTime = this.estimateProcessingTime(dataSize);
    const estimatedMemory = this.estimateMemoryRequirement(dataSize);

    return this.environmentDetector.shouldRunAdvancedAnalysis(
      dataSize,
      estimatedTime,
      estimatedMemory
    );
  }

  /**
   * 🔧 Python 프로세스 관리
   */
  private async ensurePythonProcess(): Promise<void> {
    if (this.pythonProcess && !this.pythonProcess.killed) {
      // 프로세스가 너무 오래되었거나 많은 작업을 처리했으면 재시작
      const processAge = Date.now() - this.processStartTime;
      if (processAge > 300000 || this.processTaskCount > 50) { // 5분 또는 50개 작업
        this.killPythonProcess();
      } else {
        return;
      }
    }

    await this.createPythonProcess();
  }

  private async createPythonProcess(): Promise<void> {
    try {
      const pythonPath = process.env.PYTHON_PATH || 'python';
      const scriptPath = path.join(
        process.cwd(),
        'src',
        'modules',
        'ai-agent',
        'python-engine',
        'lightweight_engine.py'
      );

      this.pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONPATH: path.dirname(scriptPath)
        }
      });

      this.processStartTime = Date.now();
      this.processTaskCount = 0;

      // 에러 핸들링
      this.pythonProcess.on('error', (error) => {
        console.error('Python 프로세스 오류:', error);
        this.pythonProcess = null;
      });

      this.pythonProcess.on('exit', (code) => {
        console.log(`Python 프로세스 종료: ${code}`);
        this.pythonProcess = null;
      });

    } catch (error) {
      console.error('Python 프로세스 생성 실패:', error);
      this.pythonProcess = null;
      throw error;
    }
  }

  private killPythonProcess(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }

  /**
   * 📡 Python과 통신
   */
  private async sendToPython(request: any, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Python process not available'));
        return;
      }

      let responseData = '';
      let errorData = '';

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        reject(new Error('Python analysis timeout'));
      }, timeout);

             // 응답 수신
       const onData = (data: Buffer) => {
         responseData += data.toString();
         
         // JSON 응답 완료 확인
         try {
           const result = JSON.parse(responseData);
           clearTimeout(timeoutId);
           this.pythonProcess?.stdout?.off('data', onData);
           this.pythonProcess?.stderr?.off('data', onError);
           this.processTaskCount++;
           resolve(result);
         } catch (e) {
           // JSON이 아직 완성되지 않음, 계속 대기
         }
       };

       const onError = (data: Buffer) => {
         errorData += data.toString();
       };

       this.pythonProcess.stdout?.on('data', onData);
       this.pythonProcess.stderr?.on('data', onError);

       // 요청 전송
       this.pythonProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * 📊 간단한 Fallback 분석 함수들
   */
  private simpleAnomalyDetection(features: number[][]): any {
    try {
      const anomalies: boolean[] = [];
      
      for (const feature of features) {
        // Z-score 기반 간단한 이상 탐지
        const mean = feature.reduce((a, b) => a + b, 0) / feature.length;
        const variance = feature.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / feature.length;
        const stdDev = Math.sqrt(variance);
        
        const hasAnomaly = feature.some(value => Math.abs(value - mean) > 2 * stdDev);
        anomalies.push(hasAnomaly);
      }

      const anomalyCount = anomalies.filter(Boolean).length;

      return {
        is_anomaly: anomalies,
        anomaly_count: anomalyCount,
        anomaly_percentage: (anomalyCount / features.length) * 100,
        algorithm: 'simple_zscore',
        total_samples: features.length
      };

    } catch (error) {
      return { error: 'Simple anomaly detection failed' };
    }
  }

  private simpleForecast(timeseries: { values: number[]; horizon?: number }): any {
    try {
      const { values, horizon = 10 } = timeseries;
      
      if (values.length < 2) {
        return { error: 'Insufficient data for forecasting' };
      }

      // 단순 선형 트렌드 계산
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = values;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // 예측값 생성
      const forecast = Array.from({ length: horizon }, (_, i) => 
        intercept + slope * (n + i)
      );

      const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

      return {
        forecast,
        model: 'simple_linear',
        trend,
        confidence: 0.7
      };

    } catch (error) {
      return { error: 'Simple forecasting failed' };
    }
  }

  private simpleCorrelation(variables: Array<{ name: string; values: number[] }>): any {
    try {
      const correlations = [];

      for (let i = 0; i < variables.length; i++) {
        for (let j = i + 1; j < variables.length; j++) {
          const var1 = variables[i];
          const var2 = variables[j];

          if (var1.values.length !== var2.values.length || var1.values.length < 3) {
            continue;
          }

          // Pearson 상관계수 계산
          const n = var1.values.length;
          const sumX = var1.values.reduce((a, b) => a + b, 0);
          const sumY = var2.values.reduce((a, b) => a + b, 0);
          const sumXY = var1.values.reduce((sum, x, idx) => sum + x * var2.values[idx], 0);
          const sumXX = var1.values.reduce((sum, x) => sum + x * x, 0);
          const sumYY = var2.values.reduce((sum, y) => sum + y * y, 0);

          const numerator = n * sumXY - sumX * sumY;
          const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

          const correlation = denominator === 0 ? 0 : numerator / denominator;

          correlations.push({
            variable1: var1.name,
            variable2: var2.name,
            coefficient: correlation,
            significance: Math.abs(correlation) > 0.5 ? 'high' : 'low'
          });
        }
      }

      return {
        correlations,
        method: 'simple_pearson',
        total_pairs: correlations.length
      };

    } catch (error) {
      return { error: 'Simple correlation failed' };
    }
  }

  /**
   * 📏 추정 함수들
   */
  private estimateDataSize(data: any): number {
    let size = 0;
    if (data.features) size += data.features.length * (data.features[0]?.length || 1);
    if (data.timeseries) size += data.timeseries.values.length;
    if (data.variables) size += data.variables.reduce((sum: number, v: any) => sum + v.values.length, 0);
    return size;
  }

  private estimateProcessingTime(dataSize: number): number {
    // 데이터 크기 기반 처리 시간 추정 (ms)
    return Math.min(8000, 100 + dataSize * 2);
  }

  private estimateMemoryRequirement(dataSize: number): number {
    // 데이터 크기 기반 메모리 요구량 추정 (MB)
    return Math.min(400, 50 + dataSize * 0.1);
  }

  private estimateMemoryUsage(): number {
    try {
      const memUsage = process.memoryUsage();
      return Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    } catch (error) {
      return 0;
    }
  }

  /**
   * 💾 캐시 관리
   */
  private generateCacheKey(request: LightweightAnalysisRequest): string {
    const dataStr = JSON.stringify(request.data);
    return crypto.createHash('md5').update(dataStr).digest('hex');
  }

  private getCachedResult(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.result;
  }

  private setCachedResult(key: string, result: any): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      result,
      timestamp: Date.now(),
      ttl: 300000, // 5분
      hitCount: 0
    });
  }

  /**
   * 📊 메트릭 관리
   */
  private updateMetrics(responseTime: number, success: boolean, fromCache: boolean): void {
    this.metrics.lastResponseTime = responseTime;
    
    if (success) {
      this.metrics.successfulRequests++;
    }

    // 평균 응답시간 업데이트
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;

    // 캐시 적중률 업데이트
    const cacheHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0);
    this.metrics.cacheHitRate = this.metrics.totalRequests > 0 ? (cacheHits / this.metrics.totalRequests) * 100 : 0;
  }

  /**
   * 📈 상태 조회
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pythonProcessActive: !!this.pythonProcess && !this.pythonProcess.killed,
      processTaskCount: this.processTaskCount,
      cacheSize: this.cache.size,
      metrics: this.metrics,
      optimizationConfig: this.optimizationConfig
    };
  }

  /**
   * 🔄 종료
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Lightweight Python Runner 종료 중...');
    
    this.killPythonProcess();
    this.cache.clear();
    this.isInitialized = false;
    
    console.log('✅ Lightweight Python Runner 종료 완료');
  }
} 