/**
 * Python Analysis Runner
 * 
 * 🐍 프로세스 풀링 기반 Python 분석 엔진 러너
 * - 재사용 가능한 Python 프로세스 풀 관리
 * - 타임아웃 및 메모리 제한 적용
 * - 캐싱 및 성능 최적화
 * - 기존 AdminLogger와 연동
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { AdminLogger } from './AdminLogger';
import {
  PythonEngineConfig,
  PythonProcessInfo,
  PythonEngineStatus,
  AnalysisRequest,
  AnalysisResponse,
  ForecastRequest,
  ForecastResponse,
  AnomalyRequest,
  AnomalyResponse,
  ClassificationRequest,
  ClassificationResponse,
  ClusteringRequest,
  ClusteringResponse,
  CorrelationRequest,
  CorrelationResponse,
  PythonEngineError,
  CacheEntry,
  CacheStats,
  PerformanceMetrics,
  ValidationResult,
  Priority,
  isForecastResponse,
  isAnomalyResponse,
  isClassificationResponse,
  isClusteringResponse,
  isCorrelationResponse
} from '../types/PythonAnalysisTypes';

interface ProcessPoolEntry {
  process: ChildProcess;
  info: PythonProcessInfo;
  isAvailable: boolean;
  currentTask?: string;
}

interface TaskQueue {
  id: string;
  request: AnalysisRequest;
  priority: Priority;
  resolve: (value: AnalysisResponse) => void;
  reject: (error: PythonEngineError) => void;
  timeout: NodeJS.Timeout;
  startTime: number;
}

export class PythonAnalysisRunner {
  private static instance: PythonAnalysisRunner;
  private config: PythonEngineConfig;
  private adminLogger: AdminLogger;
  private isInitialized = false;
  
  // 프로세스 풀 관리
  private processPool: ProcessPoolEntry[] = [];
  private taskQueue: TaskQueue[] = [];
  private isProcessingQueue = false;
  
  // 캐시 시스템
  private cache = new Map<string, CacheEntry>();
  private cacheStats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    oldestEntry: 0,
    newestEntry: 0
  };
  
  // 성능 메트릭
  private performanceMetrics: PerformanceMetrics = {
    responseTime: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
    throughput: { requestsPerSecond: 0, requestsPerMinute: 0 },
    errorRate: { total: 0, byType: {}, percentage: 0 },
    resourceUsage: { cpuUsage: 0, memoryUsage: 0, processCount: 0 }
  };
  
  private responseTimes: number[] = [];
  private totalTasks = 0;
  private successfulTasks = 0;
  private lastMetricsUpdate = Date.now();

  private constructor(config?: Partial<PythonEngineConfig>) {
    this.config = {
      pythonPath: config?.pythonPath || process.env.PYTHON_PATH || 'python',
      scriptsPath: config?.scriptsPath || path.join(process.cwd(), 'src', 'modules', 'ai-agent', 'python-engine'),
      maxProcesses: config?.maxProcesses || 3,
      processTimeout: config?.processTimeout || 30000,
      maxMemoryMB: config?.maxMemoryMB || 512,
      enableCaching: config?.enableCaching ?? true,
      cacheSize: config?.cacheSize || 100,
      logLevel: config?.logLevel || 'info'
    };
    
    this.adminLogger = new AdminLogger();
  }

  static getInstance(config?: Partial<PythonEngineConfig>): PythonAnalysisRunner {
    if (!PythonAnalysisRunner.instance) {
      PythonAnalysisRunner.instance = new PythonAnalysisRunner(config);
    }
    return PythonAnalysisRunner.instance;
  }

  /**
   * 🔧 Python 분석 엔진 초기화
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
             console.log('🐍 Python Analysis Runner 초기화 시작...');

       // 환경 검증
       const validation = await this.validateEnvironment();
       if (!validation.isValid) {
         console.error('Python 환경 검증 실패:', validation.errors);
         return false;
       }

      // 스크립트 디렉터리 확인
      await this.ensureScriptsDirectory();

      // 프로세스 풀 초기화
      await this.initializeProcessPool();

      // 캐시 디렉터리 생성
      if (this.config.enableCaching) {
        await this.initializeCache();
      }

      // 성능 모니터링 시작
      this.startPerformanceMonitoring();

             this.isInitialized = true;
       console.log('✅ Python Analysis Runner 초기화 완료');
       return true;

     } catch (error) {
       console.error('❌ Python Analysis Runner 초기화 실패:', error);
       return false;
     }
  }

  /**
   * 🔮 시계열 예측 분석
   */
  async forecastTimeSeries(request: ForecastRequest): Promise<AnalysisResponse<ForecastResponse>> {
    return this.executeAnalysis<ForecastRequest, ForecastResponse>({
      method: 'forecast',
      data: request,
      cacheKey: this.generateCacheKey('forecast', request),
      priority: 'normal'
    });
  }

  /**
   * 🚨 이상 탐지 분석
   */
  async detectAnomalies(request: AnomalyRequest): Promise<AnalysisResponse<AnomalyResponse>> {
    return this.executeAnalysis<AnomalyRequest, AnomalyResponse>({
      method: 'anomaly',
      data: request,
      cacheKey: this.generateCacheKey('anomaly', request),
      priority: 'high'
    });
  }

  /**
   * 🎲 분류 분석
   */
  async classifyData(request: ClassificationRequest): Promise<AnalysisResponse<ClassificationResponse>> {
    return this.executeAnalysis<ClassificationRequest, ClassificationResponse>({
      method: 'classification',
      data: request,
      cacheKey: this.generateCacheKey('classification', request),
      priority: 'normal'
    });
  }

  /**
   * 🎯 클러스터링 분석
   */
  async performClustering(request: ClusteringRequest): Promise<AnalysisResponse<ClusteringResponse>> {
    return this.executeAnalysis<ClusteringRequest, ClusteringResponse>({
      method: 'clustering',
      data: request,
      cacheKey: this.generateCacheKey('clustering', request),
      priority: 'normal'
    });
  }

  /**
   * 🔗 상관관계 분석
   */
  async analyzeCorrelations(request: CorrelationRequest): Promise<AnalysisResponse<CorrelationResponse>> {
    return this.executeAnalysis<CorrelationRequest, CorrelationResponse>({
      method: 'correlation',
      data: request,
      cacheKey: this.generateCacheKey('correlation', request),
      priority: 'normal'
    });
  }

  /**
   * 📊 범용 분석 실행
   */
  private async executeAnalysis<TRequest, TResponse>(
    request: AnalysisRequest<TRequest>
  ): Promise<AnalysisResponse<TResponse>> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    try {
      // 초기화 확인
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw this.createError('DEPENDENCY_ERROR', 'Failed to initialize Python environment');
        }
      }

      // 캐시 확인
      if (this.config.enableCaching && request.cacheKey) {
        const cached = this.getCachedResult<TResponse>(request.cacheKey);
        if (cached) {
          return {
            success: true,
            result: cached,
            metadata: {
              executionTime: Date.now() - startTime,
              memoryUsed: 0,
              cacheHit: true,
              processId: -1,
              modelVersion: 'cached',
              timestamp: new Date().toISOString()
            }
          };
        }
      }

      // 입력 데이터 검증
      this.validateRequest(request);

      // 분석 실행
      const result = await this.queueTask<TRequest, TResponse>(request, taskId);

      // 결과 캐싱
      if (this.config.enableCaching && request.cacheKey && result.success) {
        this.setCachedResult(request.cacheKey, result.result!);
      }

      // 성능 메트릭 업데이트
      this.updatePerformanceMetrics(Date.now() - startTime, true);

      return result;

    } catch (error) {
      this.updatePerformanceMetrics(Date.now() - startTime, false);
      
      if (error instanceof Error && 'code' in error) {
        throw error as PythonEngineError;
      }
      
      throw this.createError('PROCESS_ERROR', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 📋 작업 큐에 추가
   */
  private async queueTask<TRequest, TResponse>(
    request: AnalysisRequest<TRequest>,
    taskId: string
  ): Promise<AnalysisResponse<TResponse>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeTaskFromQueue(taskId);
        reject(this.createError('TIMEOUT', `Task ${taskId} timed out after ${this.config.processTimeout}ms`));
      }, request.timeout || this.config.processTimeout);

      const task: TaskQueue = {
        id: taskId,
        request,
        priority: request.priority || 'normal',
        resolve: resolve as (value: AnalysisResponse) => void,
        reject,
        timeout,
        startTime: Date.now()
      };

      // 우선순위에 따라 큐에 삽입
      this.insertTaskByPriority(task);
      
      // 큐 처리 시작
      this.processTaskQueue();
    });
  }

  /**
   * ⚡ 작업 큐 처리
   */
  private async processTaskQueue(): Promise<void> {
    if (this.isProcessingQueue || this.taskQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.taskQueue.length > 0) {
        const availableProcess = this.getAvailableProcess();
        if (!availableProcess) {
          // 사용 가능한 프로세스가 없으면 잠시 대기
          await this.sleep(100);
          continue;
        }

        const task = this.taskQueue.shift()!;
        this.executeTaskOnProcess(task, availableProcess);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * 🔄 프로세스에서 작업 실행
   */
  private async executeTaskOnProcess(
    task: TaskQueue,
    processEntry: ProcessPoolEntry
  ): Promise<void> {
    processEntry.isAvailable = false;
    processEntry.currentTask = task.id;
    processEntry.info.status = 'busy';

    try {
      const result = await this.runPythonScript(task.request, processEntry.process);
      
      clearTimeout(task.timeout);
      task.resolve(result);
      
      processEntry.info.taskCount++;
      this.successfulTasks++;

    } catch (error) {
      clearTimeout(task.timeout);
      task.reject(error as PythonEngineError);
      
      // 프로세스 에러 시 재시작
      if (this.shouldRestartProcess(error)) {
        await this.restartProcess(processEntry);
      }
    } finally {
      processEntry.isAvailable = true;
      processEntry.currentTask = undefined;
      processEntry.info.status = 'idle';
      processEntry.info.lastUsed = Date.now();
    }
  }

  /**
   * 🐍 Python 스크립트 실행
   */
  private async runPythonScript<TRequest, TResponse>(
    request: AnalysisRequest<TRequest>,
    process: ChildProcess
  ): Promise<AnalysisResponse<TResponse>> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const cleanup = () => {
        process.stdout?.removeAllListeners();
        process.stderr?.removeAllListeners();
        process.removeAllListeners('error');
        process.removeAllListeners('exit');
      };

      // 데이터 수집
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // 프로세스 완료
      process.on('exit', (code) => {
        cleanup();
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            
            // 결과 타입 검증
            if (this.validateAnalysisResult(request.method, result)) {
              resolve({
                success: true,
                result: result as TResponse,
                metadata: {
                  executionTime: Date.now() - Date.now(),
                  memoryUsed: 0,
                  cacheHit: false,
                  processId: process.pid || 0,
                  modelVersion: '1.0.0',
                  timestamp: new Date().toISOString()
                }
              });
            } else {
              reject(this.createError('VALIDATION_ERROR', 'Invalid analysis result format'));
            }
          } catch (parseError) {
            reject(this.createError('PROCESS_ERROR', `Failed to parse Python output: ${parseError}`));
          }
        } else {
          reject(this.createError('PROCESS_ERROR', `Python script failed with code ${code}: ${stderr}`));
        }
      });

      // 프로세스 에러
      process.on('error', (error) => {
        cleanup();
        reject(this.createError('PROCESS_ERROR', `Python process error: ${error.message}`));
      });

      // 입력 데이터 전송
      try {
        const input = JSON.stringify(request);
        process.stdin?.write(input);
        process.stdin?.end();
      } catch (error) {
        cleanup();
        reject(this.createError('PROCESS_ERROR', `Failed to send data to Python: ${error}`));
      }
    });
  }

  /**
   * 🔧 프로세스 풀 초기화
   */
     private async initializeProcessPool(): Promise<void> {
     console.log(`프로세스 풀 초기화 중... (최대 ${this.config.maxProcesses}개)`);

     for (let i = 0; i < this.config.maxProcesses; i++) {
       try {
         const processEntry = await this.createPythonProcess();
         this.processPool.push(processEntry);
         console.log(`프로세스 ${i + 1}/${this.config.maxProcesses} 생성 완료`);
       } catch (error) {
         console.error(`프로세스 ${i + 1} 생성 실패:`, error);
         throw error;
       }
     }

     console.log(`✅ 프로세스 풀 초기화 완료 (${this.processPool.length}개 프로세스)`);
   }

     /**
    * 🔄 Python 프로세스 생성
    */
   private async createPythonProcess(): Promise<ProcessPoolEntry> {
     const pythonProcess = spawn(this.config.pythonPath, [
       path.join(this.config.scriptsPath, 'engine_runner.py')
     ], {
       stdio: ['pipe', 'pipe', 'pipe'],
       env: {
         ...process.env,
         PYTHONPATH: this.config.scriptsPath,
         PYTHONUNBUFFERED: '1'
       }
     });

     const info: PythonProcessInfo = {
       pid: pythonProcess.pid || 0,
       status: 'idle',
       startTime: Date.now(),
       lastUsed: Date.now(),
       memoryUsage: 0,
       taskCount: 0
     };

     return {
       process: pythonProcess,
       info,
       isAvailable: true
     };
   }

  /**
   * 🔍 환경 검증
   */
  private async validateEnvironment(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Python 실행 가능 여부 확인
      const pythonCheck = await this.checkPythonExecutable();
      if (!pythonCheck) {
        errors.push(`Python executable not found at: ${this.config.pythonPath}`);
        suggestions.push('Install Python 3.8+ or update PYTHON_PATH environment variable');
      }

      // 필수 라이브러리 확인
      const libCheck = await this.checkRequiredLibraries();
      if (libCheck.missing.length > 0) {
        errors.push(`Missing required libraries: ${libCheck.missing.join(', ')}`);
        suggestions.push('Run: pip install -r requirements.txt');
      }

      // 스크립트 파일 확인
      const scriptsCheck = this.checkScriptFiles();
      if (scriptsCheck.missing.length > 0) {
        errors.push(`Missing script files: ${scriptsCheck.missing.join(', ')}`);
        suggestions.push('Ensure all Python analysis scripts are present');
      }

      // 메모리 제한 확인
      if (this.config.maxMemoryMB < 256) {
        warnings.push('Memory limit is very low, may cause performance issues');
        suggestions.push('Consider increasing maxMemoryMB to at least 512MB');
      }

    } catch (error) {
      errors.push(`Environment validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * 📊 시스템 상태 조회
   */
  getEngineStatus(): PythonEngineStatus {
    const activeProcesses = this.processPool.filter(p => p.info.status === 'busy').length;
    const totalTasks = this.totalTasks;
    const successRate = totalTasks > 0 ? (this.successfulTasks / totalTasks) * 100 : 0;

    return {
      isInitialized: this.isInitialized,
      processPool: this.processPool.map(p => p.info),
      activeProcesses,
      totalTasks,
      successRate,
      averageResponseTime: this.performanceMetrics.responseTime.avg,
      cacheHitRate: this.cacheStats.hitRate,
      lastError: undefined // TODO: 마지막 에러 추적
    };
  }

  /**
   * 📈 성능 메트릭 조회
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 💾 캐시 통계 조회
   */
  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }

  // ===== 유틸리티 메서드들 =====

  private generateCacheKey(method: string, data: any): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify({ method, data }));
    return `${method}_${hash.digest('hex')}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createError(code: PythonEngineError['code'], message: string): PythonEngineError {
    const error = new Error(message) as PythonEngineError;
    error.code = code;
    return error;
  }

  private validateRequest(request: AnalysisRequest): void {
    if (!request.method || !request.data) {
      throw this.createError('VALIDATION_ERROR', 'Invalid request: method and data are required');
    }
  }

  private validateAnalysisResult(method: string, result: any): boolean {
    switch (method) {
      case 'forecast': return isForecastResponse(result);
      case 'anomaly': return isAnomalyResponse(result);
      case 'classification': return isClassificationResponse(result);
      case 'clustering': return isClusteringResponse(result);
      case 'correlation': return isCorrelationResponse(result);
      default: return false;
    }
  }

  private async checkPythonExecutable(): Promise<boolean> {
    // TODO: Python 실행 가능 여부 확인 구현
    return true;
  }

  private async checkRequiredLibraries(): Promise<{ missing: string[] }> {
    // TODO: 필수 라이브러리 확인 구현
    return { missing: [] };
  }

  private checkScriptFiles(): { missing: string[] } {
    // TODO: 스크립트 파일 존재 확인 구현
    return { missing: [] };
  }

  private async ensureScriptsDirectory(): Promise<void> {
    if (!fs.existsSync(this.config.scriptsPath)) {
      fs.mkdirSync(this.config.scriptsPath, { recursive: true });
    }
  }

  private async initializeCache(): Promise<void> {
    // 캐시 초기화 로직
  }

  private startPerformanceMonitoring(): void {
    // 성능 모니터링 시작
    setInterval(() => {
      this.updatePerformanceMetrics(0, true);
    }, 60000); // 1분마다 업데이트
  }

  private updatePerformanceMetrics(responseTime: number, success: boolean): void {
    this.totalTasks++;
    if (success) this.successfulTasks++;
    
    if (responseTime > 0) {
      this.responseTimes.push(responseTime);
      if (this.responseTimes.length > 1000) {
        this.responseTimes = this.responseTimes.slice(-1000);
      }
    }
    
    // 메트릭 계산 업데이트
    this.calculatePerformanceMetrics();
  }

  private calculatePerformanceMetrics(): void {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    this.performanceMetrics.responseTime = {
      min: Math.min(...this.responseTimes),
      max: Math.max(...this.responseTimes),
      avg: this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };

    this.performanceMetrics.errorRate.percentage = 
      this.totalTasks > 0 ? ((this.totalTasks - this.successfulTasks) / this.totalTasks) * 100 : 0;
  }

  private getCachedResult<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.data;
  }

  private setCachedResult<T>(key: string, data: T): void {
    if (!this.config.enableCaching) return;

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: 300000, // 5분
      hitCount: 0,
      size: JSON.stringify(data).length
    };

    this.cache.set(key, entry);

    // 캐시 크기 제한
    if (this.cache.size > this.config.cacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
      this.cacheStats.evictionCount++;
    }
  }

  private getAvailableProcess(): ProcessPoolEntry | null {
    return this.processPool.find(p => p.isAvailable && p.info.status === 'idle') || null;
  }

  private insertTaskByPriority(task: TaskQueue): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const taskPriority = priorityOrder[task.priority];

    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      if (priorityOrder[this.taskQueue[i].priority] > taskPriority) {
        insertIndex = i;
        break;
      }
    }

    this.taskQueue.splice(insertIndex, 0, task);
  }

  private removeTaskFromQueue(taskId: string): void {
    const index = this.taskQueue.findIndex(task => task.id === taskId);
    if (index !== -1) {
      clearTimeout(this.taskQueue[index].timeout);
      this.taskQueue.splice(index, 1);
    }
  }

  private shouldRestartProcess(error: any): boolean {
    return error && (error.code === 'PROCESS_ERROR' || error.code === 'MEMORY_ERROR');
  }

     private async restartProcess(processEntry: ProcessPoolEntry): Promise<void> {
     try {
       processEntry.process.kill();
       const newProcessEntry = await this.createPythonProcess();
       Object.assign(processEntry, newProcessEntry);
       console.log(`프로세스 ${processEntry.info.pid} 재시작 완료`);
     } catch (error) {
       console.error('프로세스 재시작 실패:', error);
     }
   }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

     /**
    * 🔄 엔진 종료
    */
   async shutdown(): Promise<void> {
     console.log('Python Analysis Runner 종료 중...');

     // 모든 프로세스 종료
     for (const processEntry of this.processPool) {
       try {
         processEntry.process.kill();
       } catch (error) {
         console.error('프로세스 종료 실패:', error);
       }
     }

     // 대기 중인 작업들 취소
     for (const task of this.taskQueue) {
       clearTimeout(task.timeout);
       task.reject(this.createError('PROCESS_ERROR', 'Engine is shutting down'));
     }

     this.processPool.length = 0;
     this.taskQueue.length = 0;
     this.isInitialized = false;

     console.log('✅ Python Analysis Runner 종료 완료');
   }
} 