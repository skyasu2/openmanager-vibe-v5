#!/usr/bin/env node

/**
 * 🗄️ Supabase 벡터 테이블 설정 스크립트
 * pgvector 확장 및 vector_documents 테이블 생성
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 설정
const SUPABASE_URL = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'; // service_role 키 사용

async function setupSupabaseVector() {
    console.log('🚀 Supabase 벡터 테이블 설정 시작...\n');

    try {
        // Supabase 클라이언트 생성 (service_role 권한으로)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        console.log('📡 Supabase 연결 중...');

        // 1. 직접 테이블 생성 시도
        console.log('📋 vector_documents 테이블 생성...');

        const { error: tableError } = await supabase.rpc('sql', {
            query: `
                CREATE EXTENSION IF NOT EXISTS vector;
                
                CREATE TABLE IF NOT EXISTS vector_documents (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding vector(384),
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS vector_documents_embedding_idx 
                ON vector_documents USING ivfflat (embedding vector_cosine_ops) 
                WITH (lists = 100);
                
                CREATE INDEX IF NOT EXISTS vector_documents_metadata_idx 
                ON vector_documents USING GIN (metadata);
            `
        });

        if (tableError) {
            console.log('❌ 테이블 생성 실패:', tableError.message);

            // 대안: 개별적으로 시도
            console.log('🔄 개별 설정 시도...');

            // pgvector 확장만 먼저 시도
            try {
                await supabase.rpc('sql', { query: 'CREATE EXTENSION IF NOT EXISTS vector;' });
                console.log('✅ pgvector 확장 활성화');
            } catch (err) {
                console.log('⚠️  pgvector 확장 활성화 실패:', err.message);
            }

        } else {
            console.log('✅ 벡터 테이블 및 인덱스 생성 완료');
        }

        // 2. 샘플 데이터 삽입
        console.log('📊 샘플 데이터 삽입...');
        const sampleDocs = [
            {
                id: 'sample-cpu-monitoring',
                content: 'CPU 사용률 모니터링을 위해 top 명령어를 사용하세요. top 명령어는 실시간으로 프로세스 상태를 확인할 수 있습니다.',
                embedding: Array(384).fill(0).map(() => Math.random() * 0.1), // 임시 임베딩
                metadata: { category: 'monitoring', type: 'cpu', priority: 'high' }
            },
            {
                id: 'sample-memory-check',
                content: '메모리 사용량 확인은 free -h 명령어로 가능합니다. 메모리 상태를 정기적으로 모니터링하는 것이 중요합니다.',
                embedding: Array(384).fill(0).map(() => Math.random() * 0.1), // 임시 임베딩
                metadata: { category: 'monitoring', type: 'memory', priority: 'medium' }
            },
            {
                id: 'sample-disk-usage',
                content: '디스크 사용량 확인은 df -h 명령어를 사용합니다. 디스크 공간이 부족하면 시스템 성능에 영향을 줍니다.',
                embedding: Array(384).fill(0).map(() => Math.random() * 0.1), // 임시 임베딩
                metadata: { category: 'monitoring', type: 'disk', priority: 'medium' }
            }
        ];

        for (const doc of sampleDocs) {
            const { error: insertError } = await supabase
                .from('vector_documents')
                .upsert(doc);

            if (insertError) {
                console.log(`❌ 샘플 데이터 삽입 실패 (${doc.id}):`, insertError.message);
            } else {
                console.log(`✅ 샘플 데이터 삽입 완료: ${doc.id}`);
            }
        }

        // 3. 설정 완료 확인
        console.log('\n🔍 설정 상태 확인...');
        const { data: tableCheck, error: checkError } = await supabase
            .from('vector_documents')
            .select('id, metadata, content')
            .limit(5);

        if (checkError) {
            console.log('❌ 테이블 확인 실패:', checkError.message);
        } else {
            console.log(`✅ 테이블 확인 완료: ${tableCheck?.length || 0}개 문서 존재`);
            if (tableCheck && tableCheck.length > 0) {
                tableCheck.forEach((doc, index) => {
                    console.log(`  ${index + 1}. ${doc.id}: ${doc.content.substring(0, 50)}...`);
                });
            }
        }

        console.log('\n🎉 Supabase 벡터 테이블 설정 완료!');
        return { success: true, message: '벡터 테이블 설정 성공' };

    } catch (error) {
        console.error('❌ 설정 실패:', error);
        return { success: false, error: error.message };
    }
}

// 스크립트 실행
if (require.main === module) {
    setupSupabaseVector()
        .then(result => {
            console.log('\n📊 최종 결과:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 예상치 못한 오류:', error);
            process.exit(1);
        });
}

module.exports = { setupSupabaseVector }; 