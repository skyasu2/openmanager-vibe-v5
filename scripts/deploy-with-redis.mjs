#!/usr/bin/env node

/**
 * 🚀 Redis 환경변수 자동 설정 및 Vercel 배포 스크립트
 * OpenManager Vibe v5
 */

import CryptoJS from 'crypto-js';
import { execSync } from 'child_process';
import { ENCRYPTED_ENV_CONFIG } from '../config/encrypted-env-config.mjs';

const TEAM_PASSWORD = process.argv[2] || 'openmanager2025';

/**
 * 값 복호화
 */
function decryptValue(encryptedData, password) {
    try {
        const { encrypted, salt, iv } = encryptedData;

        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 10000,
        });

        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        throw new Error(`복호화 실패: ${error.message}`);
    }
}

/**
 * Vercel 환경변수 설정
 */
async function deployWithRedis() {
    try {
        console.log('🔐 Redis 환경변수 복호화 및 Vercel 배포 시작...');

        // 비밀번호 검증
        const passwordHash = CryptoJS.SHA256(TEAM_PASSWORD).toString();
        if (passwordHash !== ENCRYPTED_ENV_CONFIG.teamPasswordHash) {
            throw new Error('팀 비밀번호가 올바르지 않습니다.');
        }

        console.log('✅ 팀 비밀번호 인증 성공');

        // Redis 환경변수 복호화
        const redisUrl = decryptValue(ENCRYPTED_ENV_CONFIG.variables.UPSTASH_REDIS_REST_URL, TEAM_PASSWORD);
        const redisToken = decryptValue(ENCRYPTED_ENV_CONFIG.variables.UPSTASH_REDIS_REST_TOKEN, TEAM_PASSWORD);

        console.log('🔓 Redis 환경변수 복호화 완료');
        console.log(`   URL: ${redisUrl}`);
        console.log(`   TOKEN: ${redisToken.substring(0, 20)}...`);

        // Vercel 환경변수 설정
        console.log('🌐 Vercel 환경변수 설정 중...');

        try {
            execSync(`vercel env add UPSTASH_REDIS_REST_URL production --value="${redisUrl}" --force`, { stdio: 'inherit' });
            execSync(`vercel env add UPSTASH_REDIS_REST_TOKEN production --value="${redisToken}" --force`, { stdio: 'inherit' });
            console.log('✅ Vercel 환경변수 설정 완료');
        } catch (error) {
            console.log('⚠️  Vercel CLI 환경변수 설정 실패 (수동 설정 필요)');
            console.log('   다음 값들을 Vercel Dashboard에서 수동으로 설정하세요:');
            console.log(`   UPSTASH_REDIS_REST_URL=${redisUrl}`);
            console.log(`   UPSTASH_REDIS_REST_TOKEN=${redisToken}`);
        }

        // Vercel 배포
        console.log('🚀 Vercel 배포 시작...');
        execSync('vercel --prod', { stdio: 'inherit' });

        console.log('🎉 배포 완료! Redis 연결 문제가 해결되었습니다.');

    } catch (error) {
        console.error('❌ 배포 실패:', error.message);
        process.exit(1);
    }
}

// 사용법 안내
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🚀 Redis 환경변수 자동 설정 및 Vercel 배포 스크립트

사용법:
  node scripts/deploy-with-redis.mjs [팀비밀번호]

예시:
  node scripts/deploy-with-redis.mjs openmanager2025

기능:
  1. 암호화된 Redis 환경변수 복호화
  2. Vercel 환경변수 자동 설정
  3. 프로덕션 배포 실행
`);
} else {
    deployWithRedis();
} 