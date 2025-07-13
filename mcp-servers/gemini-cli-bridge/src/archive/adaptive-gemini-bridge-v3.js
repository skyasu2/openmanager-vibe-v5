import { spawn } from 'child_process';
import { promisify } from 'util';
import { CachedContextDetector } from './cached-context-detector.js';
import { UsageTracker } from './usage-tracker.js';
import { ModelStrategies, selectOptimalStrategy, buildFallbackChain } from './model-strategies.js';
import { PowerShellStrategy, PowerShellFallbackStrategy, UniversalFallbackStrategy } from './strategies/unified-strategies.js';

const sleep = promisify(setTimeout);

/**
 * 🚀 적응적 Gemini CLI 브릿지 v3.0
 * 
 * 주요 개선사항:
 * - --prompt 플래그 활용으로 성능 향상
 * - 모델별 최적화 전략
 * - 자동 폴백 체인
 * - 헤드리스 모드 지원
 * - 프롬프트 기반 모델 자동 선택
 */
export class AdaptiveGeminiBridge {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.enableAutoModelSelection = options.autoModelSelection !== false;
    
    // 모듈 초기화
    this.contextDetector = new CachedContextDetector({
      cacheTimeout: 60000,
      maxCacheSize: 50
    });
    
    this.usageTracker = new UsageTracker({
      dailyLimit: 1000,
      warningThresholds: [0.8, 0.9, 1.0]
    });
    
    this.context = null;
    
    // PowerShell 전략
    this.strategies = {
      'powershell': new PowerShellStrategy(),
      'powershell-fallback': new PowerShellFallbackStrategy(),
      'fallback': new UniversalFallbackStrategy()
    };
  }

  /**
   * 초기화 및 컨텍스트 감지
   */
  async initialize() {
    if (this.context) {
      return this.context;
    }

    console.error('[GeminiBridge v3] 초기화 시작...');
    
    this.context = await this.contextDetector.detectContext();
    this.context.executionStrategy = this._mapToPowerShellStrategy(this.context.executionStrategy);
    
    if (process.env.GEMINI_DEBUG === 'true') {
      this.contextDetector.printDebugInfo();
      console.error('[GeminiBridge v3] 사용량:', this.usageTracker.getDetailedStats());
    }

    console.error(`[GeminiBridge v3] 초기화 완료 - 전략: ${this.context.executionStrategy}`);
    return this.context;
  }

  /**
   * 채팅 명령 빌드 (v3: --prompt 사용)
   */
  _buildChatCommand(prompt, options = {}) {
    // 모델 전략 선택
    const strategy = this.enableAutoModelSelection 
      ? selectOptimalStrategy(prompt, options)
      : ModelStrategies[options.model || 'gemini-2.5-pro'];

    // PowerShell 이스케이프
    const escapedPrompt = prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '`$');
    
    // 명령 구성
    const parts = ['gemini'];
    
    // --prompt 플래그 사용 (echo 파이프 대신)
    parts.push('--prompt', `"${escapedPrompt}"`);
    
    // 모델 지정
    if (strategy.selectedModel || options.model) {
      parts.push('-m', strategy.selectedModel || options.model);
    }
    
    // 헤드리스 모드 (Flash 모델에서 기본 활성화)
    if (strategy.args?.includes('-b') || options.headless) {
      parts.push('-b');
    }
    
    // YOLO 모드 (명시적 요청 시에만)
    if (options.yolo === true && this._isSafeForYolo(prompt)) {
      parts.push('-y');
    }
    
    const command = parts.join(' ');
    
    console.error(`[GeminiBridge v3] 명령: ${command}`);
    console.error(`[GeminiBridge v3] 선택된 모델: ${strategy.selectedModel || options.model || 'default'}`);
    console.error(`[GeminiBridge v3] 전략 특성: ${JSON.stringify(strategy.characteristics || {})}`);
    
    return { command, strategy };
  }

  /**
   * YOLO 모드 안전성 체크
   */
  _isSafeForYolo(prompt) {
    const dangerousPatterns = [
      /delete|remove|rm|del/i,
      /sudo|admin|root/i,
      /password|secret|key/i,
      /execute|run|exec/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(prompt));
  }

  /**
   * 채팅 with 폴백 체인
   */
  async chat(prompt, options = {}) {
    // 사용량 체크
    const prediction = this.usageTracker.predictDailyUsage();
    if (prediction.prediction === 'critical') {
      console.warn(`[GeminiBridge v3] ${prediction.recommendation}`);
    }

    const { command, strategy } = this._buildChatCommand(prompt, options);
    const fallbackChain = buildFallbackChain(strategy.selectedModel || options.model);
    
    // 폴백 체인 시도
    for (let i = 0; i < fallbackChain.length; i++) {
      const currentModel = fallbackChain[i];
      
      try {
        console.error(`[GeminiBridge v3] 시도 중: ${currentModel}`);
        
        const modelCommand = command.replace(
          /-m \S+/, 
          `-m ${currentModel}`
        );
        
        const result = await this.executeCommand(modelCommand, {
          ...options,
          timeout: ModelStrategies[currentModel]?.timeout || options.timeout
        });
        
        return this._cleanResponse(result, options);
        
      } catch (error) {
        console.error(`[GeminiBridge v3] ${currentModel} 실패:`, error.message);
        
        if (i < fallbackChain.length - 1) {
          console.error(`[GeminiBridge v3] 폴백: ${fallbackChain[i + 1]}`);
          await sleep(1000); // 짧은 대기
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * 고급 채팅 옵션
   */
  async chatAdvanced(prompt, options = {}) {
    const advancedOptions = {
      ...options,
      // 프롬프트 분석을 통한 자동 설정
      headless: options.headless ?? (prompt.length < 100),
      model: options.model ?? 'auto',
      timeout: options.timeout ?? (prompt.length > 500 ? 45000 : 20000)
    };
    
    return this.chat(prompt, advancedOptions);
  }

  /**
   * 통계 조회 (개선된 형식)
   */
  async getStats() {
    try {
      // gemini /stats 실행
      const statsCommand = 'gemini /stats';
      const rawStats = await this.executeCommand(statsCommand, { timeout: 5000 });
      
      // 사용량 추적기 통계
      const usageStats = this.usageTracker.getDetailedStats();
      
      // 통합 통계
      return {
        geminiCLI: this._parseGeminiStats(rawStats),
        mcp: {
          usage: usageStats,
          cache: this.contextDetector.getCacheStats(),
          uptime: process.uptime(),
          models: {
            available: Object.keys(ModelStrategies),
            recommendations: this._getModelRecommendations(usageStats)
          }
        }
      };
    } catch (error) {
      return {
        error: error.message,
        fallback: this.usageTracker.getDetailedStats()
      };
    }
  }

  /**
   * Gemini 통계 파싱
   */
  _parseGeminiStats(rawStats) {
    // Gemini CLI 출력 형식에 따라 파싱
    const lines = rawStats.split('\n');
    const stats = {};
    
    lines.forEach(line => {
      if (line.includes('Usage:')) {
        const match = line.match(/(\d+)\/(\d+)/);
        if (match) {
          stats.used = parseInt(match[1]);
          stats.limit = parseInt(match[2]);
          stats.remaining = stats.limit - stats.used;
        }
      }
    });
    
    return stats;
  }

  /**
   * 모델 추천
   */
  _getModelRecommendations(usageStats) {
    const usagePercent = usageStats.percent;
    
    if (usagePercent < 50) {
      return {
        primary: 'gemini-2.5-pro',
        reason: '사용량 여유 - 고품질 모델 사용 권장'
      };
    } else if (usagePercent < 80) {
      return {
        primary: 'auto',
        reason: '사용량 중간 - 작업별 자동 선택 권장'
      };
    } else {
      return {
        primary: 'gemini-2.0-flash',
        reason: '사용량 높음 - 효율적인 Flash 모델 권장'
      };
    }
  }

  // 기존 메서드들 유지...
  async executeCommand(command, options = {}) {
    await this.initialize();

    if (!this.usageTracker.canUse()) {
      const stats = this.usageTracker.getDetailedStats();
      throw new Error(
        `Gemini CLI 일일 한도(${stats.limit}회) 초과. ` +
        `다음 리셋: ${new Date(stats.nextReset).toLocaleString('ko-KR')}`
      );
    }

    const timeout = options.timeout || this.timeout;
    const retries = options.retries || this.maxRetries;
    const startTime = Date.now();

    if (options.skipGeminiCheck !== true) {
      await this._checkGeminiAvailability();
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this._executeWithStrategy(command, timeout);
        
        const responseTime = Date.now() - startTime;
        const usageInfo = await this.usageTracker.incrementUsage({
          model: options.model || 'default',
          responseTime,
          success: true
        });
        
        console.error(
          `[GeminiBridge v3] 성공 (${attempt}/${retries}) ` +
          `- 사용량: ${usageInfo.current}/${this.usageTracker.dailyLimit} (${Math.round(usageInfo.percent)}%)`
        );
        
        return result;
      } catch (error) {
        console.error(`[GeminiBridge v3] 시도 ${attempt}/${retries} 실패:`, error.message);
        
        if (attempt === 1) {
          await this.usageTracker.incrementUsage({
            model: options.model || 'default',
            responseTime: Date.now() - startTime,
            success: false
          });
        }
        
        if (attempt < retries) {
          await sleep(1000 * attempt);
        } else {
          throw error;
        }
      }
    }
  }

  _cleanResponse(result, options) {
    const lines = result.split('\n');
    const cleanedLines = lines.filter(line => line.trim() !== '');
    
    while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
      cleanedLines.pop();
    }
    
    return cleanedLines.join('\n');
  }

  async _executeWithStrategy(command, timeout) {
    const strategyName = this.context.executionStrategy;
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      console.warn(`[GeminiBridge v3] 알 수 없는 전략 '${strategyName}', powershell 사용`);
      return await this.strategies.powershell.execute(command, timeout, this.context);
    }

    console.error(`[GeminiBridge v3] 전략 '${strategyName}' 사용`);
    
    try {
      return await strategy.execute(command, timeout, this.context);
    } catch (error) {
      if (strategyName !== 'fallback') {
        console.warn(`[GeminiBridge v3] '${strategyName}' 실패, fallback 시도`);
        return await this.strategies.fallback.execute(command, timeout, this.context);
      }
      throw error;
    }
  }

  async _checkGeminiAvailability() {
    const strategy = this.strategies[this.context.executionStrategy];
    
    if (strategy && strategy.checkAvailability) {
      return await strategy.checkAvailability(this.context);
    }

    try {
      await this.executeCommand('gemini --version', { 
        timeout: 5000, 
        skipGeminiCheck: true 
      });
    } catch (error) {
      throw new Error('Gemini CLI를 찾을 수 없습니다. 설치 및 PATH 설정을 확인하세요.');
    }
  }

  async getVersion() {
    return await this.executeCommand('gemini --version', { timeout: 5000 });
  }

  async clearContext() {
    await this.executeCommand('gemini /clear', { timeout: 5000 });
    this.context = null;
    this.contextDetector.clearCache();
    console.error('[GeminiBridge v3] 컨텍스트 초기화 완료');
    return '컨텍스트가 초기화되었습니다.';
  }

  _mapToPowerShellStrategy(oldStrategy) {
    const strategyMap = {
      'wsl-optimized': 'powershell',
      'wsl-fallback': 'powershell-fallback',
      'reverse-compatible': 'powershell',
      'powershell-direct': 'powershell',
      'powershell-fallback': 'powershell-fallback'
    };
    
    return strategyMap[oldStrategy] || 'powershell';
  }

  getUsageDashboard() {
    const stats = this.usageTracker.getDetailedStats();
    const cache = this.contextDetector.getCacheStats();
    const modelRecs = this._getModelRecommendations(stats);
    
    return {
      usage: {
        current: stats.current,
        limit: stats.limit,
        remaining: stats.remaining,
        percent: Math.round(stats.percent)
      },
      performance: {
        averageResponseTime: Math.round(stats.averageResponseTime),
        successRate: Math.round(stats.successRate * 100)
      },
      cache: {
        hitRate: cache.hitRate,
        size: cache.size
      },
      modelRecommendation: modelRecs,
      nextReset: new Date(stats.nextReset).toLocaleString('ko-KR')
    };
  }
}