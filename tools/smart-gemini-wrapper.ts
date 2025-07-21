#!/usr/bin/env tsx

/**
 * 🚀 Smart Gemini Wrapper v1.0 - 지능형 AI 협업 도구
 *
 * 주요 기능:
 * - 자동 fallback 시스템 (pro → flash)
 * - Claude와 Gemini 협업 orchestration
 * - 사용량 모니터링 및 리포팅
 * - WSL 환경 최적화
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 타입 정의
interface GeminiModel {
  name: string;
  model: string;
  priority: number;
  dailyLimit?: number;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  modelUsed?: string;
  duration?: number;
  timestamp: string;
  fallback?: boolean;
}

interface UsageLog {
  timestamp: string;
  model: string;
  command: string;
  success: boolean;
  fallback?: boolean;
  errorType?: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  models: {
    [key: string]: {
      available: boolean;
      lastUsed?: string;
      todayUsage: number;
    };
  };
  timestamp: string;
}

// 에러 타입 정의
enum ErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 스마트 Gemini 래퍼 클래스
 */
export class SmartGeminiWrapper {
  private models: GeminiModel[] = [
    {
      name: 'pro',
      model: 'gemini-1.5-pro-latest',
      priority: 1,
      dailyLimit: 50,
    },
    {
      name: 'flash',
      model: 'gemini-1.5-flash-latest',
      priority: 2,
      dailyLimit: 1500,
    },
  ];

  private cacheDir: string;
  private logDir: string;
  private maxCacheAge = 1000 * 60 * 5; // 5분
  private rateLimitDelay = 1000; // 1초
  private lastRequestTime = 0;
  private debug: boolean;
  private timeout: number;

  constructor(
    options: {
      debug?: boolean;
      timeout?: number;
      cacheDir?: string;
      logDir?: string;
    } = {}
  ) {
    this.debug = options.debug || process.env.GEMINI_DEBUG === 'true';
    this.timeout = options.timeout || 30000;
    this.cacheDir =
      options.cacheDir || join(__dirname, '..', '.cache', 'gemini');
    this.logDir = options.logDir || join(__dirname, '..', '.logs', 'gemini');

    this.ensureDirectories();
  }

  /**
   * 필요한 디렉토리 생성
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      if (this.debug) {
        console.error('[SmartGemini] 디렉토리 생성 실패:', error);
      }
    }
  }

  /**
   * 지능형 실행 - 자동 fallback 포함
   */
  async execute(
    prompt: string,
    options: {
      preferredModel?: string;
      context?: string;
      noCache?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<ExecutionResult> {
    const fullPrompt = options.context
      ? `${options.context}\n\n${prompt}`
      : prompt;

    const preferredModel = options.preferredModel || 'pro';
    const modelIndex = this.models.findIndex(m => m.name === preferredModel);

    if (modelIndex === -1) {
      return {
        success: false,
        error: `알 수 없는 모델: ${preferredModel}`,
        timestamp: new Date().toISOString(),
      };
    }

    // 모델 우선순위에 따라 시도
    for (let i = modelIndex; i < this.models.length; i++) {
      const model = this.models[i];

      if (this.debug) {
        console.log(`🎯 ${model.name} 모델로 시도 중...`);
      }

      const result = await this.executeWithModel(fullPrompt, model, {
        noCache: options.noCache,
        isRetry: i > modelIndex,
      });

      if (result.success) {
        await this.logUsage({
          timestamp: result.timestamp,
          model: model.name,
          command: 'execute',
          success: true,
          fallback: i > modelIndex,
        });

        return result;
      }

      // 에러 타입 분석
      const errorType = this.analyzeError(result.error || '');

      // 사용량 초과가 아닌 경우 재시도하지 않음
      if (
        errorType !== ErrorType.QUOTA_EXCEEDED &&
        errorType !== ErrorType.RATE_LIMIT
      ) {
        await this.logUsage({
          timestamp: result.timestamp,
          model: model.name,
          command: 'execute',
          success: false,
          errorType,
        });

        return result;
      }

      if (this.debug) {
        console.log(`⚠️ ${model.name} 모델 한도 초과, 다음 모델로 전환...`);
      }
    }

    // 모든 모델 실패
    return {
      success: false,
      error: '모든 모델에서 실행 실패',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 특정 모델로 실행
   */
  private async executeWithModel(
    prompt: string,
    model: GeminiModel,
    options: { noCache?: boolean; isRetry?: boolean } = {}
  ): Promise<ExecutionResult> {
    // Rate limiting
    await this.applyRateLimit();

    // 캐시 확인
    if (!options.noCache && !options.isRetry) {
      const cached = await this.getCachedResult(prompt, model.name);
      if (cached) {
        return cached;
      }
    }

    try {
      const args = ['--prompt', prompt, '--model', model.model];

      // WSL 환경 최적화
      const spawnOptions: SpawnOptionsWithoutStdio = {
        windowsHide: true,
        shell:
          process.platform === 'linux' && process.env.WSL_DISTRO_NAME
            ? false // WSL에서는 shell 사용 안 함
            : true,
      };

      const result = await this.runGeminiCommand(args, spawnOptions);

      if (result.success && !options.noCache) {
        await this.setCachedResult(prompt, model.name, result);
      }

      return {
        ...result,
        modelUsed: model.name,
        fallback: options.isRetry,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        modelUsed: model.name,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Gemini 명령 실행
   */
  private async runGeminiCommand(
    args: string[],
    options: SpawnOptionsWithoutStdio
  ): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const child = spawn('gemini', args, {
        ...options,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      child.on('error', error => {
        reject(error);
      });

      child.on('close', code => {
        const duration = Date.now() - startTime;

        if (code === 0) {
          resolve({
            success: true,
            output: this.cleanOutput(stdout),
            duration,
            timestamp: new Date().toISOString(),
          });
        } else {
          resolve({
            success: false,
            error: stderr || `종료 코드: ${code}`,
            duration,
            timestamp: new Date().toISOString(),
          });
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
   * 에러 타입 분석
   */
  private analyzeError(error: string): ErrorType {
    const errorLower = error.toLowerCase();

    const quotaKeywords = [
      'quota exceeded',
      'rate limit',
      'usage limit',
      'daily limit',
      'limit reached',
      '429',
      'try again tomorrow',
    ];

    if (quotaKeywords.some(keyword => errorLower.includes(keyword))) {
      return ErrorType.QUOTA_EXCEEDED;
    }

    if (errorLower.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }

    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return ErrorType.NETWORK;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Rate limiting 적용
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * 캐시 관련 메서드
   */
  private getCacheKey(prompt: string, model: string): string {
    const content = `${model}:${prompt}`;
    return createHash('md5').update(content).digest('hex');
  }

  private async getCachedResult(
    prompt: string,
    model: string
  ): Promise<ExecutionResult | null> {
    try {
      const cacheKey = this.getCacheKey(prompt, model);
      const cacheFile = join(this.cacheDir, `${cacheKey}.json`);
      const stats = await fs.stat(cacheFile);

      if (Date.now() - stats.mtime.getTime() < this.maxCacheAge) {
        const cached = await fs.readFile(cacheFile, 'utf8');
        return JSON.parse(cached);
      }
    } catch {
      return null;
    }

    return null;
  }

  private async setCachedResult(
    prompt: string,
    model: string,
    result: ExecutionResult
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(prompt, model);
      const cacheFile = join(this.cacheDir, `${cacheKey}.json`);
      await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
    } catch (error) {
      if (this.debug) {
        console.error('[SmartGemini] 캐시 저장 실패:', error);
      }
    }
  }

  /**
   * 출력 정리
   */
  private cleanOutput(output: string): string {
    return output
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return (
          trimmed &&
          !trimmed.startsWith('Loaded cached credentials') &&
          !trimmed.startsWith('Loading') &&
          !trimmed.startsWith('Starting')
        );
      })
      .join('\n')
      .trim();
  }

  /**
   * 사용량 로깅
   */
  private async logUsage(log: UsageLog): Promise<void> {
    try {
      const logFile = join(
        this.logDir,
        `usage_${new Date().toISOString().split('T')[0]}.json`
      );

      let logs: UsageLog[] = [];
      try {
        const existing = await fs.readFile(logFile, 'utf8');
        logs = JSON.parse(existing);
      } catch {
        // 파일이 없거나 파싱 실패
      }

      logs.push(log);
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      if (this.debug) {
        console.error('[SmartGemini] 로깅 실패:', error);
      }
    }
  }

  /**
   * 사용량 리포트
   */
  async getUsageReport(date?: Date): Promise<{
    date: string;
    models: Record<
      string,
      {
        total: number;
        successful: number;
        failed: number;
        fallbacks: number;
      }
    >;
    errorTypes: Record<string, number>;
  }> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    const logFile = join(this.logDir, `usage_${dateStr}.json`);

    const report: any = {
      date: dateStr,
      models: {},
      errorTypes: {},
    };

    try {
      const content = await fs.readFile(logFile, 'utf8');
      const logs: UsageLog[] = JSON.parse(content);

      for (const log of logs) {
        if (!report.models[log.model]) {
          report.models[log.model] = {
            total: 0,
            successful: 0,
            failed: 0,
            fallbacks: 0,
          };
        }

        report.models[log.model].total++;

        if (log.success) {
          report.models[log.model].successful++;
        } else {
          report.models[log.model].failed++;
        }

        if (log.fallback) {
          report.models[log.model].fallbacks++;
        }

        if (log.errorType) {
          report.errorTypes[log.errorType] =
            (report.errorTypes[log.errorType] || 0) + 1;
        }
      }
    } catch {
      // 로그 파일이 없음
    }

    return report;
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'healthy',
      models: {},
      timestamp: new Date().toISOString(),
    };

    const todayReport = await this.getUsageReport();

    for (const model of this.models) {
      const testResult = await this.executeWithModel('안녕하세요', model, {
        noCache: true,
      });

      const todayUsage = todayReport.models[model.name]?.total || 0;

      result.models[model.name] = {
        available: testResult.success,
        lastUsed: testResult.timestamp,
        todayUsage,
      };

      if (!testResult.success) {
        result.status = 'degraded';
      }
    }

    // 모든 모델이 사용 불가능하면 unhealthy
    const allUnavailable = Object.values(result.models).every(
      m => !m.available
    );
    if (allUnavailable) {
      result.status = 'unhealthy';
    }

    return result;
  }

  /**
   * AI 협업 메서드 - Claude와 Gemini의 협업 분석
   */
  async collaborativeAnalysis(options: {
    problem: string;
    claudeAnalysis?: string;
    context?: string;
    saveReport?: boolean;
  }): Promise<{
    claudeAnalysis: string;
    geminiPerspective: string;
    synthesizedSolution: string;
    modelUsed: string;
    timestamp: string;
  }> {
    const timestamp = new Date().toISOString();

    // Gemini 교차 분석
    const geminiPrompt = `
다음 문제에 대한 분석을 검토하고 다른 관점에서 추가 해결책을 제안해주세요:

문제: ${options.problem}

${options.claudeAnalysis ? `Claude 분석:\n${options.claudeAnalysis}\n\n` : ''}
${options.context ? `추가 컨텍스트:\n${options.context}\n\n` : ''}

다른 관점에서의 분석과 구체적인 해결 방안을 제시해주세요.
    `;

    const geminiResult = await this.execute(geminiPrompt);

    if (!geminiResult.success) {
      throw new Error(`Gemini 분석 실패: ${geminiResult.error}`);
    }

    // 통합 솔루션 생성
    const synthesisPrompt = `
다음 두 분석을 종합하여 최종 해결 방안을 제시해주세요:

문제: ${options.problem}

${options.claudeAnalysis ? `Claude 분석:\n${options.claudeAnalysis}\n\n` : ''}

Gemini 분석:
${geminiResult.output}

이 두 분석을 종합하여 실행 가능한 최종 해결 방안을 단계별로 제시해주세요.
    `;

    const synthesisResult = await this.execute(synthesisPrompt, {
      preferredModel: 'flash', // 통합은 flash 모델로도 충분
    });

    const result = {
      claudeAnalysis: options.claudeAnalysis || '제공되지 않음',
      geminiPerspective: geminiResult.output || '',
      synthesizedSolution: synthesisResult.output || '',
      modelUsed: geminiResult.modelUsed || 'unknown',
      timestamp,
    };

    // 리포트 저장
    if (options.saveReport) {
      const reportFile = join(
        this.logDir,
        `collaborative_analysis_${timestamp.replace(/[:.]/g, '-')}.md`
      );

      const report = `# 🔧 협업 분석 리포트

**생성일:** ${timestamp}
**문제:** ${options.problem}

## 🤖 Claude 초기 분석
${result.claudeAnalysis}

## 🧠 Gemini 교차 분석 (${result.modelUsed} 모델)
${result.geminiPerspective}

## ⚡ 통합 솔루션
${result.synthesizedSolution}
`;

      await fs.writeFile(reportFile, report);
    }

    return result;
  }
}

// CLI 인터페이스
if (import.meta.url === `file://${process.argv[1]}`) {
  const wrapper = new SmartGeminiWrapper({ debug: true });
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function runCLI() {
    try {
      switch (command) {
        case 'chat':
          const result = await wrapper.execute(args.join(' '));
          console.log(result.output);
          break;

        case 'health':
          const health = await wrapper.healthCheck();
          console.log(JSON.stringify(health, null, 2));
          break;

        case 'report':
          const report = await wrapper.getUsageReport();
          console.log('\n📊 오늘의 사용량 리포트');
          console.log('='.repeat(40));

          for (const [model, stats] of Object.entries(report.models)) {
            console.log(`\n${model.toUpperCase()} 모델:`);
            console.log(`  총 사용: ${stats.total}회`);
            console.log(`  성공: ${stats.successful}회`);
            console.log(`  실패: ${stats.failed}회`);
            console.log(`  Fallback: ${stats.fallbacks}회`);
          }

          if (Object.keys(report.errorTypes).length > 0) {
            console.log('\n에러 타입:');
            for (const [type, count] of Object.entries(report.errorTypes)) {
              console.log(`  ${type}: ${count}회`);
            }
          }
          break;

        case 'collab':
          const problem = args.join(' ');
          if (!problem) {
            console.error('❌ 문제 설명을 입력해주세요');
            process.exit(1);
          }

          console.log('🔍 협업 분석 시작...');
          const collabResult = await wrapper.collaborativeAnalysis({
            problem,
            saveReport: true,
          });

          console.log('\n📄 분석 결과:');
          console.log(collabResult.synthesizedSolution);
          break;

        default:
          console.log(`
🚀 Smart Gemini Wrapper v1.0 사용법

기본 명령어:
  tsx tools/smart-gemini-wrapper.ts chat "질문"     스마트 채팅 (자동 fallback)
  tsx tools/smart-gemini-wrapper.ts health          헬스 체크
  tsx tools/smart-gemini-wrapper.ts report          사용량 리포트
  tsx tools/smart-gemini-wrapper.ts collab "문제"   협업 분석

특징:
  - Pro 모델 한도 초과시 자동으로 Flash 모델로 전환
  - 사용량 모니터링 및 일일 리포트
  - Claude와 Gemini의 협업 분석
  - WSL 환경 최적화
          `);
      }
    } catch (error) {
      console.error('❌ 오류:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  runCLI();
}

export default SmartGeminiWrapper;
