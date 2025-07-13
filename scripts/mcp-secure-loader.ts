#!/usr/bin/env tsx

/**
 * 🔐 MCP 보안 로더
 * 
 * MCP 서버 시작 시 암호화된 토큰을 자동으로 로드합니다.
 * Claude Code 시작 전에 이 스크립트를 실행하여 토큰을 환경변수로 설정합니다.
 * 
 * 사용법:
 * npm run mcp:secure-load
 */

import fs from 'fs';
import path from 'path';
import { enhancedCryptoManager } from '../src/lib/crypto/EnhancedEnvCryptoManager';
import type { EncryptedEnvConfig } from '../src/lib/crypto/EnhancedEnvCryptoManager';
import readline from 'readline';

const SECURE_TOKENS_PATH = path.join(process.cwd(), '.secure-tokens.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    stdin.on('data', function onData(char: string) {
      const charCode = char.charCodeAt(0);
      
      if (charCode === 13 || charCode === 10) { // Enter
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(password);
      } else if (charCode === 127 || charCode === 8) { // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (charCode >= 32) { // 인쇄 가능한 문자
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

async function loadSecureTokensToEnv() {
  try {
    if (!fs.existsSync(SECURE_TOKENS_PATH)) {
      console.log('⚠️  보안 토큰 파일이 없습니다. 먼저 토큰을 추가하세요:');
      console.log('   npm run secure:add GITHUB_TOKEN');
      return;
    }
    
    const password = await questionHidden('🔐 마스터 비밀번호: ');
    
    const encryptedData: EncryptedEnvConfig = JSON.parse(
      fs.readFileSync(SECURE_TOKENS_PATH, 'utf-8')
    );
    
    enhancedCryptoManager.initializeMasterKey(password);
    const tokens = enhancedCryptoManager.decryptEnvironment(encryptedData);
    
    // 환경 변수로 설정
    for (const [key, value] of Object.entries(tokens)) {
      process.env[key] = value;
    }
    
    console.log(`\n✅ ${Object.keys(tokens).length}개의 토큰이 환경변수로 로드되었습니다.`);
    console.log('   로드된 토큰:', Object.keys(tokens).join(', '));
    
    // 셸 스크립트 생성 (현재 셸 세션에 export)
    const exportScript = Object.entries(tokens)
      .map(([key, value]) => `export ${key}="${value}"`)
      .join('\n');
    
    const scriptPath = path.join(process.cwd(), '.secure-tokens-export.sh');
    fs.writeFileSync(scriptPath, exportScript, { mode: 0o600 });
    
    console.log('\n💡 다음 명령어로 현재 셸에 토큰을 로드할 수 있습니다:');
    console.log(`   source ${scriptPath}`);
    console.log('\n🚀 이제 Claude Code를 시작하세요:');
    console.log('   claude');
    
  } catch (error) {
    console.error('❌ 토큰 로드 실패:', error);
  } finally {
    rl.close();
  }
}

// 메인 실행
loadSecureTokensToEnv().catch(console.error);