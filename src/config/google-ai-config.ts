/**
 * Google AI API 키 암호화 설정
 *
 * 이 파일은 암호화된 Google AI API 키를 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 *
 * 구조:
 * - encryptedKey: AES 암호화된 Google AI API 키
 * - salt: 암호화에 사용된 솔트
 * - iv: 초기화 벡터
 */

export interface GoogleAIEncryptedConfig {
  encryptedKey: string;
  salt: string;
  iv: string;
  createdAt: string;
  version: string;
}

/**
 * 암호화된 Google AI 설정
 * 이 값들은 encrypt-google-ai.js 스크립트로 생성됩니다.
 *
 * ⚠️ 팀 비밀번호는 별도로 관리합니다 (보안상 이유로 코드에 노출 금지)
 */
export const ENCRYPTED_GOOGLE_AI_CONFIG: GoogleAIEncryptedConfig = {
  encryptedKey:
    'nOnuT7TY8Yo0i9M/yJUVxBjsi45GE6uvE0ojKEp7mwxrrxjBC04Y+itW0s1vcwW6',
  salt: '0a366ab3f48fe4f18e58b675468eab26',
  iv: 'bae5489f8c37eda3d5dbc5315ef83578',
  createdAt: '2025-06-10T00:49:17.797Z',
  version: '1.0.0',
};

// 개발 환경에서만 사용되는 기본 설정 (암호화되지 않음)
export const DEV_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  useEncryption:
    process.env.NODE_ENV === 'production' ||
    process.env.FORCE_ENCRYPTION === 'true',
};
