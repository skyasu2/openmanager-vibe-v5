#!/usr/bin/env node

/**
 * 🧪 GitHub PAT 토큰 보안 시스템 테스트
 * 암복호화 및 토큰 관리 기능 검증
 */

const CryptoJS = require('crypto-js');
const path = require('path');

// .env.local 파일 로드
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (error) {
  console.log('⚠️ dotenv 로드 실패, 기본 환경변수 사용');
}

console.log('🧪 GitHub PAT 토큰 보안 시스템 테스트 시작...\n');

// 암호화 키 (.env.local의 ENCRYPTION_KEY와 동일)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'openmanager-vibe-v5-2025-production-key';

function encrypt(text) {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    throw new Error(`암호화 실패: ${error.message}`);
  }
}

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

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  console.log('📋 테스트 시나리오:');
  console.log('1. 기본 암복호화 테스트');
  console.log('2. GitHub 토큰 형식 검증');
  console.log('3. 환경변수에서 암호화된 토큰 읽기');
  console.log('4. 보안 상태 확인\n');

  // 테스트 1: 기본 암복호화
  console.log('🔍 테스트 1: 기본 암복호화');
  totalTests++;
  try {
    const testValue = 'ghp_test1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    
    if (decrypted === testValue) {
      console.log('✅ 기본 암복호화 성공');
      passedTests++;
    } else {
      console.log('❌ 기본 암복호화 실패: 값 불일치');
    }
  } catch (error) {
    console.log(`❌ 기본 암복호화 실패: ${error.message}`);
  }

  // 테스트 2: GitHub 토큰 형식 검증
  console.log('\n🔍 테스트 2: GitHub 토큰 형식 검증');
  totalTests++;
  try {
    const validToken = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123';
    const invalidToken1 = 'invalid_token';
    const invalidToken2 = 'ghp_short';
    
    const test1 = validateGitHubToken(validToken);
    const test2 = !validateGitHubToken(invalidToken1);
    const test3 = !validateGitHubToken(invalidToken2);
    
    if (test1 && test2 && test3) {
      console.log('✅ GitHub 토큰 형식 검증 성공');
      passedTests++;
    } else {
      console.log('❌ GitHub 토큰 형식 검증 실패');
    }
  } catch (error) {
    console.log(`❌ GitHub 토큰 형식 검증 실패: ${error.message}`);
  }

  // 테스트 3: 환경변수에서 암호화된 토큰 읽기
  console.log('\n🔍 테스트 3: 환경변수에서 암호화된 토큰 읽기');
  totalTests++;
  try {
    const encryptedToken = process.env.GITHUB_TOKEN_ENCRYPTED;
    if (encryptedToken) {
      const decryptedToken = decrypt(encryptedToken);
      const isValid = validateGitHubToken(decryptedToken);
      
      if (isValid) {
        console.log('✅ 환경변수 암호화된 토큰 읽기 성공');
        console.log(`   토큰 미리보기: ${decryptedToken.substring(0, 10)}...${decryptedToken.substring(-4)}`);
        passedTests++;
      } else {
        console.log('❌ 환경변수 토큰 형식이 올바르지 않음');
      }
    } else {
      console.log('⚠️ 환경변수에 암호화된 토큰이 없음');
    }
  } catch (error) {
    console.log(`❌ 환경변수 토큰 읽기 실패: ${error.message}`);
  }

  // 테스트 4: 보안 상태 확인
  console.log('\n🔍 테스트 4: 보안 상태 확인');
  totalTests++;
  try {
    const hasEncryptedToken = !!process.env.GITHUB_TOKEN_ENCRYPTED;
    const hasPlainToken = !!process.env.GITHUB_TOKEN;
    
    console.log(`   암호화된 토큰 존재: ${hasEncryptedToken ? '✅' : '❌'}`);
    console.log(`   평문 토큰 존재: ${hasPlainToken ? '⚠️' : '✅'}`);
    
    if (hasEncryptedToken && !hasPlainToken) {
      console.log('✅ 보안 상태 양호 - 암호화된 토큰만 존재');
      passedTests++;
    } else if (hasEncryptedToken && hasPlainToken) {
      console.log('⚠️ 보안 주의 - 암호화된 토큰과 평문 토큰이 모두 존재');
    } else if (!hasEncryptedToken && hasPlainToken) {
      console.log('❌ 보안 위험 - 평문 토큰만 존재');
    } else {
      console.log('❌ 토큰이 없음');
    }
  } catch (error) {
    console.log(`❌ 보안 상태 확인 실패: ${error.message}`);
  }

  // 결과 출력
  console.log('\n📊 테스트 결과:');
  console.log(`통과: ${passedTests}/${totalTests}`);
  console.log(`성공률: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 모든 테스트가 성공했습니다!');
    console.log('✅ GitHub PAT 토큰 보안 시스템이 정상적으로 작동합니다.');
  } else {
    console.log('\n⚠️ 일부 테스트가 실패했습니다.');
    console.log('🔧 시스템 설정을 확인해주세요.');
  }

  // 추가 정보
  console.log('\n💡 보안 권장사항:');
  console.log('1. 평문 토큰은 즉시 제거하고 암호화된 버전만 사용');
  console.log('2. 암호화 키(ENCRYPTION_KEY)는 안전한 곳에 별도 보관');
  console.log('3. 정기적으로 토큰을 갱신하고 재암호화');
  console.log('4. 로그에 토큰이 노출되지 않도록 주의');
}

runTests().catch(error => {
  console.error('❌ 테스트 실행 실패:', error);
  process.exit(1);
});