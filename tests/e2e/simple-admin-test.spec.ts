import { test, expect } from '@playwright/test';

/**
 * 🚀 간소화된 관리자 모드 테스트
 * 보안 API를 활용한 효율적 테스트 검증
 */

test.describe('간소화된 관리자 모드 테스트', () => {
  
  test('🔍 테스트 API 가용성 확인', async ({ page }) => {
    await page.goto('/');
    
    // 테스트 API 상태 확인
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/test/admin-auth', {
        headers: {
          'User-Agent': 'Playwright Test Agent'
        }
      });
      return {
        status: res.status,
        data: await res.json()
      };
    });

    expect(response.status).toBe(200);
    expect(response.data.available).toBe(true);
    expect(response.data.environment).toBe('development');

    console.log('✅ 테스트 API 가용성 확인 완료:', response.data);
  });

  test('🔒 보안 강화된 관리자 인증 (우회 모드)', async ({ page }) => {
    await page.goto('/');
    
    // 보안 토큰 생성
    const testToken = `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // 보안 강화된 API 호출
    const authResponse = await page.evaluate(async (token) => {
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify({
          bypass: true,
          token
        })
      });
      
      return await response.json();
    }, testToken);

    // 인증 결과 검증
    expect(authResponse.success).toBe(true);
    expect(authResponse.mode).toBe('test_bypass');
    expect(authResponse.adminMode).toBe(true);

    console.log('✅ 보안 강화된 관리자 인증 완료:', authResponse.mode);
  });

  test('🔐 비밀번호 인증 방식 검증', async ({ page }) => {
    await page.goto('/');
    
    // 보안 토큰 생성
    const testToken = `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // 비밀번호 인증 시도
    const authResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify({
          password: data.password,
          token: data.token
        })
      });
      
      return await response.json();
    }, { password: '4231', token: testToken });

    // 인증 결과 검증
    expect(authResponse.success).toBe(true);
    expect(authResponse.mode).toBe('password_auth');

    console.log('✅ 비밀번호 인증 방식 검증 완료');
  });

  test('🛡️ 보안: 잘못된 비밀번호 차단', async ({ page }) => {
    await page.goto('/');
    
    // 보안 토큰 생성
    const testToken = `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // 잘못된 비밀번호로 인증 시도
    const authResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify({
          password: data.password,
          token: data.token
        })
      });
      
      return await response.json();
    }, { password: 'wrong_password', token: testToken });

    // 보안 차단 확인
    expect(authResponse.success).toBe(false);
    expect(authResponse.error).toBe('INVALID_PASSWORD');

    console.log('✅ 보안 검증 완료: 잘못된 비밀번호 차단');
  });

  test('⚡ 성능: API 응답 시간 측정', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // 보안 토큰 생성
    const testToken = `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // API 호출
    const authResponse = await page.evaluate(async (token) => {
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify({
          bypass: true,
          token
        })
      });
      
      return await response.json();
    }, testToken);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // 성능 검증
    expect(authResponse.success).toBe(true);
    expect(responseTime).toBeLessThan(2000); // 2초 이내

    console.log(`⚡ API 응답 시간: ${responseTime}ms (목표: 2초 이내)`);
  });

  test('📊 5-Layer 보안 시스템 검증', async ({ page }) => {
    await page.goto('/');
    
    // 1. 잘못된 토큰 패턴 테스트
    const invalidTokenResponse = await page.evaluate(async () => {
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify({
          bypass: true,
          token: 'invalid_token_pattern'
        })
      });
      
      return await response.json();
    });

    expect(invalidTokenResponse.success).toBe(false);
    expect(invalidTokenResponse.error).toBe('INVALID_TOKEN');

    // 2. 만료된 토큰 테스트 (24시간 이전)
    const expiredToken = `test_${Date.now() - 25 * 60 * 60 * 1000}_expired`; // 25시간 전
    
    const expiredTokenResponse = await page.evaluate(async (token) => {
      const response = await fetch('/api/test/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Playwright Test Agent'
        },
        body: JSON.stringify({
          bypass: true,
          token
        })
      });
      
      return await response.json();
    }, expiredToken);

    expect(expiredTokenResponse.success).toBe(false);
    expect(expiredTokenResponse.error).toBe('TOKEN_EXPIRED');

    console.log('🛡️ 5-Layer 보안 시스템 검증 완료');
  });
});