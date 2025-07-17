#!/usr/bin/env node

/**
 * 🔐 Google AI API 키 암호화 스크립트 v2.0
 * Node.js 내장 crypto 모듈 사용 (SSR 호환)
 */

import { createCipheriv, pbkdf2Sync, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname 대체 (ES6 modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 암호화 설정
const CONFIG = {
    algorithm: 'aes-256-cbc',
    keyLength: 32, // 256 bits
    ivLength: 16, // 128 bits
    saltLength: 16, // 128 bits
    iterations: 10000,
    version: '1.0.0'
};

/**
 * 값 암호화
 */
function encrypt(value, password) {
    try {
        // 솔트와 IV 생성
        const salt = randomBytes(CONFIG.saltLength);
        const iv = randomBytes(CONFIG.ivLength);

        // PBKDF2로 키 생성
        const key = pbkdf2Sync(password, salt, CONFIG.iterations, CONFIG.keyLength, 'sha256');

        // AES-256-CBC 암호화
        const cipher = createCipheriv(CONFIG.algorithm, key, iv);

        let encrypted = cipher.update(value, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return {
            encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            timestamp: new Date().toISOString(),
            version: CONFIG.version,
        };
    } catch (error) {
        throw new Error(`암호화 실패: ${error.message}`);
    }
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('🔐 Google AI API 키 암호화 스크립트 v2.0 (Node.js crypto)');
    console.log('='.repeat(60));

    try {
        // 새로운 API 키
        const newApiKey = 'SENSITIVE_INFO_REMOVED';

        // 팀 비밀번호
        const teamPassword = 'team2025secure';

        console.log('📝 암호화 정보:');
        console.log(`- API 키: ${newApiKey.substring(0, 20)}...`);
        console.log(`- 비밀번호: ${teamPassword.substring(0, 3)}***`);
        console.log(`- 알고리즘: ${CONFIG.algorithm}`);
        console.log(`- 반복 수: ${CONFIG.iterations}`);
        console.log('');

        // 암호화 실행
        console.log('🔄 암호화 진행 중...');
        const encryptedData = encrypt(newApiKey, teamPassword);

        console.log('✅ 암호화 완료!');
        console.log('');
        console.log('📋 결과:');
        console.log(`- 암호화된 키: ${encryptedData.encrypted}`);
        console.log(`- 솔트: ${encryptedData.salt}`);
        console.log(`- IV: ${encryptedData.iv}`);
        console.log(`- 생성 시간: ${encryptedData.timestamp}`);
        console.log(`- 버전: ${encryptedData.version}`);
        console.log('');

        // 설정 파일 업데이트
        const configPath = path.join(__dirname, '../../src/config/google-ai-config.ts');
        const configContent = `/**
 * Google AI API 키 암호화 설정
 *
 * 이 파일은 암호화된 Google AI API 키를 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 *
 * 구조:
 * - encryptedKey: AES 암호화된 Google AI API 키
 * - salt: 암호화에 사용된 솔트
 * - iv: 초기화 벡터
 */

export interface GoogleAIEncryptedConfig {
  encryptedKey: string;
  salt: string;
  iv: string;
  createdAt: string;
  version: string;
}

/**
 * 암호화된 Google AI 설정 v2.0 (Node.js crypto)
 * 이 값들은 encrypt-google-ai-v2.js 스크립트로 생성됩니다.
 */
export const ENCRYPTED_GOOGLE_AI_CONFIG: GoogleAIEncryptedConfig = {
  encryptedKey: '${encryptedData.encrypted}',
  salt: '${encryptedData.salt}',
  iv: '${encryptedData.iv}',
  createdAt: '${encryptedData.timestamp}',
  version: '${encryptedData.version}',
};

// 개발 환경에서만 사용되는 기본 설정 (암호화되지 않음)
export const DEV_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  useEncryption:
    process.env.NODE_ENV === 'production' ||
    process.env.FORCE_ENCRYPTION === 'true',
};
`;

        fs.writeFileSync(configPath, configContent);
        console.log(`✅ 설정 파일 업데이트 완료: ${configPath}`);
        console.log('');

        // 테스트 스크립트 생성 (CommonJS 형태)
        const testScript = `#!/usr/bin/env node

/**
 * 🧪 Google AI API 키 복호화 테스트 (ES6 modules)
 */

import { createDecipheriv, pbkdf2Sync } from 'crypto';
import { ENCRYPTED_GOOGLE_AI_CONFIG } from '../../src/config/google-ai-config.js';

function decrypt(encryptedData, password) {
    try {
        const { encrypted, salt, iv } = encryptedData;

        // 솔트와 IV 복원
        const saltBuffer = Buffer.from(salt, 'hex');
        const ivBuffer = Buffer.from(iv, 'hex');

        // PBKDF2로 키 생성
        const key = pbkdf2Sync(password, saltBuffer, 10000, 32, 'sha256');

        // AES-256-CBC 복호화
        const decipher = createDecipheriv('aes-256-cbc', key, ivBuffer);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error(\`복호화 실패: \${error.message}\`);
    }
}

// 테스트 실행
const teamPassword = 'team2025secure';
try {
    const decryptedKey = decrypt(ENCRYPTED_GOOGLE_AI_CONFIG, teamPassword);
    console.log('🔓 복호화 성공!');
    console.log(\`복호화된 키: \${decryptedKey.substring(0, 20)}...\`);
} catch (error) {
    console.error('❌ 복호화 실패:', error.message);
}
`;

        const testPath = path.join(__dirname, 'test-decrypt-v2.js');
        fs.writeFileSync(testPath, testScript);
        console.log(`✅ 테스트 스크립트 생성: ${testPath}`);

        console.log('');
        console.log('🎯 완료! 다음 단계:');
        console.log('1. 설정 파일이 업데이트되었습니다');
        console.log('2. 테스트 스크립트로 복호화 확인: node development/security/test-decrypt-v2.js');
        console.log('3. 로컬 테스트: npm run dev');
        console.log('4. Vercel 배포: git add . && git commit -m "Google AI 암호화 v2.0 (Node.js crypto)" && git push');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        process.exit(1);
    }
}

// 스크립트 실행
main();

export { CONFIG, encrypt };
