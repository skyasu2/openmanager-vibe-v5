#!/usr/bin/env node

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
        throw new Error(`복호화 실패: ${error.message}`);
    }
}

// 테스트 실행
const teamPassword = 'team2025secure';
try {
    const decryptedKey = decrypt(ENCRYPTED_GOOGLE_AI_CONFIG, teamPassword);
    console.log('🔓 복호화 성공!');
    console.log(`복호화된 키: ${decryptedKey.substring(0, 20)}...`);
} catch (error) {
    console.error('❌ 복호화 실패:', error.message);
}
