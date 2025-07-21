import { ENCRYPTED_ENV_CONFIG } from '../../../config/encrypted-env-config';
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
import { adaptEncryptedEnvVarToEnvData } from '@/utils/encryption-adapter';
import fs from 'fs/promises';
import path from 'path';

const teamPasswords = [
  'sky3232',
  'openmanager2025',
  'openmanager-vibe-v5-2025',
  'team-password-2025',
  'openmanager-team-key',
  'development-mock-password',
  'team2025secure',
];

async function decryptForBuild() {
  console.log(
    '🔧 [TSX] 빌드 환경을 위해 암호화된 환경변수 복호화를 시작합니다...'
  );
  try {
    const cryptoManager = enhancedCryptoManager;

    let recoveredVars: { [key: string]: string } = {};

    for (const password of teamPasswords) {
      try {
        const tempRecovered: { [key: string]: string } = {};
        let success = true;
        for (const key in ENCRYPTED_ENV_CONFIG.variables) {
          const varInfo =
            ENCRYPTED_ENV_CONFIG.variables[
              key as keyof typeof ENCRYPTED_ENV_CONFIG.variables
            ];
          if (varInfo) {
            // EnhancedEnvCryptoManager는 동기 함수이므로 await 제거
            cryptoManager.initializeMasterKey(password);
            const adaptedData = adaptEncryptedEnvVarToEnvData(varInfo);
            const decrypted = cryptoManager.decryptVariable(
              adaptedData,
              password
            );
            tempRecovered[key] = decrypted;
          }
        }

        // 모든 변수가 성공적으로 복호화되었는지 간단히 확인
        if (
          Object.keys(tempRecovered).length ===
          Object.keys(ENCRYPTED_ENV_CONFIG.variables).length
        ) {
          recoveredVars = tempRecovered;
          console.log(
            `✅ 비밀번호 "${password.substring(0, 3)}***"로 모든 환경변수 복호화 성공!`
          );
          break;
        }
      } catch (e) {
        // 개별 비밀번호 실패는 무시하고 다음 비밀번호로 넘어감
        continue;
      }
    }

    if (Object.keys(recoveredVars).length === 0) {
      console.warn(
        '⚠️ 복호화된 환경변수가 없습니다. Vercel에 설정된 환경변수에 의존합니다.'
      );
      return;
    }

    const envContent = Object.entries(recoveredVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');

    const buildEnvPath = path.resolve(process.cwd(), '.env.production');
    await fs.writeFile(buildEnvPath, envContent);

    console.log(
      `✅ [TSX] 복호화 완료! ${Object.keys(recoveredVars).length}개의 환경변수를 .env.production 파일에 저장했습니다.`
    );
  } catch (error) {
    console.error(
      '❌ [TSX] 빌드용 환경변수 복호화 중 심각한 오류 발생:',
      error
    );
    process.exit(1);
  }
}

decryptForBuild();
