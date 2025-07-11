#!/usr/bin/env node

/**
 * 🚀 OpenManager Vibe v5.21.0 크로스 플랫폼 배포 스크립트
 * Windows .bat 파일을 대체하는 Node.js 기반 크로스 플랫폼 스크립트
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 컬러 출력 유틸리티
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
    try {
        colorLog('blue', `🔄 ${description}...`);
        execSync(command, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '../..')
        });
        colorLog('green', `✅ ${description} 완료`);
        return true;
    } catch (error) {
        colorLog('red', `❌ ${description} 실패: ${error.message}`);
        return false;
    }
}

async function main() {
    colorLog('cyan', '🚀 OpenManager Vibe v5.21.0 배포 시작...\n');

    // 1. 빌드 검증
    if (!executeCommand('npm run validate:quick', '빌드 검증')) {
        process.exit(1);
    }

    // 2. 테스트 실행
    if (!executeCommand('npm run test:unit', '단위 테스트')) {
        process.exit(1);
    }

    // 3. 빌드
    if (!executeCommand('npm run build', '프로덕션 빌드')) {
        process.exit(1);
    }

    // 4. Git 커밋 및 푸시
    try {
        execSync('git add -A', { stdio: 'inherit' });
        execSync('git commit -m "🚀 Deploy v5.21.0"', { stdio: 'inherit' });
        execSync('git push origin main', { stdio: 'inherit' });
        colorLog('green', '✅ Git 배포 완료');
    } catch (error) {
        colorLog('yellow', '⚠️ Git 작업 건너뜀 (변경사항 없음 또는 이미 푸시됨)');
    }

    colorLog('green', '\n🎉 OpenManager Vibe v5.21.0 배포 완료!');
    colorLog('blue', '📊 Vercel에서 자동 배포가 진행됩니다.');
}

main().catch(error => {
    colorLog('red', `❌ 배포 실패: ${error.message}`);
    process.exit(1);
}); 