import { spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const sleep = promisify(setTimeout);

export class GeminiBridge {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.powershellPath = this._findPowerShellPath();
  }

  /**
   * PowerShell 실행 파일 경로 자동 탐지
   */
  _findPowerShellPath() {
    const possiblePaths = [
      '/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe',
      '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
      '/mnt/c/windows/system32/windowspowershell/v1.0/powershell.exe',
      'powershell.exe' // PATH에서 찾기
    ];

    // existsSync는 이미 import됨
    
    for (const path of possiblePaths) {
      if (path === 'powershell.exe' || existsSync(path)) {
        console.log(`[GeminiBridge] PowerShell 경로 발견: ${path}`);
        return path;
      }
    }

    // 기본값으로 PATH에서 찾기
    console.warn('[GeminiBridge] PowerShell 경로를 찾을 수 없어 기본값 사용: powershell.exe');
    return 'powershell.exe';
  }

  /**
   * PowerShell을 통해 Gemini CLI 명령 실행
   */
  async executeCommand(command, options = {}) {
    const timeout = options.timeout || this.timeout;
    const retries = options.retries || this.maxRetries;

    // 첫 번째 시도 전에 Gemini CLI 가용성 확인
    if (options.skipGeminiCheck !== true) {
      await this._checkGeminiAvailability();
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this._executeWithTimeout(command, timeout);
        return result;
      } catch (error) {
        console.error(`[GeminiBridge] 시도 ${attempt}/${retries} 실패:`, error.message);
        
        if (attempt < retries) {
          await sleep(1000 * attempt); // 재시도 전 대기
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Gemini CLI 가용성 확인
   */
  async _checkGeminiAvailability() {
    try {
      // PowerShell에서 Gemini 명령어 확인
      const checkCommand = 'Get-Command gemini -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source';
      await this._executeWithTimeout(checkCommand, 5000);
    } catch (error) {
      console.warn('[GeminiBridge] Gemini CLI를 찾을 수 없습니다. WSL 환경에서 직접 시도합니다.');
      
      // WSL에서 직접 Gemini 확인
      try {
        // spawn은 이미 import됨
        await new Promise((resolve, reject) => {
          const child = spawn('gemini', ['--version'], { shell: true });
          child.on('close', (code) => {
            if (code === 0) {
              console.log('[GeminiBridge] WSL에서 Gemini CLI 확인됨');
              resolve();
            } else {
              reject(new Error('Gemini CLI not found in WSL'));
            }
          });
          child.on('error', reject);
        });
      } catch (wslError) {
        throw new Error('Gemini CLI를 PowerShell과 WSL 모두에서 찾을 수 없습니다. Gemini CLI가 설치되고 PATH에 있는지 확인하세요.');
      }
    }
  }

  /**
   * 타임아웃이 있는 명령 실행
   */
  async _executeWithTimeout(command, timeout) {
    // 먼저 PowerShell을 통해 시도
    try {
      return await this._executeViaPowerShell(command, timeout);
    } catch (error) {
      console.warn(`[GeminiBridge] PowerShell 실행 실패, WSL 직접 실행으로 폴백: ${error.message}`);
      
      // PowerShell 실패 시 WSL에서 직접 실행
      if (command.startsWith('gemini')) {
        return await this._executeViaWSL(command, timeout);
      }
      
      throw error;
    }
  }

  /**
   * PowerShell을 통한 명령 실행
   */
  async _executeViaPowerShell(command, timeout) {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      // PowerShell 명령 구성
      const escapedCommand = command.replace(/"/g, '\\"');
      
      const child = spawn(this.powershellPath, ['-Command', escapedCommand], {
        windowsHide: true,
        shell: false
      });

      // 타임아웃 설정
      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error(`PowerShell 명령 실행 시간 초과 (${timeout}ms)`));
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

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
   * WSL에서 직접 명령 실행
   */
  async _executeViaWSL(command, timeout) {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const child = spawn('bash', ['-c', command], {
        shell: false
      });

      // 타임아웃 설정
      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error(`WSL 명령 실행 시간 초과 (${timeout}ms)`));
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        
        if (killed) return;

        if (code !== 0) {
          reject(new Error(`WSL 명령 실행 실패 (코드: ${code}): ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(new Error(`WSL 실행 오류: ${error.message}`));
      });
    });
  }

  /**
   * Gemini CLI 버전 확인
   */
  async getVersion() {
    const result = await this.executeCommand('gemini --version', { 
      timeout: 5000, 
      skipGeminiCheck: true 
    });
    return result;
  }

  /**
   * Gemini에 프롬프트 전송
   */
  async chat(prompt) {
    // 프롬프트의 따옴표 이스케이프
    const escapedPrompt = prompt.replace(/'/g, "''");
    const command = `gemini -p '${escapedPrompt}'`;
    
    const result = await this.executeCommand(command);
    
    // "Loaded cached credentials." 같은 메시지 제거
    const lines = result.split('\n');
    const cleanedLines = lines.filter(line => 
      !line.includes('Loaded cached credentials') &&
      !line.includes('[WARN]') &&
      line.trim() !== ''
    );
    
    return cleanedLines.join('\n');
  }

  /**
   * 파일 내용을 Gemini에 전달하여 분석
   */
  async analyzeFile(filePath, prompt) {
    // WSL 경로를 Windows 경로로 변환
    const windowsPath = this._convertToWindowsPath(filePath);
    const escapedPrompt = prompt.replace(/'/g, "''");
    
    const command = `Get-Content '${windowsPath}' | gemini -p '${escapedPrompt}'`;
    
    return await this.executeCommand(command);
  }

  /**
   * Git diff를 Gemini에 전달하여 리뷰
   */
  async reviewDiff(prompt) {
    const escapedPrompt = prompt.replace(/'/g, "''");
    
    // WSL에서 git diff 실행 후 PowerShell로 전달
    const command = `bash -c "cd /mnt/d/cursor/openmanager-vibe-v5 && git diff" | gemini -p '${escapedPrompt}'`;
    
    return await this.executeCommand(command);
  }

  /**
   * Gemini 통계 조회
   */
  async getStats() {
    return await this.executeCommand('gemini /stats');
  }

  /**
   * Gemini 컨텍스트 초기화
   */
  async clearContext() {
    return await this.executeCommand('gemini /clear');
  }

  /**
   * Gemini 대화 압축
   */
  async compressConversation() {
    return await this.executeCommand('gemini /compress');
  }

  /**
   * Gemini 메모리 관리
   */
  async manageMemory(action, content = '') {
    if (action === 'list') {
      return await this.executeCommand('gemini /memory list');
    } else if (action === 'add' && content) {
      const escapedContent = content.replace(/'/g, "''");
      return await this.executeCommand(`gemini /memory add '${escapedContent}'`);
    } else if (action === 'clear') {
      return await this.executeCommand('gemini /memory clear');
    }
    
    throw new Error('잘못된 메모리 작업입니다.');
  }

  /**
   * WSL 경로를 Windows 경로로 변환
   */
  _convertToWindowsPath(wslPath) {
    // /mnt/d/path -> D:\path 형식으로 변환
    if (wslPath.startsWith('/mnt/')) {
      const parts = wslPath.split('/');
      const drive = parts[2].toUpperCase();
      const path = parts.slice(3).join('\\');
      return `${drive}:\\${path}`;
    }
    return wslPath;
  }
}