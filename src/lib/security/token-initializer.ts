/**
 * 🔐 보안 토큰 초기화
 * 애플리케이션 시작 시 암호화된 토큰들을 복호화하여 환경변수에 설정
 */

import { decrypt } from '@/utils/encryption';

/**
 * 🔑 GitHub 토큰 초기화
 * 암호화된 GitHub PAT 토큰을 복호화하여 GITHUB_TOKEN 환경변수에 설정
 */
export function _initializeGitHubToken(): boolean {
  try {
    // 평문 토큰이 있다면 우선 사용 (개발 편의성)
    if (
      process.env.GITHUB_TOKEN &&
      process.env.GITHUB_TOKEN.startsWith('ghp_')
    ) {
      console.log('✅ 평문 GitHub 토큰 사용 중 (암호화 비활성화)');
      return true;
    }

    // 암호화된 토큰 확인
    const encryptedToken = process.env.GITHUB_TOKEN_ENCRYPTED;
    if (!encryptedToken) {
      console.warn('⚠️ 암호화된 GitHub 토큰이 없습니다.');
      return false;
    }

    // 복호화 수행
    const decryptedToken = decrypt(encryptedToken);

    // 토큰 형식 검증
    if (!decryptedToken || !decryptedToken.startsWith('ghp_')) {
      console.error('❌ 복호화된 GitHub 토큰 형식이 올바르지 않습니다.');
      return false;
    }

    // 환경변수에 설정
    process.env.GITHUB_TOKEN = decryptedToken;
    console.log('✅ GitHub 토큰 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ GitHub 토큰 초기화 실패:', error);
    return false;
  }
}

/**
 * 🔐 모든 보안 토큰 초기화
 * 애플리케이션 시작 시 호출되는 메인 초기화 함수
 */
export function _initializeSecurityTokens(): boolean {
  console.log('🔐 보안 토큰 초기화 시작...');

  let success = true;

  // GitHub 토큰 초기화
  if (!_initializeGitHubToken()) {
    success = false;
  }

  // 향후 다른 토큰들 추가 가능
  // if (!_initializeOtherToken()) {
  //   success = false;
  // }

  if (success) {
    console.log('✅ 모든 보안 토큰 초기화 완료');
  } else {
    console.warn('⚠️ 일부 보안 토큰 초기화 실패');
  }

  return success;
}

/**
 * 🧹 보안 토큰 정리
 * 애플리케이션 종료 시 메모리에서 민감한 정보 제거
 */
export function cleanupSecurityTokens(): void {
  try {
    // 암호화된 토큰이 있는 경우에만 평문 토큰 제거
    if (process.env.GITHUB_TOKEN_ENCRYPTED && process.env.GITHUB_TOKEN) {
      delete process.env.GITHUB_TOKEN;
      console.log('🧹 GitHub 토큰 메모리 정리 완료');
    }
  } catch (error) {
    console.error('❌ 보안 토큰 정리 실패:', error);
  }
}

/**
 * 📊 보안 토큰 상태 확인
 */
export function getSecurityTokenStatus() {
  return {
    github: {
      hasEncrypted: !!process.env.GITHUB_TOKEN_ENCRYPTED,
      hasPlain: !!process.env.GITHUB_TOKEN,
      isValid: process.env.GITHUB_TOKEN?.startsWith('ghp_') || false,
    },
    // 향후 다른 토큰 상태 추가 가능
  };
}
