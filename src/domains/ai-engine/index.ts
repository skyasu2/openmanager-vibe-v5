/**
 * 🏗️ AI Engine Domain Entry Point
 *
 * AI 엔진 도메인의 진입점 및 의존성 주입 컨테이너
 * - 의존성 주입 (Dependency Injection)
 * - 팩토리 패턴
 * - 싱글톤 패턴
 */

// 타입 및 인터페이스 내보내기
export * from './types';
export * from './interfaces';

// 구현체 내보내기
export { AIEngineCore } from './core/AIEngineCore';
export { AIDataService } from './services/AIDataService';
export { AIController } from './services/AIController';

// 의존성 주입 컨테이너
import { AIEngineCore } from './core/AIEngineCore';
import { AIDataService } from './services/AIDataService';
import { AIController } from './services/AIController';
import {
  IAIEngineCore,
  IAIDataService,
  IAIConfigService,
  INotificationService,
  IAIController,
} from './interfaces';
import { AIEngineConfig, AIEngineStatus, NotificationSettings } from './types';

/**
 * 🔧 AI 설정 서비스 구현 (임시)
 */
class MockAIConfigService implements IAIConfigService {
  async getEngineStatus(): Promise<AIEngineStatus> {
    return {
      isHealthy: true,
      engines: [
        {
          id: 'unified',
          name: 'Unified AI Engine',
          status: 'active',
          responseTime: 150,
        },
        {
          id: 'google',
          name: 'Google AI',
          status: 'active',
          responseTime: 200,
        },
        { id: 'local', name: 'Local RAG', status: 'active', responseTime: 100 },
      ],
      lastUpdate: new Date().toISOString(),
    };
  }

  async getConfig(): Promise<AIEngineConfig> {
    return {
      primaryEngine: 'unified',
      fallbackEngines: ['google', 'local'],
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      logLevel: 'info',
    };
  }

  async updateConfig(config: Partial<AIEngineConfig>): Promise<void> {
    console.log('AI 설정 업데이트:', config);
  }

  async restartEngine(engineId: string): Promise<void> {
    console.log('AI 엔진 재시작:', engineId);
  }
}

/**
 * 🔔 알림 서비스 구현 (임시)
 */
class MockNotificationService implements INotificationService {
  async getSettings(): Promise<NotificationSettings> {
    return {
      browser: {
        enabled: false,
        permission: 'denied',
      },
      levels: {
        info: true,
        warning: true,
        error: true,
        critical: true,
      },
      filters: {
        sources: [],
        keywords: [],
      },
    };
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    console.log('알림 설정 업데이트:', settings);
  }

  async requestPermission(): Promise<NotificationPermission> {
    return 'denied';
  }

  async sendNotification(
    title: string,
    message: string,
    options?: any
  ): Promise<void> {
    console.log('📢 실시간 알림:', title, message);
  }

  async testNotification(): Promise<void> {
    await this.sendNotification(
      'OpenManager AI',
      '알림 테스트가 성공적으로 완료되었습니다.',
      { tag: 'test' }
    );
  }
}

/**
 * 🏭 AI 엔진 팩토리
 */
export class AIEngineFactory {
  private static instance: AIEngineFactory;
  private aiController: IAIController | null = null;

  private constructor() {}

  static getInstance(): AIEngineFactory {
    if (!AIEngineFactory.instance) {
      AIEngineFactory.instance = new AIEngineFactory();
    }
    return AIEngineFactory.instance;
  }

  /**
   * AI 컨트롤러 생성 (싱글톤)
   */
  createAIController(): IAIController {
    if (!this.aiController) {
      // 의존성 주입
      const aiEngine: IAIEngineCore = new AIEngineCore();
      const dataService: IAIDataService = new AIDataService();
      const configService: IAIConfigService = new MockAIConfigService();
      const notificationService: INotificationService =
        new MockNotificationService();

      this.aiController = new AIController(
        aiEngine,
        dataService,
        configService,
        notificationService
      );
    }

    return this.aiController;
  }

  /**
   * AI 엔진 코어 생성
   */
  createAIEngine(): IAIEngineCore {
    return new AIEngineCore();
  }

  /**
   * 데이터 서비스 생성
   */
  createDataService(): IAIDataService {
    return new AIDataService();
  }

  /**
   * 설정 서비스 생성
   */
  createConfigService(): IAIConfigService {
    return new MockAIConfigService();
  }

  /**
   * 알림 서비스 생성
   */
  createNotificationService(): INotificationService {
    return new MockNotificationService();
  }
}

/**
 * 🎯 편의 함수들
 */

/**
 * AI 컨트롤러 인스턴스 가져오기
 */
export function getAIController(): IAIController {
  return AIEngineFactory.getInstance().createAIController();
}

/**
 * AI 엔진 인스턴스 가져오기
 */
export function getAIEngine(): IAIEngineCore {
  return AIEngineFactory.getInstance().createAIEngine();
}

/**
 * 데이터 서비스 인스턴스 가져오기
 */
export function getDataService(): IAIDataService {
  return AIEngineFactory.getInstance().createDataService();
}

/**
 * 설정 서비스 인스턴스 가져오기
 */
export function getConfigService(): IAIConfigService {
  return AIEngineFactory.getInstance().createConfigService();
}

/**
 * 알림 서비스 인스턴스 가져오기
 */
export function getNotificationService(): INotificationService {
  return AIEngineFactory.getInstance().createNotificationService();
}
