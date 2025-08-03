#!/usr/bin/env node

/**
 * 🔧 OpenManager Vibe v5 Post-install Script
 * 
 * 패키지 설치 후 자동 실행되는 스크립트
 * - 의존성 검증
 * - 개발 환경 설정 확인
 * - 필요 시 자동 수정
 */

const fs = require('fs');
const path = require('path');

function main() {
  try {
    console.log('🚀 OpenManager Vibe v5 post-install 시작...');

    // 기본 디렉토리 존재 확인
    const requiredDirs = ['.next/cache', 'public', 'src'];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        console.log(`📁 디렉토리 생성: ${dir}`);
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // .next/cache/eslint 디렉토리 확인 (ESLint 캐시용)
    const eslintCacheDir = path.join(process.cwd(), '.next/cache/eslint');
    if (!fs.existsSync(eslintCacheDir)) {
      fs.mkdirSync(eslintCacheDir, { recursive: true });
      console.log('📁 ESLint 캐시 디렉토리 생성 완료');
    }

    console.log('✅ Post-install 완료');
  } catch (error) {
    console.log('⚠️ Post-install 오류 (무시됨):', error.message);
    // || true 때문에 프로세스는 계속 진행됨
  }
}

if (require.main === module) {
  main();
}

module.exports = main;