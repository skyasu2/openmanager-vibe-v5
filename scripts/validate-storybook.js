#!/usr/bin/env node

/**
 * 🎯 스토리북 자동 검증 스크립트
 *
 * 스토리북 빌드, 구조 검증, 서버 테스트를 자동으로 수행합니다.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec, spawn } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');

class StorybookValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        success: false,
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
      },
      checks: {},
      performance: {},
      errors: [],
    };

    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        build: '🏗️',
        server: '🌐',
      }[type] || '📋';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, description, timeout = 60000) {
    this.log(`${description} 시작...`);
    const startTime = Date.now();

    return new Promise(resolve => {
      const childProcess = exec(command, {
        timeout,
        maxBuffer: 1024 * 1024 * 5,
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', data => {
        stdout += data;
      });

      childProcess.stderr?.on('data', data => {
        stderr += data;
      });

      childProcess.on('close', code => {
        const duration = Date.now() - startTime;
        const success = code === 0;

        this.log(
          `${description} ${success ? '완료' : '실패'} (${duration}ms)`,
          success ? 'success' : 'error'
        );

        resolve({
          success,
          code,
          stdout,
          stderr,
          duration,
          command,
          description,
        });
      });

      childProcess.on('error', error => {
        const duration = Date.now() - startTime;
        this.log(`${description} 오류: ${error.message}`, 'error');
        resolve({
          success: false,
          code: -1,
          stdout,
          stderr,
          duration,
          error: error.message,
        });
      });
    });
  }

  async validateStorybookStructure() {
    this.log('스토리북 파일 구조 검증 중...');

    const storyFiles = [];
    const srcDir = path.join(process.cwd(), 'src');

    const findStoryFiles = dir => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            findStoryFiles(fullPath);
          } else if (
            file.endsWith('.stories.tsx') ||
            file.endsWith('.stories.ts')
          ) {
            storyFiles.push(fullPath);
          }
        });
      } catch (error) {
        this.log(`디렉토리 읽기 실패: ${dir} - ${error.message}`, 'warning');
      }
    };

    if (fs.existsSync(srcDir)) {
      findStoryFiles(srcDir);
    }

    const structureCheck = {
      storyFilesFound: storyFiles.length,
      storyFiles: storyFiles.map(f => path.relative(process.cwd(), f)),
      configExists: fs.existsSync(
        path.join(process.cwd(), '.storybook/main.ts')
      ),
      passed: storyFiles.length > 0,
    };

    this.results.checks.structure = structureCheck;
    this.updateSummary(structureCheck.passed);

    this.log(
      `스토리 파일 ${storyFiles.length}개 발견`,
      storyFiles.length > 0 ? 'success' : 'warning'
    );

    return structureCheck;
  }

  async validateStorybookBuild() {
    const result = await this.runCommand(
      'npm run build-storybook',
      '스토리북 빌드 검증',
      180000 // 3분
    );

    const buildCheck = {
      ...result,
      passed: result.success,
      buildSize: this.getStorybookBuildSize(),
    };

    this.results.checks.build = buildCheck;
    this.updateSummary(buildCheck.passed);

    return buildCheck;
  }

  getStorybookBuildSize() {
    try {
      const buildPath = path.join(process.cwd(), 'storybook-static');
      if (fs.existsSync(buildPath)) {
        const stats = fs.statSync(buildPath);
        return `${(stats.size / 1024 / 1024).toFixed(2)}MB`;
      }
    } catch (error) {
      this.log(`빌드 크기 측정 실패: ${error.message}`, 'warning');
    }
    return 'Unknown';
  }

  async validateStorybookServer() {
    this.log('스토리북 서버 시작 중...');

    return new Promise(resolve => {
      const serverProcess = spawn('npm', ['run', 'storybook:dev'], {
        stdio: 'pipe',
        detached: false,
      });

      let serverStarted = false;
      let serverOutput = '';

      const timeout = setTimeout(() => {
        if (!serverStarted) {
          serverProcess.kill();
          resolve({
            passed: false,
            error: '서버 시작 시간 초과',
            output: serverOutput,
          });
        }
      }, 30000); // 30초 타임아웃

      serverProcess.stdout?.on('data', data => {
        serverOutput += data.toString();

        if (data.toString().includes('Local:') && !serverStarted) {
          serverStarted = true;
          clearTimeout(timeout);

          // 서버가 시작되면 잠시 후 테스트
          setTimeout(() => {
            this.testServerResponse()
              .then(responseCheck => {
                serverProcess.kill();
                resolve({
                  passed: responseCheck.success,
                  serverStarted: true,
                  response: responseCheck,
                  output: serverOutput,
                });
              })
              .catch(error => {
                serverProcess.kill();
                resolve({
                  passed: false,
                  serverStarted: true,
                  error: error.message,
                  output: serverOutput,
                });
              });
          }, 3000);
        }
      });

      serverProcess.stderr?.on('data', data => {
        serverOutput += data.toString();
      });

      serverProcess.on('error', error => {
        clearTimeout(timeout);
        resolve({
          passed: false,
          error: error.message,
          output: serverOutput,
        });
      });
    });
  }

  async testServerResponse() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:6006', res => {
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          headers: res.headers,
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('요청 시간 초과'));
      });
    });
  }

  updateSummary(passed) {
    this.results.summary.totalChecks++;
    if (passed) {
      this.results.summary.passedChecks++;
    } else {
      this.results.summary.failedChecks++;
    }
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;

    this.results.performance.totalDuration = totalDuration;
    this.results.summary.success = this.results.summary.failedChecks === 0;

    const reportPath = path.join(
      process.cwd(),
      'storybook-validation-report.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    this.log(`검증 보고서 생성: ${reportPath}`, 'success');

    return this.results;
  }

  async run() {
    this.log('🎭 스토리북 자동 검증 시작', 'info');

    try {
      // 1. 파일 구조 검증
      await this.validateStorybookStructure();

      // 2. 빌드 검증
      await this.validateStorybookBuild();

      // 3. 서버 검증 (선택적)
      if (process.argv.includes('--skip-server')) {
        this.log('서버 검증 건너뜀', 'warning');
      } else {
        const serverCheck = await this.validateStorybookServer();
        this.results.checks.server = serverCheck;
        this.updateSummary(serverCheck.passed);
      }

      // 4. 보고서 생성
      const finalReport = await this.generateReport();

      // 5. 결과 요약
      this.log(`\n📊 검증 완료`, 'success');
      this.log(
        `성공: ${finalReport.summary.passedChecks}/${finalReport.summary.totalChecks}`,
        'info'
      );
      this.log(
        `총 실행 시간: ${(finalReport.performance.totalDuration / 1000).toFixed(1)}초`,
        'info'
      );

      if (finalReport.summary.success) {
        this.log('🎉 모든 검증이 통과했습니다!', 'success');
        process.exit(0);
      } else {
        this.log('⚠️ 일부 검증이 실패했습니다', 'warning');
        process.exit(1);
      }
    } catch (error) {
      this.log(`검증 중 오류 발생: ${error.message}`, 'error');
      this.results.errors.push(error.message);
      await this.generateReport();
      process.exit(1);
    }
  }
}

// 스크립트가 직접 실행될 때만 검증 시작
if (require.main === module) {
  const validator = new StorybookValidator();
  validator.run().catch(console.error);
}

module.exports = StorybookValidator;
