#!/usr/bin/env tsx

/**
 * 🔐 보안 토큰 관리 도구
 * 
 * 민감한 토큰들을 암호화하여 안전하게 저장하고 관리합니다.
 * 
 * 사용법:
 * - 토큰 추가: npm run secure:token add GITHUB_TOKEN
 * - 토큰 조회: npm run secure:token get GITHUB_TOKEN
 * - 토큰 삭제: npm run secure:token remove GITHUB_TOKEN
 * - 모든 토큰 목록: npm run secure:token list
 * - MCP 설정 업데이트: npm run secure:token mcp-update
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { enhancedCryptoManager } from '../src/lib/crypto/EnhancedEnvCryptoManager';
import type { EncryptedEnvConfig } from '../src/lib/crypto/EnhancedEnvCryptoManager';

const SECURE_TOKENS_PATH = path.join(process.cwd(), '.secure-tokens.json');
const MCP_SETTINGS_PATH = path.join(process.env.HOME || '', '.claude', 'settings.json');

// 터미널 입력 도구
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    // stdout.write를 사용하여 프롬프트 표시
    process.stdout.write(prompt);
    
    // 입력을 숨기기 위해 stdin 설정 변경
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

async function loadSecureTokens(password: string): Promise<Record<string, string>> {
  try {
    if (!fs.existsSync(SECURE_TOKENS_PATH)) {
      return {};
    }
    
    const encryptedData: EncryptedEnvConfig = JSON.parse(
      fs.readFileSync(SECURE_TOKENS_PATH, 'utf-8')
    );
    
    enhancedCryptoManager.initializeMasterKey(password);
    return enhancedCryptoManager.decryptEnvironment(encryptedData);
  } catch (error) {
    console.error('❌ 토큰 로드 실패:', error);
    return {};
  }
}

async function saveSecureTokens(tokens: Record<string, string>, password: string): Promise<void> {
  try {
    enhancedCryptoManager.initializeMasterKey(password);
    const encryptedConfig = enhancedCryptoManager.encryptEnvironment(tokens);
    
    fs.writeFileSync(
      SECURE_TOKENS_PATH,
      JSON.stringify(encryptedConfig, null, 2),
      'utf-8'
    );
    
    // 파일 권한 설정 (읽기 전용)
    fs.chmodSync(SECURE_TOKENS_PATH, 0o600);
    
    console.log('✅ 토큰 저장 완료');
  } catch (error) {
    console.error('❌ 토큰 저장 실패:', error);
    throw error;
  }
}

async function addToken(name: string): Promise<void> {
  const password = await questionHidden('🔐 마스터 비밀번호: ');
  const tokens = await loadSecureTokens(password);
  
  const value = await questionHidden(`📝 ${name} 값 입력: `);
  
  tokens[name] = value;
  await saveSecureTokens(tokens, password);
  
  console.log(`✅ ${name} 토큰이 안전하게 저장되었습니다.`);
}

async function getToken(name: string): Promise<void> {
  const password = await questionHidden('🔐 마스터 비밀번호: ');
  const tokens = await loadSecureTokens(password);
  
  if (tokens[name]) {
    console.log(`\n📋 ${name}: ${tokens[name]}`);
    console.log('\n⚠️  주의: 이 토큰을 안전하게 관리하세요!');
  } else {
    console.log(`❌ ${name} 토큰을 찾을 수 없습니다.`);
  }
}

async function removeToken(name: string): Promise<void> {
  const password = await questionHidden('🔐 마스터 비밀번호: ');
  const tokens = await loadSecureTokens(password);
  
  if (tokens[name]) {
    delete tokens[name];
    await saveSecureTokens(tokens, password);
    console.log(`✅ ${name} 토큰이 제거되었습니다.`);
  } else {
    console.log(`❌ ${name} 토큰을 찾을 수 없습니다.`);
  }
}

async function listTokens(): Promise<void> {
  const password = await questionHidden('🔐 마스터 비밀번호: ');
  const tokens = await loadSecureTokens(password);
  
  console.log('\n📋 저장된 토큰 목록:');
  for (const name of Object.keys(tokens)) {
    console.log(`  - ${name}`);
  }
}

async function updateMCPSettings(): Promise<void> {
  const password = await questionHidden('🔐 마스터 비밀번호: ');
  const tokens = await loadSecureTokens(password);
  
  if (!fs.existsSync(MCP_SETTINGS_PATH)) {
    console.error('❌ MCP 설정 파일을 찾을 수 없습니다:', MCP_SETTINGS_PATH);
    return;
  }
  
  const settings = JSON.parse(fs.readFileSync(MCP_SETTINGS_PATH, 'utf-8'));
  
  // GitHub 토큰 업데이트
  if (tokens.GITHUB_TOKEN && settings.mcpServers?.github) {
    settings.mcpServers.github.env = settings.mcpServers.github.env || {};
    settings.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = tokens.GITHUB_TOKEN;
    console.log('✅ GitHub 토큰 업데이트됨');
  }
  
  // Brave API 키 업데이트
  if (tokens.BRAVE_API_KEY && settings.mcpServers?.['brave-search']) {
    settings.mcpServers['brave-search'].env = settings.mcpServers['brave-search'].env || {};
    settings.mcpServers['brave-search'].env.BRAVE_API_KEY = tokens.BRAVE_API_KEY;
    console.log('✅ Brave API 키 업데이트됨');
  }
  
  // 백업 생성
  const backupPath = `${MCP_SETTINGS_PATH}.backup-${Date.now()}`;
  fs.copyFileSync(MCP_SETTINGS_PATH, backupPath);
  console.log(`📁 백업 생성됨: ${backupPath}`);
  
  // 설정 저장
  fs.writeFileSync(MCP_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  console.log('✅ MCP 설정이 업데이트되었습니다.');
  console.log('\n🚀 Claude Code를 재시작하여 변경사항을 적용하세요.');
}

// 메인 프로그램
async function main() {
  const [, , command, ...args] = process.argv;
  
  console.log('🔐 보안 토큰 관리 도구\n');
  
  try {
    switch (command) {
      case 'add':
        if (!args[0]) {
          console.error('❌ 토큰 이름을 지정하세요: npm run secure:token add TOKEN_NAME');
          break;
        }
        await addToken(args[0]);
        break;
        
      case 'get':
        if (!args[0]) {
          console.error('❌ 토큰 이름을 지정하세요: npm run secure:token get TOKEN_NAME');
          break;
        }
        await getToken(args[0]);
        break;
        
      case 'remove':
        if (!args[0]) {
          console.error('❌ 토큰 이름을 지정하세요: npm run secure:token remove TOKEN_NAME');
          break;
        }
        await removeToken(args[0]);
        break;
        
      case 'list':
        await listTokens();
        break;
        
      case 'mcp-update':
        await updateMCPSettings();
        break;
        
      default:
        console.log('사용 가능한 명령어:');
        console.log('  add TOKEN_NAME    - 새 토큰 추가');
        console.log('  get TOKEN_NAME    - 토큰 값 조회');
        console.log('  remove TOKEN_NAME - 토큰 삭제');
        console.log('  list              - 모든 토큰 목록');
        console.log('  mcp-update        - MCP 설정에 토큰 적용');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    rl.close();
  }
}

// 프로그램 실행
main().catch(console.error);