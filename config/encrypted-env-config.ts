/**
 * 🔐 암호화된 환경변수 설정 (기본값)
 * 
 * 이 파일은 암호화된 환경변수가 없을 때 사용되는 기본 설정입니다.
 * 실제 환경변수를 암호화하려면 다음 명령을 실행하세요:
 * 
 * node scripts/unified-env-crypto.mjs encrypt --password=your-password
 */

import type { EncryptedEnvConfig } from '@/lib/crypto/EnhancedEnvCryptoManager';

export const encryptedEnvConfig: EncryptedEnvConfig = {
  version: '2.0',
  environment: 'development',
  variables: {},
  checksum: ''
};