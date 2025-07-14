#!/usr/bin/env node

/**
 * 🔐 통합 환경변수 암호화 스크립트
 * 
 * 사용법:
 * node scripts/unified-encrypt-env.mjs --password=<master-password>
 * node scripts/unified-encrypt-env.mjs --password-file=.env.key
 */

import { createCipheriv, pbkdf2Sync, randomBytes, createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const CONFIG = {
  algorithm: 'aes-256-gcm',
  iterations: 100000,
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
  version: '2.0.0'
};

// CLI 인자 파싱
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  });

  return options;
}

// 마스터 비밀번호 가져오기
function getMasterPassword(options) {
  if (options.password) {
    return options.password;
  }

  if (options['password-file']) {
    const filePath = path.resolve(options['password-file']);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8').trim();
    } else {
      throw new Error(`Password file not found: ${filePath}`);
    }
  }

  // 환경변수에서 확인
  if (process.env.ENV_MASTER_PASSWORD) {
    return process.env.ENV_MASTER_PASSWORD;
  }

  throw new Error('Master password not provided. Use --password or --password-file');
}

// 환경변수 로드
function loadEnvironmentVariables() {
  // .env.local 파일 우선 로드
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }

  // .env 파일 로드
  dotenv.config();

  // 암호화할 환경변수 목록
  const varsToEncrypt = [
    // Supabase
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    // Redis
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    // Google AI
    'GOOGLE_AI_API_KEY',
    // GCP MCP
    'GCP_MCP_SERVER_URL',
    // OAuth
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    // NextAuth
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    // GitHub
    'GITHUB_TOKEN',
  ];

  const envVars = {};
  
  varsToEncrypt.forEach(key => {
    if (process.env[key]) {
      envVars[key] = process.env[key];
    }
  });

  return envVars;
}

// 값 암호화
function encryptValue(value, password) {
  const salt = randomBytes(CONFIG.saltLength);
  const iv = randomBytes(CONFIG.ivLength);
  
  const key = pbkdf2Sync(
    password,
    salt,
    CONFIG.iterations,
    CONFIG.keyLength,
    'sha256'
  );

  const cipher = createCipheriv(CONFIG.algorithm, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    timestamp: new Date().toISOString(),
    version: CONFIG.version,
  };
}

// 메인 함수
async function main() {
  try {
    console.log('🔐 통합 환경변수 암호화 시작...\n');

    const options = parseArgs();
    const masterPassword = getMasterPassword(options);
    const passwordHash = createHash('sha256').update(masterPassword).digest('hex');

    console.log('✅ 마스터 비밀번호 확인됨');

    // 환경변수 로드
    const envVars = loadEnvironmentVariables();
    const varCount = Object.keys(envVars).length;

    if (varCount === 0) {
      console.error('❌ 암호화할 환경변수가 없습니다.');
      console.log('   .env 또는 .env.local 파일을 확인하세요.');
      process.exit(1);
    }

    console.log(`📊 ${varCount}개 환경변수 발견\n`);

    // 암호화 진행
    const encryptedVars = {};
    
    for (const [key, value] of Object.entries(envVars)) {
      try {
        const encrypted = encryptValue(value, masterPassword);
        encryptedVars[key] = {
          ...encrypted,
          originalName: key,
          isPublic: key.startsWith('NEXT_PUBLIC_'),
          category: getCategoryForVar(key),
        };
        
        console.log(`✅ ${key}: 암호화 완료`);
      } catch (error) {
        console.error(`❌ ${key}: 암호화 실패 - ${error.message}`);
      }
    }

    // TypeScript 설정 파일 생성
    const configContent = generateConfigFile(passwordHash, encryptedVars);
    const configPath = path.join(process.cwd(), 'config', 'encrypted-env-config.ts');
    
    // 백업 생성
    if (fs.existsSync(configPath)) {
      const backupPath = configPath.replace('.ts', `.backup.${Date.now()}.ts`);
      fs.copyFileSync(configPath, backupPath);
      console.log(`\n📁 기존 파일 백업: ${path.basename(backupPath)}`);
    }

    fs.writeFileSync(configPath, configContent, 'utf8');

    console.log(`\n🎉 암호화 완료!`);
    console.log(`📁 저장 위치: ${configPath}`);
    console.log(`🔐 암호화된 변수: ${Object.keys(encryptedVars).length}개`);

    // Vercel 배포 가이드
    console.log('\n📘 Vercel 배포 가이드:');
    console.log('1. Vercel 대시보드에서 다음 환경변수 설정:');
    console.log('   ENV_MASTER_PASSWORD = <your-master-password>');
    console.log('2. 암호화된 설정 파일은 Git에 커밋 가능');
    console.log('3. 배포 시 자동으로 복호화되어 사용됨');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 변수 카테고리 분류
function getCategoryForVar(varName) {
  if (varName.includes('SUPABASE')) return 'database';
  if (varName.includes('REDIS')) return 'cache';
  if (varName.includes('GOOGLE_AI')) return 'ai';
  if (varName.includes('OAUTH')) return 'auth';
  if (varName.includes('NEXTAUTH')) return 'auth';
  if (varName.includes('MCP')) return 'services';
  if (varName.includes('GITHUB')) return 'vcs';
  return 'general';
}

// 설정 파일 생성
function generateConfigFile(passwordHash, encryptedVars) {
  return `/**
 * 🔐 암호화된 환경변수 설정
 * 생성일: ${new Date().toISOString()}
 * 버전: ${CONFIG.version}
 * 
 * 이 파일은 Git에 안전하게 커밋할 수 있습니다.
 * 런타임에 자동으로 복호화되어 사용됩니다.
 */

export interface EncryptedEnvVar {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
  timestamp: string;
  version: string;
  originalName: string;
  isPublic: boolean;
  category: string;
}

export interface EncryptedEnvironmentConfig {
  version: string;
  createdAt: string;
  teamPasswordHash: string;
  variables: { [key: string]: EncryptedEnvVar };
}

export const ENCRYPTED_ENV_CONFIG: EncryptedEnvironmentConfig = ${JSON.stringify({
    version: CONFIG.version,
    createdAt: new Date().toISOString(),
    teamPasswordHash: passwordHash,
    variables: encryptedVars
  }, null, 2)};

// 배포 설정
export const DEPLOYMENT_CONFIG = {
  autoDecrypt: true,
  fallbackToPlaintext: process.env.NODE_ENV === 'development',
  cacheDecrypted: true,
  services: {
    supabase: { enabled: true },
    redis: { enabled: true },
    googleAI: { enabled: true },
    mcp: { enabled: true }
  }
};`;
}

// 실행
main();