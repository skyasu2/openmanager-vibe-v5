/**
 * ��� 데이터 일관성 관리 모듈 v1.0
 * 
 * 프론트엔드-백엔드 간 데이터 불일치 문제를 원천적으로 해결하는
 * 중앙집중식 데이터 일관성 관리 시스템
 */

import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';

export interface DataConsistencyConfig {
  // 서버 데이터 설정
  servers: {
    totalCount: number;           // 총 서버 개수
    itemsPerPage: number;         // 페이지당 표시 개수
    apiDefaultLimit: number;      // API 기본 제한
    maxItemsPerPage: number;      // 최대 페이지 크기
  };
  
  // 캐시 및 성능 설정
  cache: {
    enableMockMode: boolean;      // 목업 모드 활성화
    healthCheckInterval: number;  // 헬스체크 간격 (과도한 체크 방지)
    dataRefreshInterval: number;  // 데이터 새로고침 간격
    maxRetries: number;           // 최대 재시도 횟수
    timeout: number;              // 타임아웃 설정
  };
  
  // 검증 및 모니터링 설정
  validation: {
    enableRuntimeCheck: boolean;  // 런타임 데이터 검증
    enableBuildTimeCheck: boolean; // 빌드 타임 검증
    logInconsistencies: boolean;  // 불일치 로깅
    alertOnInconsistency: boolean; // 불일치 시 알림
  };

  // 자동 복구 설정
  autoRecovery: {
    enabled: boolean;             // 자동 복구 활성화
    maxAttempts: number;          // 최대 복구 시도 횟수
    backoffDelay: number;         // 재시도 지연 시간
  };
}

/**
 * �� 데이터 일관성 관리자 클래스
 */
export class DataConsistencyManager {
  private static instance: DataConsistencyManager;
  private config: DataConsistencyConfig;
  private inconsistencyCount: number = 0;
  private lastValidationTime: number = 0;
  private validationCache: Map<string, { result: boolean; timestamp: number }> = new Map();

  private constructor() {
    this.config = this.loadConfiguration();
    this.initializeValidation();
  }

  public static getInstance(): DataConsistencyManager {
    if (!DataConsistencyManager.instance) {
      DataConsistencyManager.instance = new DataConsistencyManager();
    }
    return DataConsistencyManager.instance;
  }

  /**
   * ��� 설정 로드
   */
  private loadConfiguration(): DataConsistencyConfig {
    return {
      servers: {
        totalCount: ACTIVE_SERVER_CONFIG.maxServers,     // 15개 (중앙 설정)
        itemsPerPage: ACTIVE_SERVER_CONFIG.maxServers,   // 15개로 통일
        apiDefaultLimit: ACTIVE_SERVER_CONFIG.maxServers, // 15개로 통일
        maxItemsPerPage: 50,                             // 최대 50개
      },
      
      cache: {
        enableMockMode: false,                           // 실제 데이터 사용
        healthCheckInterval: 300000,                     // 5분 간격
        dataRefreshInterval: ACTIVE_SERVER_CONFIG.cache.updateInterval,
        maxRetries: 2,                                   // 최대 2회 재시도
        timeout: 3000,                                   // 3초 타임아웃
      },
      
      validation: {
        enableRuntimeCheck: process.env.NODE_ENV === 'development',
        enableBuildTimeCheck: true,
        logInconsistencies: process.env.NODE_ENV === 'development',
        alertOnInconsistency: process.env.NODE_ENV === 'production',
      },

      autoRecovery: {
        enabled: true,
        maxAttempts: 3,
        backoffDelay: 1000,                              // 1초 지연
      },
    };
  }

  /**
   * ��� 데이터 일관성 검증
   */
  public validateDataConsistency(context: string = 'general'): {
    isConsistent: boolean;
    issues: string[];
    recommendations: string[];
    metrics: {
      totalChecks: number;
      failedChecks: number;
      lastCheck: string;
    };
  } {
    const cacheKey = `validation_${context}`;
    const now = Date.now();
    
    // 캐시 확인 (1분 이내는 캐시 사용)
    const cached = this.validationCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < 60000) {
      return {
        isConsistent: cached.result,
        issues: [],
        recommendations: [],
        metrics: {
          totalChecks: this.inconsistencyCount,
          failedChecks: this.inconsistencyCount,
          lastCheck: new Date(cached.timestamp).toISOString(),
        }
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // 1. 서버 개수 일관성 체크
    if (this.config.servers.itemsPerPage !== this.config.servers.totalCount) {
      issues.push(`페이지네이션 불일치: itemsPerPage(${this.config.servers.itemsPerPage}) !== totalCount(${this.config.servers.totalCount})`);
      recommendations.push('itemsPerPage를 totalCount와 동일하게 설정하여 모든 서버가 표시되도록 하세요');
    }
    
    if (this.config.servers.apiDefaultLimit !== this.config.servers.totalCount) {
      issues.push(`API 제한 불일치: apiDefaultLimit(${this.config.servers.apiDefaultLimit}) !== totalCount(${this.config.servers.totalCount})`);
      recommendations.push('API 기본 제한을 총 서버 개수와 동일하게 설정하세요');
    }
    
    // 2. 캐시 설정 체크
    if (this.config.cache.healthCheckInterval < 60000) {
      issues.push(`헬스체크 간격이 너무 짧음: ${this.config.cache.healthCheckInterval}ms < 60초`);
      recommendations.push('과도한 헬스체크 방지를 위해 최소 1분 간격으로 설정하세요');
    }

    // 3. 타임아웃 설정 체크
    if (this.config.cache.timeout > 10000) {
      issues.push(`타임아웃이 너무 김: ${this.config.cache.timeout}ms > 10초`);
      recommendations.push('응답성을 위해 타임아웃을 10초 이하로 설정하세요');
    }

    const isConsistent = issues.length === 0;
    
    // 캐시 업데이트
    this.validationCache.set(cacheKey, { result: isConsistent, timestamp: now });
    this.lastValidationTime = now;
    
    if (!isConsistent) {
      this.inconsistencyCount++;
      
      if (this.config.validation.logInconsistencies) {
        console.warn(`⚠️ 데이터 일관성 문제 발견 (${context}):`, issues);
      }
      
      if (this.config.validation.alertOnInconsistency) {
        this.triggerInconsistencyAlert(context, issues);
      }
    }

    return {
      isConsistent,
      issues,
      recommendations,
      metrics: {
        totalChecks: this.inconsistencyCount,
        failedChecks: this.inconsistencyCount,
        lastCheck: new Date(now).toISOString(),
      },
    };
  }

  /**
   * ���️ 자동 복구 시도
   */
  public async attemptAutoRecovery(context: string, issues: string[]): Promise<{
    success: boolean;
    recoveredIssues: string[];
    remainingIssues: string[];
  }> {
    if (!this.config.autoRecovery.enabled) {
      return { success: false, recoveredIssues: [], remainingIssues: issues };
    }

    const recoveredIssues: string[] = [];
    const remainingIssues: string[] = [];

    for (const issue of issues) {
      let recovered = false;
      
      for (let attempt = 1; attempt <= this.config.autoRecovery.maxAttempts; attempt++) {
        try {
          // 페이지네이션 불일치 자동 복구
          if (issue.includes('페이지네이션 불일치')) {
            this.config.servers.itemsPerPage = this.config.servers.totalCount;
            recovered = true;
          }
          
          // API 제한 불일치 자동 복구
          if (issue.includes('API 제한 불일치')) {
            this.config.servers.apiDefaultLimit = this.config.servers.totalCount;
            recovered = true;
          }
          
          if (recovered) {
            recoveredIssues.push(issue);
            console.log(`✅ 자동 복구 성공 (시도 ${attempt}/${this.config.autoRecovery.maxAttempts}): ${issue}`);
            break;
          }
        } catch (error) {
          console.warn(`❌ 자동 복구 실패 (시도 ${attempt}/${this.config.autoRecovery.maxAttempts}):`, error);
          
          if (attempt < this.config.autoRecovery.maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, this.config.autoRecovery.backoffDelay * attempt));
          }
        }
      }
      
      if (!recovered) {
        remainingIssues.push(issue);
      }
    }

    return {
      success: recoveredIssues.length > 0,
      recoveredIssues,
      remainingIssues,
    };
  }

  /**
   * ��� 불일치 알림 트리거
   */
  private triggerInconsistencyAlert(context: string, issues: string[]): void {
    // 프로덕션 환경에서는 실제 알림 시스템과 연동
    if (process.env.NODE_ENV === 'production') {
      console.error(`��� 데이터 일관성 알림 (${context}):`, issues);
      // TODO: Slack, 이메일 등 실제 알림 시스템 연동
    }
  }

  /**
   * ��� 설정값 조회 메서드들
   */
  public getServerConfig() {
    return this.config.servers;
  }

  public getCacheConfig() {
    return this.config.cache;
  }

  public getValidationConfig() {
    return this.config.validation;
  }

  public getAutoRecoveryConfig() {
    return this.config.autoRecovery;
  }

  /**
   * ��� 설정 업데이트
   */
  public updateConfig(updates: Partial<DataConsistencyConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validationCache.clear(); // 캐시 초기화
    
    if (this.config.validation.logInconsistencies) {
      console.log('��� 데이터 일관성 설정 업데이트:', updates);
    }
  }

  /**
   * ��� 통계 조회
   */
  public getStatistics() {
    return {
      totalValidations: this.inconsistencyCount,
      lastValidationTime: this.lastValidationTime,
      cacheSize: this.validationCache.size,
      config: this.config,
    };
  }

  /**
   * ��� 초기화 시 검증
   */
  private initializeValidation(): void {
    if (this.config.validation.enableRuntimeCheck) {
      // 초기 검증 실행
      const validation = this.validateDataConsistency('initialization');
      
      if (!validation.isConsistent && this.config.autoRecovery.enabled) {
        // 자동 복구 시도
        this.attemptAutoRecovery('initialization', validation.issues);
      }
      
      if (this.config.validation.logInconsistencies) {
        this.logInitializationStatus(validation);
      }
    }
  }

  /**
   * ��� 초기화 상태 로깅
   */
  private logInitializationStatus(validation: any): void {
    console.log('��� 데이터 일관성 관리자 초기화 완료');
    console.log(`  ��� 서버 총 개수: ${this.config.servers.totalCount}개`);
    console.log(`  ��� 페이지당 표시: ${this.config.servers.itemsPerPage}개`);
    console.log(`  ��� API 기본 제한: ${this.config.servers.apiDefaultLimit}개`);
    console.log(`  ��� 목업 모드: ${this.config.cache.enableMockMode ? '활성화' : '비활성화'}`);
    console.log(`  ⏱️ 헬스체크 간격: ${this.config.cache.healthCheckInterval / 1000}초`);
    console.log(`  ���️ 자동 복구: ${this.config.autoRecovery.enabled ? '활성화' : '비활성화'}`);
    
    if (validation.isConsistent) {
      console.log('✅ 데이터 일관성 검증 통과');
    } else {
      console.warn('⚠️ 데이터 일관성 문제 발견:', validation.issues.length, '개');
    }
  }
}

// ��� 싱글톤 인스턴스 내보내기
export const dataConsistencyManager = DataConsistencyManager.getInstance();

// ��� 편의 함수들
export function validateConsistency(context?: string) {
  return dataConsistencyManager.validateDataConsistency(context);
}

export function getServerSettings() {
  return dataConsistencyManager.getServerConfig();
}

export function getCacheSettings() {
  return dataConsistencyManager.getCacheConfig();
}

export function getSafeHealthCheckConfig() {
  const cache = dataConsistencyManager.getCacheConfig();
  return {
    interval: cache.healthCheckInterval,
    enableMockMode: cache.enableMockMode,
    maxRetries: cache.maxRetries,
    timeout: cache.timeout,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTime: 300000,
  };
}
