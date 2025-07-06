#!/usr/bin/env node

/**
 * 🔐 통합 환경변수 암복호화 CLI 도구
 * OpenManager Vibe v5 - 통합 암호화 시스템
 */

import CryptoJS from 'crypto-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// 기본 팀 비밀번호들 (우선순위 순)
const DEFAULT_PASSWORDS = [
    'openmanager2025',
    'openmanager-vibe-v5-2025',
    'team-password-2025',
    'openmanager-team-key',
    'development-mock-password'
];

/**
 * 🔐 값 암호화
 */
function encryptValue(value, password) {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000,
    });

    const encrypted = CryptoJS.AES.encrypt(value, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    return {
        encrypted: encrypted.toString(),
        salt: salt,
        iv: iv.toString(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    };
}

/**
 * 🔓 값 복호화
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

        const result = decrypted.toString(CryptoJS.enc.Utf8);

        if (!result) {
            throw new Error('복호화 결과가 비어있습니다');
        }

        return result;
    } catch (error) {
        throw new Error(`복호화 실패: ${error.message}`);
    }
}

/**
 * 📋 사용법 출력
 */
function printUsage() {
    console.log(colorize('\n🔐 통합 환경변수 암복호화 CLI 도구', 'cyan'));
    console.log(colorize('OpenManager Vibe v5 - 통합 암호화 시스템\n', 'blue'));

    console.log(colorize('사용법:', 'yellow'));
    console.log('  node unified-env-crypto.mjs <명령어> [옵션]\n');

    console.log(colorize('명령어:', 'yellow'));
    console.log('  encrypt <값> [비밀번호]     - 값 암호화');
    console.log('  decrypt <암호화된값> [비밀번호] - 값 복호화');
    console.log('  auto-decrypt <암호화된값>   - 자동 비밀번호 시도');
    console.log('  validate <암호화된값>       - 암호화 데이터 검증');
    console.log('  help                        - 도움말 출력\n');

    console.log(colorize('예시:', 'yellow'));
    console.log('  node unified-env-crypto.mjs encrypt "my-secret" "openmanager2025"');
    console.log('  node unified-env-crypto.mjs decrypt "..." "openmanager2025"');
    console.log('  node unified-env-crypto.mjs auto-decrypt "..."');
}

/**
 * 🔐 암호화 명령어
 */
function encryptCommand(value, password) {
    if (!value) {
        console.log(colorize('❌ 암호화할 값을 입력하세요.', 'red'));
        return;
    }

    const pwd = password || DEFAULT_PASSWORDS[0];

    try {
        console.log(colorize('🔐 값 암호화 중...', 'yellow'));
        const encrypted = encryptValue(value, pwd);

        console.log(colorize('\n✅ 암호화 완료!', 'green'));
        console.log(colorize('암호화된 데이터:', 'cyan'));
        console.log(JSON.stringify(encrypted, null, 2));

        // 검증
        const decrypted = decryptValue(encrypted, pwd);
        if (decrypted === value) {
            console.log(colorize('✅ 암호화 검증 성공', 'green'));
        } else {
            console.log(colorize('❌ 암호화 검증 실패', 'red'));
        }

    } catch (error) {
        console.log(colorize(`❌ 암호화 실패: ${error.message}`, 'red'));
    }
}

/**
 * 🔓 복호화 명령어
 */
function decryptCommand(encryptedDataStr, password) {
    if (!encryptedDataStr) {
        console.log(colorize('❌ 복호화할 암호화된 데이터를 입력하세요.', 'red'));
        return;
    }

    try {
        const encryptedData = JSON.parse(encryptedDataStr);
        const pwd = password || DEFAULT_PASSWORDS[0];

        console.log(colorize('🔓 값 복호화 중...', 'yellow'));
        const decrypted = decryptValue(encryptedData, pwd);

        console.log(colorize('\n✅ 복호화 완료!', 'green'));
        console.log(colorize('복호화된 값:', 'cyan'));
        console.log(decrypted);

    } catch (error) {
        console.log(colorize(`❌ 복호화 실패: ${error.message}`, 'red'));
    }
}

/**
 * 🔄 자동 복호화 명령어
 */
function autoDecryptCommand(encryptedDataStr) {
    if (!encryptedDataStr) {
        console.log(colorize('❌ 복호화할 암호화된 데이터를 입력하세요.', 'red'));
        return;
    }

    try {
        const encryptedData = JSON.parse(encryptedDataStr);

        console.log(colorize('🔄 자동 복호화 시작...', 'yellow'));

        for (const password of DEFAULT_PASSWORDS) {
            try {
                console.log(colorize(`🔑 비밀번호 시도: ${password.substring(0, 3)}***`, 'blue'));
                const decrypted = decryptValue(encryptedData, password);

                console.log(colorize('\n✅ 자동 복호화 성공!', 'green'));
                console.log(colorize(`사용된 비밀번호: ${password}`, 'cyan'));
                console.log(colorize('복호화된 값:', 'cyan'));
                console.log(decrypted);
                return;

            } catch (error) {
                console.log(colorize(`❌ 실패: ${password.substring(0, 3)}***`, 'red'));
            }
        }

        console.log(colorize('❌ 모든 기본 비밀번호로 복호화 실패', 'red'));

    } catch (error) {
        console.log(colorize(`❌ 자동 복호화 실패: ${error.message}`, 'red'));
    }
}

/**
 * ✅ 검증 명령어
 */
function validateCommand(encryptedDataStr) {
    if (!encryptedDataStr) {
        console.log(colorize('❌ 검증할 암호화된 데이터를 입력하세요.', 'red'));
        return;
    }

    try {
        const encryptedData = JSON.parse(encryptedDataStr);

        console.log(colorize('✅ 암호화 데이터 검증 중...', 'yellow'));

        // 필수 필드 검증
        const requiredFields = ['encrypted', 'salt', 'iv', 'timestamp'];
        const missingFields = requiredFields.filter(field => !encryptedData[field]);

        if (missingFields.length > 0) {
            console.log(colorize(`❌ 누락된 필드: ${missingFields.join(', ')}`, 'red'));
            return;
        }

        console.log(colorize('✅ 암호화 데이터 구조 검증 완료', 'green'));
        console.log(colorize('데이터 정보:', 'cyan'));
        console.log(`  버전: ${encryptedData.version || '1.0.0'}`);
        console.log(`  타임스탬프: ${encryptedData.timestamp}`);
        console.log(`  솔트 길이: ${encryptedData.salt.length}`);
        console.log(`  IV 길이: ${encryptedData.iv.length}`);

    } catch (error) {
        console.log(colorize(`❌ 검증 실패: ${error.message}`, 'red'));
    }
}

// 메인 실행
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        printUsage();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'encrypt':
            encryptCommand(args[1], args[2]);
            break;
        case 'decrypt':
            decryptCommand(args[1], args[2]);
            break;
        case 'auto-decrypt':
            autoDecryptCommand(args[1]);
            break;
        case 'validate':
            validateCommand(args[1]);
            break;
        case 'help':
        default:
            printUsage();
            break;
    }
}

// 스크립트 실행
main(); 