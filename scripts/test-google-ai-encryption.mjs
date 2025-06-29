#!/usr/bin/env node

/**
 * 🔧 Google AI 암복호화 시스템 테스트 스크립트
 * OpenManager Vibe v5 - 환경변수 문제 진단
 * 
 * 현재 날짜: 2025-01-25 10:52 KST
 */

import CryptoJS from 'crypto-js';

// 🔑 실제 Google AI API 키 (사용자 제공)
const REAL_API_KEY = 'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM';

// 🔐 현재 시스템에서 사용 중인 암호화 데이터
const CURRENT_ENCRYPTED_BACKUP = {
    encryptedKey: 'waHQ/XUFlL8UB98tzvet0ylNjszQNjycJKXGT8vNOtC5leMnGAN8Za6iW9s8fTgG',
    salt: '834ce4c4cbc37fd67e0893612f460fcb',
    iv: '8d63f626197208e9ecb562f92d642ed3',
    teamPasswordHash: '7e346817b5382d72b3860a1aa9d6abc0263e2ddcea9e78c18724dfa2c1f575f5'
};

console.log('🔧 Google AI 암복호화 시스템 진단 시작...\n');

// 1. 비밀번호 해시 검증
function testPasswordHash() {
    const teamPassword = 'openmanager2025';
    const currentHash = CryptoJS.SHA256(teamPassword).toString();

    console.log('📊 비밀번호 해시 검증:');
    console.log(`현재 비밀번호: ${teamPassword}`);
    console.log(`계산된 해시: ${currentHash}`);
    console.log(`저장된 해시: ${CURRENT_ENCRYPTED_BACKUP.teamPasswordHash}`);
    console.log(`해시 일치: ${currentHash === CURRENT_ENCRYPTED_BACKUP.teamPasswordHash ? '✅' : '❌'}\n`);

    return currentHash === CURRENT_ENCRYPTED_BACKUP.teamPasswordHash;
}

// 2. 현재 암호화 데이터 복호화 테스트
function testCurrentDecryption() {
    console.log('🔓 현재 암호화 데이터 복호화 테스트:');

    try {
        const teamPassword = 'openmanager2025';
        const { encryptedKey, salt, iv } = CURRENT_ENCRYPTED_BACKUP;

        // PBKDF2 키 생성 (여러 방식 시도)
        const keyOptions = [
            { keySize: 256 / 32, name: '256/32 (현재 방식)' },
            { keySize: 32, name: '32 (올바른 방식)' },
            { keySize: 8, name: '8 (256/32 결과)' }
        ];

        for (const option of keyOptions) {
            try {
                const key = CryptoJS.PBKDF2(teamPassword, salt, {
                    keySize: option.keySize,
                    iterations: 10000,
                });

                const decrypted = CryptoJS.AES.decrypt(encryptedKey, key, {
                    iv: CryptoJS.enc.Hex.parse(iv),
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7,
                });

                const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

                console.log(`  ${option.name}: ${decryptedText ? `✅ ${decryptedText}` : '❌ 복호화 실패'}`);

                if (decryptedText === REAL_API_KEY) {
                    console.log(`  🎯 올바른 API 키 복호화 성공!`);
                    return true;
                }

            } catch (error) {
                console.log(`  ${option.name}: ❌ 오류 - ${error.message}`);
            }
        }

    } catch (error) {
        console.error(`❌ 복호화 테스트 실패: ${error.message}`);
    }

    console.log('');
    return false;
}

// 3. 새로운 암호화 데이터 생성
function generateNewEncryption() {
    console.log('🔒 새로운 암호화 데이터 생성:');

    try {
        const teamPassword = 'openmanager2025';
        const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
        const iv = CryptoJS.lib.WordArray.random(128 / 8).toString();

        // 올바른 키 생성 방식 사용
        const key = CryptoJS.PBKDF2(teamPassword, salt, {
            keySize: 32, // 256비트 = 32바이트
            iterations: 10000,
        });

        const encrypted = CryptoJS.AES.encrypt(REAL_API_KEY, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const encryptedKey = encrypted.toString();
        const passwordHash = CryptoJS.SHA256(teamPassword).toString();

        const newBackup = {
            encryptedKey,
            salt,
            iv,
            teamPasswordHash: passwordHash,
            createdAt: new Date().toISOString(),
            apiKeyPreview: REAL_API_KEY.substring(0, 10) + '...'
        };

        console.log('✅ 새로운 암호화 데이터:');
        console.log(JSON.stringify(newBackup, null, 2));

        // 즉시 검증
        console.log('\n🔍 새로운 데이터 검증:');
        const testKey = CryptoJS.PBKDF2(teamPassword, salt, {
            keySize: 32,
            iterations: 10000,
        });

        const testDecrypted = CryptoJS.AES.decrypt(encryptedKey, testKey, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const testResult = testDecrypted.toString(CryptoJS.enc.Utf8);
        console.log(`검증 결과: ${testResult === REAL_API_KEY ? '✅ 성공' : '❌ 실패'}`);
        console.log(`복호화된 키: ${testResult}`);

        return newBackup;

    } catch (error) {
        console.error(`❌ 새로운 암호화 생성 실패: ${error.message}`);
        return null;
    }
}

// 4. 환경변수 정리 테스트
function testEnvCleaning() {
    console.log('\n🧹 환경변수 정리 테스트:');

    const testCases = [
        'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM',
        'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM\r\n',
        'AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM\n',
        '"AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM"',
        ' AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM ',
    ];

    function cleanEnvValue(value) {
        if (!value || typeof value !== 'string') {
            return '';
        }

        return value
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/[\r\n]/g, '')
            .trim();
    }

    testCases.forEach((testCase, index) => {
        const cleaned = cleanEnvValue(testCase);
        const isValid = cleaned.startsWith('AIza') && cleaned.length > 20;
        console.log(`  테스트 ${index + 1}: ${isValid ? '✅' : '❌'} "${testCase.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}" → "${cleaned}"`);
    });
}

// 메인 실행
async function main() {
    console.log('🎯 OpenManager Vibe v5 - Google AI 암복호화 진단 보고서');
    console.log('='.repeat(60));

    const isHashValid = testPasswordHash();
    const isDecryptionWorking = testCurrentDecryption();

    if (!isHashValid || !isDecryptionWorking) {
        console.log('⚠️ 현재 시스템에 문제가 발견되었습니다. 새로운 암호화 데이터를 생성합니다.\n');
        const newBackup = generateNewEncryption();

        if (newBackup) {
            console.log('\n💡 Google AI 매니저 업데이트 코드:');
            console.log('```typescript');
            console.log('private static readonly ENCRYPTED_BACKUP = {');
            console.log(`  encryptedKey: '${newBackup.encryptedKey}',`);
            console.log(`  salt: '${newBackup.salt}',`);
            console.log(`  iv: '${newBackup.iv}',`);
            console.log(`  teamPasswordHash: '${newBackup.teamPasswordHash}'`);
            console.log('};');
            console.log('```');
        }
    } else {
        console.log('✅ 현재 암복호화 시스템이 정상 작동합니다.');
    }

    testEnvCleaning();

    console.log('\n🏁 진단 완료!');
}

main().catch(console.error); 