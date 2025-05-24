import { MetricCollectionManager } from './collectors/collector-factory';
import { getCollectorConfigs, validateEnvironment, getCollectorSummary } from '../config/collectors';

/**
 * 글로벌 수집 관리자
 * 
 * 애플리케이션 시작시 초기화되어 백그라운드에서 메트릭 수집을 담당합니다.
 */
class GlobalCollectionManager {
  private manager: MetricCollectionManager | null = null;
  private isInitialized = false;
  private initializationError: Error | null = null;

  /**
   * 수집 관리자 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ 수집 관리자가 이미 초기화되었습니다');
      return;
    }

    try {
      console.log('🚀 수집 관리자 초기화 시작...');
      
      // 환경 설정 검증
      const validation = validateEnvironment();
      if (!validation.valid) {
        const errorMessage = `환경 설정 오류:\n${validation.errors.join('\n')}`;
        console.error('❌', errorMessage);
        this.initializationError = new Error(errorMessage);
        return;
      }

      // 수집기 설정 로드
      const configs = getCollectorConfigs();
      if (configs.length === 0) {
        throw new Error('사용 가능한 수집기 설정이 없습니다');
      }

      // 수집 관리자 생성 및 수집기 추가
      this.manager = new MetricCollectionManager();
      
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const collectorName = `${config.type}-collector-${i + 1}`;
        
        try {
          this.manager.addCollector(collectorName, config);
          console.log(`✅ 수집기 '${collectorName}' 추가 완료`);
        } catch (error) {
          console.error(`❌ 수집기 '${collectorName}' 추가 실패:`, error);
          // 개별 수집기 실패는 전체 초기화를 중단하지 않음
        }
      }

      // 수집 상태 확인
      const activeCollectors = this.manager.getActiveCollectors();
      if (activeCollectors.length === 0) {
        throw new Error('활성화된 수집기가 없습니다');
      }

      this.isInitialized = true;
      console.log(`🎉 수집 관리자 초기화 완료 (활성 수집기: ${activeCollectors.length}개)`);
      
      // 수집기 상태 요약 출력
      const summary = getCollectorSummary();
      console.log('📊 수집기 설정 요약:', summary);

    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
      console.error('❌수집 관리자 초기화 실패:', this.initializationError.message);
      throw this.initializationError;
    }
  }

  /**
   * 수집 관리자 중지
   */
  async shutdown(): Promise<void> {
    if (!this.manager) {
      console.log('⚠️ 수집 관리자가 초기화되지 않았습니다');
      return;
    }

    try {
      console.log('🛑 수집 관리자 중지 중...');
      this.manager.stopAllSchedules();
      this.manager = null;
      this.isInitialized = false;
      console.log('✅ 수집 관리자 중지 완료');
    } catch (error) {
      console.error('❌ 수집 관리자 중지 실패:', error);
      throw error;
    }
  }

  /**
   * 수집 관리자 상태 확인
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasError: !!this.initializationError,
      error: this.initializationError?.message,
      activeCollectors: this.manager?.getActiveCollectors() || [],
      summary: this.isInitialized ? getCollectorSummary() : null
    };
  }

  /**
   * 수집기 상태 조회
   */
  async getCollectorStatus() {
    if (!this.manager) {
      throw new Error('수집 관리자가 초기화되지 않았습니다');
    }

    return await this.manager.getCollectorStatus();
  }

  /**
   * 수동 메트릭 수집 실행
   */
  async collectNow(): Promise<void> {
    if (!this.manager) {
      throw new Error('수집 관리자가 초기화되지 않았습니다');
    }

    console.log('🔄 수동 메트릭 수집 시작...');
    await this.manager.collectAllMetrics();
    console.log('✅ 수동 메트릭 수집 완료');
  }

  /**
   * 특정 수집기에서 특정 서버 메트릭 수집
   */
  async collectFromServer(collectorName: string, serverId: string) {
    if (!this.manager) {
      throw new Error('수집 관리자가 초기화되지 않았습니다');
    }

    return await this.manager.collectFromCollector(collectorName, serverId);
  }

  /**
   * 수집기 재시작
   */
  async restart(): Promise<void> {
    console.log('🔄 수집 관리자 재시작 중...');
    await this.shutdown();
    await this.initialize();
    console.log('✅ 수집 관리자 재시작 완료');
  }
}

// 글로벌 인스턴스 생성
export const globalCollectionManager = new GlobalCollectionManager();

/**
 * Next.js 앱 시작시 자동 초기화
 */
export async function initializeCollectionManager(): Promise<void> {
  try {
    await globalCollectionManager.initialize();
  } catch (error) {
    console.error('❌ 자동 초기화 실패:', error);
    // 초기화 실패시에도 앱은 계속 실행되도록 함
  }
}

/**
 * 수집 관리자 상태 체크 미들웨어용 함수
 */
export function getCollectionManagerStatus() {
  return globalCollectionManager.getStatus();
}

/**
 * 프로세스 종료시 정리 작업
 */
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('\n🛑 종료 신호 감지, 수집 관리자 정리 중...');
    try {
      await globalCollectionManager.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('❌ 정리 작업 실패:', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 종료 신호 감지, 수집 관리자 정리 중...');
    try {
      await globalCollectionManager.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('❌ 정리 작업 실패:', error);
      process.exit(1);
    }
  });
} 