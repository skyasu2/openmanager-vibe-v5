#!/usr/bin/env node

/**
 * 🔐 Supabase 환경변수 간단 암호화
 * CryptoJS를 사용한 기본 암호화 시스템
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

console.log('🔐 Supabase 환경변수 암호화 시작...\n');

// 암호화 키 (openmanager2025 기반)
const ENCRYPTION_KEY = 'openmanager2025';

// 암호화할 환경변수들 (중복 제거됨)
const supabaseEnvVars = {
  // 🚨 매우 민감한 변수들
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

function encrypt(text) {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    throw new Error(`암호화 실패: ${error.message}`);
  }
}

function decrypt(encryptedText) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('복호화 결과가 비어있음');
    }
    return decrypted;
  } catch (error) {
    throw new Error(`복호화 실패: ${error.message}`);
  }
}

try {
  console.log('🔒 환경변수 암호화 중...');
  
  const encryptedVars = {};
  for (const [key, value] of Object.entries(supabaseEnvVars)) {
    encryptedVars[key] = encrypt(value);
    console.log(`✅ ${key}: 암호화 완료`);
  }
  
  console.log(`\n📊 처리된 변수: ${Object.keys(supabaseEnvVars).length}개`);
  
  // config 디렉토리 생성
  const configDir = path.join(__dirname, '../config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // 암호화된 설정 저장
  const encryptedConfig = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    environment: 'production',
    encryptionKey: 'openmanager2025',
    variables: encryptedVars
  };
  
  const configPath = path.join(configDir, 'supabase-encrypted.json');
  fs.writeFileSync(configPath, JSON.stringify(encryptedConfig, null, 2));
  console.log(`💾 암호화된 설정 저장: ${configPath}`);
  
  // .env.production 파일 생성
  console.log('\n📝 .env.production 파일 생성 중...');
  
  let envContent = `# 🔐 Supabase 환경변수 (OpenManager Vibe v5)\n`;
  envContent += `# 생성일: ${new Date().toISOString()}\n`;
  envContent += `# 중복 제거 완료, 총 ${Object.keys(supabaseEnvVars).length}개 변수\n`;
  envContent += `# 복호화 키: openmanager2025\n\n`;
  
  // 🚨 매우 민감한 변수들 (암호화)
  envContent += `# 🚨 매우 민감한 시크릿들 (암호화됨)\n`;
  for (const key of HIGHLY_SENSITIVE) {
    envContent += `${key}_ENCRYPTED="${encryptedVars[key]}"\n`;
  }
  
  // 🔗 연결 URL들 (암호화)
  envContent += `\n# 🔗 데이터베이스 연결 URL들 (암호화됨)\n`;
  for (const key of MODERATELY_SENSITIVE) {
    envContent += `${key}_ENCRYPTED="${encryptedVars[key]}"\n`;
  }
  
  // 📋 공개 안전한 변수들 (평문)
  envContent += `\n# 📋 공개 안전한 설정들 (평문)\n`;
  for (const key of PUBLIC_SAFE) {
    envContent += `${key}="${supabaseEnvVars[key]}"\n`;
  }
  
  envContent += `\n# 🔐 암호화 설정\n`;
  envContent += `ENCRYPTION_KEY="openmanager2025"\n`;
  envContent += `SUPABASE_CONFIG_VERSION="1.0"\n`;
  
  const envPath = path.join(__dirname, '../.env.production');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ 환경변수 파일 생성: ${envPath}`);
  
  // 복호화 테스트
  console.log('\n🧪 복호화 테스트 중...');
  let testsPassed = 0;
  let totalTests = Object.keys(supabaseEnvVars).length;
  
  for (const [key, originalValue] of Object.entries(supabaseEnvVars)) {
    try {
      const decrypted = decrypt(encryptedVars[key]);
      if (decrypted === originalValue) {
        testsPassed++;
        console.log(`✅ ${key}: 복호화 성공`);
      } else {
        console.log(`❌ ${key}: 복호화 실패 (값 불일치)`);
      }
    } catch (error) {
      console.log(`❌ ${key}: 복호화 실패 (${error.message})`);
    }
  }
  
  console.log(`\n📊 테스트 결과: ${testsPassed}/${totalTests} 성공`);
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 모든 환경변수가 성공적으로 암호화되고 검증되었습니다!');
    
    console.log('\n📋 다음 단계:');
    console.log('1. Vercel 환경변수 설정:');
    console.log('   - .env.production 내용을 Vercel Dashboard에 추가');
    console.log('   - 특히 암호화된 변수들(_ENCRYPTED 접미사)');
    
    console.log('\n2. Supabase 데이터베이스 스키마 적용:');
    console.log('   - docs/supabase-schema.sql을 Supabase SQL Editor에서 실행');
    
    console.log('\n3. GitHub OAuth 테스트:');
    console.log('   - https://openmanager-vibe-v5.vercel.app/login에서 "GitHub로 로그인" 버튼 클릭');
    
    console.log('\n💡 Vercel 환경변수 설정 명령어:');
    console.log('   vercel env add SUPABASE_JWT_SECRET_ENCRYPTED');
    console.log('   vercel env add POSTGRES_PASSWORD_ENCRYPTED');
    console.log('   vercel env add POSTGRES_URL_ENCRYPTED');
    console.log('   vercel env add POSTGRES_PRISMA_URL_ENCRYPTED');
    
  } else {
    console.log('\n⚠️ 일부 환경변수 처리에 문제가 있습니다.');
  }
  
} catch (error) {
  console.error('❌ 암호화 처리 실패:', error);
  process.exit(1);
}