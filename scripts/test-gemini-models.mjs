#!/usr/bin/env node
/**
 * Gemini API 모델 유효성 테스트 스크립트 (Updated)
 * - 환경변수 로딩 개선
 * - 최신 모델 리스트 반영
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const apiKey = process.env.GEMINI_API_KEY_PRIMARY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ API Key not found in .env.local');
  console.error('   Required: GEMINI_API_KEY_PRIMARY or GOOGLE_AI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 모델 리스트 관리 (2025년 기준)
const models = [
  // 1.5 Series (Stable)
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  
  // 2.0 Series (Experimental/Preview)
  'gemini-2.0-flash-exp',
  
  // Legacy/Other
  'gemini-pro',
  'gemini-pro-vision'
];

async function testModel(modelName) {
  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "OK"');
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
    let errorType = 'UNKNOWN';
    
    if (errorMsg.includes('not found') || errorMsg.includes('404')) errorType = 'NOT_FOUND';
    else if (errorMsg.includes('quota') || errorMsg.includes('429')) errorType = 'QUOTA_EXCEEDED';
    else if (errorMsg.includes('permission') || errorMsg.includes('403')) errorType = 'NO_ACCESS';
    else if (errorMsg.includes('billing')) errorType = 'BILLING_REQUIRED';
    
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
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
  console.log('=' .repeat(60));

  const results = { valid: [], invalid: [] };

  for (const modelName of models) {
    process.stdout.write(`Testing ${modelName.padEnd(25)} `);
    const result = await testModel(modelName);

    if (result.status === '✅') {
      console.log(`➔ ${result.status} (${result.latency})`);
      results.valid.push(result);
    } else {
      console.log(`➔ ${result.status} ${result.error}`);
      results.invalid.push(result);
    }
    
    // Rate limit mitigation
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary logic...
  console.log('\n📊 결과 요약');
  console.log(`✅ 유효: ${results.valid.length}, ❌ 불가: ${results.invalid.length}`);
  
  // Save log
  const logDir = join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  
  const outputPath = join(logDir, 'gemini-model-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  console.log(`📄 로그 저장됨: ${outputPath}`);
}

main().catch(console.error);
