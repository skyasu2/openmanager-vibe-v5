#!/usr/bin/env node
/**
 * 🔐 Build-Time Decryption Engine v2.0
 * 
 * 무료 Vercel 10초 제한 대응:
 * - 빌드 시점에 모든 암복호화 처리
 * - 런타임 부하 완전 제거
 * - 정적 환경변수 생성
 * 
 * 작성일: 2025-07-04 16:00 KST
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

class BuildTimeDecryptor {
    constructor() {
        this.buildEnvPath = join(process.cwd(), '.env.build');
        this.backupEnvPath = join(process.cwd(), 'config/env-backup.json');
        this.encryptedConfigPath = join(process.cwd(), 'config/encrypted-env-config.ts');

        this.decryptedVars = new Map();
        this.metrics = {
            processed: 0,
            decrypted: 0,
            cached: 0,
            failed: 0,
            startTime: Date.now()
        };
    }

    /**
     * 🚀 메인 빌드 타임 복호화 실행
     */
    async execute() {
        console.log('🔓 Build-Time Decryption Engine v2.0 시작...');

        try {
            // 1단계: 기본 환경변수 로드
            await this.loadBasicEnvVars();

            // 2단계: 백업에서 복호화
            await this.loadFromBackup();

            // 3단계: 암호화된 설정에서 복호화 시도
            await this.loadFromEncryptedConfig();

            // 4단계: 빌드용 환경변수 파일 생성
            await this.generateBuildEnvFile();

            // 5단계: 메트릭 출력
            this.printMetrics();

            return true;
        } catch (error) {
            console.error('❌ Build-Time Decryption 실패:', error);
            return false;
        }
    }

    /**
     * 📦 기본 환경변수 로드
     */
    async loadBasicEnvVars() {
        const basicVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'GOOGLE_AI_ENABLED',
            'GOOGLE_AI_API_KEY',
            'NODE_ENV'
        ];

        for (const key of basicVars) {
            const value = process.env[key];
            if (value) {
                this.decryptedVars.set(key, {
                    value,
                    source: 'process.env',
                    encrypted: false
                });
                this.metrics.processed++;
            }
        }

        console.log(`✅ 기본 환경변수 ${this.decryptedVars.size}개 로드됨`);
    }

    /**
     * 🗂️ 백업에서 복호화
     */
    async loadFromBackup() {
        if (!existsSync(this.backupEnvPath)) {
            console.log('⚠️ 백업 파일 없음, 건너뜀');
            return;
        }

        try {
            const backupData = JSON.parse(readFileSync(this.backupEnvPath, 'utf8'));

            for (const [key, data] of Object.entries(backupData)) {
                if (typeof data === 'object' && data.value) {
                    this.decryptedVars.set(key, {
                        value: data.value,
                        source: 'backup',
                        encrypted: false
                    });
                    this.metrics.processed++;
                }
            }

            console.log(`✅ 백업에서 ${Object.keys(backupData).length}개 변수 복구됨`);
        } catch (error) {
            console.warn('⚠️ 백업 로드 실패:', error.message);
        }
    }

    /**
     * 🔐 암호화된 설정에서 복호화 시도 (플레이스홀더)
     */
    async loadFromEncryptedConfig() {
        // 실제 복호화는 보안상 빌드 타임에만 제한적으로 수행
        // 여기서는 환경변수 형태로만 처리
        const encryptedVars = [
            'UPSTASH_REDIS_REST_URL',
            'UPSTASH_REDIS_REST_TOKEN',
            'REDIS_URL'
        ];

        for (const key of encryptedVars) {
            // 암호화된 환경변수가 있으면 시도
            const encryptedValue = process.env[`${key}_ENCRYPTED`];
            if (encryptedValue) {
                try {
                    // 간단한 Base64 복호화 (실제로는 더 복잡한 알고리즘)
                    const decrypted = this.attemptSimpleDecryption(encryptedValue);
                    if (decrypted) {
                        this.decryptedVars.set(key, {
                            value: decrypted,
                            source: 'encrypted-config',
                            encrypted: true
                        });
                        this.metrics.decrypted++;
                    }
                } catch (error) {
                    this.metrics.failed++;
                }
            }
            this.metrics.processed++;
        }

        console.log(`🔓 암호화 변수 ${this.metrics.decrypted}개 복호화됨`);
    }

    /**
     * 🔧 간단한 복호화 시도
     */
    attemptSimpleDecryption(encryptedValue) {
        try {
            // Base64 복호화 시도
            return Buffer.from(encryptedValue, 'base64').toString('utf8');
        } catch {
            return null;
        }
    }

    /**
     * 📄 빌드용 환경변수 파일 생성
     */
    async generateBuildEnvFile() {
        const envContent = Array.from(this.decryptedVars.entries())
            .map(([key, data]) => {
                const comment = `# ${data.source} - ${data.encrypted ? 'decrypted' : 'plain'}`;
                return `${comment}\n${key}="${data.value}"`;
            })
            .join('\n\n');

        const header = `# 🔐 Build-Time Decrypted Environment Variables
# Generated: ${new Date().toISOString()}
# OpenManager Vibe v5 - Build Optimization
# 
# ⚠️ 이 파일은 빌드 시점에 자동 생성됩니다.
# 수동으로 편집하지 마세요.

`;

        const fullContent = header + envContent;

        writeFileSync(this.buildEnvPath, fullContent);
        console.log(`📄 빌드 환경변수 파일 생성됨: ${this.buildEnvPath}`);
    }

    /**
     * 📊 메트릭 출력
     */
    printMetrics() {
        const duration = Date.now() - this.metrics.startTime;
        const successRate = ((this.metrics.processed - this.metrics.failed) / this.metrics.processed * 100).toFixed(1);

        console.log('\n📊 Build-Time Decryption 메트릭:');
        console.log(`   처리된 변수: ${this.metrics.processed}개`);
        console.log(`   복호화 성공: ${this.metrics.decrypted}개`);
        console.log(`   캐시 적중: ${this.metrics.cached}개`);
        console.log(`   실패: ${this.metrics.failed}개`);
        console.log(`   성공률: ${successRate}%`);
        console.log(`   실행 시간: ${duration}ms`);
        console.log(`   최종 변수 수: ${this.decryptedVars.size}개\n`);
    }

    /**
     * 🧹 정리 작업
     */
    cleanup() {
        // 보안상 메모리 정리
        this.decryptedVars.clear();
    }
}

// 빌드 타임에만 실행
if (process.env.NODE_ENV === 'production' || process.env.BUILD_TIME === 'true') {
    const decryptor = new BuildTimeDecryptor();

    decryptor.execute()
        .then(success => {
            decryptor.cleanup();
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Build-Time Decryption 치명적 오류:', error);
            decryptor.cleanup();
            process.exit(1);
        });
} else {
    console.log('ℹ️ Build-Time Decryption은 프로덕션 빌드에서만 실행됩니다.');
} 