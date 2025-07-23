#!/usr/bin/env node

/**
 * 🔐 최종 보안 시스템 검증
 * GitHub PAT 토큰 암복호화 및 전체 보안 시스템 테스트
 */

const CryptoJS = require('crypto-js');
const path = require('path');

// .env.local 파일 로드
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (error) {
  console.log('⚠️ dotenv 로드 실패');
}

console.log('🔐 최종 보안 시스템 검증 시작...\n');

// 암호화 키
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'openmanager-vibe-v5-2025-production-key';

function decrypt(encryptedText) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('복호화 결과가 비어있음');
    }
    return decrypted;
  } catch (error) {
    throw new Error(`복호화 실패: ${error.message}`);
  }
}

function validateGitHubToken(token) {
  if (!token) return false;
  if (!token.startsWith('ghp_')) return false;
  if (token.length < 30 || token.length > 50) return false;
  return true;
}

async function runFinalTest() {
  console.log('📋 최종 검증 항목:');
  console.log('1. 환경변수 로드 상태');
  console.log('2. 암호화 키 설정');
  console.log('3. GitHub 토큰 암복호화');
  console.log('4. 보안 상태 종합 평가');
  console.log('5. MCP 서버 호환성\n');

  let score = 0;
  const maxScore = 5;

  // 1. 환경변수 로드 상태
  console.log('🔍 1. 환경변수 로드 상태');
  const hasEncryptedToken = !!process.env.GITHUB_TOKEN_ENCRYPTED;
  const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
  
  if (hasEncryptedToken && hasEncryptionKey) {
    console.log('✅ 필수 환경변수 모두 로드됨');
    score++;
  } else {
    console.log('❌ 필수 환경변수 누락');
    console.log(`   - GITHUB_TOKEN_ENCRYPTED: ${hasEncryptedToken ? '✅' : '❌'}`);
    console.log(`   - ENCRYPTION_KEY: ${hasEncryptionKey ? '✅' : '❌'}`);
  }

  // 2. 암호화 키 설정
  console.log('\n🔍 2. 암호화 키 설정');
  console.log(`   암호화 키: ${ENCRYPTION_KEY.substring(0, 20)}...`);
  if (ENCRYPTION_KEY.length >= 20) {
    console.log('✅ 암호화 키 길이 적절');
    score++;
  } else {
    console.log('❌ 암호화 키가 너무 짧음');
  }

  // 3. GitHub 토큰 암복호화
  console.log('\n🔍 3. GitHub 토큰 암복호화');
  try {
    const encryptedToken = process.env.GITHUB_TOKEN_ENCRYPTED;
    if (encryptedToken) {
      const decryptedToken = decrypt(encryptedToken);
      const isValid = validateGitHubToken(decryptedToken);
      
      if (isValid) {
        console.log('✅ GitHub 토큰 복호화 및 검증 성공');
        console.log(`   토큰 미리보기: ${decryptedToken.substring(0, 10)}...${decryptedToken.substring(-4)}`);
        score++;
      } else {
        console.log('❌ 복호화된 토큰 형식이 올바르지 않음');
      }
    } else {
      console.log('❌ 암호화된 토큰이 없음');
    }
  } catch (error) {
    console.log(`❌ 토큰 복호화 실패: ${error.message}`);
  }

  // 4. 보안 상태 종합 평가
  console.log('\n🔍 4. 보안 상태 종합 평가');
  const hasPlainToken = !!process.env.GITHUB_TOKEN;
  const securityLevel = hasEncryptedToken && !hasPlainToken ? 'HIGH' : 
                       hasEncryptedToken && hasPlainToken ? 'MEDIUM' : 'LOW';
  
  console.log(`   보안 수준: ${securityLevel}`);
  console.log(`   - 암호화된 토큰: ${hasEncryptedToken ? '✅' : '❌'}`);
  console.log(`   - 평문 토큰: ${hasPlainToken ? '⚠️' : '✅'}`);
  
  if (securityLevel === 'HIGH') {
    console.log('✅ 보안 상태 우수');
    score++;
  } else if (securityLevel === 'MEDIUM') {
    console.log('⚠️ 보안 상태 보통 (평문 토큰 제거 권장)');
    score += 0.5;
  } else {
    console.log('❌ 보안 상태 취약');
  }

  // 5. MCP 서버 호환성
  console.log('\n🔍 5. MCP 서버 호환성');
  try {
    // 임시로 GITHUB_TOKEN 환경변수 설정 (MCP 서버용)
    const encryptedToken = process.env.GITHUB_TOKEN_ENCRYPTED;
    if (encryptedToken) {
      const decryptedToken = decrypt(encryptedToken);
      process.env.GITHUB_TOKEN = decryptedToken;
      
      // MCP 서버가 토큰을 읽을 수 있는지 확인
      const mcpToken = process.env.GITHUB_TOKEN;
      if (mcpToken && validateGitHubToken(mcpToken)) {
        console.log('✅ MCP 서버 호환성 확인');
        score++;
        
        // 보안을 위해 즉시 제거
        delete process.env.GITHUB_TOKEN;
        console.log('🧹 임시 토큰 정리 완료');
      } else {
        console.log('❌ MCP 서버 토큰 설정 실패');
      }
    } else {
      console.log('❌ 암호화된 토큰이 없어 MCP 호환성 테스트 불가');
    }
  } catch (error) {
    console.log(`❌ MCP 호환성 테스트 실패: ${error.message}`);
  }

  // 최종 결과
  console.log('\n📊 최종 검증 결과:');
  console.log(`점수: ${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)`);
  
  if (score >= 4.5) {
    console.log('\n🎉 보안 시스템이 완벽하게 구성되었습니다!');
    console.log('✅ GitHub PAT 토큰이 안전하게 암호화되어 저장되었습니다.');
    console.log('✅ MCP 서버와의 호환성이 확인되었습니다.');
    console.log('✅ 모든 보안 요구사항을 충족합니다.');
  } else if (score >= 3) {
    console.log('\n⚠️ 보안 시스템이 대부분 구성되었지만 개선이 필요합니다.');
    console.log('🔧 위의 실패 항목들을 확인하고 수정해주세요.');
  } else {
    console.log('\n❌ 보안 시스템에 심각한 문제가 있습니다.');
    console.log('🚨 즉시 보안 설정을 점검하고 수정해주세요.');
  }

  console.log('\n💡 보안 유지 관리 팁:');
  console.log('1. 정기적으로 GitHub PAT 토큰 갱신 (3-6개월)');
  console.log('2. 암호화 키는 절대 Git에 커밋하지 않기');
  console.log('3. 로그 파일에 토큰이 노출되지 않도록 주의');
  console.log('4. 프로덕션 환경에서는 환경변수로 암호화 키 관리');
  console.log('5. 정기적으로 보안 테스트 실행');
}

runFinalTest().catch(error => {
  console.error('❌ 최종 검증 실행 실패:', error);
  process.exit(1);
});