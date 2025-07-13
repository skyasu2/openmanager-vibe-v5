#!/usr/bin/env tsx

/**
 * 🤖 자동화된 환경변수 관리 시스템
 * 
 * CI/CD 환경에서 자동으로 암호화된 환경변수를 복호화하고 로드합니다.
 * GitHub Actions, Vercel, Docker 환경을 지원합니다.
 * 
 * 사용법:
 * - 환경 검사: npm run env:check
 * - 자동 설정: npm run env:auto-setup
 * - 백업 생성: npm run env:backup
 * - 키 로테이션: npm run env:rotate
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ENCRYPTED_ENV_CONFIG } from '../config/encrypted-env-config';
import { enhancedCryptoManager } from '../src/lib/crypto/EnhancedEnvCryptoManager';
import { adaptEncryptedEnvironmentConfigToEnvConfig } from '../src/utils/encryption-adapter';

// 환경 타입 정의
type Environment = 'local' | 'ci' | 'vercel' | 'docker' | 'production';

// 환경 감지
function detectEnvironment(): Environment {
  if (process.env.CI) return 'ci';
  if (process.env.VERCEL) return 'vercel';
  if (process.env.DOCKER) return 'docker';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'local';
}

// 마스터 비밀번호 가져오기
function getMasterPassword(): string | null {
  // 1. 환경변수에서 확인
  if (process.env.ENV_MASTER_PASSWORD) {
    return process.env.ENV_MASTER_PASSWORD;
  }
  
  // 2. CI/CD 시크릿에서 확인
  if (process.env.DECRYPT_PASSWORD) {
    return process.env.DECRYPT_PASSWORD;
  }
  
  // 3. 파일에서 확인 (로컬 개발)
  const keyPath = path.join(process.cwd(), '.env.key');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf-8').trim();
  }
  
  // 4. Docker 시크릿에서 확인
  const dockerSecretPath = '/run/secrets/env_master_password';
  if (fs.existsSync(dockerSecretPath)) {
    return fs.readFileSync(dockerSecretPath, 'utf-8').trim();
  }
  
  return null;
}

// 환경변수 자동 로드
async function autoLoadEnvironment() {
  const env = detectEnvironment();
  console.log(`🔍 감지된 환경: ${env}`);
  
  const masterPassword = getMasterPassword();
  if (!masterPassword) {
    console.error('❌ 마스터 비밀번호를 찾을 수 없습니다');
    
    // 환경별 가이드 제공
    switch (env) {
      case 'ci':
        console.log('💡 GitHub Actions: secrets.ENV_MASTER_PASSWORD 설정 필요');
        break;
      case 'vercel':
        console.log('💡 Vercel: 환경변수에 ENV_MASTER_PASSWORD 추가 필요');
        break;
      case 'docker':
        console.log('💡 Docker: --secret 옵션으로 env_master_password 전달 필요');
        break;
      default:
        console.log('💡 로컬: echo "password" > .env.key 실행 필요');
    }
    
    process.exit(1);
  }
  
  try {
    // 마스터 키 초기화
    enhancedCryptoManager.initializeMasterKey(masterPassword);
    
    // 환경변수 복호화 및 로드
    const adaptedConfig = adaptEncryptedEnvironmentConfigToEnvConfig(ENCRYPTED_ENV_CONFIG);
    enhancedCryptoManager.loadToProcess(adaptedConfig);
    
    console.log('✅ 환경변수 자동 로드 완료');
    
    // 환경별 추가 설정
    switch (env) {
      case 'vercel':
        setupVercelEnvironment();
        break;
      case 'docker':
        setupDockerEnvironment();
        break;
    }
    
  } catch (error) {
    console.error('❌ 환경변수 로드 실패:', error);
    process.exit(1);
  }
}

// Vercel 환경 설정
function setupVercelEnvironment() {
  // Vercel 빌드 최적화
  if (process.env.VERCEL_ENV === 'production') {
    // NODE_ENV는 읽기 전용이므로 환경별 설정은 다른 방식으로 처리
    console.log('🚀 Vercel 프로덕션 환경 설정 완료');
    console.log(`💡 현재 NODE_ENV: ${process.env.NODE_ENV}`);
  }
}

// Docker 환경 설정
function setupDockerEnvironment() {
  // Docker 네트워크 설정
  if (process.env.DOCKER_NETWORK) {
    process.env.DATABASE_URL = process.env.DATABASE_URL?.replace('localhost', 'db');
    console.log('🐳 Docker 네트워크 설정 완료');
  }
}

// 환경변수 백업 생성
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(process.cwd(), 'backups', `env-backup-${timestamp}.json`);
  
  // 백업 디렉토리 생성
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // 암호화된 설정 백업
  fs.copyFileSync(
    path.join(process.cwd(), 'config', 'encrypted-env-config.ts'),
    backupPath
  );
  
  console.log(`📁 백업 생성: ${backupPath}`);
}

// API 키 로테이션
async function rotateKeys() {
  console.log('🔄 API 키 로테이션 시작...\n');
  
  const keysToRotate = [
    'GOOGLE_AI_API_KEY',
    'GITHUB_TOKEN',
    'NEXTAUTH_SECRET'
  ];
  
  for (const key of keysToRotate) {
    console.log(`📋 ${key}:`);
    console.log('   1. 새 키를 해당 서비스에서 생성하세요');
    console.log('   2. npm run secure:add로 새 키를 추가하세요');
    console.log('   3. 테스트 후 이전 키를 서비스에서 삭제하세요\n');
  }
  
  console.log('💡 키 로테이션 후 다음 명령을 실행하세요:');
  console.log('   npm run encrypt:env');
}

// GitHub Actions 워크플로우 생성
function generateGitHubWorkflow() {
  const workflow = `name: Deploy with Encrypted Env

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '22'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Load encrypted environment
      env:
        ENV_MASTER_PASSWORD: \${{ secrets.ENV_MASTER_PASSWORD }}
      run: npm run env:auto-setup
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: vercel/action@v20
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
`;

  const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'deploy-encrypted.yml');
  console.log('📄 GitHub Actions 워크플로우:');
  console.log(workflow);
  console.log(`\n💾 저장 위치: ${workflowPath}`);
}

// Docker Compose 설정 생성
function generateDockerCompose() {
  const compose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    secrets:
      - env_master_password
    environment:
      - NODE_ENV=production
      
secrets:
  env_master_password:
    file: ./secrets/env_master_password.txt
`;

  console.log('🐳 Docker Compose 설정:');
  console.log(compose);
}

// 메인 함수
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      const env = detectEnvironment();
      const password = getMasterPassword();
      console.log(`\n🔍 환경 검사 결과:`);
      console.log(`   환경: ${env}`);
      console.log(`   마스터 비밀번호: ${password ? '✅ 설정됨' : '❌ 없음'}`);
      console.log(`   암호화 설정: ${fs.existsSync('config/encrypted-env-config.ts') ? '✅ 있음' : '❌ 없음'}`);
      break;
      
    case 'auto-setup':
      await autoLoadEnvironment();
      break;
      
    case 'backup':
      await createBackup();
      break;
      
    case 'rotate':
      await rotateKeys();
      break;
      
    case 'github-workflow':
      generateGitHubWorkflow();
      break;
      
    case 'docker-compose':
      generateDockerCompose();
      break;
      
    default:
      console.log('🤖 자동화된 환경변수 관리 시스템\n');
      console.log('사용 가능한 명령어:');
      console.log('  check          - 현재 환경 검사');
      console.log('  auto-setup     - 자동 환경변수 로드');
      console.log('  backup         - 암호화 설정 백업');
      console.log('  rotate         - API 키 로테이션 가이드');
      console.log('  github-workflow - GitHub Actions 워크플로우 생성');
      console.log('  docker-compose - Docker Compose 설정 생성');
  }
}

// 프로그램 실행
main().catch(console.error);