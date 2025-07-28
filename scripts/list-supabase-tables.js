import { createClient } from '@supabase/supabase-js';

// 환경변수에서 가져온 값들
const supabaseUrl = process.env.SUPABASE_URL || 'https://*****.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '[REDACTED]';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
  try {
    console.log('Fetching database tables...\n');

    // 알려진 테이블들을 직접 확인
    const knownTables = [
      'users',
      'profiles',
      'claude_usage',
      'api_usage',
      'incidents',
      'settings',
      'projects',
      'documents',
      'embeddings',
      'chat_history',
      'notifications',
      'audit_logs',
      'ai_assistants',
      'ai_responses',
      'knowledge_base',
      'rag_contexts',
      'vector_store',
      'ml_data_manager',
      'batch_jobs',
      'error_logs',
    ];

    console.log('테이블 존재 확인:\n');

    const existingTables = [];

    for (const tableName of knownTables) {
      try {
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          existingTables.push({ name: tableName, count: count || 0 });
          console.log(`✅ ${tableName} - 존재함 (행 수: ${count || 0})`);
        } else {
          console.log(`❌ ${tableName} - 존재하지 않거나 접근 불가`);
        }
      } catch (e) {
        console.log(`❌ ${tableName} - 오류 발생`);
      }
    }

    console.log('\n\n=== 데이터베이스 요약 ===');
    console.log(`총 ${existingTables.length}개의 테이블 확인됨\n`);

    // 테이블별 설명
    console.log('=== 테이블 설명 ===');
    const tableDescriptions = {
      users: 'GitHub OAuth 인증 사용자 정보',
      profiles: '사용자 프로필 및 설정',
      claude_usage: 'Claude API 사용량 추적',
      api_usage: '전체 API 사용 통계',
      incidents: '시스템 인시던트 및 오류 로그',
      settings: '시스템 설정 및 구성',
      projects: '프로젝트 메타데이터',
      documents: '문서 저장소',
      embeddings: 'pgvector 임베딩 데이터',
      chat_history: '대화 기록',
      notifications: '알림 및 이벤트',
      audit_logs: '감사 로그',
      ai_assistants: 'AI 어시스턴트 설정',
      ai_responses: 'AI 응답 기록',
      knowledge_base: '지식 베이스',
      rag_contexts: 'RAG 컨텍스트 캐시',
      vector_store: '벡터 저장소',
      ml_data_manager: 'ML 데이터 관리',
      batch_jobs: '배치 작업 큐',
      error_logs: '에러 로그',
    };

    existingTables.forEach(table => {
      const desc = tableDescriptions[table.name] || '설명 없음';
      console.log(`- ${table.name}: ${desc}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listTables();
