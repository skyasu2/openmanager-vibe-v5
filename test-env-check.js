#!/usr/bin/env node

/**
 * 🔍 환경변수 직접 확인 스크립트
 */

console.log('🔍 환경변수 확인...\n');

console.log('1. 직접 환경변수 확인:');
console.log(
  `   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '설정됨 (' + process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...)' : '설정되지 않음'}`
);
console.log(`   GOOGLE_AI_ENABLED: ${process.env.GOOGLE_AI_ENABLED}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

console.log('\n2. .env.local 파일 직접 읽기:');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    const googleAILine = lines.find(line =>
      line.startsWith('GOOGLE_AI_API_KEY=')
    );
    if (googleAILine) {
      const value = googleAILine.split('=')[1];
      console.log(
        `   GOOGLE_AI_API_KEY in .env.local: ${value ? '설정됨 (' + value.substring(0, 10) + '...)' : '값 없음'}`
      );
    } else {
      console.log('   GOOGLE_AI_API_KEY in .env.local: 라인 없음');
    }
  } else {
    console.log('   .env.local 파일이 존재하지 않음');
  }
} catch (error) {
  console.log(`   .env.local 읽기 실패: ${error.message}`);
}

console.log('\n3. Google AI 매니저 테스트:');
try {
  // 동적 import 사용
  import('./src/lib/google-ai-manager.js')
    .then(module => {
      const { googleAIManager, isGoogleAIAvailable } = module;

      console.log(`   isGoogleAIAvailable(): ${isGoogleAIAvailable()}`);
      console.log(
        `   googleAIManager.getAPIKey(): ${googleAIManager.getAPIKey() ? '키 있음' : '키 없음'}`
      );
      console.log(
        `   googleAIManager.getKeyStatus():`,
        googleAIManager.getKeyStatus()
      );
    })
    .catch(error => {
      console.log(`   Google AI 매니저 import 실패: ${error.message}`);
    });
} catch (error) {
  console.log(`   Google AI 매니저 테스트 실패: ${error.message}`);
}
