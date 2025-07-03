#!/usr/bin/env node

/**
 * Google AI 키 통합 암호화 스크립트
 * 기존 환경변수 암복호화 시스템과 동일한 방식 사용
 */

const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// 새로운 API 키
const NEW_API_KEY = 'YOUR_GOOGLE_AI_API_KEY_HERE';

// 기존 암호화 시스템과 동일한 키 생성 로직
const ENCRYPTION_KEY = (() => {
    // 개발환경에서 동적 생성 (기존 시스템과 동일)
    const nodeVersion = process.version;
    const projectHash = crypto
        .createHash('sha256')
        .update(process.cwd() + 'openmanager-vibe-v5')
        .digest('hex')
        .substring(0, 32);

    return `dev-${nodeVersion}-${projectHash}`;
})();

console.log('🔐 Google AI 키 통합 암호화 시작...');
console.log(`📝 API 키: ${NEW_API_KEY.substring(0, 10)}...${NEW_API_KEY.substring(NEW_API_KEY.length - 5)}`);

try {
    // 기존 암호화 시스템과 동일한 방식으로 암호화
    const encryptedKey = CryptoJS.AES.encrypt(NEW_API_KEY, ENCRYPTION_KEY).toString();

    console.log('🔑 암호화 완료:', {
        encryptedKey: encryptedKey.substring(0, 20) + '...',
        length: encryptedKey.length
    });

    // 복호화 테스트
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (decrypted === NEW_API_KEY) {
        console.log('✅ 복호화 테스트 성공!');
    } else {
        console.log('❌ 복호화 테스트 실패');
    }

    console.log('\n📋 환경변수 설정:');
    console.log('개발 환경 (.env.local):');
    console.log(`GOOGLE_AI_API_KEY_ENCRYPTED=${encryptedKey}`);

    console.log('\nVercel 환경변수:');
    console.log('vercel env add GOOGLE_AI_API_KEY_ENCRYPTED');
    console.log(`값: ${encryptedKey}`);

    console.log('\n🎯 설정 완료:');
    console.log('- 기존 암복호화 시스템 활용');
    console.log('- 중복 기능 제거');
    console.log('- 통합 키 관리 시스템 구축');
    console.log(`- 암호화 키: ${ENCRYPTION_KEY.substring(0, 20)}...`);

} catch (error) {
    console.error('❌ 암호화 실패:', error.message);
    process.exit(1);
} 