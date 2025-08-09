/**
 * 지능형 검증 파이프라인 - 병렬 실행 엔진
 * @description 여러 검증 작업을 병렬로 실행하고 타임아웃 관리
 * @created 2025-08-09
 */

const { exec, spawn } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * 개별 작업에 대한 타임아웃 프라미스 생성
 */
function createTimeout(ms, taskName = 'Unknown') {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`⏱️  타임아웃: ${taskName} (${ms}ms 초과)`));
    }, ms);
  });
}

/**
 * 안전한 명령어 실행 (타임아웃 포함)
 */
async function executeWithTimeout(command, options = {}) {
  const { 
    timeout = 60000,      // 기본 60초 (Vercel 친화적)
    taskName = 'Task',
    cwd = process.cwd(),
    env = process.env,
    killSignal = 'SIGTERM'
  } = options;
  
  const startTime = Date.now();
  
  try {
    const taskPromise = execAsync(command, { 
      cwd, 
      env: { ...env, FORCE_COLOR: '0' }, // 컬러 출력 비활성화
      maxBuffer: 1024 * 1024 // 1MB 버퍼
    });
    
    const timeoutPromise = createTimeout(timeout, taskName);
    
    const result = await Promise.race([taskPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      taskName,
      duration,
      stdout: result.stdout,
      stderr: result.stderr,
      command
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      taskName,
      duration,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      command,
      timedOut: error.message.includes('타임아웃'),
      exitCode: error.code
    };
  }
}

/**
 * 병렬 작업 실행기
 */
async function runParallelTasks(tasks, globalOptions = {}) {
  const {
    maxConcurrency = 4,     // 최대 동시 실행 수
    globalTimeout = 120000,  // 전체 타임아웃 (2분)
    failFast = false,       // 첫 실패 시 중단
    verbose = true
  } = globalOptions;
  
  const startTime = Date.now();
  
  if (verbose) {
    console.log(`🚀 병렬 실행 시작: ${tasks.length}개 작업 (동시 ${maxConcurrency}개)`);
  }
  
  // 작업을 청크로 분할하여 동시성 제어
  const results = [];
  const chunks = [];
  
  for (let i = 0; i < tasks.length; i += maxConcurrency) {
    chunks.push(tasks.slice(i, i + maxConcurrency));
  }
  
  try {
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(task => {
        if (typeof task === 'function') {
          // 함수형 작업
          return Promise.resolve(task()).catch(error => ({
            success: false,
            taskName: task.name || 'Anonymous Function',
            error: error.message,
            duration: 0
          }));
        } else if (typeof task === 'object') {
          // 명령어 작업
          return executeWithTimeout(task.command, {
            timeout: task.timeout || 60000,
            taskName: task.name,
            cwd: task.cwd,
            env: task.env
          });
        } else if (typeof task === 'string') {
          // 단순 명령어
          return executeWithTimeout(task, { taskName: `Command: ${task.substring(0, 30)}...` });
        }
        
        return Promise.resolve({
          success: false,
          taskName: 'Invalid Task',
          error: 'Unsupported task type',
          duration: 0
        });
      });
      
      // 전체 타임아웃과 함께 청크 실행
      const chunkTimeout = createTimeout(globalTimeout, 'Global Timeout');
      const chunkResults = await Promise.race([
        Promise.allSettled(chunkPromises),
        chunkTimeout.then(() => { throw new Error('Global timeout exceeded'); })
      ]);
      
      // 결과 처리
      for (let i = 0; i < chunkResults.length; i++) {
        const settledResult = chunkResults[i];
        const result = settledResult.status === 'fulfilled' 
          ? settledResult.value 
          : {
              success: false,
              taskName: chunk[i]?.name || `Task ${results.length + i + 1}`,
              error: settledResult.reason?.message || 'Unknown error',
              duration: 0
            };
        
        results.push(result);
        
        if (verbose) {
          const status = result.success ? '✅' : '❌';
          const duration = `${result.duration}ms`;
          console.log(`${status} ${result.taskName} (${duration})`);
        }
        
        // fail-fast 모드에서 실패 시 중단
        if (failFast && !result.success) {
          throw new Error(`실패로 인한 중단: ${result.taskName} - ${result.error}`);
        }
      }
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      totalDuration: duration,
      completedTasks: results.length,
      totalTasks: tasks.length,
      results,
      globalError: error.message
    };
  }
  
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  if (verbose) {
    console.log(`📊 실행 완료: ${successCount}개 성공, ${failureCount}개 실패 (${totalDuration}ms)`);
  }
  
  return {
    success: failureCount === 0,
    totalDuration,
    completedTasks: results.length,
    totalTasks: tasks.length,
    successCount,
    failureCount,
    results,
    summary: generateSummary(results)
  };
}

/**
 * 검증 작업 빌더
 */
class ValidationTaskBuilder {
  constructor() {
    this.tasks = [];
  }
  
  addLintTask(files = [], options = {}) {
    const { timeout = 60000, skipTypes = [] } = options;
    
    if (!skipTypes.includes('eslint')) {
      // 파일이 많으면 더 가벼운 린트 사용
      let command;
      if (files.length > 5) {
        command = 'npm run lint:ultrafast';
      } else if (files.length > 0) {
        const fileArgs = files.slice(0, 5).join(' '); // 최대 5개 파일만
        command = `npm run lint:incremental`;
      } else {
        command = 'npm run lint:quick';
      }
      
      this.tasks.push({
        name: 'ESLint',
        command,
        timeout,
        critical: true
      });
    }
    
    if (!skipTypes.includes('prettier')) {
      this.tasks.push({
        name: 'Prettier',
        command: 'npm run format:check',
        timeout: 15000,
        critical: false
      });
    }
    
    return this;
  }
  
  addTypeCheckTask(files = [], options = {}) {
    const { timeout = 60000 } = options;
    
    this.tasks.push({
      name: 'TypeScript',
      command: 'npm run type-check',
      timeout,
      critical: true
    });
    
    return this;
  }
  
  addTestTask(testFiles = [], options = {}) {
    const { timeout = 90000, testType = 'unit' } = options;
    
    if (testFiles.length > 0) {
      this.tasks.push({
        name: 'Tests (Targeted)',
        command: `npx vitest run ${testFiles.join(' ')} --no-coverage`,
        timeout,
        critical: true
      });
    } else if (testType === 'quick') {
      this.tasks.push({
        name: 'Tests (Quick)',
        command: 'npm run test:quick',
        timeout: 60000,
        critical: false
      });
    }
    
    return this;
  }
  
  addSecurityTask(options = {}) {
    const { timeout = 20000, skipTypes = [] } = options;
    
    if (!skipTypes.includes('security')) {
      this.tasks.push({
        name: 'Security Check',
        command: 'bash scripts/check-hardcoded-secrets.sh --quick',
        timeout,
        critical: true
      });
    }
    
    return this;
  }
  
  addCustomTask(name, command, options = {}) {
    this.tasks.push({
      name,
      command,
      timeout: options.timeout || 60000,
      critical: options.critical || false,
      ...options
    });
    
    return this;
  }
  
  build() {
    return this.tasks;
  }
  
  clear() {
    this.tasks = [];
    return this;
  }
}

/**
 * 결과 요약 생성
 */
function generateSummary(results) {
  const critical = results.filter(r => r.critical !== false);
  const nonCritical = results.filter(r => r.critical === false);
  
  const criticalFailures = critical.filter(r => !r.success);
  const nonCriticalFailures = nonCritical.filter(r => !r.success);
  
  return {
    totalTasks: results.length,
    criticalTasks: critical.length,
    nonCriticalTasks: nonCritical.length,
    criticalFailures: criticalFailures.length,
    nonCriticalFailures: nonCriticalFailures.length,
    canProceed: criticalFailures.length === 0,
    warnings: nonCriticalFailures.map(r => `${r.taskName}: ${r.error}`),
    errors: criticalFailures.map(r => `${r.taskName}: ${r.error}`),
    fastestTask: results.reduce((fastest, r) => 
      r.duration < fastest.duration ? r : fastest, results[0]),
    slowestTask: results.reduce((slowest, r) => 
      r.duration > slowest.duration ? r : slowest, results[0])
  };
}

/**
 * 프리셋 검증 전략
 */
const VALIDATION_PRESETS = {
  STRICT: {
    maxConcurrency: 2,
    globalTimeout: 180000, // 3분
    failFast: true,
    skipTypes: []
  },
  
  ENHANCED: {
    maxConcurrency: 3,
    globalTimeout: 120000, // 2분
    failFast: true,
    skipTypes: ['prettier']
  },
  
  STANDARD: {
    maxConcurrency: 4,
    globalTimeout: 90000, // 1.5분
    failFast: false,
    skipTypes: ['prettier', 'spell-check']
  },
  
  FAST: {
    maxConcurrency: 6,
    globalTimeout: 60000, // 1분
    failFast: false,
    skipTypes: ['prettier', 'spell-check', 'unused-imports']
  }
};

module.exports = {
  runParallelTasks,
  executeWithTimeout,
  ValidationTaskBuilder,
  generateSummary,
  VALIDATION_PRESETS,
  createTimeout
};