/**
 * 🧪 AI 엔진 간단 테스트 스크립트
 * SimplifiedQueryEngine의 기본 동작을 확인
 */

import { SimplifiedQueryEngine } from './services/ai/SimplifiedQueryEngine';
import type { ServerInstance } from './types/data-generator';

// 테스트용 서버 데이터
const mockServers: ServerInstance[] = [
  {
    id: 'srv-001',
    name: 'web-server-01',
    type: 'web',
    status: 'healthy',
    cpu: 75,
    memory: 60,
    disk: 45,
    network: 150,  // 네트워크 사용량 평균값
    location: 'Seoul',
    uptime: 99.9,
    lastUpdated: new Date().toISOString(),
    lastCheck: new Date().toISOString(),
    environment: 'production',
    region: 'ap-northeast-2',
    version: '1.0.0',
    isResponding: true,
    responseTime: 50,
    health: {
      score: 95,
      status: 'healthy',
      issues: [],
      trend: [90, 92, 95],
    },
    tags: ['production', 'web'],
    alerts: 0,
    provider: 'AWS',
  } as ServerInstance,
  {
    id: 'srv-002',
    name: 'db-server-01',
    type: 'database',
    status: 'warning',
    cpu: 92,
    memory: 88,
    disk: 78,
    network: 40,  // 네트워크 사용량 평균값
    location: 'Seoul',
    uptime: 98.5,
    lastUpdated: new Date().toISOString(),
    lastCheck: new Date().toISOString(),
    environment: 'production',
    region: 'ap-northeast-2',
    version: '1.0.0',
    isResponding: true,
    responseTime: 120,
    health: {
      score: 70,
      status: 'warning',
      issues: ['High CPU usage detected'],
      trend: [85, 78, 70],
    },
    tags: ['production', 'database'],
    alerts: 1,
    provider: 'AWS',
  } as ServerInstance,
];

async function testAIEngine() {
  console.log('🧪 AI 엔진 테스트 시작...\n');
  
  const engine = new SimplifiedQueryEngine();
  await engine.initialize();
  
  // 테스트 케이스들
  const testCases = [
    {
      name: 'CPU 사용률 질의',
      query: '현재 CPU 사용률이 높은 서버는?',
    },
    {
      name: '메모리 명령어 질의',
      query: '메모리 문제가 있는 서버 확인 명령어는?',
    },
    {
      name: '서버 상태 요약',
      query: '전체 서버 상태를 요약해줘',
    },
    {
      name: '빈 질의 처리',
      query: '',
    },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 테스트: ${testCase.name}`);
    console.log(`질의: "${testCase.query}"`);
    console.log('-'.repeat(50));
    
    try {
      const response = await engine.query({
        query: testCase.query,
        mode: 'local',
        context: { servers: mockServers },
      });
      
      if (response.success) {
        console.log('✅ 성공');
        console.log(`응답: ${response.answer.substring(0, 100)}...`);
        console.log(`신뢰도: ${response.confidence}`);
        console.log(`생각 단계: ${response.thinkingSteps.length}개`);
        response.thinkingSteps.forEach((step, idx) => {
          console.log(`  ${idx + 1}. ${step.step} (${step.status})`);
        });
      } else {
        console.log('❌ 실패');
        console.log(`에러: ${response.error}`);
      }
    } catch (error) {
      console.error('💥 예외 발생:', error);
    }
  }
  
  console.log('\n\n🎉 테스트 완료!');
}

// 스크립트 실행
testAIEngine().catch(console.error);