#!/usr/bin/env node

/**
 * 🔐 Slack 웹훅 암호화 CLI 도구
 * 사용법: node scripts/encrypt-slack-webhook.js <webhook-url>
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto');

// 암호화 설정
const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY =
  process.env.ENCRYPTION_SECRET_KEY ||
  'openmanager-vibe-v5-default-secret-key-change-me';

/**
 * 🔐 텍스트 암호화
 */
function encryptText(text) {
  try {
    // 키를 32바이트로 해시화
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);

    // 암호화 수행 (CTR 모드)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // IV + 암호화된 데이터 결합
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('🔒 암호화 실패:', error);
    throw new Error('암호화에 실패했습니다.');
  }
}

/**
 * 🔓 텍스트 복호화
 */
function decryptText(encryptedText) {
  try {
    // 데이터 분리
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('잘못된 암호화 형식입니다.');
    }

    const [ivHex, encrypted] = parts;

    // 키를 32바이트로 해시화
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

    // 버퍼 변환
    const iv = Buffer.from(ivHex, 'hex');

    // 복호화 수행
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('🔓 복호화 실패:', error);
    throw new Error('복호화에 실패했습니다.');
  }
}

/**
 * 📋 사용법 표시
 */
function showUsage() {
  console.log(`
🔐 Slack 웹훅 암호화 도구

사용법:
  encrypt  <webhook-url>     - 웹훅 URL 암호화
  decrypt  <encrypted-text>  - 암호화된 텍스트 복호화
  test                       - 암호화/복호화 테스트

예시:
  node scripts/encrypt-slack-webhook.js encrypt "https://hooks.slack.com/services/..."
  node scripts/encrypt-slack-webhook.js decrypt "abc123:def456:ghi789"
  node scripts/encrypt-slack-webhook.js test

환경변수:
  ENCRYPTION_SECRET_KEY - 암호화 비밀 키 (기본값 사용 권장하지 않음)
`);
}

/**
 * 🧪 암호화/복호화 테스트
 */
function runTest() {
  console.log('🧪 암호화/복호화 테스트 시작...\n');

  const testData =
    'https://hooks.slack.com/services/EXAMPLE/EXAMPLE/EXAMPLE';

  try {
    console.log('📝 원본 데이터:');
    console.log(testData.substring(0, 60) + '...');
    console.log('');

    // 암호화
    const encrypted = encryptText(testData);
    console.log('🔐 암호화 결과:');
    console.log(encrypted);
    console.log('');

    // 복호화
    const decrypted = decryptText(encrypted);
    console.log('🔓 복호화 결과:');
    console.log(decrypted.substring(0, 60) + '...');
    console.log('');

    // 검증
    const isValid = testData === decrypted;
    console.log(`✅ 테스트 결과: ${isValid ? '성공' : '실패'}`);

    if (isValid) {
      console.log('\n🎉 암호화/복호화가 정상적으로 작동합니다!');
      console.log('\n📋 환경변수 설정 예시:');
      console.log(`SLACK_WEBHOOK_ENCRYPTED="${encrypted}"`);
    } else {
      console.log('\n❌ 암호화/복호화 테스트 실패');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

/**
 * 🚀 메인 실행
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'encrypt':
      if (args.length < 2) {
        console.error('❌ 암호화할 웹훅 URL이 필요합니다.');
        showUsage();
        process.exit(1);
      }

      try {
        const webhookUrl = args[1];
        const encrypted = encryptText(webhookUrl);

        console.log('🔐 암호화 완료!\n');
        console.log('📋 환경변수에 추가할 내용:');
        console.log(`SLACK_WEBHOOK_ENCRYPTED="${encrypted}"`);
        console.log('\n⚠️  주의: 이 암호화된 값을 .env.local 파일에 저장하고');
        console.log('    원본 웹훅 URL은 삭제하세요!');
      } catch (error) {
        console.error('❌ 암호화 실패:', error.message);
        process.exit(1);
      }
      break;

    case 'decrypt':
      if (args.length < 2) {
        console.error('❌ 복호화할 암호화 텍스트가 필요합니다.');
        showUsage();
        process.exit(1);
      }

      try {
        const encryptedText = args[1];
        const decrypted = decryptText(encryptedText);

        console.log('🔓 복호화 완료!\n');
        console.log('📋 원본 웹훅 URL:');
        console.log(decrypted);
      } catch (error) {
        console.error('❌ 복호화 실패:', error.message);
        process.exit(1);
      }
      break;

    case 'test':
      runTest();
      break;

    default:
      console.error(`❌ 알 수 없는 명령: ${command}`);
      showUsage();
      process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 실행
if (require.main === module) {
  main();
}

module.exports = {
  encryptText,
  decryptText,
  showUsage,
  runTest,
};
