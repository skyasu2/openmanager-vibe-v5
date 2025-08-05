/**
 * 🌱 벡터 DB 시드 데이터 생성 스크립트
 * 
 * pgvector 성능 테스트를 위한 샘플 데이터 생성
 */

import { getSupabaseRAGEngine } from '../src/services/ai/supabase-rag-engine';

async function seedVectorDB() {
  console.log('🌱 벡터 DB 시드 데이터 생성 시작...\n');

  const ragEngine = getSupabaseRAGEngine();

  // 서버 모니터링 관련 샘플 문서들
  const documents = [
    // 서버 상태 관련
    {
      id: 'doc_server_status_1',
      content: '서버 상태를 확인하는 방법: 대시보드에서 실시간 모니터링 뷰를 통해 서버 상태를 확인할 수 있습니다. 정상, 경고, 위험 상태가 색상으로 표시됩니다.',
      metadata: {
        category: 'server_monitoring',
        tags: ['서버', '상태', '모니터링'],
        source: 'manual',
        language: 'ko'
      }
    },
    {
      id: 'doc_server_status_2',
      content: '서버 상태 확인 API: GET /api/servers/status 엔드포인트를 사용하여 프로그래밍 방식으로 서버 상태를 조회할 수 있습니다.',
      metadata: {
        category: 'api_reference',
        tags: ['API', '서버', '상태'],
        source: 'api_docs',
        language: 'ko'
      }
    },
    
    // CPU 관련
    {
      id: 'doc_cpu_1',
      content: 'CPU 사용률이 높은 서버 찾기: 대시보드의 필터 기능을 사용하여 CPU 사용률이 80% 이상인 서버들을 쉽게 찾을 수 있습니다. 임계값 설정도 가능합니다.',
      metadata: {
        category: 'server_monitoring',
        tags: ['CPU', '사용률', '필터링'],
        source: 'manual',
        language: 'ko'
      }
    },
    {
      id: 'doc_cpu_2',
      content: 'CPU 사용률 최적화: 높은 CPU 사용률을 보이는 프로세스를 식별하고, 불필요한 서비스를 중단하며, 로드 밸런싱을 통해 부하를 분산시킬 수 있습니다.',
      metadata: {
        category: 'optimization',
        tags: ['CPU', '최적화', '성능'],
        source: 'best_practices',
        language: 'ko'
      }
    },
    
    // 메모리 관련
    {
      id: 'doc_memory_1',
      content: '메모리 부족 경고 설정: 시스템 설정에서 메모리 사용률 임계값을 설정할 수 있습니다. 기본값은 85%이며, 이를 초과하면 자동으로 경고 알림이 발송됩니다.',
      metadata: {
        category: 'alerts',
        tags: ['메모리', '경고', '알림'],
        source: 'manual',
        language: 'ko'
      }
    },
    {
      id: 'doc_memory_2',
      content: '메모리 누수 진단: 지속적으로 메모리 사용량이 증가하는 패턴을 감지하면 메모리 누수 가능성이 있습니다. 프로세스별 메모리 사용 추이를 분석하세요.',
      metadata: {
        category: 'troubleshooting',
        tags: ['메모리', '누수', '진단'],
        source: 'troubleshooting_guide',
        language: 'ko'
      }
    },
    
    // 네트워크 관련
    {
      id: 'doc_network_1',
      content: '네트워크 트래픽 분석: 실시간 네트워크 모니터링을 통해 인바운드/아웃바운드 트래픽을 분석할 수 있습니다. 비정상적인 트래픽 패턴을 자동으로 감지합니다.',
      metadata: {
        category: 'network',
        tags: ['네트워크', '트래픽', '분석'],
        source: 'manual',
        language: 'ko'
      }
    },
    {
      id: 'doc_network_2',
      content: '네트워크 대역폭 최적화: CDN 활용, 압축 적용, 캐싱 전략을 통해 네트워크 대역폭을 효율적으로 사용할 수 있습니다.',
      metadata: {
        category: 'optimization',
        tags: ['네트워크', '대역폭', '최적화'],
        source: 'best_practices',
        language: 'ko'
      }
    },
    
    // 데이터베이스 관련
    {
      id: 'doc_database_1',
      content: '데이터베이스 응답 시간 모니터링: 쿼리 실행 시간, 커넥션 풀 상태, 슬로우 쿼리 로그를 통해 데이터베이스 성능을 모니터링할 수 있습니다.',
      metadata: {
        category: 'database',
        tags: ['데이터베이스', '응답시간', '모니터링'],
        source: 'manual',
        language: 'ko'
      }
    },
    {
      id: 'doc_database_2',
      content: '데이터베이스 성능 튜닝: 인덱스 최적화, 쿼리 개선, 커넥션 풀 설정 조정을 통해 데이터베이스 응답 시간을 단축할 수 있습니다.',
      metadata: {
        category: 'database',
        tags: ['데이터베이스', '성능', '튜닝'],
        source: 'best_practices',
        language: 'ko'
      }
    },
    
    // 추가 문서들
    {
      id: 'doc_general_1',
      content: '실시간 모니터링 대시보드: 모든 서버의 상태를 한눈에 볼 수 있는 통합 대시보드를 제공합니다. CPU, 메모리, 디스크, 네트워크 메트릭을 실시간으로 확인하세요.',
      metadata: {
        category: 'features',
        tags: ['대시보드', '실시간', '모니터링'],
        source: 'product_overview',
        language: 'ko'
      }
    },
    {
      id: 'doc_general_2',
      content: 'AI 기반 이상 징후 감지: 머신러닝 알고리즘을 사용하여 정상 패턴에서 벗어난 이상 징후를 자동으로 감지하고 알림을 발송합니다.',
      metadata: {
        category: 'ai_features',
        tags: ['AI', '이상징후', '감지'],
        source: 'product_overview',
        language: 'ko'
      }
    }
  ];

  console.log(`📚 ${documents.length}개 문서 인덱싱 시작...\n`);

  // 대량 인덱싱
  const result = await ragEngine.bulkIndex(documents);
  
  console.log(`\n✅ 인덱싱 완료!`);
  console.log(`  - 성공: ${result.success}개`);
  console.log(`  - 실패: ${result.failed}개`);

  if (result.failed > 0) {
    console.log('\n⚠️  일부 문서 인덱싱에 실패했습니다.');
  }

  // 헬스체크
  const health = await ragEngine.healthCheck();
  console.log('\n🏥 RAG 엔진 상태:');
  console.log(`  - 상태: ${health.status}`);
  console.log(`  - 벡터 DB: ${health.vectorDB ? '정상' : '오류'}`);
  console.log(`  - 총 문서 수: ${health.totalDocuments}`);
  console.log(`  - 캐시 크기: ${health.cacheSize}`);

  console.log('\n✅ 시드 데이터 생성 완료!');
}

// 실행
seedVectorDB()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 시드 데이터 생성 실패:', error);
    process.exit(1);
  });