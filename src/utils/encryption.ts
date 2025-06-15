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

/**
 * 🔐 암호화 유틸리티 모듈
 *
 * 민감한 정보 (API 키, 웹훅 URL 등)를 안전하게 관리합니다.
 * 환경변수와 메모리에서 보안키를 가져옵니다.
 */

// 보안 자격 증명은 환경변수에서만 가져옵니다
const SECURE_CREDENTIALS = {
  // 모든 민감한 정보는 환경변수에서 가져옴
  // 하드코딩된 값은 보안상 제거됨
};

/**
 * 🤖 안전한 Google AI API 키 가져오기
 *
 * 환경변수에서만 가져옵니다 (보안 강화)
 */
export function getSecureGoogleAIKey(): string | null {
  return process.env.GOOGLE_AI_API_KEY || null;
}

/**
 * 📊 안전한 Supabase URL 가져오기
 */
export function getSecureSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

/**
 * 🔑 안전한 Supabase Anon 키 가져오기
 */
export function getSecureSupabaseAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
}

/**
 * 🔴 안전한 Redis URL 가져오기
 */
export function getSecureRedisUrl(): string | null {
  return process.env.REDIS_URL || null;
}

/**
 * 🔍 전체 보안 설정 상태 확인
 */
export function getSecurityStatus() {
  return {
    googleAI: {
      hasKey: !!getSecureGoogleAIKey(),
      source: process.env.GOOGLE_AI_API_KEY ? 'env' : 'builtin',
      keyPreview: getSecureGoogleAIKey()?.substring(0, 8) + '...' || 'none',
    },
    slack: {
      hasWebhook: !!getSecureSlackWebhook(),
      source: process.env.SLACK_WEBHOOK_URL ? 'env' : 'builtin',
      webhookPreview:
        getSecureSlackWebhook()?.substring(0, 30) + '...' || 'none',
    },
    supabase: {
      hasUrl: !!getSecureSupabaseUrl(),
      hasKey: !!getSecureSupabaseAnonKey(),
      source: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'env' : 'builtin',
    },
    redis: {
      hasUrl: !!getSecureRedisUrl(),
      source: process.env.REDIS_URL ? 'env' : 'builtin',
    },
  };
}

/**
 * 🛡️ 간단한 보안 키 검증 (개발용)
 *
 * @param inputKey 입력된 키
 * @param validKey 유효한 키
 * @returns boolean 검증 결과
 */
export function validateSecureKey(inputKey: string, validKey: string): boolean {
  // 개발 환경에서는 간단한 비교
  if (process.env.NODE_ENV === 'development') {
    return inputKey === validKey;
  }

  // 프로덕션에서는 더 복잡한 검증 로직 필요
  // 여기서는 간단한 예시만 제공
  return inputKey.length > 8 && inputKey === validKey;
}

/**
 * 🔐 Google AI 팀 비밀번호 검증 (GoogleAIUnlock용)
 *
 * 실제 프로덕션에서는 더 안전한 방법으로 관리해야 함
 */
export function validateGoogleAITeamPassword(password: string): boolean {
  // 개발용 간단한 비밀번호들
  const validPasswords = [
    'openmanager2025',
    'vibe-ai-unlock',
    'google-ai-team',
  ];

  return validPasswords.includes(password.toLowerCase());
}

/**
 * 🔐 암호화 유틸리티
 *
 * Google AI API 키와 같은 민감한 정보를 안전하게 저장하고 사용하기 위한 암호화 시스템
 */

// 암호화 설정
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// 환경변수에서 마스터 키 가져오기 (없으면 기본값 생성)
function getMasterKey(): Buffer {
  const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;

  if (masterKeyHex) {
    return Buffer.from(masterKeyHex, 'hex');
  }

  // 개발 환경용 기본 키 (프로덕션에서는 반드시 환경변수 설정 필요)
  console.warn(
    '⚠️ ENCRYPTION_MASTER_KEY 환경변수가 설정되지 않았습니다. 기본 키를 사용합니다.'
  );
  const defaultKey = 'openmanager-vibe-v5-default-encryption-key-2025';
  return crypto.scryptSync(defaultKey, 'salt', KEY_LENGTH);
}

/**
 * 문자열을 암호화합니다
 */
export function encryptString(plaintext: string): string {
  try {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipher('aes-256-gcm', masterKey);
    cipher.setAAD(Buffer.from('openmanager-vibe-v5', 'utf8'));

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // IV + Tag + 암호화된 데이터를 결합
    const result = iv.toString('hex') + tag.toString('hex') + encrypted;

    return result;
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('데이터 암호화 중 오류가 발생했습니다');
  }
}

/**
 * 암호화된 문자열을 복호화합니다
 */
export function decryptString(encryptedData: string): string {
  try {
    const masterKey = getMasterKey();

    // IV, Tag, 암호화된 데이터 분리
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(
      encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2),
      'hex'
    );
    const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);

    const decipher = crypto.createDecipher('aes-256-gcm', masterKey);
    decipher.setAAD(Buffer.from('openmanager-vibe-v5', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('복호화 실패:', error);
    throw new Error('데이터 복호화 중 오류가 발생했습니다');
  }
}

/**
 * Google AI API 키를 암호화하여 저장합니다
 */
export function encryptGoogleAIKey(apiKey: string): string {
  if (!apiKey || !apiKey.startsWith('AIza') || apiKey.length !== 39) {
    throw new Error(
      '유효하지 않은 Google AI API 키 형식입니다 (AIza로 시작하는 39자여야 함)'
    );
  }

  return encryptString(apiKey);
}

/**
 * 암호화된 Google AI API 키를 복호화합니다
 */
export function decryptGoogleAIKey(encryptedKey: string): string {
  const decryptedKey = decryptString(encryptedKey);

  // 복호화된 키 유효성 검증
  if (
    !decryptedKey ||
    !decryptedKey.startsWith('AIza') ||
    decryptedKey.length !== 39
  ) {
    throw new Error('복호화된 API 키가 유효하지 않습니다');
  }

  return decryptedKey;
}

/**
 * 마스터 키를 생성합니다 (초기 설정용)
 */
export function generateMasterKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('hex');
}

/**
 * API 키 유효성을 검증합니다
 */
export function validateGoogleAIKey(apiKey: string): boolean {
  return (
    apiKey &&
    typeof apiKey === 'string' &&
    apiKey.startsWith('AIza') &&
    apiKey.length === 39 &&
    /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey)
  );
}

/**
 * 암호화된 환경변수 관리
 */
export class EncryptedEnvManager {
  private static instance: EncryptedEnvManager;
  private encryptedVars: Map<string, string> = new Map();

  static getInstance(): EncryptedEnvManager {
    if (!EncryptedEnvManager.instance) {
      EncryptedEnvManager.instance = new EncryptedEnvManager();
    }
    return EncryptedEnvManager.instance;
  }

  /**
   * 암호화된 환경변수 설정
   */
  setEncrypted(key: string, value: string): void {
    const encrypted = encryptString(value);
    this.encryptedVars.set(key, encrypted);
    console.log(`🔐 환경변수 '${key}' 암호화 저장 완료`);
  }

  /**
   * 암호화된 환경변수 가져오기
   */
  getDecrypted(key: string): string | null {
    const encrypted = this.encryptedVars.get(key);
    if (!encrypted) {
      return null;
    }

    try {
      return decryptString(encrypted);
    } catch (error) {
      console.error(`환경변수 '${key}' 복호화 실패:`, error);
      return null;
    }
  }

  /**
   * Google AI API 키 설정
   */
  setGoogleAIKey(apiKey: string): void {
    if (!validateGoogleAIKey(apiKey)) {
      throw new Error('유효하지 않은 Google AI API 키입니다');
    }

    this.setEncrypted('GOOGLE_AI_API_KEY', apiKey);
  }

  /**
   * Google AI API 키 가져오기
   */
  getGoogleAIKey(): string | null {
    return this.getDecrypted('GOOGLE_AI_API_KEY');
  }

  /**
   * 저장된 키 목록 확인
   */
  listKeys(): string[] {
    return Array.from(this.encryptedVars.keys());
  }

  /**
   * 특정 키 삭제
   */
  deleteKey(key: string): boolean {
    return this.encryptedVars.delete(key);
  }

  /**
   * 모든 키 삭제
   */
  clearAll(): void {
    this.encryptedVars.clear();
    console.log('🗑️ 모든 암호화된 환경변수가 삭제되었습니다');
  }
}
