/**
 * 🚀 MCP 서버 Wake-up 서비스
 *
 * Render 무료 플랜의 Cold Start 문제 해결
 * - 시작버튼 클릭 시 MCP 서버를 먼저 깨움
 * - 최대 3분 대기, 재시도 로직 포함
 * - 진행상황 실시간 피드백
 */

export interface MCPWakeupProgress {
  stage: 'connecting' | 'waking' | 'ready' | 'timeout' | 'error';
  message: string;
  progress: number; // 0-100
  elapsedTime: number;
  estimatedRemaining?: number;
}

export interface MCPWakeupResult {
  success: boolean;
  totalTime: number;
  attempts: number;
  finalStatus: string;
  error?: string;
}

export class MCPWarmupService {
  private static instance: MCPWarmupService;
  private readonly MCP_SERVER_URL = 'https://openmanager-vibe-v5.onrender.com';
  private readonly MAX_WAIT_TIME = 180000; // 3분
  private readonly RETRY_INTERVAL = 10000; // 10초
  private readonly INITIAL_TIMEOUT = 30000; // 첫 시도는 30초

  private isWakeupInProgress = false;
  private progressCallbacks: ((progress: MCPWakeupProgress) => void)[] = [];

  private constructor() {}

  static getInstance(): MCPWarmupService {
    if (!MCPWarmupService.instance) {
      MCPWarmupService.instance = new MCPWarmupService();
    }
    return MCPWarmupService.instance;
  }

  /**
   * 🚀 MCP 서버 Wake-up 실행
   */
  async wakeupMCPServer(
    onProgress?: (progress: MCPWakeupProgress) => void
  ): Promise<MCPWakeupResult> {
    if (this.isWakeupInProgress) {
      throw new Error('MCP Wake-up이 이미 진행 중입니다');
    }

    this.isWakeupInProgress = true;
    const startTime = Date.now();
    let attempts = 0;

    try {
      if (onProgress) {
        this.progressCallbacks.push(onProgress);
      }

      // 1단계: 초기 연결 시도
      this.emitProgress({
        stage: 'connecting',
        message: 'MCP 서버에 연결 시도 중...',
        progress: 10,
        elapsedTime: 0,
        estimatedRemaining: 30000,
      });

      // 첫 번째 시도 (빠른 확인)
      attempts++;
      const quickCheck = await this.attemptConnection(this.INITIAL_TIMEOUT);

      if (quickCheck.success) {
        this.emitProgress({
          stage: 'ready',
          message: '✅ MCP 서버가 이미 활성 상태입니다',
          progress: 100,
          elapsedTime: Date.now() - startTime,
        });

        return {
          success: true,
          totalTime: Date.now() - startTime,
          attempts,
          finalStatus: 'already_active',
        };
      }

      // 2단계: Cold Start 감지 및 Wake-up 시작
      this.emitProgress({
        stage: 'waking',
        message: '🔄 MCP 서버를 깨우는 중... (Cold Start 감지)',
        progress: 20,
        elapsedTime: Date.now() - startTime,
        estimatedRemaining: 120000,
      });

      // Wake-up 시도 루프
      while (Date.now() - startTime < this.MAX_WAIT_TIME) {
        attempts++;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(20 + (elapsed / this.MAX_WAIT_TIME) * 70, 90);

        this.emitProgress({
          stage: 'waking',
          message: `🔄 MCP 서버 깨우는 중... (시도 ${attempts}회)`,
          progress,
          elapsedTime: elapsed,
          estimatedRemaining: Math.max(0, this.MAX_WAIT_TIME - elapsed),
        });

        const result = await this.attemptConnection(this.RETRY_INTERVAL);

        if (result.success) {
          this.emitProgress({
            stage: 'ready',
            message: '✅ MCP 서버가 성공적으로 활성화되었습니다!',
            progress: 100,
            elapsedTime: Date.now() - startTime,
          });

          return {
            success: true,
            totalTime: Date.now() - startTime,
            attempts,
            finalStatus: 'wakeup_success',
          };
        }

        // 다음 시도까지 대기
        if (Date.now() - startTime < this.MAX_WAIT_TIME - this.RETRY_INTERVAL) {
          await this.sleep(this.RETRY_INTERVAL);
        }
      }

      // 타임아웃 발생
      this.emitProgress({
        stage: 'timeout',
        message: '⏰ MCP 서버 Wake-up 타임아웃 (3분 경과)',
        progress: 100,
        elapsedTime: Date.now() - startTime,
      });

      return {
        success: false,
        totalTime: Date.now() - startTime,
        attempts,
        finalStatus: 'timeout',
        error: 'MCP 서버 Wake-up 타임아웃 (3분 초과)',
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;

      this.emitProgress({
        stage: 'error',
        message: `❌ MCP 서버 Wake-up 실패: ${error.message}`,
        progress: 100,
        elapsedTime: elapsed,
      });

      return {
        success: false,
        totalTime: elapsed,
        attempts,
        finalStatus: 'error',
        error: error.message,
      };
    } finally {
      this.isWakeupInProgress = false;
      this.progressCallbacks = [];
    }
  }

  /**
   * 🔌 단일 연결 시도
   */
  private async attemptConnection(timeout: number): Promise<{
    success: boolean;
    responseTime: number;
    status?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.MCP_SERVER_URL}/health`, {
        method: 'HEAD', // 가벼운 요청
        signal: controller.signal,
        headers: {
          'User-Agent': 'OpenManager-WakeUp/1.0',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        responseTime,
        status: response.status,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTime,
        error: error.name === 'AbortError' ? 'timeout' : error.message,
      };
    }
  }

  /**
   * 📡 진행상황 전파
   */
  private emitProgress(progress: MCPWakeupProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Progress callback 오류:', error);
      }
    });
  }

  /**
   * ⏱️ 비동기 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🔄 Keep-Alive 시스템 (선택적)
   */
  startKeepAlive(intervalMinutes: number = 5): () => void {
    const interval = setInterval(
      async () => {
        try {
          // 브라우저가 활성 상태일 때만 실행
          if (document.visibilityState === 'visible') {
            await this.attemptConnection(5000);
            console.log('🔄 MCP Keep-Alive ping 완료');
          }
        } catch (error) {
          console.warn('⚠️ MCP Keep-Alive 실패:', error);
        }
      },
      intervalMinutes * 60 * 1000
    );

    // 정리 함수 반환
    return () => clearInterval(interval);
  }

  /**
   * 📊 현재 상태 확인
   */
  async getCurrentStatus(): Promise<{
    isActive: boolean;
    responseTime: number;
    lastCheck: Date;
  }> {
    const result = await this.attemptConnection(10000);

    return {
      isActive: result.success,
      responseTime: result.responseTime,
      lastCheck: new Date(),
    };
  }

  /**
   * 🎯 빠른 상태 체크 (타임아웃 짧게)
   */
  async quickHealthCheck(): Promise<boolean> {
    const result = await this.attemptConnection(5000);
    return result.success;
  }
}

// 싱글톤 인스턴스 내보내기
export const mcpWarmupService = MCPWarmupService.getInstance();
