/**
 * 🔧 환경변수 자동 복구 서비스
 *
 * 기능:
 * - 시스템 시작 시 환경변수 자동 체크
 * - 누락된 환경변수 자동 복구
 * - 암호화된 백업에서 복구
 * - 실시간 모니터링 및 알림
 */

import { UnifiedEnvCryptoManager } from '@/lib/crypto/UnifiedEnvCryptoManager';
import { EnvBackupManager } from '@/lib/env-backup-manager';
import { AILogger, LogCategory } from '@/services/ai/logging/AILogger';

export interface EnvRecoveryResult {
  success: boolean;
  recovered: string[];
  failed: string[];
  method: 'encrypted' | 'backup' | 'defaults' | 'manual';
  message: string;
  timestamp: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  invalid: string[];
  priority: 'critical' | 'important' | 'optional' | 'ok';
}

export class EnvAutoRecoveryService {
  private static instance: EnvAutoRecoveryService | null = null;
  private envBackupManager: EnvBackupManager;
  private envCryptoManager: UnifiedEnvCryptoManager;
  private logger: AILogger;
  private isInitialized: boolean = false;
  private lastRecoveryAttempt: number = 0;
  private recoveryInProgress: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly RECOVERY_COOLDOWN = 300000; // 5분 쿨다운
  private readonly CHECK_INTERVAL = 300000; // 5분마다 체크

  // 🎯 환경변수 설정 (우선순위별)
  private readonly envConfig = {
    critical: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ],
    important: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
    ],
    optional: ['GOOGLE_AI_API_KEY', 'GCP_MCP_SERVER_URL', 'SLACK_WEBHOOK_URL'],
    defaults: {
      // 🔧 개발환경 전용 안전한 기본값들
      GOOGLE_AI_MODEL: 'gemini-1.5-flash',
      GOOGLE_AI_BETA_MODE: 'true',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',

      // 🚨 중요: 실제 인프라 키들은 환경변수에서만 가져오기
      // 프로덕션 환경에서는 절대 하드코딩 값 사용하지 않음
      ...(process.env.NODE_ENV === 'development'
        ? {
          // 개발환경에서만 경고와 함께 제공되는 임시값들
          GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || '',
          SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
        }
        : {}),
    } as Record<string, string>,
  };

  // 🎭 목업 모드 관리
  private isMockMode = false;
  private isHealthCheckContext = false;
  private isTestContext = false;

  private constructor() {
    this.envBackupManager = EnvBackupManager.getInstance();
    this.envCryptoManager = UnifiedEnvCryptoManager.getInstance();
    this.logger = AILogger.getInstance();
    this.detectExecutionContext();
    console.log(
      `🔧 EnvAutoRecoveryService 초기화 ${this.isMockMode ? '(목업 모드)' : '(실제 모드)'}`
    );
  }

  static getInstance(): EnvAutoRecoveryService {
    if (!EnvAutoRecoveryService.instance) {
      EnvAutoRecoveryService.instance = new EnvAutoRecoveryService();
    }
    return EnvAutoRecoveryService.instance;
  }

  /**
   * 🚀 시스템 초기화 및 자동 복구 시작
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 🔨 빌드 환경에서는 초기화 건너뛰기
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') {
      console.log('🔨 Vercel 빌드 환경 감지 - 환경변수 자동 복구 건너뜀');
      this.isInitialized = true;
      return;
    }

    if (process.env.BUILD_TIME === 'true') {
      console.log('🔨 빌드 타임 감지 - 환경변수 자동 복구 건너뜀');
      this.isInitialized = true;
      return;
    }

    try {
      console.log('🔧 환경변수 자동 복구 서비스 초기화...');

      // 1. 초기 환경변수 검증
      const validation = this.validateEnvironment();

      // 2. 문제가 있으면 자동 복구 시도
      if (!validation.isValid) {
        await this.attemptAutoRecovery(validation.missing);
      }

      // 3. 백업 생성 (현재 상태 보존)
      await this.createInitialBackup();

      // 4. 실시간 모니터링 시작 (런타임에서만)
      if (
        typeof window !== 'undefined' ||
        process.env.NODE_ENV === 'development'
      ) {
        this.startMonitoring();
      } else {
        console.log('🔨 서버 빌드 환경 - 실시간 모니터링 건너뜀');
      }

      this.isInitialized = true;

      await this.logger.info(
        LogCategory.SYSTEM,
        '✅ 환경변수 자동 복구 서비스 초기화 완료',
        {
          validation,
          monitoringEnabled: true,
          backupCreated: true,
        }
      );
    } catch (error) {
      console.error('❌ 환경변수 자동 복구 서비스 초기화 실패:', error);
      await this.logger.logError(
        'EnvAutoRecoveryService',
        LogCategory.SYSTEM,
        `초기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 🔍 환경변수 검증
   */
  validateEnvironment(): EnvValidationResult {
    const allRequired = [
      ...this.envConfig.critical,
      ...this.envConfig.important,
      ...this.envConfig.optional,
    ];

    const missing = allRequired.filter(key => !process.env[key]);
    const invalid: string[] = [];

    // URL 형식 검증
    const urlVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_URL',
      'UPSTASH_REDIS_REST_URL',
      'GCP_MCP_SERVER_URL',
    ];
    for (const varName of urlVars) {
      const value = process.env[varName];
      if (value && !value.startsWith('http')) {
        invalid.push(varName);
      }
    }

    // 우선순위 결정
    let priority: EnvValidationResult['priority'] = 'ok';
    const criticalMissing = missing.filter(key =>
      this.envConfig.critical.includes(key)
    );
    const importantMissing = missing.filter(key =>
      this.envConfig.important.includes(key)
    );

    if (criticalMissing.length > 0 || invalid.length > 0) {
      priority = 'critical';
    } else if (importantMissing.length > 0) {
      priority = 'important';
    } else if (missing.length > 0) {
      priority = 'optional';
    }

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      priority,
    };
  }

  /**
   * 🚨 자동 복구 시도
   */
  async attemptAutoRecovery(missingVars: string[]): Promise<EnvRecoveryResult> {
    // 복구 진행 중이거나 최근에 시도했으면 스킵
    const now = Date.now();
    if (this.recoveryInProgress || now - this.lastRecoveryAttempt < 30000) {
      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'manual',
        message: '복구가 이미 진행 중이거나 최근에 시도됨',
        timestamp: new Date().toISOString(),
      };
    }

    this.recoveryInProgress = true;
    this.lastRecoveryAttempt = now;

    try {
      console.log('🔧 환경변수 자동 복구 시작:', missingVars);

      // 1단계: 암호화된 환경변수 복구 시도
      const cryptoResult = await this.tryEncryptedRecovery(missingVars);
      if (cryptoResult.success && cryptoResult.recovered.length > 0) {
        return cryptoResult;
      }

      // 2단계: 백업 파일에서 복구 시도
      const backupResult = await this.tryBackupRecovery(missingVars);
      if (backupResult.success && backupResult.recovered.length > 0) {
        return backupResult;
      }

      // 3단계: 하드코딩된 기본값 적용
      const defaultResult = await this.tryDefaultRecovery(missingVars);
      return defaultResult;
    } catch (error) {
      console.error('❌ 환경변수 자동 복구 실패:', error);
      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'manual',
        message: `복구 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * 🔐 암호화된 백업에서 복구 시도
   */
  private async tryEncryptedRecovery(
    missingVars: string[]
  ): Promise<EnvRecoveryResult> {
    try {
      const recovered: string[] = [];

      // 기본 팀 비밀번호들로 자동 복구 시도
      const defaultPasswords = [
        'openmanager2025',
        'openmanager-vibe-v5-2025',
        'team-password-2025',
        'openmanager-team-key',
        'development-mock-password',
      ];

      // UnifiedEnvCryptoManager의 자동 복구 기능 사용
      try {
        const recoveredVars = await this.envCryptoManager.autoRecoverEnvVars(defaultPasswords);

        // 누락된 변수들 중에서 복구된 것들 확인
        for (const varName of missingVars) {
          if (recoveredVars[varName]) {
            process.env[varName] = recoveredVars[varName];
            recovered.push(varName);
            console.log(`✅ ${varName}: 암호화된 백업에서 복구 완료`);
          }
        }

        if (recovered.length > 0) {
          await this.logger.info(
            LogCategory.SYSTEM,
            `🔐 암호화된 백업에서 환경변수 복구 완료: ${recovered.join(', ')}`,
            { recovered, method: 'encrypted' }
          );

          return {
            success: true,
            recovered,
            failed: missingVars.filter(v => !recovered.includes(v)),
            method: 'encrypted',
            message: `암호화된 백업에서 ${recovered.length}개 변수 복구`,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.log('🔐 자동 복구 실패, 수동 시도 진행...');
      }

      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'encrypted',
        message: '암호화된 백업에서 복구 실패',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'encrypted',
        message: `암호화 복구 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 💾 백업 파일에서 복구 시도
   */
  private async tryBackupRecovery(
    missingVars: string[]
  ): Promise<EnvRecoveryResult> {
    try {
      const backupStatus = this.envBackupManager.getBackupStatus();

      if (!backupStatus.exists) {
        return {
          success: false,
          recovered: [],
          failed: missingVars,
          method: 'backup',
          message: '백업 파일이 존재하지 않음',
          timestamp: new Date().toISOString(),
        };
      }

      // 중요 환경변수만 복구 (보안상 이유)
      const emergencyResult =
        await this.envBackupManager.emergencyRestore('critical');

      if (emergencyResult.success) {
        const recoveredFromMissing = emergencyResult.restored.filter(key =>
          missingVars.includes(key.replace(' (기본값)', ''))
        );

        await this.logger.info(
          LogCategory.SYSTEM,
          `💾 백업에서 환경변수 복구 완료: ${recoveredFromMissing.join(', ')}`,
          { recovered: recoveredFromMissing, method: 'backup' }
        );

        return {
          success: true,
          recovered: recoveredFromMissing,
          failed: missingVars.filter(v => !recoveredFromMissing.includes(v)),
          method: 'backup',
          message: `백업에서 ${recoveredFromMissing.length}개 변수 복구`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'backup',
        message: emergencyResult.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'backup',
        message: `백업 복구 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 🎯 기본값으로 복구 시도
   */
  private async tryDefaultRecovery(
    missingVars: string[]
  ): Promise<EnvRecoveryResult> {
    try {
      const recovered: string[] = [];

      // 🚨 보안 경고: 실제 프로덕션 키는 환경변수에서만 가져오기
      // 개발환경에서만 사용되는 안전한 기본값들
      const defaults = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      };

      for (const varName of missingVars) {
        if (defaults[varName as keyof typeof defaults]) {
          process.env[varName] = defaults[varName as keyof typeof defaults];
          recovered.push(varName);
          console.log(`✅ ${varName}: 기본값으로 복구 완료`);
        }
      }

      if (recovered.length > 0) {
        await this.logger.info(
          LogCategory.SYSTEM,
          `🎯 기본값으로 환경변수 복구 완료: ${recovered.join(', ')}`,
          { recovered, method: 'defaults' }
        );
      }

      return {
        success: recovered.length > 0,
        recovered,
        failed: missingVars.filter(v => !recovered.includes(v)),
        method: 'defaults',
        message:
          recovered.length > 0
            ? `기본값으로 ${recovered.length}개 변수 복구`
            : '복구 가능한 기본값 없음',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        recovered: [],
        failed: missingVars,
        method: 'defaults',
        message: `기본값 적용 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 💾 초기 백업 생성
   */
  private async createInitialBackup(): Promise<void> {
    try {
      const backupResult = await this.envBackupManager.createBackup();
      if (backupResult) {
        console.log('💾 초기 환경변수 백업 생성 완료');
      }
    } catch (error) {
      console.warn('⚠️ 초기 백업 생성 실패:', error);
    }
  }

  /**
   * 👁️ 실시간 모니터링 시작
   */
  private startMonitoring(): void {
    // 5분마다 환경변수 상태 체크
    this.monitoringInterval = setInterval(
      async () => {
        try {
          const validation = this.validateEnvironment();

          if (!validation.isValid && validation.priority === 'critical') {
            console.log('🚨 환경변수 문제 재감지 - 자동 복구 시도');
            await this.attemptAutoRecovery(validation.missing);
          }
        } catch (error) {
          console.warn('⚠️ 환경변수 모니터링 오류:', error);
        }
      },
      5 * 60 * 1000
    ); // 5분

    console.log('👁️ 환경변수 실시간 모니터링 시작 (5분 간격)');
  }

  /**
   * 🛑 서비스 종료
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isInitialized = false;
    console.log('🛑 환경변수 자동 복구 서비스 종료');
  }

  /**
   * 📊 현재 상태 조회 (목업 모드 지원)
   */
  getStatus(): {
    isInitialized: boolean;
    lastRecoveryAttempt: number;
    recoveryInProgress: boolean;
    validation: EnvValidationResult;
    monitoringActive: boolean;
    isRunning: boolean;
    isMockMode: boolean;
    isHealthCheckContext: boolean;
    isTestContext: boolean;
    checkInterval: number;
    recoveryCooldown: number;
  } {
    return {
      isInitialized: this.isInitialized,
      lastRecoveryAttempt: this.lastRecoveryAttempt,
      recoveryInProgress: this.recoveryInProgress,
      validation: this.validateEnvironment(),
      monitoringActive: this.monitoringInterval !== null,
      isRunning: this.isRunning,
      isMockMode: this.isMockMode,
      isHealthCheckContext: this.isHealthCheckContext,
      isTestContext: this.isTestContext,
      checkInterval: this.CHECK_INTERVAL,
      recoveryCooldown: this.RECOVERY_COOLDOWN,
    };
  }

  /**
   * 🔍 실행 컨텍스트 감지
   */
  private detectExecutionContext(): void {
    const stack = new Error().stack || '';

    // 헬스체크 컨텍스트 감지
    this.isHealthCheckContext =
      stack.includes('health') ||
      stack.includes('performHealthCheck') ||
      process.env.HEALTH_CHECK_CONTEXT === 'true' ||
      process.argv.some(arg => arg.includes('health'));

    // 테스트 컨텍스트 감지
    this.isTestContext =
      process.env.NODE_ENV === 'test' ||
      stack.includes('test') ||
      stack.includes('jest') ||
      stack.includes('vitest') ||
      process.env.FORCE_MOCK_REDIS === 'true';

    // 목업 모드 결정
    this.isMockMode =
      this.isHealthCheckContext ||
      this.isTestContext ||
      process.env.FORCE_MOCK_REDIS === 'true';

    if (this.isMockMode) {
      console.log('🎭 EnvAutoRecoveryService 목업 모드 활성화');
    }
  }

  /**
   * 🔄 서비스 시작 (목업 모드 지원)
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ EnvAutoRecoveryService 이미 실행 중');
      return;
    }

    if (this.isMockMode) {
      console.log('🎭 목업 모드: EnvAutoRecoveryService 모니터링 건너뜀');
      this.isRunning = true;
      return;
    }

    this.isRunning = true;

    // 즉시 한 번 체크
    this.performCheck();

    // 주기적 체크 시작
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.CHECK_INTERVAL);

    console.log(
      `✅ EnvAutoRecoveryService 시작됨 (${this.CHECK_INTERVAL / 1000}초 간격)`
    );
  }

  /**
   * 🛑 서비스 중지
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('🛑 EnvAutoRecoveryService 중지됨');
  }

  /**
   * 🔍 환경변수 검증 및 자동 복구 (목업 모드 지원)
   */
  private async performCheck(): Promise<void> {
    if (this.isMockMode) {
      // 목업 모드에서는 체크 건너뜀
      return;
    }

    try {
      const criticalEnvs = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ];

      const missing = criticalEnvs.filter(key => !process.env[key]);

      if (missing.length > 0) {
        console.log(`🚨 환경변수 문제 감지: ${missing.join(', ')}`);

        // 쿨다운 체크
        const now = Date.now();
        if (now - this.lastRecoveryAttempt < this.RECOVERY_COOLDOWN) {
          console.log('⏰ 복구 쿨다운 중... 다음 시도까지 대기');
          return;
        }

        // 자동 복구 시도
        const recoveryResult = await this.attemptRecovery(missing);
        this.lastRecoveryAttempt = now;

        if (recoveryResult.success) {
          console.log(
            `✅ 자동 복구 성공: ${recoveryResult.recovered.join(', ')}`
          );
        } else {
          console.log(`❌ 자동 복구 실패: ${recoveryResult.message}`);
        }
      }
    } catch (error) {
      console.error('❌ EnvAutoRecoveryService 체크 실패:', error);
    }
  }

  /**
   * 🔧 환경변수 복구 시도 (목업 모드 지원)
   */
  private async attemptRecovery(missingVars: string[]): Promise<{
    success: boolean;
    recovered: string[];
    method: string;
    message: string;
  }> {
    if (this.isMockMode) {
      // 목업 모드에서는 가상 복구 성공 반환
      return {
        success: true,
        recovered: missingVars,
        method: 'mock',
        message: '목업 모드: 가상 복구 완료',
      };
    }

    // 실제 복구 로직 (기존 코드)
    const recovered: string[] = [];

    try {
      // 🚨 보안 경고: 실제 프로덕션 키는 환경변수에서만 가져오기
      // 개발환경에서만 사용되는 안전한 기본값들
      const defaults = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      };

      for (const varName of missingVars) {
        if (defaults[varName as keyof typeof defaults]) {
          process.env[varName] = defaults[varName as keyof typeof defaults];
          recovered.push(varName);
        }
      }

      return {
        success: recovered.length > 0,
        recovered,
        method: 'defaults',
        message:
          recovered.length > 0
            ? '기본값으로 복구 완료'
            : '복구 가능한 변수 없음',
      };
    } catch (error) {
      return {
        success: false,
        recovered: [],
        method: 'failed',
        message: error instanceof Error ? error.message : '복구 실패',
      };
    }
  }
}

// 🚀 전역 인스턴스 및 자동 초기화
let globalEnvRecoveryService: EnvAutoRecoveryService | null = null;

export function getEnvAutoRecoveryService(): EnvAutoRecoveryService {
  if (!globalEnvRecoveryService) {
    globalEnvRecoveryService = EnvAutoRecoveryService.getInstance();
  }
  return globalEnvRecoveryService;
}

// 서버 시작 시 자동 초기화 (서버 환경에서만)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  const service = getEnvAutoRecoveryService();
  service.initialize().catch(console.error);
}
