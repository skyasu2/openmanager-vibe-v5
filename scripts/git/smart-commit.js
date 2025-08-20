#!/usr/bin/env node

/**
 * 스마트 커밋 자동화 도구 (v3.0)
 * 2025년 Non-blocking CI/CD 표준 준수
 * 
 * 기능:
 * - 자동 파일 분석 및 커밋 메시지 생성
 * - 타입별 스마트 분류 (feat, fix, refactor, etc.)
 * - 이모지 자동 추가 (프로젝트 표준)
 * - TypeScript 에러 자동 수정 시도
 * - Pre-commit 훅 우회 옵션
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 이모지 매핑 (프로젝트 표준)
const emojiMap = {
  feat: '✨',
  fix: '🐛',
  hotfix: '🚑',
  refactor: '♻️',
  perf: '⚡',
  style: '💄',
  test: '🧪',
  docs: '📚',
  chore: '⚙️',
  config: '🔧',
  ci: '👷',
  security: '🔒',
  deps: '📦',
  wip: '🚧',
  release: '🚀'
};

// 파일 타입별 분류
const fileTypePatterns = {
  component: /\.(tsx|jsx)$/,
  style: /\.(css|scss|sass|less)$/,
  config: /\.(json|yml|yaml|toml|ini)$/,
  test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
  docs: /\.(md|mdx|txt)$/,
  script: /\.(sh|ps1|py)$/,
  type: /\.d\.ts$/,
  api: /\/api\/.*\.(ts|js)$/,
  hook: /\.husky\//
};

class SmartCommitter {
  constructor() {
    this.startTime = Date.now();
    this.options = this.parseArgs();
    this.changedFiles = [];
    this.commitType = '';
    this.scope = '';
    this.description = '';
  }

  parseArgs() {
    const args = process.argv.slice(2);
    return {
      fast: args.includes('--fast'),
      fix: args.includes('--fix'),
      skipHooks: args.includes('--skip-hooks'),
      message: args.find(arg => arg.startsWith('--message='))?.split('=')[1],
      dryRun: args.includes('--dry-run'),
      verbose: args.includes('--verbose')
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Git 상태 분석
  analyzeGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (!status.trim()) {
        this.log('커밋할 변경사항이 없습니다.', 'warn');
        process.exit(0);
      }

      const lines = status.split('\n').filter(Boolean);
      this.changedFiles = lines.map(line => {
        const status = line.slice(0, 2);
        const file = line.slice(3);
        return { status, file };
      });

      this.log(`${this.changedFiles.length}개 파일 변경 감지`);
      if (this.options.verbose) {
        this.changedFiles.forEach(({ status, file }) => {
          this.log(`  ${status} ${file}`);
        });
      }

    } catch (error) {
      this.log(`Git 상태 확인 실패: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  // 커밋 타입 자동 감지
  detectCommitType() {
    const files = this.changedFiles.map(f => f.file);
    
    // 긴급 수정 감지 (hotfix 패턴)
    if (files.some(f => f.includes('hotfix') || f.includes('urgent'))) {
      return 'hotfix';
    }

    // 테스트 파일 변경
    if (files.every(f => fileTypePatterns.test.test(f))) {
      return 'test';
    }

    // 문서 변경
    if (files.every(f => fileTypePatterns.docs.test(f))) {
      return 'docs';
    }

    // 설정 파일 변경
    if (files.some(f => fileTypePatterns.config.test(f) || f.includes('.husky'))) {
      return 'config';
    }

    // CI/CD 파일 변경
    if (files.some(f => f.includes('.github') || f.includes('ci'))) {
      return 'ci';
    }

    // package.json 변경 (의존성)
    if (files.some(f => f.includes('package.json'))) {
      return 'deps';
    }

    // 버그 수정 패턴 감지
    const fixPatterns = ['fix', 'bug', 'error', 'issue', 'patch'];
    if (fixPatterns.some(pattern => 
      files.some(f => f.toLowerCase().includes(pattern)))) {
      return 'fix';
    }

    // 리팩토링 패턴
    const refactorPatterns = ['refactor', 'cleanup', 'improve', 'optimize'];
    if (refactorPatterns.some(pattern => 
      files.some(f => f.toLowerCase().includes(pattern)))) {
      return 'refactor';
    }

    // 성능 개선
    if (files.some(f => f.includes('performance') || f.includes('perf'))) {
      return 'perf';
    }

    // 기본값: 새 기능
    return 'feat';
  }

  // 스코프 감지 (변경된 주요 디렉토리)
  detectScope() {
    const dirs = this.changedFiles
      .map(f => f.file.split('/')[0])
      .filter(dir => !['src', 'app'].includes(dir));

    const uniqueDirs = [...new Set(dirs)];
    
    if (uniqueDirs.length === 1) {
      return uniqueDirs[0];
    }

    // src 내부 분석
    const srcFiles = this.changedFiles
      .map(f => f.file)
      .filter(f => f.startsWith('src/'));

    if (srcFiles.length > 0) {
      const srcDirs = srcFiles
        .map(f => f.split('/')[1])
        .filter(Boolean);
      
      const uniqueSrcDirs = [...new Set(srcDirs)];
      if (uniqueSrcDirs.length === 1) {
        return uniqueSrcDirs[0];
      }
    }

    return '';
  }

  // 설명 생성
  generateDescription() {
    const fileCount = this.changedFiles.length;
    const mainFile = this.changedFiles[0]?.file;
    
    if (fileCount === 1) {
      const fileName = path.basename(mainFile, path.extname(mainFile));
      return `${fileName} 업데이트`;
    }

    if (this.commitType === 'feat') {
      return '새 기능 구현';
    }

    if (this.commitType === 'fix') {
      return '버그 수정';
    }

    if (this.commitType === 'refactor') {
      return '코드 리팩토링';
    }

    if (this.commitType === 'config') {
      return '설정 업데이트';
    }

    return `${fileCount}개 파일 업데이트`;
  }

  // TypeScript 에러 자동 수정 시도
  async fixTypeScriptErrors() {
    if (!this.options.fix) return;

    this.log('TypeScript 에러 자동 수정 시도 중...');
    try {
      execSync('npm run type-fix', { stdio: 'inherit' });
      this.log('TypeScript 에러 수정 완료');
    } catch (error) {
      this.log('TypeScript 자동 수정 실패 - 계속 진행', 'warn');
    }
  }

  // 커밋 메시지 생성
  generateCommitMessage() {
    if (this.options.message) {
      return this.options.message;
    }

    this.commitType = this.detectCommitType();
    this.scope = this.detectScope();
    this.description = this.generateDescription();

    const emoji = emojiMap[this.commitType] || '📝';
    const scopeStr = this.scope ? `(${this.scope})` : '';
    
    return `${emoji} ${this.commitType}${scopeStr}: ${this.description}`;
  }

  // 커밋 실행
  async executeCommit() {
    const message = this.generateCommitMessage();
    
    this.log(`커밋 메시지: "${message}"`);
    
    if (this.options.dryRun) {
      this.log('Dry-run 모드 - 실제 커밋하지 않음');
      return;
    }

    try {
      // 변경된 파일 스테이징
      execSync('git add -A', { stdio: 'inherit' });

      // TypeScript 에러 수정 시도
      await this.fixTypeScriptErrors();

      // 커밋 실행
      const commitFlags = [];
      if (this.options.skipHooks) {
        commitFlags.push('--no-verify');
      }

      const commitCmd = `git commit -m "${message}" ${commitFlags.join(' ')}`;
      execSync(commitCmd, { stdio: 'inherit' });

      this.log('커밋 완료!');
      
      // 성능 통계
      const duration = Date.now() - this.startTime;
      this.log(`실행 시간: ${duration}ms`);

      // Push 추천
      if (!this.options.fast) {
        this.log('💡 다음 단계: git push 또는 npm run git:push');
      }

    } catch (error) {
      this.log(`커밋 실패: ${error.message}`, 'error');
      
      // 실패 시 도움말
      this.log('💡 해결 방안:');
      this.log('  - npm run type-fix (TypeScript 에러 수정)');
      this.log('  - node scripts/smart-commit.js --skip-hooks (훅 우회)');
      this.log('  - HUSKY=0 git commit (Husky 비활성화)');
      
      process.exit(1);
    }
  }

  // 메인 실행
  async run() {
    this.log('🚀 스마트 커밋 시작 (v3.0)...');
    
    try {
      this.analyzeGitStatus();
      await this.executeCommit();
      
      this.log('✅ 스마트 커밋 완료!');
    } catch (error) {
      this.log(`치명적 오류: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 메인 실행
if (require.main === module) {
  const committer = new SmartCommitter();
  committer.run().catch(error => {
    console.error('💥 스마트 커밋 실패:', error);
    process.exit(1);
  });
}

module.exports = SmartCommitter;