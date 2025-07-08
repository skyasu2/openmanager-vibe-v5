#!/usr/bin/env node

/**
 * 🔐 OpenManager Vibe v5 - 통합 암호화 매니저
 * 
 * 기존 중복 스크립트들의 장점을 통합한 단일 CLI 도구:
 * - encrypt-google-ai.js: CLI UX, 검증 기능
 * - quick-encrypt.js: 복호화 테스트
 * - encrypt-env-vars.mjs: 할당량 보호 설정
 * - restore-env.js: 기본 환경변수 설정
 * 
 * 사용법:
 * node scripts/encryption-manager.js --help
 * node scripts/encryption-manager.js --encrypt-google-ai
 * node scripts/encryption-manager.js --encrypt-env
 * node scripts/encryption-manager.js --test-encryption
 * node scripts/encryption-manager.js --restore-env
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

// CLI 유틸리티 모듈을 CommonJS 방식으로 임포트
let cliUtils;
try {
    // 개발 환경에서는 TypeScript 컴파일 없이도 동작하도록 fallback
    const { colors, hiddenQuestion, validateAPIKey, validatePassword, successLog, errorLog, titleLog, completionLog } = require('../src/utils/cli-utils');
    cliUtils = { colors, hiddenQuestion, validateAPIKey, validatePassword, successLog, errorLog, titleLog, completionLog };
} catch {
    // TypeScript 모듈 로드 실패 시 기본 구현 사용
    cliUtils = {
        colors: {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
        },
        successLog: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
        errorLog: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
        titleLog: (msg) => console.log(`\x1b[1m\x1b[34m🔐 ${msg}\x1b[0m\n`),
        completionLog: (msg) => console.log(`\n\x1b[1m\x1b[32m🎉 ${msg}\x1b[0m\n`),
        validateAPIKey: (key) => key && key.startsWith('AIza') && key.length >= 20 && key.length <= 50,
        validatePassword: (pwd) => pwd && pwd.length >= 4,
        hiddenQuestion: () => Promise.resolve('openmanager2025') // 기본값
    };
}

class UnifiedEncryptionManager {
    constructor() {
        this.teamPassword = 'openmanager2025';
        this.encryptionKey = this.getEncryptionKey();
    }

    /**
     * 🔑 암호화 키 생성 (src/utils/encryption.ts와 호환)
     */
    getEncryptionKey() {
        if (process.env.ENCRYPTION_KEY) {
            return process.env.ENCRYPTION_KEY;
        }

        const nodeVersion = process.version;
        const projectHash = crypto
            .createHash('sha256')
            .update(process.cwd() + 'openmanager-vibe-v5')
            .digest('hex')
            .substring(0, 32);

        return `dev-${nodeVersion}-${projectHash}`;
    }

    /**
     * 🔒 값 암호화 (CryptoJS AES)
     */
    encrypt(text) {
        try {
            return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
        } catch (error) {
            throw new Error(`암호화 실패: ${error.message}`);
        }
    }

    /**
     * 🔓 값 복호화 (CryptoJS AES)
     */
    decrypt(encryptedText) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
                throw new Error('복호화 결과가 비어있음');
            }
            return decrypted;
        } catch (error) {
            throw new Error(`복호화 실패: ${error.message}`);
        }
    }

    /**
     * 🧪 암호화/복호화 테스트 (quick-encrypt.js에서 통합)
     */
    testEncryption() {
        cliUtils.titleLog('암호화/복호화 테스트');

        const testValue = 'test-encryption-' + Date.now();
        console.log(`📝 테스트 값: ${testValue}`);

        try {
            const encrypted = this.encrypt(testValue);
            console.log(`🔒 암호화: ${encrypted.substring(0, 20)}...`);

            const decrypted = this.decrypt(encrypted);
            console.log(`🔓 복호화: ${decrypted}`);

            if (decrypted === testValue) {
                cliUtils.successLog('암호화/복호화 테스트 성공!');
                return true;
            } else {
                cliUtils.errorLog('테스트 값이 일치하지 않음');
                return false;
            }
        } catch (error) {
            cliUtils.errorLog(`테스트 실패: ${error.message}`);
            return false;
        }
    }

    /**
     * 🤖 Google AI 키 암호화 (대화형 인터페이스)
     */
    async encryptGoogleAI() {
        cliUtils.titleLog('Google AI API 키 암호화');

        try {
            // API 키 입력
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            const apiKey = await new Promise(resolve => {
                rl.question(`${cliUtils.colors.yellow}Google AI Studio API 키를 입력하세요:${cliUtils.colors.reset} `, resolve);
            });

            rl.close();

            if (!cliUtils.validateAPIKey(apiKey.trim())) {
                cliUtils.errorLog('올바르지 않은 API 키 형식입니다. (AIza로 시작해야 하며, 20-50자 사이)');
                return false;
            }

            // 암호화 수행
            const encrypted = this.encrypt(apiKey.trim());
            cliUtils.successLog('Google AI API 키 암호화 완료');

            // 결과 출력
            console.log('\n📋 환경변수 설정:');
            console.log('개발 환경 (.env.local):');
            console.log(`GOOGLE_AI_API_KEY_ENCRYPTED=${encrypted}`);

            console.log('\nVercel 환경변수:');
            console.log('vercel env add GOOGLE_AI_API_KEY_ENCRYPTED');
            console.log(`값: ${encrypted}`);

            // 복호화 테스트
            console.log('\n🧪 복호화 테스트...');
            const decrypted = this.decrypt(encrypted);
            if (decrypted === apiKey.trim()) {
                cliUtils.successLog('복호화 테스트 성공!');
            } else {
                cliUtils.errorLog('복호화 테스트 실패');
            }

            return true;
        } catch (error) {
            cliUtils.errorLog(`Google AI 키 암호화 실패: ${error.message}`);
            return false;
        }
    }

    /**
     * 🌐 환경변수 복원 (restore-env.js 기능 통합)
     */
    async restoreEnvironment() {
        cliUtils.titleLog('환경변수 복원');

        try {
            // 백업 파일 확인
            const backupPath = path.join(__dirname, '../config/env-backup.json');
            if (!fs.existsSync(backupPath)) {
                cliUtils.errorLog('백업 파일이 존재하지 않습니다');
                return false;
            }

            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            console.log(`📊 백업 파일 로드: ${backup.entries.length}개 환경변수`);

            // 기본 환경변수 (restore-env.js에서 통합)
            const defaultVars = {
                NODE_ENV: 'development',
                DISABLE_GOOGLE_AI_HEALTH_CHECK: 'true',
                NEXT_TELEMETRY_DISABLED: '1',
                SKIP_ENV_VALIDATION: 'true',
                GOOGLE_AI_BETA_MODE: 'true',
                GOOGLE_AI_ENABLED: 'true',
                DEVELOPMENT_MODE: 'true',
                LOCAL_DEVELOPMENT: 'true',
            };

            let envContent = '';
            let successCount = 0;

            // 기본값 추가
            for (const [key, value] of Object.entries(defaultVars)) {
                envContent += `${key}=${value}\n`;
                successCount++;
            }

            // 백업된 환경변수 복원
            backup.entries.forEach(entry => {
                try {
                    const value = entry.encrypted ? this.decryptLegacy(entry.value) : entry.value;
                    envContent += `${entry.key}=${value}\n`;
                    successCount++;
                } catch (error) {
                    console.error(`❌ 복구 실패: ${entry.key}`);
                }
            });

            // .env.local 파일 생성
            const envPath = path.join(__dirname, '../.env.local');
            fs.writeFileSync(envPath, envContent);

            cliUtils.successLog(`${successCount}개 환경변수 복원 완료`);
            console.log(`📁 파일 위치: ${envPath}`);

            return true;
        } catch (error) {
            cliUtils.errorLog(`환경변수 복원 실패: ${error.message}`);
            return false;
        }
    }

    /**
     * 🔓 레거시 복호화 (restore-env.js 호환)
     */
    decryptLegacy(encryptedText) {
        try {
            const [ivHex, encrypted] = encryptedText.split(':');
            if (!ivHex || !encrypted) {
                return encryptedText; // 암호화되지 않은 값
            }

            const iv = Buffer.from(ivHex, 'hex');
            const encryptionKey = crypto
                .createHash('sha256')
                .update(process.env.CRON_SECRET || 'openmanager-vibe-v5-backup')
                .digest('hex')
                .slice(0, 32);

            const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch {
            return encryptedText; // 복호화 실패 시 원본 반환
        }
    }

    /**
     * 📋 도움말 출력
     */
    showHelp() {
        console.log(`
${cliUtils.colors.bright}${cliUtils.colors.blue}🔐 OpenManager Vibe v5 - 통합 암호화 매니저${cliUtils.colors.reset}

${cliUtils.colors.cyan}사용법:${cliUtils.colors.reset}
  node scripts/encryption-manager.js [옵션]

${cliUtils.colors.cyan}옵션:${cliUtils.colors.reset}
  --encrypt-google-ai     Google AI API 키 암호화 (대화형)
  --test-encryption       암호화/복호화 테스트 실행
  --restore-env          환경변수 백업에서 복원
  --help                 이 도움말 출력

${cliUtils.colors.cyan}예시:${cliUtils.colors.reset}
  node scripts/encryption-manager.js --encrypt-google-ai
  node scripts/encryption-manager.js --test-encryption
  node scripts/encryption-manager.js --restore-env

${cliUtils.colors.yellow}💡 이 도구는 기존 중복 스크립트들의 장점을 통합했습니다:${cliUtils.colors.reset}
  - encrypt-google-ai.js: CLI UX, 검증 기능
  - quick-encrypt.js: 복호화 테스트  
  - encrypt-env-vars.mjs: 할당량 보호 설정
  - restore-env.js: 기본 환경변수 설정
`);
    }
}

// CLI 실행
async function main() {
    const args = process.argv.slice(2);
    const manager = new UnifiedEncryptionManager();

    if (args.length === 0 || args.includes('--help')) {
        manager.showHelp();
        return;
    }

    try {
        if (args.includes('--encrypt-google-ai')) {
            await manager.encryptGoogleAI();
        } else if (args.includes('--test-encryption')) {
            manager.testEncryption();
        } else if (args.includes('--restore-env')) {
            await manager.restoreEnvironment();
        } else {
            console.log('알 수 없는 옵션입니다. --help를 참조하세요.');
        }
    } catch (error) {
        cliUtils.errorLog(`실행 중 오류 발생: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = UnifiedEncryptionManager; 