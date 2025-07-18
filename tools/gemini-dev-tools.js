#!/usr/bin/env node

/**
 * 🚀 Gemini 개발 도구 v5.0 - 효율적인 CLI 도구
 * 
 * 기존 MCP 브릿지를 대체하는 고성능 직접 실행 도구
 * - MCP 오버헤드 제거
 * - 캐싱 시스템 내장
 * - 배치 처리 지원
 * - 개발 워크플로우 최적화
 * 
 * @author Claude Code
 * @version 5.0.0
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import GeminiSystemCommands from './gemini-system-commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GeminiDevTools {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.debug = process.env.GEMINI_DEBUG === 'true';
    this.cacheDir = join(__dirname, '..', '.cache', 'gemini');
    this.maxCacheAge = 1000 * 60 * 5; // 5분
    this.rateLimitDelay = 1000; // 1초 간격
    this.lastRequestTime = 0;
    
    // 시스템 명령 처리기 초기화
    this.systemCommands = new GeminiSystemCommands();
    
    // 캐시 디렉토리 생성
    this.ensureCacheDir();
  }

  /**
   * 캐시 디렉토리 생성
   */
  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      if (this.debug) {
        console.error('[GeminiDevTools] 캐시 디렉토리 생성 실패:', error.message);
      }
    }
  }

  /**
   * 캐시 키 생성
   */
  getCacheKey(command, args) {
    const content = `${command}:${JSON.stringify(args)}`;
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * 캐시에서 결과 읽기
   */
  async getCachedResult(cacheKey) {
    try {
      const cacheFile = join(this.cacheDir, `${cacheKey}.json`);
      const stats = await fs.stat(cacheFile);
      
      if (Date.now() - stats.mtime.getTime() < this.maxCacheAge) {
        const cached = await fs.readFile(cacheFile, 'utf8');
        return JSON.parse(cached);
      }
    } catch (error) {
      // 캐시 없음 또는 만료
      return null;
    }
  }

  /**
   * 캐시에 결과 저장
   */
  async setCachedResult(cacheKey, result) {
    try {
      const cacheFile = join(this.cacheDir, `${cacheKey}.json`);
      await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
    } catch (error) {
      if (this.debug) {
        console.error('[GeminiDevTools] 캐시 저장 실패:', error.message);
      }
    }
  }

  /**
   * Rate limiting 적용
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Gemini 명령 실행 (기본 메서드)
   */
  async executeGemini(args = [], options = {}) {
    await this.applyRateLimit();
    
    const cacheKey = this.getCacheKey('gemini', args);
    
    // 캐시 확인 (읽기 전용 작업만)
    if (!options.noCache && this.isReadOnlyCommand(args)) {
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        if (this.debug) {
          console.error('[GeminiDevTools] 캐시 히트:', cacheKey);
        }
        return cached;
      }
    }

    const startTime = Date.now();
    
    // 시스템 명령은 자체 처리기로 라우팅
    const systemCommand = args.find(arg => arg.startsWith('/'));
    if (systemCommand) {
      // 자체 시스템 명령 처리기 사용
      const result = await this.handleSystemCommand(systemCommand, args);
      return {
        success: true,
        stdout: result,
        stderr: '',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    return new Promise((resolve, reject) => {
      if (this.debug) {
        console.error(`[GeminiDevTools] 실행: gemini ${args.join(' ')}`);
      }
      
      // shell: true를 사용할 때는 인자를 올바르게 전달
      // 한글이 포함된 인자는 따옴표로 감싸기
      const escapedArgs = args.map(arg => {
        // 공백이나 특수문자가 포함된 경우 따옴표로 감싸기
        if (arg.includes(' ') || /[^\x00-\x7F]/.test(arg)) {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
      });
      
      // stdin 입력이 있는지 확인
      const hasStdinInput = options.stdin || options.pipeInput;
      
      const child = spawn('gemini', escapedArgs, {
        stdio: [hasStdinInput ? 'pipe' : 'inherit', 'pipe', 'pipe'],
        windowsHide: true,
        shell: true
      });
      
      // stdin 입력이 있으면 전달
      if (hasStdinInput) {
        const input = options.stdin || options.pipeInput;
        if (this.debug) {
          console.error(`[GeminiDevTools] stdin 입력 전달: ${input.substring(0, 100)}...`);
        }
        child.stdin.write(input);
        child.stdin.end();
      }
      
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
          console.error(`[GeminiDevTools] 완료 (${duration}ms) - 코드: ${code}`);
        }

        const result = {
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration,
          timestamp: new Date().toISOString()
        };

        // 캐시 저장 (성공한 읽기 전용 작업만)
        if (result.success && !options.noCache && this.isReadOnlyCommand(args)) {
          this.setCachedResult(cacheKey, result);
        }

        if (code !== 0) {
          reject(new Error(`종료 코드: ${code}\n${stderr}`));
        } else {
          resolve(result);
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
   * 시스템 명령 처리
   */
  async handleSystemCommand(command, args) {
    switch (command) {
      case '/stats':
        return await this.systemCommands.getStats();
      case '/clear':
        return await this.systemCommands.clearContext();
      case '/memory':
        const subCommand = args[1] || 'list';
        const memoryArgs = args.slice(2);
        return await this.systemCommands.memoryCommand(subCommand, ...memoryArgs);
      case '/help':
        return this.systemCommands.getHelp();
      default:
        return `❌ 알 수 없는 명령: ${command}\n💡 /help를 입력하여 사용 가능한 명령을 확인하세요.`;
    }
  }

  /**
   * 읽기 전용 명령인지 확인
   */
  isReadOnlyCommand(args) {
    const writeCommands = ['/clear', '/memory'];
    return !args.some(arg => writeCommands.includes(arg));
  }

  /**
   * 🎯 빠른 채팅 (가장 많이 사용)
   */
  async quickChat(prompt, options = {}) {
    const args = ['--prompt', prompt];
    
    if (options.model) {
      args.push('-m', options.model);
    }
    
    if (options.yolo) {
      args.push('-y');
    }

    try {
      const result = await this.executeGemini(args, options);
      
      // 사용량 기록 (토큰 수는 추정치)
      const estimatedTokens = Math.floor((prompt.length + result.stdout.length) / 4);
      await this.systemCommands.recordUsage(estimatedTokens);
      
      return this.cleanOutput(result.stdout);
    } catch (error) {
      // 간단한 재시도 (한 번만)
      if (!options.retry) {
        console.error('[GeminiDevTools] 재시도 중...');
        return await this.quickChat(prompt, { ...options, retry: true });
      }
      throw error;
    }
  }

  /**
   * 📊 사용량 확인
   */
  async getStats() {
    // 자체 시스템 명령 사용
    return await this.systemCommands.getStats();
  }

  /**
   * 🧹 컨텍스트 초기화
   */
  async clearContext() {
    // 자체 시스템 명령 사용
    return await this.systemCommands.clearContext();
  }

  /**
   * 📦 대화 압축 (지원 중단)
   * @deprecated Gemini CLI에서 /compress 명령을 더 이상 지원하지 않습니다.
   * 대신 /clear를 사용하여 컨텍스트를 초기화하거나 /memory를 사용하세요.
   */
  async compressContext() {
    return `⚠️ Gemini CLI에서 /compress 명령을 더 이상 지원하지 않습니다.\n\n💡 대안:\n- 컨텍스트 초기화: gemini /clear\n- 메모리 관리: gemini /memory\n- 사용량 확인: gemini /stats`;
  }

  /**
   * 📁 파일 분석
   */
  async analyzeFile(filePath, question = "이 파일을 분석해주세요") {
    const args = ['--prompt', question, '@' + filePath];
    
    try {
      const result = await this.executeGemini(args);
      return this.cleanOutput(result.stdout);
    } catch (error) {
      throw new Error(`파일 분석 실패: ${error.message}`);
    }
  }

  /**
   * 🔍 Git diff 분석
   */
  async analyzeGitDiff(message = "변경사항을 리뷰해주세요") {
    try {
      // git diff를 파이프로 전달
      const gitDiff = await this.executeGitDiff();
      if (!gitDiff.trim()) {
        return '📝 변경사항이 없습니다.';
      }
      
      return await this.quickChat(`${message}\n\n${gitDiff}`);
    } catch (error) {
      throw new Error(`Git diff 분석 실패: ${error.message}`);
    }
  }

  /**
   * Git diff 가져오기
   */
  async executeGitDiff() {
    return new Promise((resolve, reject) => {
      const child = spawn('git', ['diff'], { stdio: ['inherit', 'pipe', 'pipe'] });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Git diff 실패: ${stderr}`));
        }
      });
    });
  }

  /**
   * 🧹 출력 정리
   */
  cleanOutput(output) {
    return output
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('Loaded cached credentials') &&
               !trimmed.startsWith('Loading') &&
               !trimmed.startsWith('Starting');
      })
      .join('\n')
      .trim();
  }

  /**
   * 📋 배치 처리
   */
  async batchProcess(prompts, options = {}) {
    const results = [];
    
    for (const prompt of prompts) {
      try {
        const result = await this.quickChat(prompt, options);
        results.push({ prompt, result, success: true });
      } catch (error) {
        results.push({ prompt, error: error.message, success: false });
      }
    }
    
    return results;
  }

  /**
   * 🔧 버전 정보
   */
  async getVersion() {
    try {
      const result = await this.executeGemini(['--version']);
      return result.stdout.split('\n')[0] || 'Unknown';
    } catch (error) {
      return `버전 확인 실패: ${error.message}`;
    }
  }

  /**
   * 🏥 헬스 체크
   */
  async healthCheck() {
    try {
      const version = await this.getVersion();
      const testResult = await this.quickChat('안녕하세요', { yolo: true });
      
      return {
        status: 'healthy',
        version,
        testResponse: testResult.length > 0,
        cacheDir: this.cacheDir,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// CLI 인터페이스
if (process.argv[1] === __filename) {
  const tool = new GeminiDevTools();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  // stdin 입력 감지 및 읽기
  async function readStdin() {
    // TTY가 아니거나 readable이면 파이프 입력 가능성이 있음
    if (process.stdin.isTTY === true) {
      return null; // 파이프 입력이 없음
    }
    
    // stdin이 readable한 상태인지 확인
    if (!process.stdin.readable) {
      return null;
    }
    
    return new Promise((resolve, reject) => {
      let data = '';
      let resolved = false;
      const chunks = [];
      
      process.stdin.setEncoding('utf8');
      
      // 데이터가 있는지 즉시 확인
      process.stdin.on('readable', () => {
        let chunk;
        while (null !== (chunk = process.stdin.read())) {
          chunks.push(chunk);
        }
      });
      
      process.stdin.on('end', () => {
        if (!resolved) {
          resolved = true;
          data = chunks.join('');
          resolve(data.trim() || null);
        }
      });
      
      process.stdin.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });
      
      // 타임아웃 설정
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          data = chunks.join('');
          resolve(data.trim() || null);
        }
      }, 100);
    });
  }

  async function runCLI() {
    try {
      // stdin 입력 확인
      const stdinInput = await readStdin();
      
      switch (command) {
        case 'chat':
          const prompt = args.join(' ');
          let result;
          
          if (stdinInput) {
            // 파이프 입력이 있으면 직접 전달 (프롬프트 없이)
            result = await tool.executeGemini([], { 
              pipeInput: stdinInput 
            });
            console.log(result.stdout);
          } else {
            // 파이프 입력이 없으면 일반 채팅
            result = await tool.quickChat(prompt);
            console.log(result);
          }
          break;
          
        case 'stats':
          const stats = await tool.getStats();
          console.log(stats);
          break;
          
        case 'clear':
          const clearResult = await tool.clearContext();
          console.log(clearResult);
          break;
          
        case 'compress':
          // 지원 중단된 명령
          const compressResult = await tool.compressContext();
          console.log(compressResult);
          break;
          
        case 'memory':
          const memoryArgs = args.slice(0);
          const memoryResult = await tool.systemCommands.memoryCommand(...memoryArgs);
          console.log(memoryResult);
          break;
          
        case 'analyze':
          const filePath = args[0];
          const question = args.slice(1).join(' ') || "이 파일을 분석해주세요";
          const analysis = await tool.analyzeFile(filePath, question);
          console.log(analysis);
          break;
          
        case 'diff':
          const diffMessage = args.join(' ') || "변경사항을 리뷰해주세요";
          const diffResult = await tool.analyzeGitDiff(diffMessage);
          console.log(diffResult);
          break;
          
        case 'health':
          const health = await tool.healthCheck();
          console.log(JSON.stringify(health, null, 2));
          break;
          
        case 'version':
          const version = await tool.getVersion();
          console.log(version);
          break;
          
        default:
          // 파이프 입력이 있으면 자동으로 chat 명령으로 처리
          if (stdinInput) {
            // 파이프 입력과 프롬프트를 합쳐서 전달
            const prompt = command ? [command, ...args].join(' ') : '';
            const combinedInput = prompt ? `${stdinInput}\n\n${prompt}` : stdinInput;
            const result = await tool.executeGemini([], { 
              pipeInput: combinedInput 
            });
            console.log(result.stdout);
          } else {
            console.log(`
🚀 Gemini 개발 도구 v5.1 사용법

기본 명령어:
  node tools/gemini-dev-tools.js chat "질문내용"     빠른 채팅
  node tools/gemini-dev-tools.js stats              사용량 확인
  node tools/gemini-dev-tools.js clear              컨텍스트 초기화
  node tools/gemini-dev-tools.js memory [cmd]       메모리 관리
  node tools/gemini-dev-tools.js analyze <file>     파일 분석
  node tools/gemini-dev-tools.js diff               Git 변경사항 리뷰
  node tools/gemini-dev-tools.js health             헬스 체크
  node tools/gemini-dev-tools.js version            버전 확인

파이프 입력:
  echo "코드" | node tools/gemini-dev-tools.js "분석해주세요"
  cat file.txt | node tools/gemini-dev-tools.js chat "요약해주세요"
  git diff | node tools/gemini-dev-tools.js "리뷰해주세요"

예시:
  node tools/gemini-dev-tools.js chat "TypeScript 에러 해결법"
  node tools/gemini-dev-tools.js analyze src/app/page.tsx "이 컴포넌트 최적화 방법"
  node tools/gemini-dev-tools.js diff "SOLID 원칙 관점에서 리뷰"
            `);
          }
      }
    } catch (error) {
      console.error('❌ 오류:', error.message);
      process.exit(1);
    }
  }

  runCLI();
}

export default GeminiDevTools;