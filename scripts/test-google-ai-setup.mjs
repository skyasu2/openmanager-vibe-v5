#!/usr/bin/env node

/**
 * 🔑 Google AI API 키 설정 및 테스트 스크립트
 */

import fetch from 'node-fetch';
import readline from 'readline';

const API_BASE = 'http://localhost:3001/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function testGoogleAISetup() {
  console.log('🔑 Google AI API 키 설정 및 테스트 시작...\n');

  try {
    // 1. 현재 상태 확인
    console.log('1️⃣ 현재 Google AI 상태 확인...');
    const statusResponse = await fetch(`${API_BASE}/ai/google-ai/config`);

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ 현재 상태:', {
        hasKey: statusData.hasGoogleAIKey,
        status: statusData.status,
        keysCount: statusData.encryptedKeysCount,
      });
    } else {
      console.error('❌ 상태 확인 실패:', statusResponse.status);
    }

    // 2. API 키 입력 받기
    console.log('\n2️⃣ Google AI API 키 설정...');
    console.log(
      '💡 Google AI Studio (https://aistudio.google.com)에서 API 키를 발급받으세요.'
    );
    console.log('💡 AIza로 시작하는 39자리 키여야 합니다.');

    const apiKey = await askQuestion(
      '🔑 Google AI API 키를 입력하세요 (또는 Enter로 건너뛰기): '
    );

    if (apiKey && apiKey.trim()) {
      // 3. API 키 설정
      console.log('\n3️⃣ API 키 설정 중...');
      const setResponse = await fetch(`${API_BASE}/ai/google-ai/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          apiKey: apiKey.trim(),
        }),
      });

      if (setResponse.ok) {
        const setData = await setResponse.json();
        console.log('✅ API 키 설정 성공:', {
          success: setData.success,
          message: setData.message,
          connectionTest: setData.connectionTest,
        });
      } else {
        const errorData = await setResponse.json();
        console.error('❌ API 키 설정 실패:', {
          status: setResponse.status,
          error: errorData.error,
          details: errorData.details,
        });
      }
    } else {
      console.log('⏭️ API 키 설정을 건너뛰었습니다.');
    }

    // 4. 연결 테스트
    console.log('\n4️⃣ Google AI 연결 테스트...');
    const testResponse = await fetch(`${API_BASE}/ai/google-ai/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
      }),
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ 연결 테스트 결과:', {
        success: testData.success,
        connectionTest: testData.connectionTest,
      });
    } else {
      const errorData = await testResponse.json();
      console.error('❌ 연결 테스트 실패:', {
        status: testResponse.status,
        error: errorData.error,
      });
    }

    // 5. 전체 AI 엔진 상태 재확인
    console.log('\n5️⃣ 전체 AI 엔진 상태 재확인...');
    const healthResponse = await fetch(`${API_BASE}/ai/health`);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ 전체 AI 엔진 상태:', {
        mcp: healthData.mcp?.status,
        rag: healthData.rag?.status,
        google_ai: healthData.google_ai?.status,
        overall: healthData.overall_status,
      });
    } else {
      console.error('❌ 전체 상태 확인 실패:', healthResponse.status);
    }
  } catch (error) {
    console.error('❌ Google AI 설정 테스트 실패:', error.message);
  } finally {
    rl.close();
  }
}

testGoogleAISetup();
