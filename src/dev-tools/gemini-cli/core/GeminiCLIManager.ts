/**
 * Gemini CLI 핵심 관리자
 * 
 * @description 모든 Gemini CLI 호출을 관리하는 중앙 집중형 매니저
 * @note 로컬 개발 전용 - 재사용 가능한 모듈
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { 
  GeminiConfig, 
  GeminiQuery, 
  GeminiResponse,
  DevOnlyConfig 
} from './types.js';

export class GeminiCLIManager {
  private config: GeminiConfig;
  private devConfig: DevOnlyConfig;
  private callCount: number = 0;
  private startTime: number;

  constructor(config?: Partial<GeminiConfig>) {
    this.config = {
      executablePath: 'gemini',
      timeout: 30000,
      maxRetries: 3,
      logLevel: 'info',
      ...config
    };

    this.devConfig = {
      isDevelopment: process.env.NODE_ENV !== 'production',
      excludeFromBuild: true,
      excludeFromDeploy: true
    };

    this.startTime = Date.now();
    this.validateEnvironment();
  }

  /**
   * 개발 환경 검증
   */
  private validateEnvironment(): void {
    if (!this.devConfig.isDevelopment) {
      throw new Error('🚫 GeminiCLIManager는 개발 환경에서만 사용 가능합니다.');
    }

    // Vercel 환경에서 실행 방지
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      throw new Error('🚫 GeminiCLIManager는 Vercel 환경에서 실행할 수 없습니다.');
    }
  }

  /**
   * Gemini CLI 명령 실행
   */
  async executeQuery(query: GeminiQuery): Promise<GeminiResponse> {
    const startTime = Date.now();
    this.callCount++;

    try {
      this.log('info', `🚀 Gemini 쿼리 실행 중... (${this.callCount}번째 호출)`);
      
      const response = await this.runGeminiCommand(query);
      const executionTime = Date.now() - startTime;

      this.log('info', `✅ Gemini 쿼리 완료 (${executionTime}ms)`);

      return {
        content: response,
        executionTime,
        success: true,
        estimatedTokens: this.estimateTokens(query.prompt + (query.input || ''))
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.log('error', `❌ Gemini 쿼리 실패: ${errorMessage}`);

      return {
        content: '',
        executionTime,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 파일 참조와 함께 쿼리 실행
   */
  async executeWithFileReference(
    filePaths: string[], 
    prompt: string
  ): Promise<GeminiResponse> {
    try {
      // 파일 내용 읽기
      const fileContents = await Promise.all(
        filePaths.map(async (filePath) => {
          const fullPath = path.resolve(filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          return `@${filePath}\n${content}`;
        })
      );

      const query: GeminiQuery = {
        prompt,
        input: fileContents.join('\n\n'),
        fileReferences: filePaths
      };

      return this.executeQuery(query);

    } catch (error) {
      this.log('error', `파일 읽기 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 배치 쿼리 실행 (순차적)
   */
  async executeBatch(queries: GeminiQuery[]): Promise<GeminiResponse[]> {
    const results: GeminiResponse[] = [];
    
    this.log('info', `📦 배치 실행 시작 (${queries.length}개 쿼리)`);

    for (const [index, query] of queries.entries()) {
      this.log('info', `⏳ 배치 진행: ${index + 1}/${queries.length}`);
      
      const result = await this.executeQuery(query);
      results.push(result);

      // 실패 시 중단할지 결정
      if (!result.success && this.config.maxRetries === 0) {
        this.log('warn', '🛑 배치 실행 중단 (실패로 인한)');
        break;
      }
    }

    this.log('info', `✅ 배치 실행 완료 (${results.length}개 결과)`);
    return results;
  }

  /**
   * 실제 Gemini CLI 명령 실행
   */
  private async runGeminiCommand(query: GeminiQuery): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['-p', query.prompt];
      
      const geminiProcess = spawn(this.config.executablePath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // 입력 데이터가 있으면 파이프로 전달
      if (query.input) {
        geminiProcess.stdin?.write(query.input);
        geminiProcess.stdin?.end();
      }

      geminiProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      geminiProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      geminiProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Gemini CLI 종료 코드: ${code}\nSTDERR: ${stderr}`));
        }
      });

      geminiProcess.on('error', (error) => {
        reject(new Error(`Gemini CLI 실행 오류: ${error.message}`));
      });

      // 타임아웃 설정
      setTimeout(() => {
        geminiProcess.kill();
        reject(new Error('Gemini CLI 타임아웃'));
      }, this.config.timeout);
    });
  }

  /**
   * 토큰 수 추정 (대략적)
   */
  private estimateTokens(text: string): number {
    // 대략적인 토큰 계산 (1토큰 ≈ 4글자)
    return Math.ceil(text.length / 4);
  }

  /**
   * 로깅
   */
  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * 통계 정보 반환
   */
  getStats() {
    return {
      callCount: this.callCount,
      uptime: Date.now() - this.startTime,
      config: this.config,
      isDevelopment: this.devConfig.isDevelopment
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', '⚙️ Gemini 설정이 업데이트되었습니다.');
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.executeQuery({
        prompt: 'ping'
      });
      return response.success;
    } catch {
      return false;
    }
  }
}