const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 환경 변수 암호화 함수
function encryptEnv(envContent, password) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, 'salt', 32); // 키 생성
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(envContent, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    content: encrypted
  };
}

// .env.example을 기반으로 .env.encrypted 생성
function setupEnv() {
  const envPath = path.join(__dirname, '..', '.env.example');
  const encryptedPath = path.join(__dirname, '..', '.env.encrypted');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.example 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const password = crypto.randomBytes(16).toString('hex'); // 랜덤 비밀번호 생성
  
  const encrypted = encryptEnv(envContent, password);
  
  // 암호화된 환경 변수와 비밀번호를 저장
  fs.writeFileSync(
    encryptedPath,
    `# 암호화된 환경 변수 파일\n` +
    `# 복구를 위한 비밀번호: ${password}\n` +
    `IV=${encrypted.iv}\n` +
    `ENCRYPTED_CONTENT=${encrypted.content}\n`
  );
  
  console.log('✅ .env.encrypted 파일이 생성되었습니다.');
  console.log(`🔑 복구 비밀번호: ${password}`);
  console.log('⚠️ 이 비밀번호를 안전한 곳에 보관하세요!');
}

setupEnv();
