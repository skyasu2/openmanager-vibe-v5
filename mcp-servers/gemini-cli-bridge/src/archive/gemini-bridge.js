import { spawn } from 'child_process';

export class GeminiBridge {
  constructor() {
    this.powerShellPath = 'powershell.exe';
  }

  /**
   * Gemini CLI 가용성 확인
   */
  async checkGeminiAvailability() {
    try {
      const result = await this._executeViaPowerShell('gemini --version', 5000);
      console.log(`[GeminiBridge] Gemini CLI 버전: ${result}`);
      return true;
    } catch (error) {
      console.warn('[GeminiBridge] Gemini CLI를 찾을 수 없습니다.');
      return false;
    }
  }

  /**
   * 명령 실행
   */
  async execute(command, timeout = 10000) {
    console.log(`[GeminiBridge] 명령 실행: ${command}`);

    try {
      return await this._executeViaPowerShell(command, timeout);
    } catch (error) {
      console.error(`[GeminiBridge] PowerShell 실행 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * PowerShell에서 명령 실행
   */
  async _executeViaPowerShell(command, timeout) {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const child = spawn(this.powerShellPath, ['-Command', command], {
        shell: false,
        windowsHide: true,
      });

      // 타임아웃 설정
      const timer = setTimeout(() => {
        killed = true;
        child.kill();
        reject(new Error(`PowerShell 명령 실행 시간 초과 (${timeout}ms)`));
      }, timeout);

      child.stdout.on('data', data => {
        stdout += data.toString();
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', code => {
        clearTimeout(timer);

        if (killed) return;

        if (code !== 0) {
          reject(
            new Error(`PowerShell 명령 실행 실패 (코드: ${code}): ${stderr}`)
          );
        } else {
          resolve(stdout.trim());
        }
      });

      child.on('error', error => {
        clearTimeout(timer);
        reject(new Error(`PowerShell 실행 오류: ${error.message}`));
      });
    });
  }

  /**
   * Git diff 명령 실행
   */
  async executeGitDiff(prompt) {
    try {
      const escapedPrompt = prompt.replace(/'/g, "''");
      const command = `git diff | gemini -p '${escapedPrompt}'`;

      const result = await this._executeViaPowerShell(command, 15000);
      return result;
    } catch (error) {
      console.error(`[GeminiBridge] Git diff 실행 실패: ${error.message}`);
      throw error;
    }
  }
}
