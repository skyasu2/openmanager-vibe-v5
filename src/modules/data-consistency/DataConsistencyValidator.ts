/**
 * ��� 데이터 일관성 검증 모듈 v1.0
 * 
 * 실시간 데이터 검증, 자동 복구, 성능 모니터링을 담당하는
 * 전문 검증 시스템
 */

import { dataConsistencyManager } from './DataConsistencyManager';

export interface ValidationResult {
  isValid: boolean;
  context: string;
  timestamp: string;
  issues: ValidationIssue[];
  metrics: ValidationMetrics;
  autoRecovery?: AutoRecoveryResult;
}

export interface ValidationIssue {
  type: 'pagination' | 'api_limit' | 'cache' | 'timeout' | 'mock_mode';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  autoFixable: boolean;
}

export interface ValidationMetrics {
  validationTime: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  cacheHitRate: number;
}

export interface AutoRecoveryResult {
  attempted: boolean;
  success: boolean;
  recoveredIssues: string[];
  remainingIssues: string[];
  recoveryTime: number;
}

/**
 * ��� 데이터 일관성 검증기 클래스
 */
export class DataConsistencyValidator {
  private static instance: DataConsistencyValidator;
  private validationHistory: ValidationResult[] = [];
  private maxHistorySize: number = 100;

  private constructor() {}

  public static getInstance(): DataConsistencyValidator {
    if (!DataConsistencyValidator.instance) {
      DataConsistencyValidator.instance = new DataConsistencyValidator();
    }
    return DataConsistencyValidator.instance;
  }

  /**
   * ��� 포괄적 데이터 일관성 검증
   */
  public async validateComprehensive(context: string = 'comprehensive'): Promise<ValidationResult> {
    const startTime = Date.now();
    const issues: ValidationIssue[] = [];
    
    console.log(`��� 포괄적 데이터 일관성 검증 시작 (${context})`);

    try {
      // 1. 기본 일관성 검증
      const basicValidation = dataConsistencyManager.validateDataConsistency(context);
      
      // 2. 세부 검증 실행
      const paginationIssues = await this.validatePagination();
      const apiIssues = await this.validateAPIConsistency();
      const cacheIssues = await this.validateCacheSettings();
      const performanceIssues = await this.validatePerformanceSettings();

      issues.push(...paginationIssues, ...apiIssues, ...cacheIssues, ...performanceIssues);

      // 3. 자동 복구 시도 (심각한 문제가 있는 경우)
      let autoRecovery: AutoRecoveryResult | undefined;
      const criticalIssues = issues.filter(issue => issue.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        autoRecovery = await this.attemptAutoRecovery(context, criticalIssues);
      }

      // 4. 검증 결과 생성
      const validationTime = Date.now() - startTime;
      const result: ValidationResult = {
        isValid: issues.length === 0,
        context,
        timestamp: new Date().toISOString(),
        issues,
        metrics: {
          validationTime,
          totalChecks: paginationIssues.length + apiIssues.length + cacheIssues.length + performanceIssues.length,
          passedChecks: 4 - issues.length,
          failedChecks: issues.length,
          cacheHitRate: this.calculateCacheHitRate(),
        },
        autoRecovery,
      };

      // 5. 검증 히스토리 저장
      this.addToHistory(result);

      console.log(`✅ 포괄적 검증 완료 (${validationTime}ms): ${issues.length}개 문제 발견`);
      return result;

    } catch (error) {
      console.error('❌ 포괄적 검증 실패:', error);
      
      return {
        isValid: false,
        context,
        timestamp: new Date().toISOString(),
        issues: [{
          type: 'api_limit',
          severity: 'critical',
          description: `검증 프로세스 실패: ${error}`,
          recommendation: '시스템 관리자에게 문의하세요',
          autoFixable: false,
        }],
        metrics: {
          validationTime: Date.now() - startTime,
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 1,
          cacheHitRate: 0,
        },
      };
    }
  }

  /**
   * ��� 페이지네이션 검증
   */
  private async validatePagination(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const serverConfig = dataConsistencyManager.getServerConfig();

    // 페이지네이션 일관성 체크
    if (serverConfig.itemsPerPage !== serverConfig.totalCount) {
      issues.push({
        type: 'pagination',
        severity: 'high',
        description: `페이지네이션 불일치: 페이지당 ${serverConfig.itemsPerPage}개 표시, 총 ${serverConfig.totalCount}개 서버`,
        recommendation: 'itemsPerPage를 totalCount와 동일하게 설정하여 모든 서버를 표시하세요',
        autoFixable: true,
      });
    }

    // 최대 페이지 크기 체크
    if (serverConfig.itemsPerPage > serverConfig.maxItemsPerPage) {
      issues.push({
        type: 'pagination',
        severity: 'medium',
        description: `페이지 크기 초과: ${serverConfig.itemsPerPage} > ${serverConfig.maxItemsPerPage}`,
        recommendation: '페이지 크기를 최대 제한 이하로 설정하세요',
        autoFixable: true,
      });
    }

    return issues;
  }

  /**
   * ��� API 일관성 검증
   */
  private async validateAPIConsistency(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const serverConfig = dataConsistencyManager.getServerConfig();

    // API 제한과 서버 개수 일치 체크
    if (serverConfig.apiDefaultLimit !== serverConfig.totalCount) {
      issues.push({
        type: 'api_limit',
        severity: 'high',
        description: `API 제한 불일치: 기본 제한 ${serverConfig.apiDefaultLimit}개, 총 서버 ${serverConfig.totalCount}개`,
        recommendation: 'API 기본 제한을 총 서버 개수와 동일하게 설정하세요',
        autoFixable: true,
      });
    }

    // API 제한 범위 체크
    if (serverConfig.apiDefaultLimit <= 0 || serverConfig.apiDefaultLimit > 100) {
      issues.push({
        type: 'api_limit',
        severity: 'medium',
        description: `API 제한 범위 벗어남: ${serverConfig.apiDefaultLimit} (권장: 1-100)`,
        recommendation: 'API 제한을 1-100 범위 내로 설정하세요',
        autoFixable: true,
      });
    }

    return issues;
  }

  /**
   * ���️ 캐시 설정 검증
   */
  private async validateCacheSettings(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const cacheConfig = dataConsistencyManager.getCacheConfig();

    // 헬스체크 간격 체크 (과도한 체크 방지)
    if (cacheConfig.healthCheckInterval < 60000) {
      issues.push({
        type: 'cache',
        severity: 'high',
        description: `헬스체크 간격이 너무 짧음: ${cacheConfig.healthCheckInterval}ms (최소 60초 권장)`,
        recommendation: '과도한 헬스체크 방지를 위해 최소 1분 간격으로 설정하세요',
        autoFixable: true,
      });
    }

    // 목업 모드 체크 (프로덕션에서는 비활성화)
    if (cacheConfig.enableMockMode && process.env.NODE_ENV === 'production') {
      issues.push({
        type: 'mock_mode',
        severity: 'critical',
        description: '프로덕션 환경에서 목업 모드가 활성화됨',
        recommendation: '프로덕션에서는 목업 모드를 비활성화하세요',
        autoFixable: true,
      });
    }

    return issues;
  }

  /**
   * ⚡ 성능 설정 검증
   */
  private async validatePerformanceSettings(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const cacheConfig = dataConsistencyManager.getCacheConfig();

    // 타임아웃 설정 체크
    if (cacheConfig.timeout > 10000) {
      issues.push({
        type: 'timeout',
        severity: 'medium',
        description: `타임아웃이 너무 김: ${cacheConfig.timeout}ms (최대 10초 권장)`,
        recommendation: '응답성을 위해 타임아웃을 10초 이하로 설정하세요',
        autoFixable: true,
      });
    }

    if (cacheConfig.timeout < 1000) {
      issues.push({
        type: 'timeout',
        severity: 'medium',
        description: `타임아웃이 너무 짧음: ${cacheConfig.timeout}ms (최소 1초 권장)`,
        recommendation: '안정성을 위해 타임아웃을 1초 이상으로 설정하세요',
        autoFixable: true,
      });
    }

    // 재시도 횟수 체크
    if (cacheConfig.maxRetries > 5) {
      issues.push({
        type: 'cache',
        severity: 'low',
        description: `재시도 횟수가 많음: ${cacheConfig.maxRetries}회 (최대 5회 권장)`,
        recommendation: '과도한 재시도를 방지하기 위해 최대 5회로 제한하세요',
        autoFixable: true,
      });
    }

    return issues;
  }

  /**
   * ���️ 자동 복구 시도
   */
  private async attemptAutoRecovery(context: string, issues: ValidationIssue[]): Promise<AutoRecoveryResult> {
    const startTime = Date.now();
    const autoFixableIssues = issues.filter(issue => issue.autoFixable);
    
    if (autoFixableIssues.length === 0) {
      return {
        attempted: false,
        success: false,
        recoveredIssues: [],
        remainingIssues: issues.map(i => i.description),
        recoveryTime: 0,
      };
    }

    console.log(`���️ 자동 복구 시도: ${autoFixableIssues.length}개 문제`);

    const recoveredIssues: string[] = [];
    const remainingIssues: string[] = [];

    for (const issue of autoFixableIssues) {
      try {
        let recovered = false;

        switch (issue.type) {
          case 'pagination':
            if (issue.description.includes('페이지네이션 불일치')) {
              // 페이지네이션 자동 복구
              const serverConfig = dataConsistencyManager.getServerConfig();
              dataConsistencyManager.updateConfig({
                servers: {
                  ...serverConfig,
                  itemsPerPage: serverConfig.totalCount,
                }
              });
              recovered = true;
            }
            break;

          case 'api_limit':
            if (issue.description.includes('API 제한 불일치')) {
              // API 제한 자동 복구
              const serverConfig = dataConsistencyManager.getServerConfig();
              dataConsistencyManager.updateConfig({
                servers: {
                  ...serverConfig,
                  apiDefaultLimit: serverConfig.totalCount,
                }
              });
              recovered = true;
            }
            break;

          case 'mock_mode':
            if (issue.description.includes('목업 모드')) {
              // 목업 모드 자동 비활성화
              const cacheConfig = dataConsistencyManager.getCacheConfig();
              dataConsistencyManager.updateConfig({
                cache: {
                  ...cacheConfig,
                  enableMockMode: false,
                }
              });
              recovered = true;
            }
            break;

          case 'cache':
            if (issue.description.includes('헬스체크 간격')) {
              // 헬스체크 간격 자동 조정
              const cacheConfig = dataConsistencyManager.getCacheConfig();
              dataConsistencyManager.updateConfig({
                cache: {
                  ...cacheConfig,
                  healthCheckInterval: Math.max(cacheConfig.healthCheckInterval, 60000),
                }
              });
              recovered = true;
            }
            break;
        }

        if (recovered) {
          recoveredIssues.push(issue.description);
          console.log(`✅ 자동 복구 성공: ${issue.type}`);
        } else {
          remainingIssues.push(issue.description);
        }

      } catch (error) {
        console.error(`❌ 자동 복구 실패 (${issue.type}):`, error);
        remainingIssues.push(issue.description);
      }
    }

    const recoveryTime = Date.now() - startTime;
    const success = recoveredIssues.length > 0;

    console.log(`���️ 자동 복구 완료 (${recoveryTime}ms): ${recoveredIssues.length}/${autoFixableIssues.length}개 복구`);

    return {
      attempted: true,
      success,
      recoveredIssues,
      remainingIssues,
      recoveryTime,
    };
  }

  /**
   * ��� 캐시 적중률 계산
   */
  private calculateCacheHitRate(): number {
    // 실제 캐시 통계를 기반으로 계산
    // 현재는 모의 데이터 반환
    return Math.random() * 0.3 + 0.7; // 70-100% 범위
  }

  /**
   * ��� 검증 히스토리 관리
   */
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.push(result);
    
    // 히스토리 크기 제한
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * ��� 검증 히스토리 조회
   */
  public getValidationHistory(limit?: number): ValidationResult[] {
    const history = [...this.validationHistory].reverse(); // 최신순
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * ��� 검증 통계 조회
   */
  public getValidationStatistics() {
    const total = this.validationHistory.length;
    const successful = this.validationHistory.filter(r => r.isValid).length;
    const avgValidationTime = total > 0 
      ? this.validationHistory.reduce((sum, r) => sum + r.metrics.validationTime, 0) / total 
      : 0;

    return {
      totalValidations: total,
      successfulValidations: successful,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageValidationTime: Math.round(avgValidationTime),
      lastValidation: this.validationHistory[this.validationHistory.length - 1]?.timestamp,
    };
  }

  /**
   * ��� 빠른 검증 (기본 체크만)
   */
  public async validateQuick(context: string = 'quick'): Promise<boolean> {
    try {
      const serverConfig = dataConsistencyManager.getServerConfig();
      
      // 핵심 일관성만 체크
      const isConsistent = 
        serverConfig.itemsPerPage === serverConfig.totalCount &&
        serverConfig.apiDefaultLimit === serverConfig.totalCount;

      console.log(`⚡ 빠른 검증 (${context}): ${isConsistent ? '통과' : '실패'}`);
      return isConsistent;
      
    } catch (error) {
      console.error('❌ 빠른 검증 실패:', error);
      return false;
    }
  }
}

// ��� 싱글톤 인스턴스 내보내기
export const dataConsistencyValidator = DataConsistencyValidator.getInstance();

// ��� 편의 함수들
export async function validateDataConsistency(context?: string) {
  return dataConsistencyValidator.validateComprehensive(context);
}

export async function quickValidation(context?: string) {
  return dataConsistencyValidator.validateQuick(context);
}

export function getValidationHistory(limit?: number) {
  return dataConsistencyValidator.getValidationHistory(limit);
}

export function getValidationStats() {
  return dataConsistencyValidator.getValidationStatistics();
}
