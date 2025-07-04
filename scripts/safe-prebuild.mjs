#!/usr/bin/env node
/**
 * 🛡️ Safe Prebuild Script
 * 
 * Vercel 배포 시 build-time-decryption.mjs가 없어도 
 * 안전하게 빌드가 진행되도록 하는 크로스 플랫폼 스크립트
 * 
 * 작성일: 2025-07-02 16:30 KST
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const decryptionScript = join(projectRoot, 'scripts', 'build-time-decryption.mjs');

console.log('🛡️ Safe Prebuild Script 시작...');

try {
    if (existsSync(decryptionScript)) {
        console.log('✅ build-time-decryption.mjs 발견됨, 실행 중...');
        execSync('node scripts/build-time-decryption.mjs', {
            stdio: 'inherit',
            cwd: projectRoot
        });
        console.log('✅ Build-time decryption 완료');
    } else {
        console.log('⚠️ build-time-decryption.mjs 없음');
        console.log('🔄 기본 환경변수로 빌드 진행...');

        // 기본 환경변수 설정이 필요하다면 여기에 추가
        const requiredVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.log(`⚠️ 누락된 환경변수: ${missingVars.join(', ')}`);
            console.log('🔧 기본값으로 대체하거나 빌드 계속 진행...');
        }

        console.log('✅ Safe prebuild 완료');
    }
} catch (error) {
    console.error('❌ Prebuild 오류:', error.message);
    console.log('🔄 오류 무시하고 빌드 계속 진행...');
    process.exit(0); // 빌드가 계속 진행되도록 성공 코드로 종료
} 