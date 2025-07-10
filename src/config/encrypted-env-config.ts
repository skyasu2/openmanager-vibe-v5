/**
 * 🔐 Encrypted Environment Configuration
 *
 * 암호화된 환경변수 설정 관리
 * - 보안 키 암호화
 * - 동적 환경변수 복호화
 * - 안전한 키 관리
 */

// 🔐 암호화된 환경변수 설정
export const ENCRYPTED_ENV_CONFIG = {
  version: '5.44.0',
  environment: process.env.NODE_ENV || 'development',
  createdAt: new Date().toISOString(),
  teamPasswordHash: '', // 운영시 실제 해시 값으로 교체
  variables: {}, // 실제 암호화된 변수들은 별도 보안 저장소에서 관리
  checksum: '', // 실제 운영시 체크섬 값으로 교체

  // 메타데이터 (기존 설정 유지)
  metadata: {
    // 암호화된 환경변수 키들
    ENCRYPTED_KEYS: [
      'GOOGLE_AI_API_KEY',
      // 'SLACK_WEBHOOK_URL' 제거됨
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_TOKEN',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
    ],

    // 암호화 설정
    ENCRYPTION_SETTINGS: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      encoding: 'base64' as const,
    },

    // 환경별 설정
    ENVIRONMENTS: {
      development: {
        encryptionEnabled: false,
        strictMode: false,
        fallbackToPlaintext: true,
      },
      production: {
        encryptionEnabled: true,
        strictMode: true,
        fallbackToPlaintext: false,
      },
      test: {
        encryptionEnabled: false,
        strictMode: false,
        fallbackToPlaintext: true,
      },
    },

    // 보안 수준 설정
    SECURITY_LEVELS: {
      development: 'basic',
      staging: 'enhanced',
      production: 'maximum',
    },

    // 키 로테이션 설정
    KEY_ROTATION: {
      enabled: true,
      schedule: 'monthly',
      notificationDays: 7,
    },
  },
};

// 현재 환경 설정 가져오기
export function getCurrentEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return (
    ENCRYPTED_ENV_CONFIG.metadata.ENVIRONMENTS[
      env as keyof typeof ENCRYPTED_ENV_CONFIG.metadata.ENVIRONMENTS
    ] || ENCRYPTED_ENV_CONFIG.metadata.ENVIRONMENTS.development
  );
}

// 보안 레벨 설정 가져오기
export function getSecurityLevelConfig() {
  const level = process.env.SECURITY_LEVEL || 'development';
  return (
    ENCRYPTED_ENV_CONFIG.metadata.SECURITY_LEVELS[
      level as keyof typeof ENCRYPTED_ENV_CONFIG.metadata.SECURITY_LEVELS
    ] || ENCRYPTED_ENV_CONFIG.metadata.SECURITY_LEVELS.development
  );
}

// 키가 암호화되어야 하는지 확인
export function shouldEncryptKey(key: string): boolean {
  return ENCRYPTED_ENV_CONFIG.metadata.ENCRYPTED_KEYS.includes(key);
}

// 암호화 설정 가져오기
export function getEncryptionSettings() {
  return ENCRYPTED_ENV_CONFIG.metadata.ENCRYPTION_SETTINGS;
}

// encrypted-env-loader에서 사용하는 export
export const encryptedEnvConfig = ENCRYPTED_ENV_CONFIG;
