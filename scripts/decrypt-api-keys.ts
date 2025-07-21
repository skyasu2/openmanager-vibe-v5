#!/usr/bin/env tsx

/**
 * 🔐 API 키 복호화 도구
 *
 * 암호화된 환경변수 설정에서 API 키를 안전하게 복원합니다.
 *
 * 사용법:
 * - 모든 API 키 복호화: npm run decrypt:keys
 * - 특정 키만 복호화: npm run decrypt:keys GOOGLE_AI_API_KEY
 * - .env 파일로 내보내기: npm run decrypt:keys --export
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { ENCRYPTED_ENV_CONFIG } from '../config/encrypted-env-config';
import { enhancedCryptoManager } from '../src/lib/crypto/EnhancedEnvCryptoManager';
import { adaptEncryptedEnvVarToEnvData } from '../src/utils/encryption-adapter';

// 터미널 입력 도구
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise(resolve => {
    process.stdout.write(prompt);

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    stdin.on('data', function onData(char: string) {
      const charCode = char.charCodeAt(0);

      if (charCode === 13 || charCode === 10) {
        // Enter
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(password);
      } else if (charCode === 127 || charCode === 8) {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (charCode >= 32) {
        // 인쇄 가능한 문자
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

async function decryptKeys(targetKey?: string, exportToFile = false) {
  console.log('🔐 API 키 복호화 도구\n');

  try {
    // 마스터 비밀번호 입력
    const masterPassword = await questionHidden('🔑 마스터 비밀번호 입력: ');

    // 마스터 키 초기화
    enhancedCryptoManager.initializeMasterKey(masterPassword);

    console.log('\n⏳ 복호화 중...\n');

    // 복호화할 키 목록
    const keysToDecrypt = targetKey
      ? [targetKey]
      : Object.keys(ENCRYPTED_ENV_CONFIG.variables);

    const decryptedValues: Record<string, string> = {};
    let successCount = 0;
    let failCount = 0;

    for (const key of keysToDecrypt) {
      const encryptedData = ENCRYPTED_ENV_CONFIG.variables[key];

      if (!encryptedData) {
        console.log(`❌ ${key}: 암호화된 데이터를 찾을 수 없습니다`);
        failCount++;
        continue;
      }

      try {
        const adaptedData = adaptEncryptedEnvVarToEnvData(encryptedData);
        const decrypted = enhancedCryptoManager.decryptVariable(adaptedData);
        decryptedValues[key] = decrypted;
        successCount++;

        if (!exportToFile) {
          // 민감한 정보는 일부만 표시
          const displayValue =
            key.includes('KEY') || key.includes('SECRET')
              ? `${decrypted.substring(0, 10)}...${decrypted.substring(decrypted.length - 5)}`
              : decrypted;

          console.log(`✅ ${key}: ${displayValue}`);
        }
      } catch (error) {
        console.log(
          `❌ ${key}: 복호화 실패 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
        failCount++;
      }
    }

    console.log(`\n📊 결과: ${successCount}개 성공, ${failCount}개 실패`);

    // 파일로 내보내기
    if (exportToFile && successCount > 0) {
      const envContent = Object.entries(decryptedValues)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');

      const envPath = path.join(process.cwd(), '.env.decrypted');
      fs.writeFileSync(envPath, envContent, 'utf-8');
      fs.chmodSync(envPath, 0o600); // 읽기 전용

      console.log(`\n📁 복호화된 환경변수가 ${envPath}에 저장되었습니다`);
      console.log(
        '⚠️  주의: 이 파일은 민감한 정보를 포함하고 있습니다. 사용 후 삭제하세요!'
      );
    }
  } catch (error) {
    console.error(
      '\n❌ 오류 발생:',
      error instanceof Error ? error.message : error
    );
  } finally {
    rl.close();
  }
}

// MCP 설정 업데이트 함수
async function updateMCPConfig() {
  console.log('🔐 MCP 설정 업데이트\n');

  try {
    const masterPassword = await questionHidden('🔑 마스터 비밀번호 입력: ');
    enhancedCryptoManager.initializeMasterKey(masterPassword);

    // API 키 복호화
    const githubKey = ENCRYPTED_ENV_CONFIG.variables.GITHUB_TOKEN;
    const googleAIKey = ENCRYPTED_ENV_CONFIG.variables.GOOGLE_AI_API_KEY;

    const decryptedGithub = githubKey
      ? enhancedCryptoManager.decryptVariable(
          adaptEncryptedEnvVarToEnvData(githubKey)
        )
      : null;
    const decryptedGoogleAI = googleAIKey
      ? enhancedCryptoManager.decryptVariable(
          adaptEncryptedEnvVarToEnvData(googleAIKey)
        )
      : null;

    // MCP 설정 파일 업데이트
    const mcpConfigPath = path.join(
      'C:\\Users\\skyasu-pc\\AppData\\Roaming\\Claude',
      'claude_desktop_config.json'
    );

    if (fs.existsSync(mcpConfigPath)) {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));

      if (decryptedGithub && mcpConfig.mcpServers?.github) {
        mcpConfig.mcpServers.github.env = mcpConfig.mcpServers.github.env || {};
        mcpConfig.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN =
          decryptedGithub;
        console.log('✅ GitHub 토큰 업데이트 완료');
      }

      // 백업 생성
      const backupPath = `${mcpConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(mcpConfigPath, backupPath);
      console.log(`📁 백업 생성: ${backupPath}`);

      // 설정 저장
      fs.writeFileSync(
        mcpConfigPath,
        JSON.stringify(mcpConfig, null, 2),
        'utf-8'
      );
      console.log('\n✅ MCP 설정 업데이트 완료!');
      console.log('🚀 Claude Desktop을 재시작하여 변경사항을 적용하세요.');
    } else {
      console.error('❌ MCP 설정 파일을 찾을 수 없습니다');
    }
  } catch (error) {
    console.error(
      '\n❌ 오류 발생:',
      error instanceof Error ? error.message : error
    );
  } finally {
    rl.close();
  }
}

// 메인 함수
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--mcp-update')) {
    await updateMCPConfig();
  } else {
    const exportToFile = args.includes('--export');
    const targetKey = args.find(arg => !arg.startsWith('--'));

    await decryptKeys(targetKey, exportToFile);
  }
}

// 프로그램 실행
main().catch(console.error);
