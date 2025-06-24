/**
 * 🔄 모드별 타이머 관리자
 * AI 관리자 모드와 기본 모니터링 모드 간 전환을 위한 타이머 관리
 */

interface ModeTimerConfig {
  id: string;
  callback: () => void | Promise<void>;
  interval: number;
  immediate?: boolean;
}

class ModeTimerManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private currentMode: 'ai' | 'monitoring' | 'auto' | null = null;

  // 모든 타이머 정지
  stopAll(): void {
    console.log('🔄 Stopping all mode timers...');

    for (const [id, timer] of this.timers) {
      clearInterval(timer);
      console.log(`⏹️ Timer stopped: ${id}`);
    }

    this.timers.clear();
    console.log('✅ All mode timers stopped');
  }

  // 개별 타이머 등록
  private registerTimer(config: ModeTimerConfig): void {
    // 기존 타이머가 있으면 제거
    if (this.timers.has(config.id)) {
      clearInterval(this.timers.get(config.id)!);
    }

    // 즉시 실행 옵션
    if (config.immediate) {
      this.executeCallback(config);
    }

    // 주기적 실행
    const timer = setInterval(() => {
      this.executeCallback(config);
    }, config.interval);

    this.timers.set(config.id, timer);
    console.log(
      `⏰ Mode timer registered: ${config.id} (${config.interval}ms)`
    );
  }

  // 콜백 실행 (에러 핸들링 포함)
  private async executeCallback(config: ModeTimerConfig): Promise<void> {
    try {
      await config.callback();
    } catch (error) {
      console.error(`❌ Mode timer callback error [${config.id}]:`, error);
    }
  }

  // AI 관리자 모드 시작
  startAIMode(): void {
    console.log('🤖 Starting AI Admin Mode timers...');
    this.currentMode = 'ai';

    // AI 에이전트 하트비트 (GET 방식으로 변경)
    this.registerTimer({
      id: 'ai-agent-heartbeat',
      callback: async () => {
        try {
          const response = await fetch('/api/ai-agent?action=health', {
            method: 'GET',
          });

          if (!response.ok) {
            console.warn(`⚠️ AI Agent heartbeat failed: ${response.status}`);
          } else {
            const data = await response.json();
            if (data.success) {
              console.log('✅ AI Agent heartbeat successful');
            } else {
              console.warn('⚠️ AI Agent heartbeat failed (response)');
            }
          }
        } catch (error) {
          console.warn(
            '⚠️ AI Agent heartbeat error (expected in offline mode):',
            error
          );
        }
      },
      interval: 15000, // 15초로 간격 증가 (부하 감소)
      immediate: false, // 즉시 실행 비활성화
    });

    // MCP 시스템 모니터링 (GET 방식으로 개선)
    this.registerTimer({
      id: 'mcp-monitor',
      callback: async () => {
        try {
          const response = await fetch('/api/mcp/status');
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 MCP Status:', data.success ? '✅' : '⚠️');
          } else {
            console.warn(`🔍 MCP Status: ⚠️ (${response.status})`);
          }
        } catch (error) {
          console.warn('🔍 MCP Monitor: ⚠️ (offline mode)');
        }
      },
      interval: 30000, // 30초로 간격 증가
      immediate: false,
    });

    // AI 분석 데이터 수집 - 🎯 데이터 생성기와 동기화
    this.registerTimer({
      id: 'ai-analytics-collector',
      callback: async () => {
        try {
          console.log('📊 Collecting AI analytics data...');
          // AI 분석 관련 API 호출 로직
        } catch (error) {
          console.error('❌ AI Analytics error:', error);
        }
      },
      interval: 40000, // 40초 (데이터 생성기 20초의 2배 간격)
      immediate: false,
    });
  }

  // 기본 모니터링 모드 시작 (AUTO 모드로 통합)
  startMonitoringMode(): void {
    console.log('📊 Starting Basic Monitoring Mode timers (AUTO 모드)...');
    this.currentMode = 'auto'; // MONITORING → AUTO로 변경

    // 기본 서버 모니터링
    this.registerTimer({
      id: 'basic-monitoring',
      callback: async () => {
        try {
          const response = await fetch('/api/health');
          if (response.ok) {
            console.log('✅ Basic monitoring check passed');
          }
        } catch (error) {
          console.error('❌ Basic monitoring error:', error);
        }
      },
      interval: 15000, // 15초
      immediate: true,
    });

    // 데이터 생성기 상태 확인 - 🎯 데이터 생성기 간격(20초)보다 길게 조정
    this.registerTimer({
      id: 'data-generator-status',
      callback: async () => {
        try {
          const response = await fetch('/api/data-generator');
          if (response.ok) {
            const data = await response.json();
            console.log(
              '🧪 Data Generator:',
              data.data?.generation?.isGenerating ? '✅' : '⏸️'
            );
          }
        } catch (error) {
          console.error('❌ Data Generator status error:', error);
        }
      },
      interval: 25000, // 25초 (데이터 생성기 20초보다 5초 길게)
      immediate: false,
    });

    // 시스템 메트릭 모니터링
    this.registerTimer({
      id: 'system-metrics',
      callback: async () => {
        try {
          const response = await fetch('/api/metrics/performance');
          if (response.ok) {
            const data = await response.json();
            console.log('📈 System Metrics collected');
          }
        } catch (error) {
          console.error('❌ System metrics error:', error);
        }
      },
      interval: 20000, // 20초
      immediate: false,
    });
  }

  // 모드 전환
  switchMode(mode: 'ai' | 'monitoring' | 'auto'): void {
    console.log(
      `🔄 Switching from ${this.currentMode || 'none'} to ${mode} mode...`
    );

    // 기존 모든 타이머 정지
    this.stopAll();

    // 새 모드 타이머 시작
    if (mode === 'ai') {
      this.startAIMode();
    } else {
      this.startMonitoringMode();
    }
  }

  // 현재 모드 반환
  getCurrentMode(): 'ai' | 'monitoring' | 'auto' | null {
    return this.currentMode;
  }

  // 활성 타이머 목록
  getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
  }

  // 타이머 상태 확인
  isActive(id: string): boolean {
    return this.timers.has(id);
  }

  // 메모리 정리
  cleanup(): void {
    this.stopAll();
    this.currentMode = null;
    console.log('🧹 ModeTimerManager cleanup completed');
  }
}

// 싱글톤 인스턴스
export const modeTimerManager = new ModeTimerManager();

// React Hook 형태로도 제공
export function useModeTimerManager() {
  return modeTimerManager;
}
