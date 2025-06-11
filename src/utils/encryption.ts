import crypto from 'crypto';

// 암호화 설정
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY =
  process.env.ENCRYPTION_SECRET_KEY ||
  'openmanager-vibe-v5-default-secret-key-change-me';

/**
 * 🔐 텍스트 암호화
 */
export function encryptText(text: string): string {
  try {
    // 키를 32바이트로 해시화
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);

    // 암호화 수행
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('openmanager-auth', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 인증 태그 가져오기
    const authTag = cipher.getAuthTag();

    // IV + 인증태그 + 암호화된 데이터 결합
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('🔒 암호화 실패:', error);
    throw new Error('암호화에 실패했습니다.');
  }
}

/**
 * 🔓 텍스트 복호화
 */
export function decryptText(encryptedText: string): string {
  try {
    // 데이터 분리
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('잘못된 암호화 형식입니다.');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // 키를 32바이트로 해시화
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

    // 버퍼 변환
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // 복호화 수행
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('openmanager-auth', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('🔓 복호화 실패:', error);
    throw new Error('복호화에 실패했습니다.');
  }
}

/**
 * 🧪 암호화/복호화 테스트
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-data-for-encryption-validation';
    const encrypted = encryptText(testData);
    const decrypted = decryptText(encrypted);

    console.log('🔐 암호화 테스트:');
    console.log('원본:', testData.substring(0, 50) + '...');
    console.log('암호화:', encrypted.substring(0, 50) + '...');
    console.log('복호화:', decrypted.substring(0, 50) + '...');
    console.log('결과:', testData === decrypted ? '✅ 성공' : '❌ 실패');

    return testData === decrypted;
  } catch (error) {
    console.error('🧪 암호화 테스트 실패:', error);
    return false;
  }
}

/**
 * 🔑 Slack 웹훅 URL 안전하게 가져오기
 */
export function getSecureSlackWebhook(): string | null {
  try {
    // 환경변수에서 암호화된 웹훅 가져오기
    const encryptedWebhook = process.env.SLACK_WEBHOOK_ENCRYPTED;

    if (!encryptedWebhook) {
      // 개발 환경에서는 일반 환경변수도 허용
      const plainWebhook = process.env.SLACK_WEBHOOK_URL;
      if (plainWebhook && process.env.NODE_ENV === 'development') {
        console.warn(
          '⚠️ 개발 환경에서 암호화되지 않은 Slack 웹훅을 사용 중입니다.'
        );
        return plainWebhook;
      }
      return null;
    }

    // 복호화하여 반환
    return decryptText(encryptedWebhook);
  } catch (error) {
    console.error('🔑 Slack 웹훅 복호화 실패:', error);
    return null;
  }
}

/**
 * 🔐 웹훅 URL 암호화 헬퍼 (CLI 도구용)
 */
export function encryptSlackWebhook(webhookUrl: string): string {
  return encryptText(webhookUrl);
}
