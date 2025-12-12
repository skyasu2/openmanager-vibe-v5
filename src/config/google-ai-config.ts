/**
 * 🔐 Google AI API 암호화된 설정 v3.0
 *
 * 새로운 API 키: SENSITIVE_INFO_REMOVED
 * 팀 비밀번호: team2025secure
 * 암호화 알고리즘: AES-256-GCM
 * 솔트: 128bit 랜덤, IV: 96bit 랜덤
 *
 * 암호화 날짜: 2025-01-30 (한국시간)
 * 유효기간: 2025년 말까지
 *
 * // Verified: 2025-12-12
 */

export interface EncryptedGoogleAIConfig {
  encryptedKey: string;
  salt: string;
  iv: string;
  authTag?: string; // 이전 버전 호환성을 위한 옵셔널 속성
  version: string;
  algorithm: string;
  createdAt: string;
  description: string;
  keyPrefix: string;
  teamPassword?: string;
}

/**
 * 🔐 암호화된 Google AI 설정 (팀 공유)
 *
 * 복호화 방법:
 * 1. 팀 비밀번호: team2025secure
 * 2. UnifiedEnvCryptoManager.decrypt() 사용
 * 3. 결과: SENSITIVE_INFO_REMOVED
 */
export const ENCRYPTED_GOOGLE_AI_CONFIG: EncryptedGoogleAIConfig = {
  // 🔐 새로운 API 키 암호화 결과
  encryptedKey:
    'ymppwQOSkN5lotCTegQJT/Jw/pJnWy494YLG4E9fuIih1JlQluijX4akdrQORjGP',
  salt: 'd2f9cce3838651ef3f27ab0755f3438e',
  iv: '4d31ddece291dfeb9a7803eb03bd40a8',

  // 🔧 메타데이터
  version: '3.0.0',
  algorithm: 'aes-256-gcm',
  createdAt: '2025-01-30T09:30:00.000Z',
  description: 'Google AI API 키 (새로운 키로 업데이트)',
  keyPrefix: 'AIzaSyABFUH',
};

/**
 * 🔐 Google AI 설정 검증 함수
 */
export function validateGoogleAIConfig(): {
  isValid: boolean;
  hasEncryptedKey: boolean;
  hasMetadata: boolean;
  version: string;
  algorithm: string;
} {
  const config = ENCRYPTED_GOOGLE_AI_CONFIG;

  return {
    isValid: !!(config.encryptedKey && config.salt && config.iv),
    hasEncryptedKey: !!config.encryptedKey,
    hasMetadata: !!(config.version && config.algorithm && config.createdAt),
    version: config.version,
    algorithm: config.algorithm,
  };
}

/**
 * 🔐 Google AI 설정 정보 출력
 */
export function getGoogleAIConfigInfo(): {
  keyPrefix: string;
  version: string;
  algorithm: string;
  createdAt: string;
  description: string;
  hasTeamPassword: boolean;
} {
  const config = ENCRYPTED_GOOGLE_AI_CONFIG;

  return {
    keyPrefix: config.keyPrefix,
    version: config.version,
    algorithm: config.algorithm,
    createdAt: config.createdAt,
    description: config.description,
    hasTeamPassword: !!config.teamPassword,
  };
}

/**
 * 🔐 기본 팀 비밀번호 목록
 */
export const DEFAULT_TEAM_PASSWORDS = [
  'team2025secure',
  'openmanager2025',
  'openmanager-vibe-v5-2025',
  'team-password-2025',
] as const;

export default ENCRYPTED_GOOGLE_AI_CONFIG;
