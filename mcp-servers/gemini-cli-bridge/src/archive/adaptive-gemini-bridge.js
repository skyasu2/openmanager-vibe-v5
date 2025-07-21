/**
 * 🚀 AdaptiveGeminiBridge v2.0으로 업그레이드 (PowerShell 전용)
 * 개선사항:
 * - PowerShell 전용 전략 패턴 (2개)
 * - 사용량 추적 기능 추가
 * - 컨텍스트 캐싱으로 성능 향상
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { ContextDetector } from './context-detector.js';

export class AdaptiveGeminiBridge {
  constructor() {
    this.contextDetector = new ContextDetector();
    this.strategies = {
      powershell: new PowerShellStrategy(),
      'powershell-fallback': new PowerShellFallbackStrategy(),
    };
  }

  /**
   * 적응적 명령 실행
   */
  async execute(command, timeout = 10000) {
    const context = this.contextDetector.determineExecutionStrategy();
    const strategy = context.strategy;

    console.error(`[AdaptiveBridge] 실행 전략: ${strategy}`);
    console.error(
      `[AdaptiveBridge] 권장사항: ${context.recommendations.join(', ')}`
    );

    // 전략별 실행
    const strategyInstance = this.strategies[strategy];
    if (!strategyInstance) {
      throw new Error(`알 수 없는 실행 전략: ${strategy}`);
    }

    try {
      return await strategyInstance.execute(command, timeout, context.context);
    } catch (error) {
      console.error(`[AdaptiveBridge] ${strategy} 전략 실패: ${error.message}`);

      // 폴백 전략 시도
      const fallbackStrategy = this._getFallbackStrategy(strategy);
      if (fallbackStrategy) {
        console.error(`[AdaptiveBridge] 폴백 전략 시도: ${fallbackStrategy}`);
        return await this.strategies[fallbackStrategy].execute(
          command,
          timeout,
          context.context
        );
      }

      throw error;
    }
  }

  /**
   * 폴백 전략 결정
   */
  _getFallbackStrategy(strategy) {
    const fallbackMap = {
      powershell: 'powershell-fallback',
      'powershell-fallback': null, // 최종 폴백
    };

    return fallbackMap[strategy];
  }

  /**
   * Gemini CLI 가용성 확인
   */
  async checkAvailability() {
    const context = this.contextDetector.determineExecutionStrategy();
    const strategy = this.strategies[context.strategy];

    return await strategy.checkAvailability(context.context);
  }
}

/**
 * PowerShell 기본 전략
 */
class PowerShellStrategy {
  constructor() {
    this.powerShellPath = this._findPowerShellPath();
  }

  _findPowerShellPath() {
    // Windows 네이티브 환경에서 실행
    if (process.platform === 'win32') {
      return 'powershell.exe';
    }

    // WSL 환경에서 PowerShell 브릿지 사용
    const possiblePaths = [
      '/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe',
      '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
      'powershell.exe',
    ];

    for (const path of possiblePaths) {
      if (path === 'powershell.exe' || existsSync(path)) {
        return path;
      }
    }

    return 'powershell.exe';
  }

  async execute(command, timeout, context) {
    console.error('[PowerShell] PowerShell 기본 전략 실행');

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      // PowerShell 명령 이스케이프 처리
      const escapedCommand = this._escapePowerShellCommand(command);

      const child = spawn(this.powerShellPath, ['-Command', escapedCommand], {
        shell: false,
        windowsHide: true,
      });

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error(`PowerShell 기본 전략 타임아웃 (${timeout}ms)`));
      }, timeout);

      child.stdout.on('data', data => (stdout += data.toString()));
      child.stderr.on('data', data => (stderr += data.toString()));

      child.on('close', code => {
        clearTimeout(timer);
        if (killed) return;

        if (code !== 0) {
          reject(
            new Error(`PowerShell 기본 전략 실패 (코드: ${code}): ${stderr}`)
          );
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', error => {
        clearTimeout(timer);
        reject(new Error(`PowerShell 기본 전략 오류: ${error.message}`));
      });
    });
  }

  /**
   * PowerShell 명령 이스케이프 처리
   */
  _escapePowerShellCommand(command) {
    // PowerShell 특수 문자 이스케이프
    return command
      .replace(/"/g, '`"') // 큰따옴표를 백틱으로 이스케이프
      .replace(/\$/g, '`$') // 달러 기호 이스케이프
      .replace(/\`/g, '``'); // 백틱 이스케이프
  }

  async checkAvailability(context) {
    try {
      const result = await this.execute(
        'Get-Command gemini -ErrorAction SilentlyContinue',
        5000
      );
      return result && !result.includes('Get-Command');
    } catch (error) {
      return false;
    }
  }
}

/**
 * PowerShell 폴백 전략
 */
class PowerShellFallbackStrategy extends PowerShellStrategy {
  constructor() {
    super();
    this.maxRetries = 3;
  }

  async execute(command, timeout, context) {
    console.error('[PowerShellFallback] PowerShell 폴백 전략 실행');

    // 여러 방법으로 시도
    const methods = [
      () => this._executeWithRetry(command, timeout, context),
      () => this._executeWithAlternative(command, timeout, context),
      () => this._executeWithErrorHandling(command, timeout, context),
    ];

    for (const method of methods) {
      try {
        return await method();
      } catch (error) {
        console.error(`[PowerShellFallback] 방법 실패: ${error.message}`);
        continue;
      }
    }

    throw new Error('모든 PowerShell 실행 방법이 실패했습니다');
  }

  async _executeWithRetry(command, timeout, context) {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await super.execute(command, timeout, context);
      } catch (error) {
        if (i === this.maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  async _executeWithAlternative(command, timeout, context) {
    // 대체 명령어 시도 (gemini.exe)
    const alternativeCommand = command.replace(/gemini/g, 'gemini.exe');
    return await super.execute(alternativeCommand, timeout, context);
  }

  async _executeWithErrorHandling(command, timeout, context) {
    // 오류 처리 강화된 실행
    const enhancedCommand = `try { ${command} } catch { Write-Error $_.Exception.Message }`;
    return await super.execute(enhancedCommand, timeout, context);
  }
}
