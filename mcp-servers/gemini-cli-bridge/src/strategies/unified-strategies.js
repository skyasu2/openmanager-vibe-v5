import { spawn } from 'child_process';
import { existsSync } from 'fs';

/**
 * 🎯 PowerShell 전용 실행 전략 클래스들
 * WSL 의존성 제거 및 PowerShell 환경 최적화
 */

/**
 * PowerShell 기본 전략
 */
export class PowerShellStrategy {
  constructor() {
    this.name = 'powershell';
    this.powershellPath = this._findPowerShellPath();
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
      'powershell.exe'
    ];

    for (const path of possiblePaths) {
      if (path === 'powershell.exe' || existsSync(path)) {
        return path;
      }
    }

    return 'powershell.exe';
  }

  async execute(command, timeout, context) {
    console.error('[PowerShell] PowerShell 전략 실행');
    
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      // PowerShell 명령 이스케이프 처리
      const escapedCommand = this._escapePowerShellCommand(command);
      
      const child = spawn(this.powershellPath, ['-Command', escapedCommand], {
        windowsHide: true,
        shell: false
      });

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error(`PowerShell 전략 타임아웃 (${timeout}ms)`));
      }, timeout);

      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());

      child.on('close', (code) => {
        clearTimeout(timer);
        if (killed) return;

        if (code !== 0) {
          reject(new Error(`PowerShell 명령 실행 실패 (코드: ${code}): ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(new Error(`PowerShell 실행 오류: ${error.message}`));
      });
    });
  }

  /**
   * PowerShell 명령 이스케이프 처리
   */
  _escapePowerShellCommand(command) {
    // PowerShell 특수 문자 이스케이프
    return command
      .replace(/"/g, '`"')  // 큰따옴표를 백틱으로 이스케이프
      .replace(/\$/g, '`$') // 달러 기호 이스케이프
      .replace(/\`/g, '``'); // 백틱 이스케이프
  }

  async checkAvailability(context) {
    const checkCommand = 'Get-Command gemini -ErrorAction SilentlyContinue';
    try {
      const result = await this.execute(checkCommand, 5000, context);
      return result && !result.includes('Get-Command');
    } catch (error) {
      return false;
    }
  }
}

/**
 * PowerShell 폴백 전략 (재시도 및 대체 방법)
 */
export class PowerShellFallbackStrategy extends PowerShellStrategy {
  constructor() {
    super();
    this.name = 'powershell-fallback';
    this.maxRetries = 3;
  }

  async execute(command, timeout, context) {
    console.error('[PowerShellFallback] PowerShell 폴백 전략 실행');
    
    // 여러 방법으로 시도
    const methods = [
      () => this._executeWithRetry(command, timeout, context),
      () => this._executeWithAlternative(command, timeout, context),
      () => this._executeWithErrorHandling(command, timeout, context)
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

/**
 * 범용 폴백 전략 (최후의 수단)
 */
export class UniversalFallbackStrategy {
  constructor() {
    this.name = 'universal-fallback';
    this.attempts = [];
  }

  async execute(command, timeout, context) {
    console.error('[UniversalFallback] 범용 폴백 전략 실행');
    
    // 시도 1: 직접 실행
    try {
      return await this._directExecution(command, timeout);
    } catch (error) {
      this.attempts.push({ method: 'direct', error: error.message });
    }

    // 시도 2: shell: true로 실행
    try {
      return await this._shellExecution(command, timeout);
    } catch (error) {
      this.attempts.push({ method: 'shell', error: error.message });
    }

    // 시도 3: cmd.exe 경유 (Windows)
    if (process.platform === 'win32') {
      try {
        return await this._cmdExecution(command, timeout);
      } catch (error) {
        this.attempts.push({ method: 'cmd', error: error.message });
      }
    }

    // 모든 시도 실패
    const summary = this.attempts
      .map(a => `${a.method}: ${a.error}`)
      .join(', ');
    throw new Error(`범용 폴백 전략 실패 - 시도 내역: ${summary}`);
  }

  async _directExecution(command, timeout) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { shell: false });
      
      let stdout = '';
      let stderr = '';
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error('직접 실행 타임아웃'));
      }, timeout);

      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());

      child.on('close', (code) => {
        clearTimeout(timer);
        if (killed) return;
        
        if (code !== 0) {
          reject(new Error(`직접 실행 실패: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', reject);
    });
  }

  async _shellExecution(command, timeout) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], { 
        shell: true,
        windowsHide: true
      });
      
      let stdout = '';
      let stderr = '';
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error('shell 실행 타임아웃'));
      }, timeout);

      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());

      child.on('close', (code) => {
        clearTimeout(timer);
        if (killed) return;
        
        if (code !== 0) {
          reject(new Error(`shell 실행 실패: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', reject);
    });
  }

  async _cmdExecution(command, timeout) {
    return new Promise((resolve, reject) => {
      const child = spawn('cmd.exe', ['/c', command], {
        windowsHide: true,
        shell: false
      });
      
      let stdout = '';
      let stderr = '';
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error('cmd 실행 타임아웃'));
      }, timeout);

      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());

      child.on('close', (code) => {
        clearTimeout(timer);
        if (killed) return;
        
        if (code !== 0) {
          reject(new Error(`cmd 실행 실패: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', reject);
    });
  }

  async checkAvailability(context) {
    // 기본 가용성 확인
    try {
      const result = await this._directExecution('gemini --version', 5000);
      return result && result.includes('gemini');
    } catch (error) {
      return false;
    }
  }
}