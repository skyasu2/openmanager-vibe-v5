#!/usr/bin/env node

/**
 * 🎯 파일 변경 감지 자동 테스트 와처
 *
 * 파일 변경 시 자동으로 관련 테스트를 실행합니다.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('child_process');

class TestWatcher {
  constructor() {
    this.isRunning = false;
    this.debounceTimer = null;
    this.watchedPaths = ['src/', 'tests/', 'stories/'];

    this.testPatterns = {
      'src/components/': ['test:unit', 'storybook:build'],
      'src/stories/': ['storybook:build'],
      'tests/unit/': ['test:unit'],
      'tests/integration/': ['test:integration'],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '👀',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        test: '🧪',
      }[type] || '👀';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runTest(command) {
    if (this.isRunning) {
      this.log('테스트가 이미 실행 중입니다. 건너뜁니다.', 'warning');
      return;
    }

    this.isRunning = true;
    this.log(`테스트 실행: ${command}`, 'test');

    return new Promise(resolve => {
      const startTime = Date.now();

      exec(`npm run ${command}`, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;

        if (error) {
          this.log(`테스트 실패 (${duration}ms): ${command}`, 'error');
          console.log(stderr);
        } else {
          this.log(`테스트 성공 (${duration}ms): ${command}`, 'success');
        }

        this.isRunning = false;
        resolve({ success: !error, duration, command });
      });
    });
  }

  getTestsForFile(filePath) {
    const tests = new Set();

    for (const [pattern, testCommands] of Object.entries(this.testPatterns)) {
      if (filePath.includes(pattern)) {
        testCommands.forEach(cmd => tests.add(cmd));
      }
    }

    // 기본 테스트
    if (tests.size === 0) {
      tests.add('test:unit');
    }

    return Array.from(tests);
  }

  async handleFileChange(filePath) {
    this.log(`파일 변경 감지: ${filePath}`);

    // 디바운스 처리
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      const tests = this.getTestsForFile(filePath);

      for (const test of tests) {
        await this.runTest(test);
      }
    }, 1000); // 1초 디바운스
  }

  start() {
    this.log('파일 와처 시작...');

    this.watchedPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        this.log(`감시 시작: ${watchPath}`);

        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (
            filename &&
            (filename.endsWith('.ts') || filename.endsWith('.tsx'))
          ) {
            const fullPath = path.join(watchPath, filename);
            this.handleFileChange(fullPath);
          }
        });
      }
    });

    this.log(
      '파일 와처가 시작되었습니다. 파일을 수정하면 자동으로 테스트가 실행됩니다.'
    );
    this.log('종료하려면 Ctrl+C를 누르세요.');
  }
}

// 스크립트가 직접 실행될 때만 와처 시작
if (require.main === module) {
  const watcher = new TestWatcher();
  watcher.start();

  // 종료 시그널 처리
  process.on('SIGINT', () => {
    console.log('\n파일 와처를 종료합니다...');
    process.exit(0);
  });
}

module.exports = TestWatcher;
