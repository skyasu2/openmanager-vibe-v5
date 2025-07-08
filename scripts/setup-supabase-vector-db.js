#!/usr/bin/env node

/**
 * 🚀 Supabase 벡터 DB 자동 설정 스크립트
 * 
 * pgvector 확장, 테이블, 인덱스, RPC 함수를 모두 설정합니다.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function setupSupabaseVectorDB() {
    console.log('🚀 Supabase 벡터 DB 설정 시작...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase 환경변수가 설정되지 않았습니다');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('🔧 1단계: pgvector 확장 활성화...');

        // pgvector 확장 활성화 (RPC로 시도)
        const { data: extensionResult, error: extensionError } = await supabase
            .rpc('exec_sql', {
                sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
            });

        if (extensionError) {
            console.warn('⚠️ pgvector 확장 활성화 실패 (이미 활성화되었을 수 있음):', extensionError.message);
        } else {
            console.log('✅ pgvector 확장 활성화 완료');
        }

        console.log('\n🗄️ 2단계: command_vectors 테이블 생성...');

        // 테이블 생성 SQL
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS command_vectors (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                metadata JSONB NOT NULL,
                embedding vector(384),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;

        const { data: tableResult, error: tableError } = await supabase
            .rpc('exec_sql', { sql: createTableSQL });

        if (tableError) {
            console.warn('⚠️ 테이블 생성 실패, 직접 생성 시도:', tableError.message);

            // 직접 테이블 접근으로 확인
            const { data: testData, error: testError } = await supabase
                .from('command_vectors')
                .select('count')
                .limit(1);

            if (testError && testError.code === '42P01') {
                console.error('❌ 테이블이 존재하지 않고 생성도 실패했습니다');
                console.log('   → Supabase Dashboard에서 수동으로 SQL을 실행해주세요');
                console.log('   → infra/database/sql/setup-vector-database.sql');
                return;
            } else {
                console.log('✅ 테이블이 이미 존재합니다');
            }
        } else {
            console.log('✅ command_vectors 테이블 생성 완료');
        }

        console.log('\n📊 3단계: 벡터 인덱스 생성...');

        // 인덱스 생성 SQL
        const createIndexSQL = `
            CREATE INDEX IF NOT EXISTS command_vectors_embedding_cosine_idx 
            ON command_vectors USING ivfflat (embedding vector_cosine_ops) 
            WITH (lists = 100);
            
            CREATE INDEX IF NOT EXISTS command_vectors_metadata_idx 
            ON command_vectors USING gin (metadata);
        `;

        const { data: indexResult, error: indexError } = await supabase
            .rpc('exec_sql', { sql: createIndexSQL });

        if (indexError) {
            console.warn('⚠️ 인덱스 생성 실패:', indexError.message);
        } else {
            console.log('✅ 벡터 인덱스 생성 완료');
        }

        console.log('\n🔍 4단계: RPC 함수 생성...');

        // RPC 함수 생성 SQL
        const createFunctionSQL = `
            CREATE OR REPLACE FUNCTION search_similar_commands(
                query_embedding vector(384),
                match_threshold float DEFAULT 0.7,
                match_count int DEFAULT 5
            )
            RETURNS TABLE (
                id text,
                content text,
                metadata jsonb,
                similarity float
            )
            LANGUAGE sql STABLE
            AS $$
                SELECT 
                    command_vectors.id,
                    command_vectors.content,
                    command_vectors.metadata,
                    1 - (command_vectors.embedding <=> query_embedding) as similarity
                FROM command_vectors
                WHERE 1 - (command_vectors.embedding <=> query_embedding) > match_threshold
                ORDER BY command_vectors.embedding <=> query_embedding
                LIMIT match_count;
            $$;
        `;

        const { data: functionResult, error: functionError } = await supabase
            .rpc('exec_sql', { sql: createFunctionSQL });

        if (functionError) {
            console.warn('⚠️ RPC 함수 생성 실패:', functionError.message);
        } else {
            console.log('✅ search_similar_commands 함수 생성 완료');
        }

        console.log('\n🧪 5단계: 시스템 테스트...');

        // 샘플 데이터 삽입 테스트
        const sampleData = {
            id: 'test-vector-001',
            content: 'top 명령어는 실시간으로 실행 중인 프로세스를 모니터링하는 도구입니다.',
            metadata: {
                category: 'linux',
                tags: ['monitoring', 'process'],
                commands: ['top']
            },
            embedding: Array.from({ length: 384 }, () => Math.random() * 2 - 1)
        };

        const { data: insertResult, error: insertError } = await supabase
            .from('command_vectors')
            .upsert([sampleData]);

        if (insertError) {
            console.warn('⚠️ 샘플 데이터 삽입 실패:', insertError.message);
        } else {
            console.log('✅ 샘플 데이터 삽입 성공');
        }

        // RPC 함수 테스트
        const testVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
        const { data: searchResult, error: searchError } = await supabase
            .rpc('search_similar_commands', {
                query_embedding: testVector,
                match_threshold: 0.5,
                match_count: 3
            });

        if (searchError) {
            console.warn('⚠️ RPC 함수 테스트 실패:', searchError.message);
        } else {
            console.log('✅ RPC 함수 테스트 성공');
            console.log(`   검색 결과: ${searchResult?.length || 0}개`);
        }

        console.log('\n🎉 Supabase 벡터 DB 설정 완료!');
        console.log('   → 이제 RAG 시스템을 사용할 수 있습니다');
        console.log('   → /api/test-supabase-rag 에서 테스트하세요');

    } catch (error) {
        console.error('❌ Supabase 벡터 DB 설정 실패:', error.message);
        console.log('\n🚨 수동 설정 방법:');
        console.log('   1. https://supabase.com/dashboard 접속');
        console.log('   2. SQL Editor 메뉴 선택');
        console.log('   3. infra/database/sql/setup-vector-database.sql 내용 붙여넣기');
        console.log('   4. RUN 버튼 클릭');
    }
}

setupSupabaseVectorDB(); 