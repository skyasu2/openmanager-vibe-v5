#!/usr/bin/env node

/**
 * Cross-platform Post-commit Hook
 * v3.0.0 - Auto AI Review + Claude Code Integration
 *
 * 워크플로우:
 * 1. 커밋 완료 → 이 훅 실행
 * 2. WSL에서 auto-ai-review.sh 백그라운드 실행
 * 3. 리뷰 결과 → reports/ai-review/pending/
 * 4. Claude Code가 /ai-code-review로 평가
 */

const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const cwd = process.cwd();

// Get commit info safely
const tryGit = (args) => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

const commitHash = tryGit(['rev-parse', '--short', 'HEAD']) || 'unknown';
const commitMsg = tryGit(['log', '-1', '--format=%s']) || 'unknown';

console.log('');
console.log(`✅ 커밋 완료: ${commitHash} ${commitMsg.substring(0, 50)}`);

// Windows에서는 WSL로 리다이렉트
if (isWindows) {
  console.log('');
  console.log('ℹ️  Windows 환경 - WSL에서 AI 리뷰를 실행하세요:');
  console.log('   bash scripts/code-review/auto-ai-review.sh');
  console.log('');
  process.exit(0);
}

// Unix/WSL: 백그라운드로 AI 리뷰 실행
const scriptPath = path.join(cwd, 'scripts/code-review/auto-ai-review.sh');
const logDir = path.join(cwd, 'logs');
const logPath = path.join(logDir, 'post-commit.log');

// 스크립트 존재 확인
if (!fs.existsSync(scriptPath)) {
  console.log('⚠️  auto-ai-review.sh not found, skipping');
  process.exit(0);
}

// logs 디렉토리 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

try {
  // 백그라운드 프로세스 실행
  const logStream = fs.openSync(logPath, 'a');
  const child = spawn('bash', [scriptPath], {
    cwd,
    detached: true,
    stdio: ['ignore', logStream, logStream],
    env: { ...process.env, PROJECT_ROOT: cwd },
  });
  child.unref();

  console.log('');
  console.log('🤖 AI 코드 리뷰 시작 (백그라운드)');
  console.log(`   로그: ${logPath}`);
  console.log('');
  console.log('📋 리뷰 완료 후:');
  console.log('   - 결과: reports/ai-review/pending/');
  console.log('   - 평가: /ai-code-review 실행');
  console.log('');
} catch (err) {
  console.log('⚠️  AI 리뷰 시작 실패:', err.message);
  console.log('   수동 실행: bash scripts/code-review/auto-ai-review.sh');
  console.log('');
}

process.exit(0);
