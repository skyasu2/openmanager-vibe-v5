#!/usr/bin/env node

/**
 * 🚀 Supabase RAG Engine 직접 테스트 스크립트 (ES Module)
 * 벡터 검색 및 임베딩 기능 검증
 */

import { getSupabaseRAGEngine } from '../src/lib/ml/supabase-rag-engine.js';

async function testSupabaseRAG() {
    console.log('🚀 Supabase RAG Engine 직접 테스트 시작...\n');

    const startTime = Date.now();

    try {
        // 1. RAG 엔진 인스턴스 가져오기
        console.log('📡 RAG 엔진 초기화 중...');
        const ragEngine = getSupabaseRAGEngine();
        
        // 2. 초기화
        await ragEngine.initialize();
        console.log('✅ RAG 엔진 초기화 완료!\n');

        // 3. 헬스체크
        console.log('🏥 헬스체크 실행...');
        const healthStatus = await ragEngine.healthCheck();
        console.log('📊 헬스체크 결과:', JSON.stringify(healthStatus, null, 2));
        console.log();

        // 4. 다양한 쿼리 테스트
        const testQueries = [
            { query: '서버 상태 확인 명령어', category: 'system' },
            { query: 'CPU 사용률 모니터링', category: 'monitoring' },
            { query: 'MySQL 연결 오류', category: 'mysql' },
            { query: 'Kubernetes Pod 상태', category: 'k8s' },
            { query: '로그 확인하는 방법', category: null }
        ];

        console.log('🔍 검색 테스트 시작...\n');

        for (const test of testQueries) {
            console.log(`\n📌 쿼리: "${test.query}" (카테고리: ${test.category || '전체'})`);
            console.log('─'.repeat(50));

            try {
                const result = await ragEngine.searchSimilar(test.query, {
                    maxResults: 3,
                    threshold: 0.5,
                    category: test.category,
                    enableMCP: true
                });

                if (result.success) {
                    console.log(`✅ 검색 성공! (${result.processingTime}ms)`);
                    console.log(`   - 총 결과: ${result.totalResults}개`);
                    console.log(`   - 캐시: ${result.cached ? '히트' : '미스'}`);
                    
                    if (result.results.length > 0) {
                        console.log('\n   🎯 검색 결과:');
                        result.results.forEach((doc, idx) => {
                            console.log(`\n   ${idx + 1}. [${doc.metadata.category}] ${doc.id}`);
                            console.log(`      내용: ${doc.content.substring(0, 100)}...`);
                            console.log(`      유사도: ${(doc.similarity || 0).toFixed(3)}`);
                            console.log(`      태그: ${doc.metadata.tags.join(', ')}`);
                        });
                    } else {
                        console.log('   ⚠️ 검색 결과가 없습니다.');
                    }

                    // MCP 컨텍스트 확인
                    if (result.mcpContext && result.mcpContext.files.length > 0) {
                        console.log(`\n   🗂️ MCP 컨텍스트: ${result.mcpContext.files.length}개 파일`);
                        result.mcpContext.files.forEach(file => {
                            console.log(`      - ${file.path} (${file.type})`);
                        });
                    }
                } else {
                    console.log(`❌ 검색 실패: ${result.error}`);
                }
            } catch (error) {
                console.log(`❌ 오류 발생:`, error.message);
            }
        }

        // 5. 성능 통계
        const totalTime = Date.now() - startTime;
        console.log(`\n\n📊 전체 테스트 완료 시간: ${totalTime}ms`);

    } catch (error) {
        console.error('\n❌ 테스트 실패:', error);
        console.error('상세 오류:', error.stack);
    }
}

// 실행
console.log('🌟 Supabase RAG Engine 테스트 스크립트\n');
console.log('환경변수 확인:');
console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log();

testSupabaseRAG().catch(console.error);