#!/usr/bin/env node

/*
 * 🚀 check-pnpm.js
 * 개발자가 `pnpm` 미설치 상태로 프로젝트 스크립트를 실행했을 때
 * 친절한 가이드를 출력해 주는 유틸리티.
 * Windows PowerShell + Cursor 환경에서 자주 발생하는 문제를 해결합니다.
 */

/* eslint-disable */

const { execSync } = require('child_process');

function hasPnpm() {
  try {
    execSync('pnpm -v', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!hasPnpm()) {
  console.warn(
    `\u001b[33m[경고] pnpm이 설치되어 있지 않습니다.\u001b[0m\n` +
      `프로젝트는 pnpm-lock.yaml을 사용하여 의존성 버전을 고정합니다.\n` +
      `다음 명령으로 pnpm을 설치하세요:\n\n` +
      `  # Corepack\n  corepack enable\n  corepack prepare pnpm@latest --activate\n\n` +
      `  # 또는 전역 설치\n  npm install -g pnpm\n`
  );
  process.exitCode = 0;
}
