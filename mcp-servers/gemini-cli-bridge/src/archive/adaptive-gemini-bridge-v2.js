import { spawn } from 'child_process';
import { promisify } from 'util';
import { CachedContextDetector } from './cached-context-detector.js';
import { UsageTracker } from './usage-tracker.js';
import {
  PowerShellStrategy,
  PowerShellFallbackStrategy,
  UniversalFallbackStrategy,
} from './strategies/unified-strategies.js';

const sleep = promisify(setTimeout);

/**
 * 🚀 적응적 Gemini CLI 브릿지 v2.0 (PowerShell 전용)
 * - PowerShell 환경 최적화
 * - 사용량 추적 기능
 * - 컨텍스트 캐싱
 */
export class AdaptiveGeminiBridge {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;

    // 🆕 개선된 모듈들 초기화
    this.contextDetector = new CachedContextDetector({
      cacheTimeout: 60000, // 1분
      maxCacheSize: 50,
    });

    this.usageTracker = new UsageTracker({
      dailyLimit: 1000,
      warningThresholds: [0.8, 0.9, 1.0],
    });

    this.context = null;

    // 🆕 PowerShell 전용 전략 (3개)
    this.strategies = {
      powershell: new PowerShellStrategy(),
      'powershell-fallback': new PowerShellFallbackStrategy(),
      fallback: new UniversalFallbackStrategy(),
    };
  }

  /**
   * 초기화 및 컨텍스트 감지
   */
  async initialize() {
    if (this.context) {
      return this.context;
    }

    console.error('[AdaptiveGeminiBridge v2] PowerShell 환경 초기화 시작...');

    // 캐싱된 컨텍스트 감지
    this.context = await this.contextDetector.detectContext();

    // PowerShell 전략으로 매핑
    this.context.executionStrategy = this._mapToPowerShellStrategy(
      this.context.executionStrategy
    );

    // 디버그 모드에서 상세 정보 출력
    if (process.env.GEMINI_DEBUG === 'true') {
      this.contextDetector.printDebugInfo();
      console.error(
        '[AdaptiveGeminiBridge v2] 사용량 통계:',
        this.usageTracker.getDetailedStats()
      );
    }

    console.error(
      `[AdaptiveGeminiBridge v2] 초기화 완료 - 전략: ${this.context.executionStrategy}`
    );
    return this.context;
  }

  /**
   * PowerShell 전략으로 매핑
   */
  _mapToPowerShellStrategy(oldStrategy) {
    const strategyMap = {
      'wsl-optimized': 'powershell',
      'wsl-fallback': 'powershell-fallback',
      'reverse-compatible': 'powershell',
      'powershell-direct': 'powershell',
      'powershell-fallback': 'powershell-fallback',
    };

    return strategyMap[oldStrategy] || 'powershell';
  }

  /**
   * 적응적 명령 실행 (사용량 추적 포함)
   */
  async executeCommand(command, options = {}) {
    // 컨텍스트 감지 보장
    await this.initialize();

    // 🆕 사용량 확인
    if (!this.usageTracker.canUse()) {
      const stats = this.usageTracker.getDetailedStats();
      throw new Error(
        `Gemini CLI 일일 사용 한도(${stats.limit}회) 초과. ` +
          `다음 리셋: ${new Date(stats.nextReset).toLocaleString('ko-KR')}`
      );
    }

    const timeout = options.timeout || this.timeout;
    const retries = options.retries || this.maxRetries;
    const startTime = Date.now();

    // Gemini CLI 가용성 확인 (첫 번째 시도만)
    if (options.skipGeminiCheck !== true) {
      await this._checkGeminiAvailability();
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this._executeWithStrategy(command, timeout);

        // 🆕 성공 시 사용량 증가
        const responseTime = Date.now() - startTime;
        const usageInfo = await this.usageTracker.incrementUsage({
          model: options.model || 'default',
          responseTime,
          success: true,
        });

        console.error(
          `[AdaptiveGeminiBridge v2] 명령 실행 성공 (시도 ${attempt}/${retries}) ` +
            `- 사용량: ${usageInfo.current}/${this.usageTracker.dailyLimit} (${Math.round(usageInfo.percent)}%)`
        );

        return result;
      } catch (error) {
        console.error(
          `[AdaptiveGeminiBridge v2] 시도 ${attempt}/${retries} 실패:`,
          error.message
        );

        // 🆕 실패도 사용량에 기록
        if (attempt === 1) {
          await this.usageTracker.incrementUsage({
            model: options.model || 'default',
            responseTime: Date.now() - startTime,
            success: false,
          });
        }

        if (attempt < retries) {
          await sleep(1000 * attempt); // 지수 백오프
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * 전략 기반 명령 실행 (PowerShell 최적화)
   */
  async _executeWithStrategy(command, timeout) {
    const strategyName = this.context.executionStrategy;
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      // 알 수 없는 전략은 자동으로 powershell 사용
      console.warn(
        `[AdaptiveGeminiBridge v2] 알 수 없는 전략 '${strategyName}', powershell 사용`
      );
      return await this.strategies.powershell.execute(
        command,
        timeout,
        this.context
      );
    }

    console.error(
      `[AdaptiveGeminiBridge v2] 전략 '${strategyName}' 사용하여 명령 실행`
    );

    try {
      return await strategy.execute(command, timeout, this.context);
    } catch (error) {
      // 전략 실패 시 자동으로 fallback 시도
      if (strategyName !== 'fallback') {
        console.warn(
          `[AdaptiveGeminiBridge v2] '${strategyName}' 실패, fallback 시도`
        );
        return await this.strategies.fallback.execute(
          command,
          timeout,
          this.context
        );
      }
      throw error;
    }
  }

  /**
   * Gemini CLI 가용성 확인
   */
  async _checkGeminiAvailability() {
    const strategy = this.strategies[this.context.executionStrategy];

    if (strategy && strategy.checkAvailability) {
      return await strategy.checkAvailability(this.context);
    }

    // 기본 가용성 확인
    try {
      await this.executeCommand('gemini --version', {
        timeout: 5000,
        skipGeminiCheck: true,
      });
    } catch (error) {
      throw new Error(
        'Gemini CLI를 찾을 수 없습니다. 설치 및 PATH 설정을 확인하세요.'
      );
    }
  }

  /**
   * Gemini CLI 버전 확인
   */
  async getVersion() {
    return await this.executeCommand('gemini --version', { timeout: 5000 });
  }

  /**
   * Gemini 채팅 (사용량 추적 강화)
   */
  async chat(prompt, options = {}) {
    // 사용량 예측 확인
    const prediction = this.usageTracker.predictDailyUsage();
    if (prediction.prediction === 'critical') {
      console.warn(`[AdaptiveGeminiBridge v2] ${prediction.recommendation}`);
    }

    try {
      const command = this._buildChatCommand(prompt, options);
      const result = await this.executeCommand(command, options);

      return this._cleanResponse(result, options);
    } catch (error) {
      return await this._handleChatError(error, prompt, options);
    }
  }

  /**
   * 채팅 명령 빌드 (PowerShell 최적화)
   */
  _buildChatCommand(prompt, options) {
    // PowerShell 환경용 이스케이프
    const escapedPrompt = prompt.replace(/"/g, '`"').replace(/'/g, "''");
    const modelFlag = options.model ? `-m ${options.model}` : '';

    return `echo "${escapedPrompt}" | gemini ${modelFlag} -p`.trim();
  }

  /**
   * 응답 정리
   */
  _cleanResponse(result, options) {
    const lines = result.split('\n');

    // 빈 줄 제거
    const cleanedLines = lines.filter(line => line.trim() !== '');

    // 마지막 빈 줄 제거
    while (
      cleanedLines.length > 0 &&
      cleanedLines[cleanedLines.length - 1].trim() === ''
    ) {
      cleanedLines.pop();
    }

    return cleanedLines.join('\n');
  }

  /**
   * 채팅 오류 처리
   */
  async _handleChatError(error, prompt, options) {
    console.error(`[AdaptiveGeminiBridge v2] 채팅 오류: ${error.message}`);

    // 오류 메시지 정리
    const errorMessage = error.message
      .replace(/PowerShell.*실패/, '명령 실행 실패')
      .replace(/타임아웃.*ms/, '응답 시간 초과');

    return {
      error: true,
      message: errorMessage,
      originalPrompt: prompt,
      retry: options.retry !== false,
    };
  }

  /**
   * 통계 조회
   */
  async getStats() {
    const stats = {
      context: this.context,
      usage: this.usageTracker.getDetailedStats(),
      cache: this.contextDetector.getCacheStats(),
      strategies: Object.keys(this.strategies),
      uptime: process.uptime(),
    };

    return stats;
  }

  /**
   * 컨텍스트 초기화
   */
  async clearContext() {
    this.context = null;
    this.contextDetector.clearCache();
    console.error('[AdaptiveGeminiBridge v2] 컨텍스트 초기화 완료');
  }

  /**
   * 사용량 대시보드
   */
  getUsageDashboard() {
    const stats = this.usageTracker.getDetailedStats();
    const cache = this.contextDetector.getCacheStats();

    return {
      usage: {
        current: stats.current,
        limit: stats.limit,
        remaining: stats.remaining,
        percent: Math.round(stats.percent),
      },
      performance: {
        averageResponseTime: Math.round(stats.averageResponseTime),
        successRate: Math.round(stats.successRate * 100),
      },
      cache: {
        hitRate: cache.hitRate,
        size: cache.size,
      },
      nextReset: new Date(stats.nextReset).toLocaleString('ko-KR'),
    };
  }
}
