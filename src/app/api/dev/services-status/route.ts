import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { devKeyManager } from '@/utils/dev-key-manager';

interface ServiceStatus {
    name: string;
    status: 'connected' | 'error' | 'unknown';
    responseTime: number;
    details: any;
    error?: string;
}

interface ServicesStatusResponse {
    timestamp: string;
    environment: string;
    services: ServiceStatus[];
    summary: {
        total: number;
        connected: number;
        errors: number;
        averageResponseTime: number;
    };
}

async function checkSupabase(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
        const supabaseUrl = devKeyManager.getSupabaseUrl();
        const supabaseKey = devKeyManager.getSupabaseAnonKey();

        if (!supabaseUrl || !supabaseKey) {
            return {
                name: 'Supabase',
                status: 'error',
                responseTime: 0,
                details: null,
                error: 'Missing environment variables (DevKeyManager)'
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('system_logs').select('count').limit(1);

        const responseTime = Date.now() - startTime;

        if (error) {
            return {
                name: 'Supabase',
                status: 'error',
                responseTime,
                details: { error: error.message },
                error: error.message
            };
        }

        return {
            name: 'Supabase',
            status: 'connected',
            responseTime,
            details: {
                url: supabaseUrl,
                region: 'ap-southeast-1',
                database: 'postgres',
                connection: 'pooler',
                keyManager: 'DevKeyManager v1.0'
            }
        };
    } catch (error: any) {
        return {
            name: 'Supabase',
            status: 'error',
            responseTime: Date.now() - startTime,
            details: null,
            error: error.message
        };
    }
}

async function checkRedis(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
        const redisUrl = devKeyManager.getKey('UPSTASH_REDIS_REST_URL');
        const redisToken = devKeyManager.getKey('UPSTASH_REDIS_REST_TOKEN');

        if (!redisUrl || !redisToken) {
            return {
                name: 'Redis (Upstash)',
                status: 'error',
                responseTime: 0,
                details: null,
                error: 'Missing environment variables (DevKeyManager)'
            };
        }

        const redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });

        // 테스트 키-값 설정 및 읽기
        const testKey = `dev-test-${Date.now()}`;
        await redis.set(testKey, 'test-value', { ex: 10 });
        const testValue = await redis.get(testKey);
        await redis.del(testKey);

        const responseTime = Date.now() - startTime;

        return {
            name: 'Redis (Upstash)',
            status: 'connected',
            responseTime,
            details: {
                url: redisUrl,
                testResult: testValue === 'test-value' ? 'passed' : 'failed',
                host: 'charming-condor-46598.upstash.io',
                keyManager: 'DevKeyManager v1.0'
            }
        };
    } catch (error: any) {
        return {
            name: 'Redis (Upstash)',
            status: 'error',
            responseTime: Date.now() - startTime,
            details: null,
            error: error.message
        };
    }
}

async function checkGoogleAI(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
        const apiKey = devKeyManager.getGoogleAIKey();

        if (!apiKey) {
            return {
                name: 'Google AI (Gemini)',
                status: 'error',
                responseTime: 0,
                details: null,
                error: 'Missing API key (DevKeyManager)'
            };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Hello' }]
                    }]
                })
            }
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorData = await response.text();
            return {
                name: 'Google AI (Gemini)',
                status: 'error',
                responseTime,
                details: { httpStatus: response.status },
                error: `HTTP ${response.status}: ${errorData}`
            };
        }

        const data = await response.json();

        return {
            name: 'Google AI (Gemini)',
            status: 'connected',
            responseTime,
            details: {
                model: 'gemini-1.5-flash',
                enabled: process.env.GOOGLE_AI_ENABLED === 'true',
                quotaProtection: process.env.GOOGLE_AI_QUOTA_PROTECTION === 'true',
                dailyLimit: process.env.GOOGLE_AI_DAILY_LIMIT || '300',
                keyManager: 'DevKeyManager v1.0'
            }
        };
    } catch (error: any) {
        return {
            name: 'Google AI (Gemini)',
            status: 'error',
            responseTime: Date.now() - startTime,
            details: null,
            error: error.message
        };
    }
}

async function checkRenderMCP(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
        const mcpUrl = devKeyManager.getMCPUrl() || 'https://openmanager-vibe-v5.onrender.com';

        const response = await fetch(`${mcpUrl}/health`, {
            method: 'GET',
            headers: {
                'User-Agent': 'OpenManager-Dev-Tools/1.0'
            }
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            return {
                name: 'Render MCP Server',
                status: 'error',
                responseTime,
                details: { httpStatus: response.status },
                error: `HTTP ${response.status}`
            };
        }

        const data = await response.json();

        return {
            name: 'Render MCP Server',
            status: 'connected',
            responseTime,
            details: {
                url: mcpUrl,
                port: 10000,
                health: data,
                keyManager: 'DevKeyManager v1.0'
            }
        };
    } catch (error: any) {
        return {
            name: 'Render MCP Server',
            status: 'error',
            responseTime: Date.now() - startTime,
            details: null,
            error: error.message
        };
    }
}

async function checkVercel(): Promise<ServiceStatus> {
    const startTime = Date.now();
    try {
        // Vercel 환경에서는 자체 API 호출로 확인
        const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/health`, {
            method: 'GET'
        });

        const responseTime = Date.now() - startTime;

        return {
            name: 'Vercel Deployment',
            status: response.ok ? 'connected' : 'error',
            responseTime,
            details: {
                environment: process.env.VERCEL_ENV || 'development',
                url: process.env.VERCEL_URL || 'localhost:3000',
                region: process.env.VERCEL_REGION || 'local'
            }
        };
    } catch (error: any) {
        return {
            name: 'Vercel Deployment',
            status: 'error',
            responseTime: Date.now() - startTime,
            details: null,
            error: error.message
        };
    }
}

export async function GET(request: NextRequest) {
    // 🚫 개발 환경에서만 접근 허용
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Dev endpoints are only available in development' },
            { status: 404 }
        );
    }

    try {
        console.log('🔍 개발자 도구: 모든 서비스 상태 확인 시작...');

        // 모든 서비스 상태를 병렬로 확인
        const [supabaseStatus, redisStatus, googleAIStatus, renderStatus, vercelStatus] = await Promise.all([
            checkSupabase(),
            checkRedis(),
            checkGoogleAI(),
            checkRenderMCP(),
            checkVercel()
        ]);

        const services = [supabaseStatus, redisStatus, googleAIStatus, renderStatus, vercelStatus];

        const summary = {
            total: services.length,
            connected: services.filter(s => s.status === 'connected').length,
            errors: services.filter(s => s.status === 'error').length,
            averageResponseTime: Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length)
        };

        const response: ServicesStatusResponse = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services,
            summary
        };

        console.log(`✅ 서비스 상태 확인 완료: ${summary.connected}/${summary.total} 연결됨`);

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('❌ 서비스 상태 확인 중 오류:', error);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services: [],
            summary: { total: 0, connected: 0, errors: 1, averageResponseTime: 0 },
            error: error.message
        }, { status: 500 });
    }
} 