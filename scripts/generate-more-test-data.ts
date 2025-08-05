/**
 * 🎯 대량 테스트 데이터 생성 스크립트
 * 
 * pgvector 성능 테스트를 위한 1000개의 샘플 문서 생성
 */

import { getSupabaseRAGEngine } from '../src/services/ai/supabase-rag-engine';

async function generateBulkTestData() {
  console.log('🎯 대량 테스트 데이터 생성 시작...\n');

  const ragEngine = getSupabaseRAGEngine();

  // 서버 타입
  const serverTypes = ['웹서버', 'API서버', 'DB서버', '캐시서버', '로드밸런서'];
  const metrics = ['CPU', '메모리', '디스크', '네트워크', '응답시간'];
  const statuses = ['정상', '경고', '위험', '점검중'];
  const actions = ['확인', '분석', '최적화', '모니터링'];
  
  // 템플릿
  const templates = [
    '{server}의 {metric} {action} 방법을 알려주세요',
    '{server}에서 {metric}이 {status} 상태입니다. 어떻게 해야 하나요?',
    '{metric} 사용률이 높은 {server}를 {action}하는 방법은?',
    '{server}의 {metric} {status} 알림이 발생했습니다',
    '실시간으로 {server}의 {metric}을 {action}하려면 어떻게 해야 하나요?',
    '{server} {metric} 성능을 개선하는 방법',
    '{status} 상태인 {server}의 {metric} 문제 해결',
    '{server} 클러스터에서 {metric} 로드 밸런싱',
    '자동으로 {server}의 {metric}을 {action}하는 설정',
    '{server}의 {metric} 임계값 설정 가이드'
  ];

  const documents = [];
  let docId = 100; // 기존 문서와 겹치지 않게

  // 1000개 문서 생성
  for (let i = 0; i < 1000; i++) {
    const server = serverTypes[Math.floor(Math.random() * serverTypes.length)];
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const template = templates[Math.floor(Math.random() * templates.length)];

    const content = template
      .replace('{server}', server)
      .replace('{metric}', metric)
      .replace('{status}', status)
      .replace('{action}', action);

    // 추가 컨텍스트 생성
    const details = [];
    if (Math.random() > 0.5) {
      details.push(`${server}는 현재 ${Math.floor(Math.random() * 10 + 1)}대가 운영 중입니다.`);
    }
    if (Math.random() > 0.5) {
      details.push(`${metric} 사용률은 ${Math.floor(Math.random() * 100)}% 입니다.`);
    }
    if (Math.random() > 0.5) {
      details.push(`최근 ${Math.floor(Math.random() * 24 + 1)}시간 동안의 평균값을 기준으로 합니다.`);
    }

    const fullContent = content + ' ' + details.join(' ');

    documents.push({
      id: `doc_generated_${docId++}`,
      content: fullContent,
      metadata: {
        category: 'server_monitoring',
        server_type: server,
        metric_type: metric,
        status_type: status,
        action_type: action,
        generated: true,
        batch: Math.floor(i / 100) + 1,
        timestamp: new Date().toISOString()
      }
    });

    // 10개마다 진행상황 표시
    if ((i + 1) % 100 === 0) {
      console.log(`📊 ${i + 1}/1000 문서 준비 완료...`);
    }
  }

  console.log('\n🚀 대량 인덱싱 시작...');

  // 100개씩 배치로 인덱싱
  const batchSize = 100;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1}/10 인덱싱 중...`);
    
    const result = await ragEngine.bulkIndex(batch);
    totalSuccess += result.success;
    totalFailed += result.failed;
    
    console.log(`  ✅ 성공: ${result.success}, ❌ 실패: ${result.failed}`);
    
    // 배치 간 잠시 대기 (rate limiting 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ 대량 데이터 생성 완료!');
  console.log(`  - 총 성공: ${totalSuccess}개`);
  console.log(`  - 총 실패: ${totalFailed}개`);

  // 통계 확인
  const health = await ragEngine.healthCheck();
  console.log('\n🏥 최종 RAG 엔진 상태:');
  console.log(`  - 총 문서 수: ${health.totalDocuments}`);
  console.log(`  - 벡터 DB: ${health.vectorDB ? '정상' : '오류'}`);
  console.log(`  - 캐시 크기: ${health.cacheSize}`);

  // 카테고리별 통계
  console.log('\n📊 생성된 데이터 분포:');
  console.log(`  - 서버 타입: ${serverTypes.length}종`);
  console.log(`  - 메트릭: ${metrics.length}종`);
  console.log(`  - 상태: ${statuses.length}종`);
  console.log(`  - 액션: ${actions.length}종`);
  console.log(`  - 배치: 10개 (각 100개 문서)`);
}

// 실행
generateBulkTestData()
  .then(() => {
    console.log('\n🎉 스크립트 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실패:', error);
    process.exit(1);
  });