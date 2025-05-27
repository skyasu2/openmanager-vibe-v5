/**
 * Python 분석 엔진 브리지 어댑터
 * 
 * 🐍 완전 오프라인 환경에서 Python ML 모델 실행
 * - Kats (시계열 예측)
 * - PyOD (이상 탐지)
 * - SciPy (상관분석)
 * - scikit-learn (클러스터링, 분류)
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface PythonAnalysisConfig {
  pythonPath?: string;
  scriptsPath?: string;
  timeout?: number;
  maxMemoryMB?: number;
  cacheDir?: string;
}

export interface AnalysisInput<T = any> {
  method: 'forecast' | 'anomaly' | 'correlation' | 'clustering' | 'classification';
  data: T;
  params?: Record<string, any>;
  cacheKey?: string;
}

export interface AnalysisOutput<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    memoryUsed: number;
    cacheHit: boolean;
    modelVersion: string;
  };
}

export class PythonAnalysisRunner {
  private static instance: PythonAnalysisRunner;
  private config: Required<PythonAnalysisConfig>;
  private isInitialized = false;
  private modelCache = new Map<string, any>();

  private constructor(config: PythonAnalysisConfig = {}) {
    this.config = {
      pythonPath: config.pythonPath || 'python',
      scriptsPath: config.scriptsPath || path.join(process.cwd(), 'python-analysis'),
      timeout: config.timeout || 20000, // 20초
      maxMemoryMB: config.maxMemoryMB || 500,
      cacheDir: config.cacheDir || path.join(process.cwd(), '.cache', 'ai-engine')
    };
  }

  static getInstance(config?: PythonAnalysisConfig): PythonAnalysisRunner {
    if (!PythonAnalysisRunner.instance) {
      PythonAnalysisRunner.instance = new PythonAnalysisRunner(config);
    }
    return PythonAnalysisRunner.instance;
  }

  /**
   * 🔧 Python 환경 초기화 및 검증
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('🐍 Initializing Python Analysis Engine...');

      // 캐시 디렉터리 생성
      await this.ensureCacheDirectory();

      // Python 환경 검증
      const pythonCheck = await this.checkPythonEnvironment();
      if (!pythonCheck.success) {
        console.error('❌ Python environment check failed:', pythonCheck.error);
        return false;
      }

      // 필수 라이브러리 검증
      const libCheck = await this.checkRequiredLibraries();
      if (!libCheck.success) {
        console.error('❌ Required libraries check failed:', libCheck.error);
        return false;
      }

      // Python 스크립트 디렉터리 생성
      await this.ensureScriptsDirectory();

      this.isInitialized = true;
      console.log('✅ Python Analysis Engine initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Python Analysis Engine:', error);
      return false;
    }
  }

  /**
   * 📊 범용 분석 실행
   */
  async runAnalysis<TInput, TOutput>(
    input: AnalysisInput<TInput>
  ): Promise<AnalysisOutput<TOutput>> {
    const startTime = Date.now();

    try {
      // 초기화 확인
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Python environment');
        }
      }

      // 캐시 확인
      if (input.cacheKey) {
        const cached = this.getCachedResult<TOutput>(input.cacheKey);
        if (cached) {
          return {
            success: true,
            result: cached,
            metadata: {
              executionTime: Date.now() - startTime,
              memoryUsed: 0,
              cacheHit: true,
              modelVersion: 'cached'
            }
          };
        }
      }

      // Python 스크립트 실행
      const result = await this.executePythonScript<TInput, TOutput>(input);

      // 결과 캐싱
      if (input.cacheKey && result.success) {
        this.setCachedResult(input.cacheKey, result.result);
      }

      return {
        ...result,
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: 0, // TODO: 실제 메모리 사용량 측정
          cacheHit: false,
          modelVersion: '1.0.0'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          cacheHit: false,
          modelVersion: 'error'
        }
      };
    }
  }

  /**
   * 🔮 시계열 예측 (Kats ARIMA)
   */
  async forecastTimeSeries(data: {
    timestamps: string[];
    values: number[];
    horizon?: number;
    model?: 'arima' | 'prophet' | 'linear';
  }): Promise<AnalysisOutput<{
    forecast: number[];
    confidence_lower: number[];
    confidence_upper: number[];
    model_params: any;
  }>> {
    return this.runAnalysis({
      method: 'forecast',
      data,
      params: {
        horizon: data.horizon || 30,
        model: data.model || 'arima'
      },
      cacheKey: `forecast_${data.model || 'arima'}_${data.values.length}_${data.horizon || 30}`
    });
  }

  /**
   * 🚨 이상 탐지 (PyOD Isolation Forest)
   */
  async detectAnomalies(data: {
    features: number[][];
    contamination?: number;
    algorithm?: 'isolation_forest' | 'autoencoder' | 'lof';
  }): Promise<AnalysisOutput<{
    anomaly_scores: number[];
    is_anomaly: boolean[];
    threshold: number;
    contamination_rate: number;
  }>> {
    return this.runAnalysis({
      method: 'anomaly',
      data,
      params: {
        contamination: data.contamination || 0.05,
        algorithm: data.algorithm || 'isolation_forest'
      },
      cacheKey: `anomaly_${data.algorithm || 'isolation_forest'}_${data.features.length}`
    });
  }

  /**
   * 🔗 상관관계 분석 (SciPy)
   */
  async analyzeCorrelations(data: {
    variables: { name: string; values: number[] }[];
    method?: 'pearson' | 'spearman' | 'kendall';
  }): Promise<AnalysisOutput<{
    correlations: {
      var1: string;
      var2: string;
      coefficient: number;
      p_value: number;
      significance: 'high' | 'medium' | 'low' | 'none';
    }[];
    correlation_matrix: number[][];
  }>> {
    return this.runAnalysis({
      method: 'correlation',
      data,
      params: {
        method: data.method || 'pearson'
      },
      cacheKey: `correlation_${data.method || 'pearson'}_${data.variables.length}`
    });
  }

  /**
   * 🎯 클러스터링 (scikit-learn K-means)
   */
  async performClustering(data: {
    features: number[][];
    n_clusters?: number;
    algorithm?: 'kmeans' | 'dbscan' | 'hierarchical';
  }): Promise<AnalysisOutput<{
    cluster_labels: number[];
    cluster_centers: number[][];
    inertia: number;
    silhouette_score: number;
  }>> {
    return this.runAnalysis({
      method: 'clustering',
      data,
      params: {
        n_clusters: data.n_clusters || 3,
        algorithm: data.algorithm || 'kmeans'
      },
      cacheKey: `clustering_${data.algorithm || 'kmeans'}_${data.n_clusters || 3}_${data.features.length}`
    });
  }

  /**
   * 🎲 분류 예측 (Random Forest)
   */
  async classifyData(data: {
    features: number[][];
    labels?: number[];
    test_features?: number[][];
    model?: 'random_forest' | 'gradient_boost' | 'svm';
  }): Promise<AnalysisOutput<{
    predictions: number[];
    probabilities: number[][];
    accuracy?: number;
    feature_importance?: number[];
    confusion_matrix?: number[][];
  }>> {
    return this.runAnalysis({
      method: 'classification',
      data,
      params: {
        model: data.model || 'random_forest'
      },
      cacheKey: `classification_${data.model || 'random_forest'}_${data.features.length}`
    });
  }

  /**
   * 🐍 Python 스크립트 실행
   */
  private async executePythonScript<TInput, TOutput>(
    input: AnalysisInput<TInput>
  ): Promise<AnalysisOutput<TOutput>> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.config.scriptsPath, `${input.method}.py`);
      
      // Python 프로세스 생성
      const pythonProcess = spawn(this.config.pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.config.timeout
      });

      let stdout = '';
      let stderr = '';

      // 데이터 전송
      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();

      // 출력 수집
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // 프로세스 완료
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve({
              success: true,
              result: result as TOutput
            });
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      // 타임아웃 처리
      pythonProcess.on('error', (error) => {
        reject(new Error(`Python process error: ${error.message}`));
      });
    });
  }

  /**
   * 🔍 Python 환경 검증
   */
  private async checkPythonEnvironment(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.config.pythonPath, ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000
      });

      let output = '';
      pythonProcess.stdout.on('data', (data) => output += data.toString());
      pythonProcess.stderr.on('data', (data) => output += data.toString());

      pythonProcess.on('close', (code) => {
        if (code === 0 && output.includes('Python')) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `Python not found or invalid version: ${output}` });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({ success: false, error: `Python execution failed: ${error.message}` });
      });
    });
  }

  /**
   * 📦 필수 라이브러리 검증
   */
  private async checkRequiredLibraries(): Promise<{ success: boolean; error?: string }> {
    const requiredLibs = ['kats', 'pyod', 'scipy', 'sklearn', 'pandas', 'numpy'];
    
    return new Promise((resolve) => {
      const checkScript = `
import sys
required = ${JSON.stringify(requiredLibs)}
missing = []
for lib in required:
    try:
        __import__(lib)
    except ImportError:
        missing.append(lib)
if missing:
    print(f"Missing libraries: {missing}")
    sys.exit(1)
else:
    print("All libraries available")
`;

      const pythonProcess = spawn(this.config.pythonPath, ['-c', checkScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });

      let output = '';
      pythonProcess.stdout.on('data', (data) => output += data.toString());
      pythonProcess.stderr.on('data', (data) => output += data.toString());

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: output });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({ success: false, error: `Library check failed: ${error.message}` });
      });
    });
  }

  /**
   * 📁 캐시 디렉터리 생성
   */
  private async ensureCacheDirectory(): Promise<void> {
    if (!fs.existsSync(this.config.cacheDir)) {
      fs.mkdirSync(this.config.cacheDir, { recursive: true });
    }
  }

  /**
   * 📁 Python 스크립트 디렉터리 생성
   */
  private async ensureScriptsDirectory(): Promise<void> {
    if (!fs.existsSync(this.config.scriptsPath)) {
      fs.mkdirSync(this.config.scriptsPath, { recursive: true });
    }
  }

  /**
   * 💾 캐시 결과 조회
   */
  private getCachedResult<T>(key: string): T | null {
    return this.modelCache.get(key) || null;
  }

  /**
   * 💾 캐시 결과 저장
   */
  private setCachedResult<T>(key: string, result: T): void {
    this.modelCache.set(key, result);
    
    // 메모리 사용량 제한 (최대 100개 캐시)
    if (this.modelCache.size > 100) {
      const firstKey = this.modelCache.keys().next().value;
      if (firstKey) {
        this.modelCache.delete(firstKey);
      }
    }
  }

  /**
   * 📊 시스템 상태 조회
   */
  getSystemStatus(): {
    isInitialized: boolean;
    cacheSize: number;
    config: PythonAnalysisConfig;
  } {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this.modelCache.size,
      config: this.config
    };
  }
} 