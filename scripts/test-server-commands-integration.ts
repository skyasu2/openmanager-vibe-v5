/**
 * serverCommandsConfig 통합 테스트
 * 
 * UnifiedAIEngineRouter가 serverCommandsConfig.ts의 
 * 서버별 명령어를 올바르게 사용하는지 확인
 */

import { getUnifiedAIRouter } from '../src/services/ai/UnifiedAIEngineRouter';

async function testServerCommandsIntegration() {
  const router = getUnifiedAIRouter();
  
  console.log('🧪 serverCommandsConfig 통합 테스트 시작\n');
  
  // 테스트 케이스 1: Nginx 서버 명령어
  console.log('📌 테스트 1: Nginx 서버 명령어 요청');
  const nginxResult = await router.getCommandRecommendations(
    'nginx 서버에서 로그 확인하는 명령어 알려줘',
    { maxRecommendations: 5 }
  );
  
  console.log('결과:');
  nginxResult.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.command}`);
    console.log(`     설명: ${rec.description}`);
    console.log(`     예시: ${rec.usage_example}`);
    console.log(`     신뢰도: ${(rec.confidence * 100).toFixed(1)}%\n`);
  });
  
  // 테스트 케이스 2: PostgreSQL 명령어
  console.log('\n📌 테스트 2: PostgreSQL 서버 명령어 요청');
  const pgResult = await router.getCommandRecommendations(
    'postgresql 데이터베이스 상태 확인 명령어',
    { maxRecommendations: 5 }
  );
  
  console.log('결과:');
  pgResult.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.command}`);
    console.log(`     설명: ${rec.description}`);
    console.log(`     예시: ${rec.usage_example}`);
    console.log(`     신뢰도: ${(rec.confidence * 100).toFixed(1)}%\n`);
  });
  
  // 테스트 케이스 3: 일반적인 CPU 모니터링
  console.log('\n📌 테스트 3: CPU 모니터링 명령어 (서버 미지정)');
  const cpuResult = await router.getCommandRecommendations(
    'CPU 사용률이 높을 때 확인할 명령어',
    { maxRecommendations: 5 }
  );
  
  console.log('결과:');
  cpuResult.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.command}`);
    console.log(`     설명: ${rec.description}`);
    console.log(`     예시: ${rec.usage_example}`);
    console.log(`     신뢰도: ${(rec.confidence * 100).toFixed(1)}%\n`);
  });
  
  // 테스트 케이스 4: PM2 Node.js 서버
  console.log('\n📌 테스트 4: PM2 Node.js 서버 명령어');
  const pm2Result = await router.getCommandRecommendations(
    'pm2로 node.js 프로세스 상태 확인',
    { maxRecommendations: 5 }
  );
  
  console.log('결과:');
  pm2Result.recommendations.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.command}`);
    console.log(`     설명: ${rec.description}`);
    console.log(`     예시: ${rec.usage_example}`);
    console.log(`     신뢰도: ${(rec.confidence * 100).toFixed(1)}%\n`);
  });
  
  // 분석 결과 출력
  console.log('\n📊 분석 결과:');
  console.log('- Nginx 서버 감지:', nginxResult.analysis.detectedCategories.join(', '));
  console.log('  - 특정 명령어:', nginxResult.analysis.specificCommands?.join(', ') || 'none');
  console.log('  - 신뢰도:', nginxResult.analysis.confidence);
  console.log('- PostgreSQL 서버 감지:', pgResult.analysis.detectedCategories.join(', '));
  console.log('  - 특정 명령어:', pgResult.analysis.specificCommands?.join(', ') || 'none');
  console.log('  - 신뢰도:', pgResult.analysis.confidence);
  console.log('- CPU 모니터링 카테고리:', cpuResult.analysis.detectedCategories.join(', '));
  console.log('  - 특정 명령어:', cpuResult.analysis.specificCommands?.join(', ') || 'none');
  console.log('  - 신뢰도:', cpuResult.analysis.confidence);
  console.log('- PM2 서버 감지:', pm2Result.analysis.detectedCategories.join(', '));
  console.log('  - 특정 명령어:', pm2Result.analysis.specificCommands?.join(', ') || 'none');
  console.log('  - 신뢰도:', pm2Result.analysis.confidence);
  
  console.log('\n✅ serverCommandsConfig 통합 테스트 완료!');
}

// 테스트 실행
testServerCommandsIntegration().catch(console.error);