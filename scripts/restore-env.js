const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// 환경 변수 복호화 함수
function decryptEnv(encrypted, iv, password) {
  try {
    const key = crypto.scryptSync(password, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ 복호화 실패: 잘못된 비밀번호이거나 파일이 손상되었습니다.');
    process.exit(1);
  }
}

// .env 파일 복구
async function restoreEnv() {
  const encryptedPath = path.join(__dirname, '..', '.env.encrypted');
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(encryptedPath)) {
    console.error('❌ .env.encrypted 파일을 찾을 수 없습니다.');
    process.exit(1);
  }

  // 암호화된 파일에서 내용 읽기
  const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
  const ivMatch = encryptedContent.match(/IV=([a-f0-9]+)/i);
  const contentMatch = encryptedContent.match(/ENCRYPTED_CONTENT=([a-f0-9]+)/i);
  
  if (!ivMatch || !contentMatch) {
    console.error('❌ 유효하지 않은 .env.encrypted 파일 형식입니다.');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🔑 복구 비밀번호를 입력하세요: ', (password) => {
    // 복호화 시도
    const decrypted = decryptEnv(contentMatch[1], ivMatch[1], password.trim());
    
    // .env.local 파일로 저장
    fs.writeFileSync(envPath, decrypted);
    console.log('✅ .env.local 파일이 성공적으로 복구되었습니다.');
    
    rl.close();
  });
}

restoreEnv();
