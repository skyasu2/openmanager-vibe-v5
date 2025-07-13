#!/usr/bin/env node

/**
 * 🔐 Supabase 환경변수 암호화 스크립트
 * 제공된 민감한 환경변수들을 안전하게 암호화합니다
 */

import { enhancedCryptoManager } from '../src/lib/crypto/EnhancedEnvCryptoManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Supabase 환경변수 암호화 시작...\n');

// 마스터 키 초기화
const MASTER_PASSWORD = 'openmanager2025';
enhancedCryptoManager.initializeMasterKey(MASTER_PASSWORD);

// 암호화할 환경변수들 (중복 제거됨)
const supabaseEnvVars = {
  // 🚨 매우 민감한 변수들 (서버 사이드만)
  SUPABASE_JWT_SECRET: "qNzA4/WgbksJU3xxkQJcfbCRkXhgBR7TVmI4y2XKRy59BwtRk6iuUSdkRNNQN1Yud3PGsGLTcZkdHSTZL0mhug==",
  POSTGRES_PASSWORD: "2D3DWhSl8HBlgYIm",
  
  // 🔗 연결 URL들
  POSTGRES_URL: "postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
  POSTGRES_PRISMA_URL: "postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
  
  // 📋 기본 설정들
  POSTGRES_USER: "postgres",
  POSTGRES_HOST: "db.vnswjnltnhpsueosfhmw.supabase.co", 
  POSTGRES_DATABASE: "postgres",
  SUPABASE_URL: "https://vnswjnltnhpsueosfhmw.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU"
};

// 민감도별 분류
const HIGHLY_SENSITIVE = ['SUPABASE_JWT_SECRET', 'POSTGRES_PASSWORD'];
const MODERATELY_SENSITIVE = ['POSTGRES_URL', 'POSTGRES_PRISMA_URL'];
const PUBLIC_SAFE = ['POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_DATABASE', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

try {
  console.log('🔒 환경변수 암호화 중...');
  
  // 전체 환경변수 암호화
  const encryptedConfig = enhancedCryptoManager.encryptEnvironment(supabaseEnvVars);
  
  console.log('✅ 암호화 완료!');
  console.log(`📊 처리된 변수: ${Object.keys(supabaseEnvVars).length}개`);
  
  // 암호화된 설정 저장
  const configPath = path.join(__dirname, '../config/supabase-encrypted.json');
  
  // config 디렉토리가 없으면 생성
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(encryptedConfig, null, 2));
  console.log(`💾 암호화된 설정 저장: ${configPath}`);
  
  // .env.local에 안전한 형태로 추가 (암호화된 형태)
  console.log('\n📝 .env.local 파일 생성 중...');
  
  let envContent = `# 🔐 Supabase 환경변수 (암호화됨)\n`;
  envContent += `# 생성일: ${new Date().toISOString()}\n`;
  envContent += `# 중복 제거 완료, 총 ${Object.keys(supabaseEnvVars).length}개 변수\n\n`;
  
  // 🚨 매우 민감한 변수들 (암호화된 형태로 저장)
  envContent += `# 🚨 매우 민감한 시크릿들 (암호화됨)\n`;
  for (const key of HIGHLY_SENSITIVE) {
    const encrypted = encryptedConfig.variables[key];
    envContent += `${key}_ENCRYPTED=${encrypted.encrypted}\n`;
  }
  
  envContent += `\n# 🔗 연결 URL들 (암호화됨)\n`;
  for (const key of MODERATELY_SENSITIVE) {
    const encrypted = encryptedConfig.variables[key];
    envContent += `${key}_ENCRYPTED=${encrypted.encrypted}\n`;
  }
  
  envContent += `\n# 📋 공개 가능한 설정들 (평문)\n`;
  for (const key of PUBLIC_SAFE) {
    envContent += `${key}=${supabaseEnvVars[key]}\n`;
  }
  
  envContent += `\n# 🔐 복호화 키 정보\n`;
  envContent += `ENCRYPTION_MASTER_KEY_HINT="openmanager2025"\n`;
  envContent += `SUPABASE_ENCRYPTION_VERSION="${encryptedConfig.version}"\n`;
  
  const envPath = path.join(__dirname, '../.env.supabase.production');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ 환경변수 파일 생성: ${envPath}`);
  
  // 복호화 테스트
  console.log('\n🧪 복호화 테스트 중...');
  const decrypted = enhancedCryptoManager.decryptEnvironment(encryptedConfig);
  
  let testsPassed = 0;
  let totalTests = Object.keys(supabaseEnvVars).length;
  
  for (const [key, originalValue] of Object.entries(supabaseEnvVars)) {
    if (decrypted[key] === originalValue) {
      testsPassed++;
      console.log(`✅ ${key}: 복호화 성공`);
    } else {
      console.log(`❌ ${key}: 복호화 실패`);
    }
  }
  
  console.log(`\n📊 테스트 결과: ${testsPassed}/${totalTests} 성공`);
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 모든 환경변수가 성공적으로 암호화되고 검증되었습니다!');
    console.log('\n📋 다음 단계:');
    console.log('1. .env.supabase.production을 Vercel 환경변수로 설정');
    console.log('2. Supabase 데이터베이스 스키마 적용');
    console.log('3. GitHub OAuth 최종 테스트');
  } else {
    console.log('\n⚠️ 일부 환경변수 처리에 문제가 있습니다.');
  }
  
} catch (error) {
  console.error('❌ 암호화 처리 실패:', error);
  process.exit(1);
}