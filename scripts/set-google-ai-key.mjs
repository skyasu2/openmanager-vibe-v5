#!/usr/bin/env node

/**
 * 🔑 Google AI API 키 직접 설정 스크립트
 */

const API_KEY = 'YOUR_GOOGLE_AI_API_KEY_HERE';
const API_URL = 'http://localhost:3001/api/ai/google-ai/config';

async function setGoogleAIKey() {
  console.log('🔑 Google AI API 키 설정 중...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        action: 'set',
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Google AI API 키 설정 성공!');
      console.log('📊 연결 테스트 결과:', result.connectionTest);
    } else {
      console.log('❌ API 키 설정 실패:', result.error);
      if (result.details) {
        console.log('📝 상세 정보:', result.details);
      }
    }

    // 설정 후 상태 확인
    console.log('\n🔍 설정 상태 확인 중...');
    const statusResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const statusResult = await statusResponse.json();
    console.log('📊 현재 상태:', statusResult);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
setGoogleAIKey();
