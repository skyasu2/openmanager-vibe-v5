#!/usr/bin/env node
/**
 * Gemini API 모델 유효성 테스트 스크립트
 * 각 모델의 Free Tier 접근 가능 여부 확인
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const apiKey = process.env.GEMINI_API_KEY_PRIMARY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ API Key not found in .env.local');
  console.error('   Required: GEMINI_API_KEY_PRIMARY or GOOGLE_AI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 테스트할 모델 목록 (2025년 기준 주요 모델)
const models = [
  // 1.5 세대 (안정적 Free Tier)
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',

  // 2.0 세대 (권장 Free Tier)
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-lite',

  // 2.5 세대 (축소된 Free Tier)
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-pro',
  'gemini-2.5-pro-preview-05-06',
];

async function testModel(modelName) {
  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "OK" in one word only');
    const text = result.response.text();
    const latency = Date.now() - startTime;
    return {
      model: modelName,
      status: '✅',
      response: text.trim().substring(0, 30),
      latency: `${latency}ms`
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMsg = error.message || String(error);
    // 에러 유형 분류
    let errorType = 'UNKNOWN';
    if (errorMsg.includes('not found') || errorMsg.includes('404')) {
      errorType = 'NOT_FOUND';
    } else if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      errorType = 'QUOTA_EXCEEDED';
    } else if (errorMsg.includes('permission') || errorMsg.includes('403')) {
      errorType = 'NO_ACCESS';
    } else if (errorMsg.includes('billing')) {
      errorType = 'BILLING_REQUIRED';
    }
    return {
      model: modelName,
      status: '❌',
      error: errorType,
      detail: errorMsg.substring(0, 60),
      latency: `${latency}ms`
    };
  }
}

async function main() {
  console.log('🔍 Gemini API 모델 유효성 테스트');
  console.log('=' .repeat(60));
  console.log(`📅 테스트 시간: ${new Date().toISOString()}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('=' .repeat(60));
  console.log('');

  const results = { valid: [], invalid: [] };

  for (const modelName of models) {
    process.stdout.write(`Testing ${modelName}... `);
    const result = await testModel(modelName);

    if (result.status === '✅') {
      console.log(`${result.status} (${result.latency}) → "${result.response}"`);
      results.valid.push(result);
    } else {
      console.log(`${result.status} ${result.error} (${result.latency})`);
      results.invalid.push(result);
    }

    // Rate limit 방지
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('');
  console.log('=' .repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('=' .repeat(60));

  console.log('\n✅ 유효한 모델 (Free Tier 접근 가능):');
  if (results.valid.length === 0) {
    console.log('   없음');
  } else {
    results.valid.forEach(r => console.log(`   • ${r.model} (${r.latency})`));
  }

  console.log('\n❌ 접근 불가 모델:');
  if (results.invalid.length === 0) {
    console.log('   없음');
  } else {
    results.invalid.forEach(r => console.log(`   • ${r.model}: ${r.error}`));
  }

  console.log('\n💡 권장 설정:');
  if (results.valid.length > 0) {
    const recommended = results.valid[0];
    console.log(`   PRIMARY: ${recommended.model}`);
    if (results.valid.length > 1) {
      console.log(`   FALLBACK: ${results.valid[1].model}`);
    }
  }

  // JSON 결과 저장
  const outputPath = join(__dirname, '../logs/gemini-model-test-results.json');
  const fs = await import('fs');
  fs.mkdirSync(join(__dirname, '../logs'), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    valid: results.valid.map(r => r.model),
    invalid: results.invalid.map(r => ({ model: r.model, error: r.error })),
    recommended: {
      primary: results.valid[0]?.model || null,
      fallback: results.valid[1]?.model || null
    }
  }, null, 2));
  console.log(`\n📄 결과 저장: ${outputPath}`);
}

main().catch(console.error);
