/**
 * 🔄 자동 복구 엔진 
 * 4단계 복구 전략: Immediate → Quick → Deep → Emergency
 * 목표: 99.5% 복구 성공률
 */

import { ErrorDetails } from './error-tracker';

// 복구 전략 레벨
export type RecoveryLevel = 'immediate' | 'quick' | 'deep' | 'emergency';

// 복구 액션 타입
export interface RecoveryAction {
  id: string;
  level: RecoveryLevel;
  type: 'restart' | 'reset' | 'reconfigure' | 'failover' | 'rollback' | 'scale';
  target: string; // 대상 컴포넌트/서비스
  description: string;
  estimatedTime: number; // 예상 소요 시간 (초)
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  rollbackAction?: RecoveryAction;
}

// 복구 결과
export interface RecoveryResult {
  actionId: string;
  success: boolean;
  startTime: number;
  endTime: number;
  actualTime: number;
  errorMessage?: string;
  metrics: {
    systemHealthBefore: number; // 0-100
    systemHealthAfter: number;  // 0-100
    affectedServices: string[];
    recoveredServices: string[];
  };
}

// 복구 계획
export interface RecoveryPlan {
  errorId: string;
  actions: RecoveryAction[];
  estimatedTotalTime: number;
  successProbability: number; // 0-100
  riskAssessment: 'low' | 'medium' | 'high' | 'critical';
}

export class AutoRecoveryEngine {
  private recoveryHistory: Map<string, RecoveryResult[]> = new Map();
  private activeRecoveries: Set<string> = new Set();
  private recoveryStrategies: Map<string, RecoveryAction[]> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
  }

  // 🎯 메인 복구 실행 메서드
  async executeRecoveryPlan(error: ErrorDetails): Promise<RecoveryResult[]> {
    const plan = this.createRecoveryPlan(error);
    const results: RecoveryResult[] = [];

    console.log(`🔄 복구 계획 실행 시작: ${error.id} (${plan.actions.length}단계)`);

    for (const action of plan.actions) {
      if (this.activeRecoveries.has(action.target)) {
        console.warn(`⚠️ ${action.target} 이미 복구 진행 중, 스킵`);
        continue;
      }

      const result = await this.executeRecoveryAction(action);
      results.push(result);

      // 복구 성공 시 다음 단계로, 실패 시 롤백 고려
      if (result.success) {
        console.log(`✅ 복구 성공: ${action.description}`);
        
        // 시스템 상태 검증
        const isSystemHealthy = await this.validateRecoverySuccess(action, result);
        if (isSystemHealthy) {
          console.log(`🎉 시스템 상태 정상화 완료`);
          break; // 복구 완료
        }
      } else {
        console.error(`❌ 복구 실패: ${action.description} - ${result.errorMessage}`);
        
        // 롤백 실행
        if (action.rollbackAction) {
          console.log(`🔙 롤백 실행: ${action.rollbackAction.description}`);
          const rollbackResult = await this.executeRecoveryAction(action.rollbackAction);
          results.push(rollbackResult);
        }
      }
    }

    // 복구 이력 저장
    this.recordRecoveryHistory(error.id, results);
    
    return results;
  }

  // 🔧 개별 복구 액션 실행
  private async executeRecoveryAction(action: RecoveryAction): Promise<RecoveryResult> {
    const startTime = Date.now();
    this.activeRecoveries.add(action.target);

    console.log(`🔧 복구 액션 실행: ${action.description} (${action.target})`);

    try {
      // 사전 조건 검사
      const prerequisiteCheck = await this.checkPrerequisites(action);
      if (!prerequisiteCheck.success) {
        throw new Error(`사전 조건 미충족: ${prerequisiteCheck.reason}`);
      }

      // 복구 액션별 실행 로직
      let success = false;
      let errorMessage: string | undefined;

      switch (action.type) {
        case 'restart':
          success = await this.performRestart(action.target);
          break;
        case 'reset':
          success = await this.performReset(action.target);
          break;
        case 'reconfigure':
          success = await this.performReconfigure(action.target);
          break;
        case 'failover':
          success = await this.performFailover(action.target);
          break;
        case 'rollback':
          success = await this.performRollback(action.target);
          break;
        case 'scale':
          success = await this.performScale(action.target);
          break;
        default:
          throw new Error(`알 수 없는 복구 액션 타입: ${action.type}`);
      }

      const endTime = Date.now();
      const actualTime = endTime - startTime;

      // 시스템 상태 측정
      const healthBefore = await this.measureSystemHealth(action.target);
      await this.waitForStabilization(2000); // 2초 대기
      const healthAfter = await this.measureSystemHealth(action.target);

      const result: RecoveryResult = {
        actionId: action.id,
        success,
        startTime,
        endTime,
        actualTime,
        errorMessage,
        metrics: {
          systemHealthBefore: healthBefore,
          systemHealthAfter: healthAfter,
          affectedServices: [action.target],
          recoveredServices: success ? [action.target] : [],
        },
      };

      return result;

    } catch (error) {
      const endTime = Date.now();
      return {
        actionId: action.id,
        success: false,
        startTime,
        endTime,
        actualTime: endTime - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          systemHealthBefore: 0,
          systemHealthAfter: 0,
          affectedServices: [action.target],
          recoveredServices: [],
        },
      };
    } finally {
      this.activeRecoveries.delete(action.target);
    }
  }

  // 🔍 복구 성공 검증
  private async validateRecoverySuccess(
    action: RecoveryAction,
    result: RecoveryResult
  ): Promise<boolean> {
    // 기본 성공 조건
    if (!result.success) return false;

    // 시스템 상태 개선 확인
    const healthImprovement = result.metrics.systemHealthAfter - result.metrics.systemHealthBefore;
    if (healthImprovement < 10) {
      console.warn(`⚠️ 시스템 상태 개선 미미: ${healthImprovement}%`);
      return false;
    }

    // 타겟 서비스 상태 확인
    const targetHealth = await this.checkServiceHealth(action.target);
    if (targetHealth < 80) {
      console.warn(`⚠️ 타겟 서비스 상태 불량: ${action.target} (${targetHealth}%)`);
      return false;
    }

    // 의존성 서비스 영향 확인
    const dependencyCheck = await this.checkDependencyHealth(action.target);
    if (!dependencyCheck.allHealthy) {
      console.warn(`⚠️ 의존성 서비스 영향: ${dependencyCheck.unhealthyServices.join(', ')}`);
      return false;
    }

    console.log(`✅ 복구 검증 완료: ${action.target} (상태: ${targetHealth}%)`);
    return true;
  }

  // 📋 복구 계획 생성
  createRecoveryPlan(error: ErrorDetails): RecoveryPlan {
    const strategies = this.selectRecoveryStrategies(error);
    const actions: RecoveryAction[] = [];

    // 에러 심각도별 복구 전략 선택
    if (error.metrics.severity === 'critical') {
      // Immediate → Emergency 순서
      actions.push(...this.getImmediateActions(error));
      actions.push(...this.getEmergencyActions(error));
    } else if (error.metrics.severity === 'high') {
      // Immediate → Quick → Deep 순서
      actions.push(...this.getImmediateActions(error));
      actions.push(...this.getQuickActions(error));
      actions.push(...this.getDeepActions(error));
    } else {
      // Quick → Deep 순서
      actions.push(...this.getQuickActions(error));
      actions.push(...this.getDeepActions(error));
    }

    const estimatedTotalTime = actions.reduce(
      (total, action) => total + action.estimatedTime,
      0
    );

    // 성공 확률 계산 (이력 기반)
    const successProbability = this.calculateSuccessProbability(error, actions);

    return {
      errorId: error.id,
      actions,
      estimatedTotalTime,
      successProbability,
      riskAssessment: this.assessOverallRisk(actions),
    };
  }

  // 🔧 복구 액션 구현부
  private async performRestart(target: string): Promise<boolean> {
    console.log(`🔄 서비스 재시작: ${target}`);
    
    try {
      // 실제 환경에서는 해당 서비스/컴포넌트 재시작 로직
      await this.simulateAsyncOperation(2000 + Math.random() * 3000);
      
      // 90% 성공률 시뮬레이션
      return Math.random() > 0.1;
    } catch (error) {
      console.error(`❌ 재시작 실패: ${target}`, error);
      return false;
    }
  }

  private async performReset(target: string): Promise<boolean> {
    console.log(`♻️ 시스템 리셋: ${target}`);
    
    try {
      await this.simulateAsyncOperation(1000 + Math.random() * 2000);
      return Math.random() > 0.15; // 85% 성공률
    } catch (error) {
      console.error(`❌ 리셋 실패: ${target}`, error);
      return false;
    }
  }

  private async performReconfigure(target: string): Promise<boolean> {
    console.log(`⚙️ 설정 재구성: ${target}`);
    
    try {
      await this.simulateAsyncOperation(3000 + Math.random() * 5000);
      return Math.random() > 0.2; // 80% 성공률
    } catch (error) {
      console.error(`❌ 재구성 실패: ${target}`, error);
      return false;
    }
  }

  private async performFailover(target: string): Promise<boolean> {
    console.log(`🔄 페일오버: ${target}`);
    
    try {
      await this.simulateAsyncOperation(5000 + Math.random() * 5000);
      return Math.random() > 0.05; // 95% 성공률 (가장 안정적)
    } catch (error) {
      console.error(`❌ 페일오버 실패: ${target}`, error);
      return false;
    }
  }

  private async performRollback(target: string): Promise<boolean> {
    console.log(`🔙 롤백: ${target}`);
    
    try {
      await this.simulateAsyncOperation(4000 + Math.random() * 4000);
      return Math.random() > 0.1; // 90% 성공률
    } catch (error) {
      console.error(`❌ 롤백 실패: ${target}`, error);
      return false;
    }
  }

  private async performScale(target: string): Promise<boolean> {
    console.log(`📈 스케일링: ${target}`);
    
    try {
      await this.simulateAsyncOperation(8000 + Math.random() * 7000);
      return Math.random() > 0.25; // 75% 성공률
    } catch (error) {
      console.error(`❌ 스케일링 실패: ${target}`, error);
      return false;
    }
  }

  // 🔍 복구 전략 초기화
  private initializeRecoveryStrategies(): void {
    // AI 서비스 복구 전략
    this.recoveryStrategies.set('ai-service', [
      {
        id: 'ai-restart-immediate',
        level: 'immediate',
        type: 'restart',
        target: 'ai-service',
        description: 'AI 서비스 즉시 재시작',
        estimatedTime: 30,
        riskLevel: 'low',
        prerequisites: [],
      },
      {
        id: 'ai-reset-quick',
        level: 'quick',
        type: 'reset',
        target: 'ai-service',
        description: 'AI 엔진 상태 리셋',
        estimatedTime: 60,
        riskLevel: 'medium',
        prerequisites: ['backup-created'],
      },
    ]);

    // 데이터베이스 복구 전략
    this.recoveryStrategies.set('database', [
      {
        id: 'db-connection-reset',
        level: 'immediate',
        type: 'reset',
        target: 'database',
        description: '데이터베이스 연결 풀 리셋',
        estimatedTime: 15,
        riskLevel: 'low',
        prerequisites: [],
      },
      {
        id: 'db-failover',
        level: 'deep',
        type: 'failover',
        target: 'database',
        description: '데이터베이스 페일오버',
        estimatedTime: 300,
        riskLevel: 'high',
        prerequisites: ['backup-verified', 'standby-ready'],
      },
    ]);

    // 네트워크 복구 전략
    this.recoveryStrategies.set('network', [
      {
        id: 'network-retry',
        level: 'immediate',
        type: 'reconfigure',
        target: 'network',
        description: '네트워크 연결 재시도',
        estimatedTime: 10,
        riskLevel: 'low',
        prerequisites: [],
      },
    ]);
  }

  // Helper methods
  private selectRecoveryStrategies(error: ErrorDetails): RecoveryAction[] {
    const component = error.context.operation.split('.')[0] || 'unknown';
    return this.recoveryStrategies.get(component) || [];
  }

  private getImmediateActions(error: ErrorDetails): RecoveryAction[] {
    return this.selectRecoveryStrategies(error).filter(
      action => action.level === 'immediate'
    );
  }

  private getQuickActions(error: ErrorDetails): RecoveryAction[] {
    return this.selectRecoveryStrategies(error).filter(
      action => action.level === 'quick'
    );
  }

  private getDeepActions(error: ErrorDetails): RecoveryAction[] {
    return this.selectRecoveryStrategies(error).filter(
      action => action.level === 'deep'
    );
  }

  private getEmergencyActions(error: ErrorDetails): RecoveryAction[] {
    return this.selectRecoveryStrategies(error).filter(
      action => action.level === 'emergency'
    );
  }

  private calculateSuccessProbability(
    error: ErrorDetails,
    actions: RecoveryAction[]
  ): number {
    const history = this.recoveryHistory.get(error.error.type) || [];
    if (history.length === 0) return 70; // 기본값

    const successCount = history.filter(result => result.success).length;
    return Math.round((successCount / history.length) * 100);
  }

  private assessOverallRisk(actions: RecoveryAction[]): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskCount = actions.filter(action => action.riskLevel === 'high').length;
    const mediumRiskCount = actions.filter(action => action.riskLevel === 'medium').length;

    if (highRiskCount > 2) return 'critical';
    if (highRiskCount > 0) return 'high';
    if (mediumRiskCount > 1) return 'medium';
    return 'low';
  }

  private async checkPrerequisites(
    action: RecoveryAction
  ): Promise<{ success: boolean; reason?: string }> {
    for (const prerequisite of action.prerequisites) {
      const isReady = await this.checkPrerequisite(prerequisite);
      if (!isReady) {
        return { success: false, reason: `사전 조건 미충족: ${prerequisite}` };
      }
    }
    return { success: true };
  }

  private async checkPrerequisite(prerequisite: string): Promise<boolean> {
    // 실제 환경에서는 각 사전 조건별 확인 로직
    await this.simulateAsyncOperation(100);
    return Math.random() > 0.1; // 90% 확률로 사전 조건 충족
  }

  private async measureSystemHealth(target: string): Promise<number> {
    await this.simulateAsyncOperation(500);
    return Math.floor(Math.random() * 40) + 60; // 60-100 범위
  }

  private async checkServiceHealth(target: string): Promise<number> {
    await this.simulateAsyncOperation(300);
    return Math.floor(Math.random() * 30) + 70; // 70-100 범위
  }

  private async checkDependencyHealth(
    target: string
  ): Promise<{ allHealthy: boolean; unhealthyServices: string[] }> {
    await this.simulateAsyncOperation(200);
    
    // 80% 확률로 모든 의존성 서비스가 정상
    const allHealthy = Math.random() > 0.2;
    const unhealthyServices = allHealthy ? [] : ['dependency-service-1'];
    
    return { allHealthy, unhealthyServices };
  }

  private async waitForStabilization(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateAsyncOperation(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordRecoveryHistory(errorId: string, results: RecoveryResult[]): void {
    const errorType = errorId.split('-')[0] || 'unknown';
    
    if (!this.recoveryHistory.has(errorType)) {
      this.recoveryHistory.set(errorType, []);
    }
    
    this.recoveryHistory.get(errorType)!.push(...results);
  }

  // 📊 공개 메서드들
  getRecoveryStatistics(): {
    totalRecoveries: number;
    successRate: number;
    averageRecoveryTime: number;
    mostCommonErrors: string[];
  } {
    let totalRecoveries = 0;
    let successfulRecoveries = 0;
    let totalTime = 0;
    const errorCounts = new Map<string, number>();

    for (const [errorType, results] of this.recoveryHistory.entries()) {
      totalRecoveries += results.length;
      successfulRecoveries += results.filter(r => r.success).length;
      totalTime += results.reduce((sum, r) => sum + r.actualTime, 0);
      
      errorCounts.set(errorType, results.length);
    }

    const successRate = totalRecoveries > 0 ? (successfulRecoveries / totalRecoveries) * 100 : 0;
    const averageRecoveryTime = totalRecoveries > 0 ? totalTime / totalRecoveries : 0;
    
    const mostCommonErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([errorType]) => errorType);

    return {
      totalRecoveries,
      successRate: Math.round(successRate),
      averageRecoveryTime: Math.round(averageRecoveryTime),
      mostCommonErrors,
    };
  }

  isRecoveryInProgress(target: string): boolean {
    return this.activeRecoveries.has(target);
  }

  getActiveRecoveries(): string[] {
    return Array.from(this.activeRecoveries);
  }
}