/**
 * 🔐 GitHub PAT 토큰 보안 관리
 * 암호화된 토큰을 안전하게 복호화하여 사용
 */

import { decrypt } from './encryption';

/**
 * 🔑 GitHub PAT 토큰 안전하게 가져오기
 */
export function getSecureGitHubToken(): string | null {
  try {
    // 1. 평문 토큰 우선 확인 (개발 편의성)
    const plainToken = process.env.GITHUB_TOKEN;
    if (plainToken && plainToken.startsWith('ghp_')) {
      console.log('✅ 평문 GitHub 토큰 사용 중');
      return plainToken;
    }

    // 2. 암호화된 토큰 확인 (fallback)
    const encryptedToken = process.env.GITHUB_TOKEN_ENCRYPTED;
    if (encryptedToken) {
      console.log('🔐 암호화된 토큰 복호화 시도...');
      const decryptedToken = decrypt(encryptedToken);

      // 토큰 형식 검증
      if (decryptedToken && decryptedToken.startsWith('ghp_')) {
        return decryptedToken;
      } else {
        console.warn('⚠️ 복호화된 GitHub 토큰 형식이 올바르지 않습니다.');
        return null;
      }
    }

    console.warn('🔑 GitHub PAT 토큰을 찾을 수 없습니다.');
    return null;
  } catch (error) {
    console.error('🔑 GitHub PAT 토큰 처리 실패:', error);
    return null;
  }
}

/**
 * 🧪 GitHub 토큰 유효성 검사
 */
export function validateGitHubToken(token: string): boolean {
  if (!token) return false;

  // GitHub PAT 토큰 형식 검증
  if (!token.startsWith('ghp_')) return false;

  // 길이 검증 (일반적으로 40자)
  if (token.length < 30 || token.length > 50) return false;

  return true;
}

/**
 * 📊 GitHub 토큰 상태 확인
 */
export function getGitHubTokenStatus() {
  try {
    const hasEncryptedToken = !!process.env.GITHUB_TOKEN_ENCRYPTED;
    const hasPlainToken = !!process.env.GITHUB_TOKEN;
    const token = getSecureGitHubToken();
    const isValid = token ? validateGitHubToken(token) : false;

    return {
      hasToken: !!token,
      isEncrypted: hasEncryptedToken,
      isPlainText: hasPlainToken && !hasEncryptedToken,
      isValid,
      tokenPreview: token
        ? `${token.substring(0, 10)}...${token.substring(-4)}`
        : 'none',
      source: hasEncryptedToken
        ? 'encrypted'
        : hasPlainToken
          ? 'plain'
          : 'none',
    };
  } catch (error) {
    console.error('GitHub 토큰 상태 확인 실패:', error);
    return {
      hasToken: false,
      isEncrypted: false,
      isPlainText: false,
      isValid: false,
      tokenPreview: 'error',
      source: 'error',
    };
  }
}

/**
 * 🔐 MCP 서버용 GitHub 토큰 환경변수 설정
 * MCP 서버가 복호화된 토큰을 사용할 수 있도록 임시 환경변수 설정
 */
export function setupGitHubTokenForMCP(): boolean {
  try {
    const token = getSecureGitHubToken();
    if (!token) {
      console.warn('⚠️ MCP용 GitHub 토큰 설정 실패: 토큰이 없습니다.');
      return false;
    }

    // MCP 서버가 사용할 수 있도록 임시 환경변수 설정
    process.env.GITHUB_TOKEN = token;
    console.log('✅ MCP 서버용 GitHub 토큰 설정 완료');
    return true;
  } catch (error) {
    console.error('❌ MCP용 GitHub 토큰 설정 실패:', error);
    return false;
  }
}

/**
 * 🧹 MCP 서버용 임시 토큰 정리
 * 보안을 위해 사용 후 임시 환경변수 제거
 */
export function cleanupGitHubTokenForMCP(): void {
  try {
    if (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN_ENCRYPTED) {
      // 암호화된 토큰이 있는 경우에만 평문 토큰 제거
      delete process.env.GITHUB_TOKEN;
      console.log('🧹 MCP용 임시 GitHub 토큰 정리 완료');
    }
  } catch (error) {
    console.error('❌ MCP용 GitHub 토큰 정리 실패:', error);
  }
}
