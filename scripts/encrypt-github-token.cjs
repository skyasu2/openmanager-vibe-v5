#!/usr/bin/env node

/**
 * 🔐 GitHub PAT 토큰 안전 암호화
 * 제공받은 토큰을 안전하게 암호화하여 환경변수에 저장
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

console.log('🔐 GitHub PAT 토큰 암호화 시작...\n');

// .env.local 파일 로드
try {
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (error) {
    console.log('⚠️ dotenv 로드 실패');
}

// 암호화 키 (.env.local의 ENCRYPTION_KEY와 동일)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'openmanager-vibe-v5-2025-production-key';

// 제공받은 GitHub PAT 토큰 (보안상 제거됨)
const GITHUB_TOKEN = '*** REMOVED FOR SECURITY ***';

function encrypt(text) {
    try {
        return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    } catch (error) {
        throw new Error(`암호화 실패: ${error.message}`);
    }
}

function decrypt(encryptedText) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
            throw new Error('복호화 결과가 비어있음');
        }
        return decrypted;
    } catch (error) {
        throw new Error(`복호화 실패: ${error.message}`);
    }
}

try {
    console.log('🔒 GitHub PAT 토큰 암호화 중...');

    // 토큰 검증
    if (!GITHUB_TOKEN || !GITHUB_TOKEN.startsWith('ghp_')) {
        throw new Error('올바르지 않은 GitHub PAT 토큰 형식입니다.');
    }

    // 암호화 수행
    const encryptedToken = encrypt(GITHUB_TOKEN);
    console.log('✅ GitHub PAT 토큰 암호화 완료');

    // 복호화 테스트
    console.log('\n🧪 복호화 테스트 중...');
    const decryptedToken = decrypt(encryptedToken);

    if (decryptedToken === GITHUB_TOKEN) {
        console.log('✅ 복호화 테스트 성공');
    } else {
        throw new Error('복호화 테스트 실패 - 토큰이 일치하지 않음');
    }

    // .env.local 파일 업데이트
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // 기존 GITHUB_TOKEN 라인 찾기 및 교체
    const lines = envContent.split('\n');
    let tokenUpdated = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('GITHUB_TOKEN=')) {
            lines[i] = `GITHUB_TOKEN_ENCRYPTED="${encryptedToken}"`;
            lines[i + 1] = lines[i + 1] || '';
            lines.splice(i + 1, 0, `# 원본 토큰은 보안상 제거됨 - 암호화된 버전 사용`);
            tokenUpdated = true;
            break;
        }
    }

    // 토큰이 없었다면 추가
    if (!tokenUpdated) {
        lines.push('');
        lines.push('# ========================================');
        lines.push('# 🔐 GitHub PAT 토큰 (암호화됨)');
        lines.push('# ========================================');
        lines.push(`GITHUB_TOKEN_ENCRYPTED="${encryptedToken}"`);
        lines.push('# 원본 토큰은 보안상 제거됨 - 암호화된 버전 사용');
    }

    // 파일 저장
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log(`💾 암호화된 토큰이 .env.local에 저장되었습니다`);

    // 결과 출력
    console.log('\n📋 암호화 결과:');
    console.log(`원본 토큰: ${GITHUB_TOKEN.substring(0, 10)}...${GITHUB_TOKEN.substring(-4)}`);
    console.log(`암호화된 토큰: ${encryptedToken.substring(0, 20)}...`);

    console.log('\n🔐 환경변수 설정:');
    console.log(`GITHUB_TOKEN_ENCRYPTED="${encryptedToken}"`);

    console.log('\n💡 사용 방법:');
    console.log('1. 코드에서 암호화된 토큰 사용:');
    console.log('   const token = decrypt(process.env.GITHUB_TOKEN_ENCRYPTED);');
    console.log('2. MCP 서버 설정에서 복호화된 토큰 사용');

    console.log('\n🎉 GitHub PAT 토큰이 안전하게 암호화되어 저장되었습니다!');

} catch (error) {
    console.error('❌ GitHub PAT 토큰 암호화 실패:', error.message);
    process.exit(1);
}