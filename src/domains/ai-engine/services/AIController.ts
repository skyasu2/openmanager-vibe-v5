/**
 * 🎮 AI Controller Implementation (Facade Pattern)
 *
 * 복잡한 AI 서브시스템들을 단순한 인터페이스로 통합
 * - 질의 처리 통합 관리
 * - 탭 데이터 로드 관리
 * - 설정 관리 통합
 * - 상태 조회 통합
 */

import {
  IAIController,
  IAIEngineCore,
  IAIDataService,
  IAIConfigService,
  INotificationService,
} from '../interfaces';
import { ConversationItem, AIEngineStatus } from '../types';

export class AIController implements IAIController {
  constructor(
    private aiEngine: IAIEngineCore,
    private dataService: IAIDataService,
    private configService: IAIConfigService,
    private notificationService: INotificationService
  ) {}

  /**
   * 질의 처리 (스트리밍 방식)
   */
  async handleQuery(question: string): Promise<ConversationItem> {
    try {
      return await this.aiEngine.processStreamingQuery(question, event => {
        // 이벤트는 UI 레이어에서 처리하도록 위임
        // 여기서는 로깅만 수행
        console.log('AI 처리 이벤트:', event);
      });
    } catch (error) {
      console.error('질의 처리 오류:', error);
      throw error;
    }
  }

  /**
   * 탭 데이터 로드
   */
  async loadTabData(tabId: string): Promise<any> {
    try {
      switch (tabId) {
        case 'prediction':
          return await this.dataService.getPredictionData();

        case 'anomaly':
          return await this.dataService.getAnomalyData();

        case 'report':
          return await this.dataService.getReportData();

        case 'logs':
          // 기본 로그 검색 (빈 쿼리)
          return await this.dataService.searchLogs('');

        case 'notification':
          return await this.notificationService.getSettings();

        case 'settings':
          return {
            engineStatus: await this.configService.getEngineStatus(),
            config: await this.configService.getConfig(),
          };

        default:
          throw new Error(`알 수 없는 탭 ID: ${tabId}`);
      }
    } catch (error) {
      console.error(`탭 데이터 로드 오류 (${tabId}):`, error);
      throw error;
    }
  }

  /**
   * 설정 관리
   */
  async manageSettings(action: string, data?: any): Promise<any> {
    try {
      switch (action) {
        case 'get_engine_status':
          return await this.configService.getEngineStatus();

        case 'get_config':
          return await this.configService.getConfig();

        case 'update_config':
          if (!data) throw new Error('설정 데이터가 필요합니다');
          await this.configService.updateConfig(data);
          return { success: true };

        case 'restart_engine':
          if (!data?.engineId) throw new Error('엔진 ID가 필요합니다');
          await this.configService.restartEngine(data.engineId);
          return { success: true };

        case 'get_notification_settings':
          return await this.notificationService.getSettings();

        case 'update_notification_settings':
          if (!data) throw new Error('알림 설정 데이터가 필요합니다');
          await this.notificationService.updateSettings(data);
          return { success: true };

        case 'request_notification_permission':
          return await this.notificationService.requestPermission();

        case 'test_notification':
          await this.notificationService.testNotification();
          return { success: true };

        default:
          throw new Error(`알 수 없는 설정 액션: ${action}`);
      }
    } catch (error) {
      console.error(`설정 관리 오류 (${action}):`, error);
      throw error;
    }
  }

  /**
   * 상태 조회
   */
  async getStatus(): Promise<AIEngineStatus> {
    try {
      return await this.configService.getEngineStatus();
    } catch (error) {
      console.error('상태 조회 오류:', error);
      // 폴백 상태 반환
      return {
        isHealthy: false,
        engines: [],
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  /**
   * 로그 검색 (편의 메서드)
   */
  async searchLogs(query: string, filters?: any): Promise<any> {
    try {
      return await this.dataService.searchLogs(query, filters);
    } catch (error) {
      console.error('로그 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 알림 전송 (편의 메서드)
   */
  async sendNotification(
    title: string,
    message: string,
    options?: any
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification(title, message, options);
    } catch (error) {
      console.error('알림 전송 오류:', error);
      throw error;
    }
  }

  /**
   * 시스템 로그 생성 (편의 메서드)
   */
  generateSystemLogs(question: string) {
    return this.aiEngine.generateSystemLogs(question);
  }

  /**
   * 질문 카테고리 결정 (편의 메서드)
   */
  determineCategory(question: string): string {
    return this.aiEngine.determineCategory(question);
  }
}
