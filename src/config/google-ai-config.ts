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
 */
export const ENCRYPTED_GOOGLE_AI_CONFIG: GoogleAIEncryptedConfig = {
  encryptedKey:
    'nimoLDQDIRGXgvhsgmyE75qRwP366vsjxGQQXUcnTr8wtOPouKD7XifhwdbVwTi+',
  salt: '151e3f103c7ab58cd8ceed1d35c0d1d3',
  iv: 'ce840ff0b3968e9ba7d1597565db1029',
  createdAt: '2025-07-07T11:21:08.018Z',
  version: '1.0.0',
};

// 개발 환경에서만 사용되는 기본 설정 (암호화되지 않음)
export const DEV_CONFIG = {
  isProduction: process.env.NODE_ENV === 'production',
  useEncryption:
    process.env.NODE_ENV === 'production' ||
    process.env.FORCE_ENCRYPTION === 'true',
};
