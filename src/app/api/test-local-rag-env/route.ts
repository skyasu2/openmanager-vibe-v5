/**
 * 🔍 LocalRAG 환경별 사용 테스트 API
 * 
 * 개발/테스트 환경에서만 LocalRAG 사용
 * 배포 환경에서는 Supabase RAG만 사용
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 환경 감지
        const nodeEnv = process.env.NODE_ENV;
        const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
        const isRender = !!(process.env.RENDER || process.env.RENDER_SERVICE_ID);
        const disableLocalRAG = process.env.DISABLE_LOCAL_RAG === 'true';
        const forceLocalRAG = process.env.FORCE_LOCAL_RAG === 'true';

        // LocalRAG 사용 여부 결정
        const shouldUseLocalRAG = forceLocalRAG || (!disableLocalRAG && !isVercel && !isRender && nodeEnv !== 'production');

        const environmentInfo = {
            nodeEnv,
            isVercel,
            isRender,
            isProduction: nodeEnv === 'production' || isVercel || isRender,
            disableLocalRAG,
            forceLocalRAG,
            shouldUseLocalRAG,
            shouldUseSupabaseRAG: true
        };

        console.log('🔍 LocalRAG 환경 테스트:', environmentInfo);

        // LocalRAG 테스트 (환경에 따라)
        let localRAGResult = null;
        if (shouldUseLocalRAG) {
            try {
                // 동적 import로 LocalRAG 로드
                const { LocalRAGEngine } = await import('@/lib/ml/rag-engine');
                const localRAG = new LocalRAGEngine();

                // 환경 정보 확인
                if (localRAG.isAvailableInCurrentEnvironment && localRAG.isAvailableInCurrentEnvironment()) {
                    await localRAG.initialize();

                    const searchResult = await localRAG.search({
                        query: 'test query',
                        maxResults: 3
                    });

                    localRAGResult = {
                        available: true,
                        initialized: true,
                        searchResult: searchResult.success,
                        resultCount: searchResult.results?.length || 0,
                        environmentInfo: localRAG.getEnvironmentInfo ? localRAG.getEnvironmentInfo() : null
                    };
                } else {
                    localRAGResult = {
                        available: false,
                        reason: 'Environment check failed',
                        environmentInfo: localRAG.getEnvironmentInfo ? localRAG.getEnvironmentInfo() : null
                    };
                }
            } catch (error) {
                localRAGResult = {
                    available: false,
                    error: error.message,
                    reason: 'LocalRAG initialization failed'
                };
            }
        } else {
            localRAGResult = {
                available: false,
                reason: 'Disabled in production environment'
            };
        }

        // Supabase RAG 테스트
        let supabaseRAGResult = null;
        try {
            const { createClient } = await import('@supabase/supabase-js');

            // Supabase 설정 로드
            let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                // 암호화된 설정 사용
                supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
                supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';
            }

            const supabase = createClient(supabaseUrl, supabaseKey);

            // 간단한 연결 테스트
            const { data, error } = await supabase
                .from('rag_commands')
                .select('count')
                .limit(1);

            supabaseRAGResult = {
                available: !error,
                connected: !error,
                error: error?.message || null
            };
        } catch (error) {
            supabaseRAGResult = {
                available: false,
                error: error.message
            };
        }

        // AI 엔진 우선순위 결정
        const aiEnginePriority = environmentInfo.isProduction
            ? ['supabase_rag', 'rule_based', 'mcp', 'google_ai']
            : ['supabase_rag', 'rule_based', 'local_rag', 'mcp', 'google_ai'];

        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            environment: environmentInfo,
            engines: {
                localRAG: localRAGResult,
                supabaseRAG: supabaseRAGResult
            },
            aiEnginePriority,
            recommendation: environmentInfo.isProduction
                ? 'Use Supabase RAG only in production'
                : 'Use both Supabase RAG (primary) and LocalRAG (fallback) in development'
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ LocalRAG 환경 테스트 실패:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 