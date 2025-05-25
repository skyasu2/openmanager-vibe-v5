/**
 * Action Executor
 * 
 * ⚡ AI 액션 실행 시스템
 * - 의도 기반 액션 추출
 * - 우선순위 기반 액션 정렬
 * - 시뮬레이션 기반 액션 실행
 */

import { Intent } from './IntentClassifier';
import { GeneratedResponse } from './ResponseGenerator';

export interface Action {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  executable: boolean;
  estimatedDuration?: number; // 초 단위
}

export type ActionType = 
  | 'server_restart'
  | 'service_restart'
  | 'log_download'
  | 'alert_configure'
  | 'performance_optimize'
  | 'backup_create'
  | 'security_scan'
  | 'capacity_scale'
  | 'network_diagnose'
  | 'config_update'
  | 'monitoring_setup'
  | 'report_generate'
  | 'notification_send'
  | 'data_export'
  | 'system_check';

export interface ActionResult {
  actionId: string;
  success: boolean;
  message: string;
  data?: any;
  executionTime: number;
  timestamp: string;
}

export class ActionExecutor {
  private actionTemplates: Map<string, Action[]> = new Map();
  private executionHistory: ActionResult[] = [];
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('⚡ Action Executor initialized');
  }

  /**
   * 의도와 응답에서 액션 추출
   */
  async extractActions(intent: Intent, response: GeneratedResponse): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const actions: string[] = [];

    // 1. 의도 기반 액션 추출
    const intentActions = this.getActionsForIntent(intent.name);
    actions.push(...intentActions.map(action => action.name));

    // 2. 엔티티 기반 액션 보강
    const entityActions = this.getActionsForEntities(intent.entities);
    actions.push(...entityActions.map(action => action.name));

    // 3. 응답 타입 기반 액션 추가
    const responseActions = this.getActionsForResponseType(response.type);
    actions.push(...responseActions.map(action => action.name));

    // 4. 컨텍스트 기반 액션 필터링
    const contextualActions = this.filterActionsByContext(intentActions.concat(entityActions).concat(responseActions), intent.context);

    // 5. 우선순위 정렬
    const sortedActions = this.sortActionsByPriority(contextualActions);

    return sortedActions.map(action => action.name);
  }

  /**
   * 액션 실행 (시뮬레이션)
   */
  async executeAction(actionName: string, parameters?: Record<string, any>): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = this.generateActionId();

    try {
      // 액션 찾기
      const action = this.findActionByName(actionName);
      if (!action) {
        throw new Error(`액션을 찾을 수 없습니다: ${actionName}`);
      }

      if (!action.executable) {
        throw new Error(`실행할 수 없는 액션입니다: ${actionName}`);
      }

      // 액션 실행 시뮬레이션
      const result = await this.simulateActionExecution(action, parameters);
      
      const executionTime = Date.now() - startTime;
      
      const actionResult: ActionResult = {
        actionId,
        success: true,
        message: result.message,
        data: result.data,
        executionTime,
        timestamp: new Date().toISOString()
      };

      // 실행 히스토리에 추가
      this.executionHistory.push(actionResult);

      return actionResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const actionResult: ActionResult = {
        actionId,
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        executionTime,
        timestamp: new Date().toISOString()
      };

      this.executionHistory.push(actionResult);
      return actionResult;
    }
  }

  /**
   * 액션 템플릿 초기화
   */
  private initializeActionTemplates(): void {
    // 서버 상태 관련 액션
    this.actionTemplates.set('server_status', [
      {
        id: 'server_detail_view',
        type: 'system_check',
        name: '서버 상세 보기',
        description: '선택한 서버의 상세 정보를 확인합니다',
        parameters: { serverId: 'string' },
        priority: 'medium',
        executable: true,
        estimatedDuration: 5
      },
      {
        id: 'health_check',
        type: 'system_check',
        name: '헬스 체크',
        description: '서버 상태를 종합적으로 점검합니다',
        parameters: {},
        priority: 'high',
        executable: true,
        estimatedDuration: 10
      }
    ]);

    // 성능 분석 관련 액션
    this.actionTemplates.set('performance_analysis', [
      {
        id: 'performance_optimize',
        type: 'performance_optimize',
        name: '성능 최적화',
        description: '시스템 성능을 자동으로 최적화합니다',
        parameters: { serverId: 'string', optimizationType: 'string' },
        priority: 'high',
        executable: true,
        estimatedDuration: 30
      },
      {
        id: 'resource_monitor',
        type: 'monitoring_setup',
        name: '리소스 모니터링 설정',
        description: '리소스 사용률 모니터링을 설정합니다',
        parameters: { thresholds: 'object' },
        priority: 'medium',
        executable: true,
        estimatedDuration: 15
      }
    ]);

    // 로그 분석 관련 액션
    this.actionTemplates.set('log_analysis', [
      {
        id: 'log_download',
        type: 'log_download',
        name: '로그 다운로드',
        description: '서버 로그 파일을 다운로드합니다',
        parameters: { serverId: 'string', logType: 'string', timeRange: 'string' },
        priority: 'medium',
        executable: true,
        estimatedDuration: 20
      },
      {
        id: 'error_analysis',
        type: 'report_generate',
        name: '에러 분석 리포트',
        description: '에러 패턴을 분석한 리포트를 생성합니다',
        parameters: { timeRange: 'string' },
        priority: 'high',
        executable: true,
        estimatedDuration: 45
      }
    ]);

    // 알림 관리 관련 액션
    this.actionTemplates.set('alert_management', [
      {
        id: 'alert_configure',
        type: 'alert_configure',
        name: '알림 규칙 설정',
        description: '모니터링 알림 규칙을 설정합니다',
        parameters: { rules: 'object' },
        priority: 'medium',
        executable: true,
        estimatedDuration: 10
      },
      {
        id: 'notification_test',
        type: 'notification_send',
        name: '알림 테스트',
        description: '설정된 알림이 정상 작동하는지 테스트합니다',
        parameters: { channels: 'array' },
        priority: 'low',
        executable: true,
        estimatedDuration: 5
      }
    ]);

    // 특정 서버 분석 관련 액션
    this.actionTemplates.set('specific_server_analysis', [
      {
        id: 'server_restart',
        type: 'server_restart',
        name: '서버 재시작',
        description: '서버를 안전하게 재시작합니다',
        parameters: { serverId: 'string', graceful: 'boolean' },
        priority: 'critical',
        executable: false, // 시연용으로 비활성화
        estimatedDuration: 120
      },
      {
        id: 'service_restart',
        type: 'service_restart',
        name: '서비스 재시작',
        description: '특정 서비스를 재시작합니다',
        parameters: { serverId: 'string', serviceName: 'string' },
        priority: 'high',
        executable: true,
        estimatedDuration: 30
      }
    ]);

    // 용량 계획 관련 액션
    this.actionTemplates.set('capacity_planning', [
      {
        id: 'capacity_scale',
        type: 'capacity_scale',
        name: '용량 확장',
        description: '서버 리소스를 확장합니다',
        parameters: { serverId: 'string', scaleType: 'string', amount: 'number' },
        priority: 'high',
        executable: false, // 시연용으로 비활성화
        estimatedDuration: 300
      },
      {
        id: 'capacity_report',
        type: 'report_generate',
        name: '용량 계획 리포트',
        description: '용량 계획 분석 리포트를 생성합니다',
        parameters: { timeRange: 'string' },
        priority: 'medium',
        executable: true,
        estimatedDuration: 60
      }
    ]);
  }

  /**
   * 의도별 액션 조회
   */
  private getActionsForIntent(intentName: string): Action[] {
    return this.actionTemplates.get(intentName) || [];
  }

  /**
   * 엔티티별 액션 조회
   */
  private getActionsForEntities(entities: Record<string, any>): Action[] {
    const actions: Action[] = [];

    // 서버 ID가 있으면 서버 특화 액션 추가
    if (entities.server_id) {
      actions.push({
        id: 'server_specific_check',
        type: 'system_check',
        name: '특정 서버 점검',
        description: '지정된 서버를 집중 점검합니다',
        parameters: { serverId: entities.server_id },
        priority: 'high',
        executable: true,
        estimatedDuration: 15
      });
    }

    // 메트릭 타입이 있으면 관련 액션 추가
    if (entities.metric_type) {
      actions.push({
        id: 'metric_analysis',
        type: 'report_generate',
        name: '메트릭 분석',
        description: '특정 메트릭을 상세 분석합니다',
        parameters: { metricType: entities.metric_type },
        priority: 'medium',
        executable: true,
        estimatedDuration: 20
      });
    }

    return actions;
  }

  /**
   * 응답 타입별 액션 조회
   */
  private getActionsForResponseType(responseType: string): Action[] {
    const actions: Action[] = [];

    switch (responseType) {
      case 'warning':
        actions.push({
          id: 'urgent_check',
          type: 'system_check',
          name: '긴급 점검',
          description: '경고 상황에 대한 긴급 점검을 수행합니다',
          parameters: {},
          priority: 'critical',
          executable: true,
          estimatedDuration: 10
        });
        break;
      
      case 'actionable':
        actions.push({
          id: 'action_plan',
          type: 'report_generate',
          name: '액션 플랜 생성',
          description: '권장 조치사항을 정리한 액션 플랜을 생성합니다',
          parameters: {},
          priority: 'medium',
          executable: true,
          estimatedDuration: 15
        });
        break;
    }

    return actions;
  }

  /**
   * 컨텍스트 기반 액션 필터링
   */
  private filterActionsByContext(actions: Action[], context: string[]): Action[] {
    if (!context || context.length === 0) return actions;

    return actions.filter(action => {
      // 긴급 상황에서는 우선순위 높은 액션만
      if (context.includes('urgent')) {
        return action.priority === 'critical' || action.priority === 'high';
      }

      // 전체 시스템 컨텍스트에서는 글로벌 액션 우선
      if (context.includes('global')) {
        return !action.parameters.serverId;
      }

      return true;
    });
  }

  /**
   * 우선순위별 액션 정렬
   */
  private sortActionsByPriority(actions: Action[]): Action[] {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return actions.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 액션 이름으로 액션 찾기
   */
  private findActionByName(actionName: string): Action | null {
    for (const actions of this.actionTemplates.values()) {
      const found = actions.find(action => action.name === actionName);
      if (found) return found;
    }
    return null;
  }

  /**
   * 액션 실행 시뮬레이션
   */
  private async simulateActionExecution(action: Action, parameters?: Record<string, any>): Promise<{ message: string; data?: any }> {
    // 실행 시간 시뮬레이션
    const delay = Math.min(action.estimatedDuration || 5, 10) * 100; // 최대 1초
    await new Promise(resolve => setTimeout(resolve, delay));

    switch (action.type) {
      case 'system_check':
        return {
          message: `${action.name} 완료: 시스템 상태가 정상입니다.`,
          data: { status: 'healthy', checkedAt: new Date().toISOString() }
        };

      case 'log_download':
        return {
          message: `로그 다운로드 완료: ${parameters?.logType || 'system'} 로그를 다운로드했습니다.`,
          data: { fileName: `${parameters?.serverId || 'system'}_${Date.now()}.log`, size: '2.3MB' }
        };

      case 'alert_configure':
        return {
          message: '알림 규칙이 성공적으로 설정되었습니다.',
          data: { rulesCount: 3, activeAlerts: 1 }
        };

      case 'performance_optimize':
        return {
          message: '성능 최적화가 완료되었습니다. CPU 사용률이 15% 개선되었습니다.',
          data: { improvementPercent: 15, optimizedServices: ['nginx', 'mysql'] }
        };

      case 'report_generate':
        return {
          message: `${action.name} 리포트가 생성되었습니다.`,
          data: { reportId: `RPT_${Date.now()}`, pages: 12, format: 'PDF' }
        };

      default:
        return {
          message: `${action.name}이(가) 성공적으로 실행되었습니다.`,
          data: { executedAt: new Date().toISOString() }
        };
    }
  }

  /**
   * 액션 ID 생성
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * 실행 히스토리 조회
   */
  getExecutionHistory(limit: number = 10): ActionResult[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * 정리 작업
   */
  async cleanup(): Promise<void> {
    this.executionHistory = [];
    console.log('🧹 Action Executor cleanup completed');
  }
} 