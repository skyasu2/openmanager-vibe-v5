/**
 * 🛡️ 데이터 무결성 검증 및 경고 시스템
 *
 * 목적:
 * - 실제 배포시 목업 데이터 사용 방지
 * - 개발 환경에서 명확한 경고 제공
 * - 데이터 소스 추적 및 검증
 */

export interface DataValidationResult {
  isValid: boolean;
  isMockData: boolean;
  dataSource: string;
  warnings: string[];
  errors: string[];
  environment: string;
  timestamp: string;
  actionRequired?: string;
}

export interface DataValidationConfig {
  strictMode: boolean;
  allowMockInProduction: boolean;
  requireRealDataSources: string[];
  warningThreshold: number;
}

export class DataIntegrityValidator {
  private static instance: DataIntegrityValidator | null = null;
  private config: DataValidationConfig;
  private validationHistory: DataValidationResult[] = [];

  constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): DataIntegrityValidator {
    if (!DataIntegrityValidator.instance) {
      DataIntegrityValidator.instance = new DataIntegrityValidator();
    }
    return DataIntegrityValidator.instance;
  }

  /**
   * 🔍 서버 데이터 검증
   */
  public validateServerData(
    servers: any[],
    dataSource: string = 'unknown'
  ): DataValidationResult {
    const result: DataValidationResult = {
      isValid: true,
      isMockData: false,
      dataSource,
      warnings: [],
      errors: [],
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // 1. 기본 데이터 존재 여부 검증
    if (!servers || servers.length === 0) {
      result.isValid = false;
      result.errors.push('서버 데이터가 존재하지 않습니다');
      result.actionRequired = '실제 데이터 소스 연결 필요';
    }

    // 2. 목업 데이터 감지
    const mockDataIndicators = this.detectMockData(servers);
    if (mockDataIndicators.length > 0) {
      result.isMockData = true;
      result.warnings.push(
        `목업 데이터 감지: ${mockDataIndicators.join(', ')}`
      );
    }

    // 3. 프로덕션 환경 엄격 검증
    if (this.isProductionEnvironment()) {
      if (result.isMockData) {
        result.isValid = false;
        result.errors.push('프로덕션 환경에서 목업 데이터 사용 금지');
        result.actionRequired = '실제 데이터 소스로 교체 필요';
      }

      if (dataSource.includes('mock') || dataSource.includes('fallback')) {
        result.isValid = false;
        result.errors.push(
          `프로덕션에서 허용되지 않는 데이터 소스: ${dataSource}`
        );
      }
    }

    // 4. 데이터 품질 검증
    const qualityIssues = this.validateDataQuality(servers);
    result.warnings.push(...qualityIssues);

    // 5. 검증 결과 저장
    this.validationHistory.push(result);

    // 6. 경고/에러 로깅
    this.logValidationResult(result);

    return result;
  }

  /**
   * 🕵️ 목업 데이터 감지 알고리즘
   */
  private detectMockData(servers: any[]): string[] {
    const indicators: string[] = [];

    if (!servers || servers.length === 0) return indicators;

    // 1. 명시적 목업 플래그 확인
    const hasExplicitMockFlag = servers.some(
      server =>
        server._isMockData ||
        server._dataSource === 'fallback' ||
        server._dataSource === 'mock'
    );
    if (hasExplicitMockFlag) {
      indicators.push('명시적 목업 플래그');
    }

    // 2. 의심스러운 호스트네임 패턴
    const suspiciousHostnames = servers.filter(
      server =>
        server.hostname?.includes('example.com') ||
        server.hostname?.includes('test.local') ||
        server.hostname?.includes('mock')
    );
    if (suspiciousHostnames.length > 0) {
      indicators.push(
        `의심스러운 호스트네임 (${suspiciousHostnames.length}개)`
      );
    }

    // 3. 순차적 ID 패턴 (server-1, server-2, ...)
    const sequentialIds = servers.filter(server =>
      /^server-\d+$/.test(server.id)
    );
    if (sequentialIds.length > servers.length * 0.8) {
      indicators.push('순차적 ID 패턴');
    }

    // 4. 너무 완벽한 메트릭 (정수값만 있는 경우)
    const perfectMetrics = servers.filter(
      server =>
        Number.isInteger(server.cpu) &&
        Number.isInteger(server.memory) &&
        Number.isInteger(server.disk)
    );
    if (perfectMetrics.length > servers.length * 0.9) {
      indicators.push('비현실적 메트릭 패턴');
    }

    // 5. 제한된 위치 다양성
    const locations = new Set(servers.map(server => server.location));
    if (locations.size < 3 && servers.length > 10) {
      indicators.push('제한된 지역 다양성');
    }

    return indicators;
  }

  /**
   * 📊 데이터 품질 검증
   */
  private validateDataQuality(servers: any[]): string[] {
    const issues: string[] = [];

    if (!servers || servers.length === 0) return issues;

    // 1. 중복 데이터 확인
    const ids = servers.map(server => server.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push('중복된 서버 ID 발견');
    }

    // 2. 필수 필드 누락 확인
    const requiredFields = ['id', 'name', 'status'];
    servers.forEach((server, index) => {
      requiredFields.forEach(field => {
        if (!server[field]) {
          issues.push(`서버 ${index}: ${field} 필드 누락`);
        }
      });
    });

    // 3. 메트릭 범위 검증
    servers.forEach((server, index) => {
      if (server.cpu > 100 || server.cpu < 0) {
        issues.push(`서버 ${index}: CPU 메트릭 범위 초과`);
      }
      if (server.memory > 100 || server.memory < 0) {
        issues.push(`서버 ${index}: 메모리 메트릭 범위 초과`);
      }
    });

    return issues;
  }

  /**
   * 🔧 설정 로드
   */
  private loadConfiguration(): DataValidationConfig {
    return {
      strictMode: process.env.DATA_STRICT_MODE === 'true',
      allowMockInProduction: process.env.ALLOW_MOCK_IN_PRODUCTION === 'true',
      requireRealDataSources: (
        process.env.REQUIRED_DATA_SOURCES || 'RealServerDataGenerator'
      ).split(','),
      warningThreshold: parseInt(process.env.DATA_WARNING_THRESHOLD || '3'),
    };
  }

  /**
   * 🌍 환경 확인
   */
  private isProductionEnvironment(): boolean {
    return (
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production'
    );
  }

  /**
   * 📝 검증 결과 로깅
   */
  private logValidationResult(result: DataValidationResult): void {
    const logLevel =
      result.errors.length > 0
        ? 'error'
        : result.warnings.length > 0
          ? 'warn'
          : 'info';

    const logMessage = {
      level: logLevel.toUpperCase(),
      message: '데이터 무결성 검증 결과',
      result,
      config: this.config,
    };

    if (logLevel === 'error') {
      console.error('🚨 DATA_INTEGRITY_ERROR:', logMessage);
    } else if (logLevel === 'warn') {
      console.warn('⚠️ DATA_INTEGRITY_WARNING:', logMessage);
    } else {
      console.log('✅ DATA_INTEGRITY_OK:', logMessage);
    }

    // 프로덕션에서 에러 발생시 추가 알림
    if (this.isProductionEnvironment() && result.errors.length > 0) {
      console.error('💀 PRODUCTION_DATA_ERROR: 즉시 조치 필요!', {
        errors: result.errors,
        actionRequired: result.actionRequired,
        timestamp: result.timestamp,
      });
    }
  }

  /**
   * 📈 검증 히스토리 조회
   */
  public getValidationHistory(): DataValidationResult[] {
    return this.validationHistory;
  }

  /**
   * 🧹 히스토리 정리
   */
  public clearHistory(): void {
    this.validationHistory = [];
  }

  /**
   * ⚠️ 경고 생성기
   */
  public createDataFallbackWarning(
    dataSource: string,
    fallbackReason: string
  ): object {
    return {
      level: 'CRITICAL',
      type: 'DATA_FALLBACK_WARNING',
      message: '서버 데이터 생성기 실패 - 목업 데이터 사용 중',
      dataSource,
      fallbackReason,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      actionRequired: '실제 데이터 소스 연결 필요',
      productionImpact: this.isProductionEnvironment() ? 'CRITICAL' : 'LOW',
    };
  }
}

// 전역 인스턴스 내보내기
export const dataIntegrityValidator = DataIntegrityValidator.getInstance();
