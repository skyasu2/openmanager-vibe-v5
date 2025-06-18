#!/usr/bin/env node

/**
 * 🔐 환경변수 암호화 스크립트
 * OpenManager Vibe v5
 */

import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 팀 비밀번호 (실제 사용 시 환경변수나 CLI 인자로 받아야 함)
const TEAM_PASSWORD = 'openmanager2025';

// 암호화할 환경변수들
const ENV_VARS = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://vnswjnltnhpsueosfhmw.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.aqP3vhgVSWIgN4_B7aHYvRZJFYWPEHhNJEFMsWDPJBs',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8',
    UPSTASH_REDIS_REST_URL: 'https://charming-condor-46598.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
    RENDER_MCP_SERVER_URL: 'https://openmanager-vibe-v5.onrender.com'
};

/**
 * 값 암호화
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
    };
}

/**
 * 모든 환경변수 암호화
 */
function encryptAllVars() {
    console.log('🔐 환경변수 암호화 시작...');

    const encryptedVars = {};
    const teamPasswordHash = CryptoJS.SHA256(TEAM_PASSWORD).toString();

    for (const [varName, value] of Object.entries(ENV_VARS)) {
        try {
            const encrypted = encryptValue(value, TEAM_PASSWORD);
            encryptedVars[varName] = {
                ...encrypted,
                originalName: varName,
                isPublic: varName.startsWith('NEXT_PUBLIC_'),
                rotateSchedule: varName.includes('TOKEN') ? 'quarterly' : 'manual',
            };

            console.log(`✅ ${varName}: 암호화 완료`);
        } catch (error) {
            console.error(`❌ ${varName}: 암호화 실패 -`, error.message);
        }
    }

    // 암호화된 설정 파일 생성
    const configContent = `/**
 * 🔐 OpenManager Vibe v5 - 암호화된 환경변수 설정
 * 
 * 이 파일은 민감한 환경변수들을 AES 암호화하여 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 * 
 * 생성일: ${new Date().toISOString()}
 * 암호화된 변수: ${Object.keys(encryptedVars).length}개
 */

export interface EncryptedEnvVar {
  encrypted: string;
  salt: string;
  iv: string;
  timestamp: string;
  originalName: string;
  isPublic: boolean;
  rotateSchedule: string;
}

export interface EncryptedEnvironmentConfig {
  version: string;
  createdAt: string;
  teamPasswordHash: string;
  variables: { [key: string]: EncryptedEnvVar };
}

export const ENCRYPTED_ENV_CONFIG: EncryptedEnvironmentConfig = {
  version: '2.0.0',
  createdAt: '${new Date().toISOString()}',
  teamPasswordHash: '${teamPasswordHash}',
  variables: ${JSON.stringify(encryptedVars, null, 4)}
};

export const DEPLOYMENT_CONFIG = {
  supabase: {
    enabled: true,
    region: 'ap-southeast-1',
    project: 'vnswjnltnhpsueosfhmw'
  },
  renderMCP: {
    enabled: true,
    region: 'singapore',
    loadBalanced: true
  },
  redis: {
    enabled: true,
    provider: 'upstash',
    region: 'ap-southeast-1'
  },
  googleAI: {
    enabled: true,
    model: 'gemini-1.5-flash',
    betaMode: true
  }
};`;

    // 파일 저장
    const configPath = path.join(__dirname, '..', 'config', 'encrypted-env-config.ts');
    fs.writeFileSync(configPath, configContent, 'utf8');

    console.log(`🎉 총 ${Object.keys(encryptedVars).length}개 환경변수 암호화 완료!`);
    console.log(`📁 저장 위치: ${configPath}`);

    return encryptedVars;
}

// 스크립트 실행
if (require.main === module) {
    encryptAllVars();
} 