import { spawn } from 'child_process';

/**
 * 단순화된 PowerShell 전용 Gemini CLI 브릿지
 * - 복잡한 컨텍스트 감지 제거
 * - PowerShell 직접 실행에 집중
 * - 최소한의 에러 처리만 포함
 */
export class SimplePowerShellBridge {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.debug = process.env.GEMINI_DEBUG === 'true';
  }

  /**
   * 간단한 초기화 - 버전 확인만
   */
  async initialize() {
    if (this.debug) {
      console.error('[SimplePowerShellBridge] 초기화 시작...');
    }
    
    try {
      const version = await this.getVersion();
      console.error(`[SimplePowerShellBridge] Gemini CLI 버전: ${version}`);
      return { success: true, version };
    } catch (error) {
      console.error('[SimplePowerShellBridge] 초기화 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * PowerShell에서 직접 gemini 실행
   */
  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // PowerShell 명령 구성
      const fullCommand = `${command} ${args.join(' ')}`;
      
      if (this.debug) {
        console.error(`[SimplePowerShellBridge] 실행: ${fullCommand}`);
      }

      // PowerShell에서 직접 실행
      const child = spawn('powershell.exe', ['-Command', fullCommand], {
        windowsHide: true,
        encoding: 'utf8'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(new Error(`실행 실패: ${error.message}`));
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (this.debug) {
          console.error(`[SimplePowerShellBridge] 완료 (${duration}ms) - 코드: ${code}`);
        }

        if (code !== 0 && stderr) {
          reject(new Error(`종료 코드: ${code}, 에러: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      // 타임아웃 처리
      setTimeout(() => {
        child.kill();
        reject(new Error(`타임아웃 (${this.timeout}ms)`));
      }, this.timeout);
    });
  }

  /**
   * Gemini 버전 확인
   */
  async getVersion() {
    try {
      const output = await this.executeCommand('gemini', ['--version']);
      return output.split('\n')[0] || 'Unknown';
    } catch (error) {
      throw new Error(`버전 확인 실패: ${error.message}`);
    }
  }

  /**
   * Gemini 채팅 실행
   */
  async chat(prompt, options = {}) {
    const args = [];
    
    // --prompt 플래그 사용 (따옴표 처리 개선)
    args.push('--prompt', `"${prompt.replace(/"/g, '\\"')}"`);
    
    // 모델 지정
    if (options.model) {
      args.push('-m', options.model);
    }
    
    // YOLO 모드
    if (options.yolo) {
      args.push('-y');
    }

    try {
      const output = await this.executeCommand('gemini', args);
      
      // 불필요한 메시지 필터링
      const lines = output.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('Loaded cached credentials') &&
               !trimmed.startsWith('Loading') &&
               !trimmed.startsWith('Starting');
      });
      
      return filteredLines.join('\n').trim();
    } catch (error) {
      // 간단한 재시도 로직
      if (error.message.includes('타임아웃') && options.retry !== false) {
        console.error('[SimplePowerShellBridge] 재시도 중...');
        return await this.chat(prompt, { ...options, retry: false });
      }
      throw error;
    }
  }

  /**
   * 사용량 확인
   */
  async getStats() {
    // Gemini CLI는 API 모드에서 /stats를 지원하지 않음
    // 대신 더미 데이터 반환
    return {
      message: "Gemini CLI API 모드에서는 사용량 확인이 지원되지 않습니다.",
      tip: "인터랙티브 모드에서 /stats 명령을 사용하세요."
    };
  }

  /**
   * 컨텍스트 초기화
   */
  async clearContext() {
    // Gemini CLI는 API 모드에서 /clear를 지원하지 않음
    return { 
      success: false, 
      message: "API 모드에서는 컨텍스트 초기화가 지원되지 않습니다." 
    };
  }

  /**
   * 대화 압축
   */
  async compressContext() {
    // Gemini CLI는 API 모드에서 /compress를 지원하지 않음
    return { 
      success: false, 
      message: "API 모드에서는 대화 압축이 지원되지 않습니다." 
    };
  }
}