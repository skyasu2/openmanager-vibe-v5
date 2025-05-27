/**
 * 🌍 Environment Detector & Optimizer
 * 
 * 환경별 최적화 설정 관리
 * - Vercel 무료/Pro 티어 감지
 * - 로컬 개발 환경 감지
 * - 환경별 최적 설정 제공
 */

export interface EnvironmentInfo {
  platform: 'vercel-free' | 'vercel-pro' | 'local' | 'unknown';
  memoryLimit: number;
  timeLimit: number;
  cpuCores: number;
  isProduction: boolean;
  region?: string;
  capabilities: {
    pythonAnalysis: boolean;
    heavyComputation: boolean;
    longRunningTasks: boolean;
    fileSystem: boolean;
  };
}

export interface OptimizationConfig {
  maxProcesses: number;
  processTimeout: number;
  maxMemoryMB: number;
  enableCaching: boolean;
  cacheSize: number;
  enablePythonAnalysis: boolean;
  pythonTimeout: number;
  fallbackMode: boolean;
  batchSize: number;
  concurrentTasks: number;
}

export class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private environmentInfo: EnvironmentInfo | null = null;
  private optimizationConfig: OptimizationConfig | null = null;

  private constructor() {}

  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  /**
   * 🔍 환경 감지 및 분석
   */
  async detectEnvironment(): Promise<EnvironmentInfo> {
    if (this.environmentInfo) {
      return this.environmentInfo;
    }

    const env = process.env;
    const isProduction = env.NODE_ENV === 'production';
    
    // Vercel 환경 감지
    const isVercel = !!(env.VERCEL || env.VERCEL_URL);
    const vercelPlan = env.VERCEL_PLAN || 'hobby'; // hobby = 무료, pro = Pro
    
    // 메모리 제한 감지
    const memoryLimit = this.detectMemoryLimit();
    
    // CPU 코어 수 감지
    const cpuCores = this.detectCpuCores();
    
    // 플랫폼 결정
    let platform: EnvironmentInfo['platform'] = 'unknown';
    let timeLimit = 30000; // 기본 30초
    
    if (isVercel) {
      if (vercelPlan === 'pro') {
        platform = 'vercel-pro';
        timeLimit = 60000; // Pro: 60초
      } else {
        platform = 'vercel-free';
        timeLimit = 10000; // 무료: 10초
      }
    } else {
      platform = 'local';
      timeLimit = 300000; // 로컬: 5분
    }

    // 기능 지원 여부 결정
    const capabilities = this.determineCapabilities(platform, memoryLimit, cpuCores);

    this.environmentInfo = {
      platform,
      memoryLimit,
      timeLimit,
      cpuCores,
      isProduction,
      region: env.VERCEL_REGION,
      capabilities
    };

    console.log('🌍 Environment detected:', this.environmentInfo);
    return this.environmentInfo;
  }

  /**
   * 📊 메모리 제한 감지
   */
  private detectMemoryLimit(): number {
    try {
      // Vercel 환경 변수에서 메모리 제한 확인
      const vercelMemory = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
      if (vercelMemory) {
        return parseInt(vercelMemory, 10);
      }

      // Node.js 메모리 사용량으로 추정
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal + memUsage.external;
      
      // 일반적인 제한값들과 비교
      if (totalMemory < 512 * 1024 * 1024) return 512;      // 512MB
      if (totalMemory < 1024 * 1024 * 1024) return 1024;    // 1GB
      if (totalMemory < 3008 * 1024 * 1024) return 3008;    // 3GB (Vercel Pro)
      
      return 8192; // 로컬 환경 기본값
    } catch (error) {
      return 1024; // 기본값
    }
  }

  /**
   * 🖥️ CPU 코어 수 감지
   */
  private detectCpuCores(): number {
    try {
      const os = require('os');
      return os.cpus().length;
    } catch (error) {
      return 1; // 기본값
    }
  }

  /**
   * ⚙️ 환경별 기능 지원 여부 결정
   */
  private determineCapabilities(
    platform: EnvironmentInfo['platform'],
    memoryLimit: number,
    cpuCores: number
  ): EnvironmentInfo['capabilities'] {
    const capabilities = {
      pythonAnalysis: false,
      heavyComputation: false,
      longRunningTasks: false,
      fileSystem: false
    };

    switch (platform) {
      case 'vercel-free':
        capabilities.pythonAnalysis = memoryLimit >= 512;
        capabilities.heavyComputation = false;
        capabilities.longRunningTasks = false;
        capabilities.fileSystem = false;
        break;

      case 'vercel-pro':
        capabilities.pythonAnalysis = true;
        capabilities.heavyComputation = memoryLimit >= 1024;
        capabilities.longRunningTasks = true;
        capabilities.fileSystem = false;
        break;

      case 'local':
        capabilities.pythonAnalysis = true;
        capabilities.heavyComputation = true;
        capabilities.longRunningTasks = true;
        capabilities.fileSystem = true;
        break;

      default:
        // 보수적 설정
        capabilities.pythonAnalysis = memoryLimit >= 512;
        capabilities.heavyComputation = false;
        capabilities.longRunningTasks = false;
        capabilities.fileSystem = false;
    }

    return capabilities;
  }

  /**
   * 🎛️ 환경별 최적화 설정 생성
   */
  async getOptimizationConfig(): Promise<OptimizationConfig> {
    if (this.optimizationConfig) {
      return this.optimizationConfig;
    }

    const env = await this.detectEnvironment();
    
    let config: OptimizationConfig;

    switch (env.platform) {
      case 'vercel-free':
        config = {
          maxProcesses: 1,                    // 단일 프로세스
          processTimeout: 8000,               // 8초 (여유분 2초)
          maxMemoryMB: Math.min(400, env.memoryLimit * 0.8), // 메모리의 80%
          enableCaching: true,
          cacheSize: 50,                      // 작은 캐시
          enablePythonAnalysis: env.capabilities.pythonAnalysis,
          pythonTimeout: 6000,                // 6초
          fallbackMode: true,                 // 적극적 fallback
          batchSize: 100,                     // 작은 배치
          concurrentTasks: 1                  // 순차 처리
        };
        break;

      case 'vercel-pro':
        config = {
          maxProcesses: 2,                    // 2개 프로세스
          processTimeout: 50000,              // 50초
          maxMemoryMB: Math.min(800, env.memoryLimit * 0.6), // 메모리의 60%
          enableCaching: true,
          cacheSize: 200,                     // 큰 캐시
          enablePythonAnalysis: true,
          pythonTimeout: 45000,               // 45초
          fallbackMode: false,                // 고급 기능 활용
          batchSize: 500,                     // 중간 배치
          concurrentTasks: 2                  // 병렬 처리
        };
        break;

      case 'local':
        config = {
          maxProcesses: Math.min(env.cpuCores, 4), // CPU 코어 수만큼
          processTimeout: 120000,             // 2분
          maxMemoryMB: Math.min(2048, env.memoryLimit * 0.5), // 메모리의 50%
          enableCaching: true,
          cacheSize: 500,                     // 대용량 캐시
          enablePythonAnalysis: true,
          pythonTimeout: 100000,              // 100초
          fallbackMode: false,                // 모든 기능 활용
          batchSize: 1000,                    // 큰 배치
          concurrentTasks: env.cpuCores       // 최대 병렬 처리
        };
        break;

      default:
        // 안전한 기본 설정
        config = {
          maxProcesses: 1,
          processTimeout: 10000,
          maxMemoryMB: 256,
          enableCaching: true,
          cacheSize: 50,
          enablePythonAnalysis: false,
          pythonTimeout: 8000,
          fallbackMode: true,
          batchSize: 50,
          concurrentTasks: 1
        };
    }

    this.optimizationConfig = config;
    console.log('⚙️ Optimization config generated:', config);
    return config;
  }

  /**
   * 🚦 실행 가능 여부 판단
   */
  async shouldRunAdvancedAnalysis(
    requestSize: number,
    estimatedTime: number,
    memoryRequired: number
  ): Promise<boolean> {
    const env = await this.detectEnvironment();
    const config = await this.getOptimizationConfig();

    // 시간 제한 확인
    if (estimatedTime > config.processTimeout) {
      return false;
    }

    // 메모리 제한 확인
    if (memoryRequired > config.maxMemoryMB) {
      return false;
    }

    // 플랫폼별 추가 제약
    switch (env.platform) {
      case 'vercel-free':
        // 무료 티어는 매우 신중하게
        return requestSize < 100 && estimatedTime < 6000 && memoryRequired < 300;

      case 'vercel-pro':
        // Pro 티어는 적극 활용
        return env.capabilities.pythonAnalysis && estimatedTime < 45000;

      case 'local':
        // 로컬은 모든 기능 활용
        return true;

      default:
        return false;
    }
  }

  /**
   * 📈 성능 모니터링 및 동적 조정
   */
  async adjustConfigBasedOnPerformance(
    averageResponseTime: number,
    errorRate: number,
    memoryUsage: number
  ): Promise<void> {
    if (!this.optimizationConfig) return;

    const config = this.optimizationConfig;
    let adjusted = false;

    // 응답시간이 너무 길면 타임아웃 단축
    if (averageResponseTime > config.processTimeout * 0.8) {
      config.processTimeout = Math.max(5000, config.processTimeout * 0.9);
      adjusted = true;
    }

    // 에러율이 높으면 fallback 모드 활성화
    if (errorRate > 0.2) {
      config.fallbackMode = true;
      config.maxProcesses = Math.max(1, config.maxProcesses - 1);
      adjusted = true;
    }

    // 메모리 사용량이 높으면 제한 강화
    if (memoryUsage > config.maxMemoryMB * 0.9) {
      config.maxMemoryMB = Math.max(256, config.maxMemoryMB * 0.8);
      config.cacheSize = Math.max(10, config.cacheSize * 0.8);
      adjusted = true;
    }

    if (adjusted) {
      console.log('🔧 Configuration adjusted based on performance:', config);
    }
  }

  /**
   * 🌡️ 환경 상태 모니터링
   */
  getEnvironmentStatus() {
    return {
      environment: this.environmentInfo,
      optimization: this.optimizationConfig,
      runtime: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }

  /**
   * 🔄 설정 리셋 (테스트용)
   */
  reset(): void {
    this.environmentInfo = null;
    this.optimizationConfig = null;
  }
} 