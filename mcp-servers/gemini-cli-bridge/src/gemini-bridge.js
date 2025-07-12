import { spawn } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

export class GeminiBridge {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.powershellPath = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
  }

  /**
   * PowerShell을 통해 Gemini CLI 명령 실행
   */
  async executeCommand(command, options = {}) {
    const timeout = options.timeout || this.timeout;
    const retries = options.retries || this.maxRetries;

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
   * 타임아웃이 있는 명령 실행
   */
  async _executeWithTimeout(command, timeout) {
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
        reject(new Error(`명령 실행 시간 초과 (${timeout}ms)`));
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
          reject(new Error(`명령 실행 실패 (코드: ${code}): ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Gemini CLI 버전 확인
   */
  async getVersion() {
    const result = await this.executeCommand('gemini --version', { timeout: 5000 });
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