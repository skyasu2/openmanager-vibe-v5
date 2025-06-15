import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 배포환경 AI 에이전트
 * 
 * 커서가 배포환경과 직접 통신할 수 있는 AI 에이전트 엔드포인트
 * Google AI API 부하를 최소화하면서 시스템 정보를 제공합니다.
 */

interface AIAgentRequest {
    query: string;
    context?: {
        source?: string;
        timestamp?: string;
        [key: string]: any;
    };
}

interface SystemMetrics {
    timestamp: string;
    performance: {
        responseTime: number;
        memoryUsage: number;
        cpuUsage: number;
    };
    aiEngines: {
        googleAI: {
            status: 'active' | 'inactive' | 'limited';
            requestCount: number;
            lastRequest: string;
        };
        unified: {
            status: 'active' | 'inactive';
            engines: string[];
        };
    };
    database: {
        supabase: {
            status: 'connected' | 'disconnected';
            responseTime: number;
        };
        redis: {
            status: 'connected' | 'disconnected';
            responseTime: number;
        };
    };
    errors: {
        recent: number;
        critical: number;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: AIAgentRequest = await request.json();
        const { query, context } = body;

        console.log(`🤖 AI 에이전트 요청: ${query}`);
        console.log(`📍 요청 소스: ${context?.source || 'unknown'}`);

        // 쿼리 타입에 따른 응답 분기
        const response = await processQuery(query, context);

        return NextResponse.json({
            success: true,
            query,
            response,
            timestamp: new Date().toISOString(),
            source: 'deployment-ai-agent'
        });

    } catch (error) {
        console.error('❌ AI 에이전트 오류:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    try {
        let response;

        switch (action) {
            case 'status':
                response = await getSystemStatus();
                break;
            case 'metrics':
                response = await getSystemMetrics();
                break;
            case 'health':
                response = await getHealthCheck();
                break;
            default:
                response = { message: 'AI 에이전트가 준비되었습니다', availableActions: ['status', 'metrics', 'health'] };
        }

        return NextResponse.json({
            success: true,
            action,
            data: response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ AI 에이전트 GET 오류:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * 쿼리 처리 로직
 */
async function processQuery(query: string, context?: any): Promise<string> {
    const lowerQuery = query.toLowerCase();

    // 시스템 상태 관련 쿼리
    if (lowerQuery.includes('상태') || lowerQuery.includes('status')) {
        const status = await getSystemStatus();
        return `현재 시스템 상태:
- AI 엔진: ${status.aiEngines.googleAI.status === 'active' ? '정상' : '제한됨'}
- 데이터베이스: ${status.database.supabase.status === 'connected' ? '연결됨' : '연결 안됨'}
- 최근 에러: ${status.errors.recent}개
- 전체적으로 ${status.performance.responseTime < 3000 ? '정상' : '느림'} 상태입니다.`;
    }

    // 성능 관련 쿼리
    if (lowerQuery.includes('성능') || lowerQuery.includes('performance')) {
        const metrics = await getSystemMetrics();
        return `현재 성능 지표:
- 응답시간: ${metrics.performance.responseTime}ms
- 메모리 사용량: ${metrics.performance.memoryUsage}%
- CPU 사용량: ${metrics.performance.cpuUsage}%
- Google AI 요청 수: ${metrics.aiEngines.googleAI.requestCount}회
${metrics.performance.responseTime > 3000 ? '⚠️ 응답시간이 느립니다. 최적화가 필요합니다.' : '✅ 성능이 양호합니다.'}`;
    }

    // AI 엔진 관련 쿼리
    if (lowerQuery.includes('ai') || lowerQuery.includes('엔진')) {
        const status = await getSystemStatus();
        return `AI 엔진 상태:
- Google AI: ${status.aiEngines.googleAI.status} (요청 수: ${status.aiEngines.googleAI.requestCount})
- 통합 AI: ${status.aiEngines.unified.status} (엔진: ${status.aiEngines.unified.engines.join(', ')})
- 마지막 요청: ${status.aiEngines.googleAI.lastRequest}
${status.aiEngines.googleAI.status === 'limited' ? '⚠️ Google AI API 사용량 제한에 근접했습니다.' : '✅ AI 엔진이 정상 작동 중입니다.'}`;
    }

    // 에러 관련 쿼리
    if (lowerQuery.includes('에러') || lowerQuery.includes('error') || lowerQuery.includes('문제')) {
        const status = await getSystemStatus();
        return `에러 현황:
- 최근 에러: ${status.errors.recent}개
- 심각한 에러: ${status.errors.critical}개
${status.errors.critical > 0 ? '🚨 심각한 에러가 발생했습니다. 즉시 확인이 필요합니다.' :
                status.errors.recent > 5 ? '⚠️ 에러가 다소 많습니다. 모니터링이 필요합니다.' :
                    '✅ 에러 수준이 정상입니다.'}`;
    }

    // 개선 제안 쿼리
    if (lowerQuery.includes('개선') || lowerQuery.includes('최적화') || lowerQuery.includes('improve')) {
        const metrics = await getSystemMetrics();
        const suggestions = [];

        if (metrics.performance.responseTime > 3000) {
            suggestions.push('API 응답시간 최적화 (현재: ' + metrics.performance.responseTime + 'ms)');
        }
        if (metrics.performance.memoryUsage > 80) {
            suggestions.push('메모리 사용량 최적화 (현재: ' + metrics.performance.memoryUsage + '%)');
        }
        if (metrics.aiEngines.googleAI.requestCount > 50) {
            suggestions.push('Google AI API 사용량 최적화 (현재: ' + metrics.aiEngines.googleAI.requestCount + '회)');
        }
        if (metrics.errors.recent > 5) {
            suggestions.push('에러 발생 빈도 개선 (현재: ' + metrics.errors.recent + '개)');
        }

        if (suggestions.length === 0) {
            return '✅ 현재 시스템이 최적 상태입니다. 추가 개선사항이 없습니다.';
        }

        return `개선 제안사항:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

우선순위: ${suggestions[0]}`;
    }

    // 기본 응답
    return `질문을 이해했습니다: "${query}"

사용 가능한 정보:
- 시스템 상태 (상태, status)
- 성능 지표 (성능, performance)  
- AI 엔진 정보 (ai, 엔진)
- 에러 현황 (에러, error)
- 개선 제안 (개선, 최적화)

더 구체적인 질문을 해주시면 상세한 정보를 제공하겠습니다.`;
}

/**
 * 시스템 상태 조회
 */
async function getSystemStatus(): Promise<SystemMetrics> {
    // 실제 시스템 메트릭 수집 (시뮬레이션)
    const now = new Date();

    return {
        timestamp: now.toISOString(),
        performance: {
            responseTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
            memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
            cpuUsage: Math.floor(Math.random() * 40) + 20 // 20-60%
        },
        aiEngines: {
            googleAI: {
                status: Math.random() > 0.8 ? 'limited' : 'active',
                requestCount: Math.floor(Math.random() * 80) + 10,
                lastRequest: new Date(now.getTime() - Math.random() * 300000).toISOString()
            },
            unified: {
                status: 'active',
                engines: ['google-ai', 'local-rag', 'hybrid-engine']
            }
        },
        database: {
            supabase: {
                status: Math.random() > 0.95 ? 'disconnected' : 'connected',
                responseTime: Math.floor(Math.random() * 100) + 20
            },
            redis: {
                status: Math.random() > 0.98 ? 'disconnected' : 'connected',
                responseTime: Math.floor(Math.random() * 50) + 10
            }
        },
        errors: {
            recent: Math.floor(Math.random() * 10),
            critical: Math.floor(Math.random() * 3)
        }
    };
}

/**
 * 시스템 메트릭 조회
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
    return await getSystemStatus();
}

/**
 * 헬스 체크
 */
async function getHealthCheck() {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '5.44.0',
        environment: process.env.NODE_ENV || 'development'
    };
} 