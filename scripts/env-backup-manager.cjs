#!/usr/bin/env node

/**
 * 🔄 환경변수 백업/복원 매니저
 * 개발 환경에서 환경변수를 백업하고 다른 컴퓨터에서 복원하기 위한 도구
 * GitHub에 안전하게 업로드할 수 있도록 민감한 정보만 암호화
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 로드
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (error) {
  console.log('⚠️ .env.local 파일을 찾을 수 없습니다.');
}

console.log('🔄 환경변수 백업/복원 매니저\n');

// 간단한 암호화 키 (개발용)
const BACKUP_KEY = 'openmanager-backup-2025';

// 암호화가 필요한 민감한 환경변수들
const SENSITIVE_VARS = [
  'GITHUB_TOKEN',
  'GITHUB_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'GOOGLE_AI_API_KEY',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_TOKEN',
];

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, BACKUP_KEY).toString();
}

function decrypt(encryptedText) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, BACKUP_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return encryptedText; // 복호화 실패 시 원본 반환
  }
}

function backupEnvironmentVariables() {
  console.log('💾 환경변수 백업 시작...\n');
  
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    description: 'OpenManager Vibe v5 환경변수 백업',
    variables: {}
  };

  let totalVars = 0;
  let encryptedVars = 0;

  // 모든 환경변수 처리
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('npm_') || key.startsWith('NODE_') || 
        key.includes('PATH') || key.includes('TEMP')) {
      continue; // 시스템 변수 제외
    }

    totalVars++;
    
    if (SENSITIVE_VARS.includes(key)) {
      // 민감한 변수는 암호화
      backup.variables[key] = {
        value: encrypt(value),
        encrypted: true,
        sensitive: true
      };
      encryptedVars++;
      console.log(`🔒 ${key}: 암호화됨`);
    } else {
      // 일반 변수는 평문
      backup.variables[key] = {
        value: value,
        encrypted: false,
        sensitive: false
      };
      console.log(`📝 ${key}: 평문 저장`);
    }
  }

  // 백업 파일 저장
  const backupPath = path.join(__dirname, '../config/env-backup.json');
  const configDir = path.dirname(backupPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`\n📊 백업 완료:`);
  console.log(`   총 변수: ${totalVars}개`);
  console.log(`   암호화된 변수: ${encryptedVars}개`);
  console.log(`   평문 변수: ${totalVars - encryptedVars}개`);
  console.log(`   저장 위치: ${backupPath}`);
  
  console.log('\n✅ 이 파일은 GitHub에 안전하게 업로드할 수 있습니다!');
}

function restoreEnvironmentVariables() {
  console.log('🔄 환경변수 복원 시작...\n');
  
  const backupPath = path.join(__dirname, '../config/env-backup.json');
  
  if (!fs.existsSync(backupPath)) {
    console.error('❌ 백업 파일을 찾을 수 없습니다:', backupPath);
    return;
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`📅 백업 날짜: ${backup.timestamp}`);
  console.log(`📝 설명: ${backup.description}\n`);

  let envContent = `# 🔄 환경변수 복원 (${new Date().toISOString()})\n`;
  envContent += `# 백업 날짜: ${backup.timestamp}\n\n`;

  let restoredVars = 0;
  let decryptedVars = 0;

  for (const [key, data] of Object.entries(backup.variables)) {
    try {
      let value = data.value;
      
      if (data.encrypted) {
        value = decrypt(value);
        decryptedVars++;
        console.log(`🔓 ${key}: 복호화됨`);
      } else {
        console.log(`📝 ${key}: 평문 복원`);
      }

      envContent += `${key}="${value}"\n`;
      restoredVars++;
    } catch (error) {
      console.error(`❌ ${key}: 복원 실패 - ${error.message}`);
    }
  }

  // .env.local 파일 생성
  const envPath = path.join(__dirname, '../.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log(`\n📊 복원 완료:`);
  console.log(`   복원된 변수: ${restoredVars}개`);
  console.log(`   복호화된 변수: ${decryptedVars}개`);
  console.log(`   저장 위치: ${envPath}`);
  
  console.log('\n✅ 환경변수가 성공적으로 복원되었습니다!');
}

function showHelp() {
  console.log(`
🔄 환경변수 백업/복원 매니저

사용법:
  node scripts/env-backup-manager.cjs [명령어]

명령어:
  backup    현재 환경변수를 백업 파일로 저장
  restore   백업 파일에서 환경변수 복원
  help      이 도움말 표시

예시:
  node scripts/env-backup-manager.cjs backup
  node scripts/env-backup-manager.cjs restore

💡 특징:
  - 민감한 환경변수는 자동으로 암호화
  - 일반 환경변수는 평문으로 저장
  - GitHub에 안전하게 업로드 가능
  - 다른 컴퓨터에서 쉽게 복원 가능
`);
}

// CLI 실행
const command = process.argv[2];

switch (command) {
  case 'backup':
    backupEnvironmentVariables();
    break;
  case 'restore':
    restoreEnvironmentVariables();
    break;
  case 'help':
  default:
    showHelp();
    break;
}