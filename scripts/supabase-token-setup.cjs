#!/usr/bin/env node

/**
 * 🔐 Supabase MCP 액세스 토큰 설정
 * 사용자 액세스 토큰을 암호화하여 저장
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

console.log('🔐 Supabase MCP 액세스 토큰 설정...\n');

// 암호화 키
const ENCRYPTION_KEY = 'openmanager2025';

function encrypt(text) {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    throw new Error(`암호화 실패: ${error.message}`);
  }
}

function addSupabaseAccessToken(token) {
  // 기존 암호화 파일 읽기
  const encryptedFilePath = path.join(
    __dirname,
    '..',
    'config',
    'supabase-encrypted.json'
  );

  if (!fs.existsSync(encryptedFilePath)) {
    console.error('❌ 기존 암호화 파일을 찾을 수 없습니다:', encryptedFilePath);
    return;
  }

  const existingData = JSON.parse(fs.readFileSync(encryptedFilePath, 'utf8'));

  // 액세스 토큰 암호화 및 추가
  const encryptedToken = encrypt(token);
  existingData.variables.SUPABASE_ACCESS_TOKEN = encryptedToken;

  // 파일 업데이트
  fs.writeFileSync(encryptedFilePath, JSON.stringify(existingData, null, 2));

  console.log('✅ Supabase 액세스 토큰이 암호화되어 저장되었습니다');

  // .env.production 파일도 업데이트
  const envPath = path.join(__dirname, '..', '.env.production');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // 새 토큰 라인 추가
  const tokenLine = `SUPABASE_ACCESS_TOKEN_ENCRYPTED="${encryptedToken}"`;
  envContent += `\n${tokenLine}\n`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.production 파일도 업데이트되었습니다');
}

// 사용법 안내
console.log(`
📋 Supabase 액세스 토큰 생성 방법:

1. https://supabase.com/dashboard 접속
2. your_project_id 프로젝트 선택  
3. Settings → API → Project API keys
4. "service_role" 키 복사 (⚠️ 매우 민감함)

📝 토큰 설정 명령어:
node scripts/supabase-token-setup.cjs "sbp_your_service_role_key_here"

또는 환경변수로 설정:
export SUPABASE_ACCESS_TOKEN="sbp_your_service_role_key_here"
`);

// 명령줄 인수 처리
const token = process.argv[2];
if (token) {
  if (token.startsWith('sbp_') || token.startsWith('eyJ')) {
    addSupabaseAccessToken(token);
  } else {
    console.error(
      '❌ 유효하지 않은 토큰 형식입니다. "sbp_" 또는 JWT 형식이어야 합니다.'
    );
  }
} else {
  console.log('💡 토큰을 인수로 제공하지 않았습니다. 위의 안내를 참고하세요.');
}
