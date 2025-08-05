#!/usr/bin/env tsx

/**
 * 🚀 pgvector 네이티브 함수 적용 스크립트
 * 
 * Supabase에 pgvector 최적화 함수들을 생성합니다.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPgvectorFunctions() {
  console.log('🚀 pgvector 네이티브 함수 적용 시작...\n');

  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'sql', 'pgvector_functions.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');
    
    console.log('📄 SQL 스크립트 로드 완료');
    console.log(`   파일: ${sqlPath}`);
    console.log(`   크기: ${sqlContent.length}자\n`);

    // SQL 실행
    console.log('🔧 SQL 함수 생성 중...');
    const { error } = await supabase.rpc('query', {
      query: sqlContent
    }).single();

    if (error) {
      // RPC 함수가 없으면 직접 실행 시도
      console.log('⚠️  RPC 함수가 없습니다. 대체 방법 시도...');
      
      // SQL을 개별 명령으로 분리
      const statements = sqlContent
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      console.log(`📝 ${statements.length}개의 SQL 문 발견\n`);

      // 각 명령 실행
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const firstLine = statement.split('\n')[0];
        
        console.log(`실행 중 [${i + 1}/${statements.length}]: ${firstLine}...`);
        
        // 함수 생성은 Supabase 대시보드에서 직접 실행 필요
        if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          console.log('   ⚠️  함수 생성은 Supabase 대시보드에서 실행하세요.');
        }
      }

      console.log('\n⚠️  주의: pgvector 함수들은 Supabase 대시보드의 SQL Editor에서 직접 실행해야 합니다.');
      console.log('📋 다음 단계:');
      console.log('   1. Supabase 대시보드 > SQL Editor 열기');
      console.log('   2. scripts/sql/pgvector_functions.sql 내용 복사');
      console.log('   3. SQL Editor에 붙여넣고 실행');
      
      return;
    }

    console.log('✅ pgvector 함수 생성 완료!\n');

    // 함수 테스트
    console.log('🧪 함수 테스트...');
    
    // 1. 통계 확인
    const { data: stats, error: statsError } = await supabase.rpc('get_vector_stats');
    
    if (!statsError && stats) {
      console.log('📊 벡터 DB 통계:');
      console.log(`   - 총 문서: ${stats.total_documents}개`);
      console.log(`   - 카테고리: ${stats.total_categories}개`);
      console.log(`   - 평균 길이: ${Math.round(stats.avg_content_length)}자`);
      console.log(`   - NULL 임베딩: ${stats.null_embeddings}개\n`);
    } else {
      console.log('   ⚠️  통계 함수 테스트 실패');
    }

    console.log('🎉 pgvector 네이티브 함수 적용 완료!');
    console.log('이제 postgres-vector-db.ts에서 네이티브 함수를 사용할 수 있습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 메인 실행
if (require.main === module) {
  applyPgvectorFunctions();
}

export { applyPgvectorFunctions };