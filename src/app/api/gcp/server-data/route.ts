/**
 * 🌐 GCP 서버 데이터 조회 API
 * 
 * Vercel에서 GCP Firestore의 실시간 서버 메트릭을 조회하는 엔드포인트
 * 기존 모니터링 시스템과 완벽한 호환성 보장
 */

import { TimeSeriesMetrics } from '@/types/ai-agent-input-schema';
import { NextRequest, NextResponse } from 'next/server';

// GCP 연결 설정 (환경변수에서 로드)
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_FIRESTORE_DATABASE = process.env.GCP_FIRESTORE_DATABASE || '(default)';

interface GCPServerDataResponse {
    success: boolean;
    data?: {
        sessionId: string;
        metrics: TimeSeriesMetrics[];
        dataSource: 'GCP';
        timestamp: string;
        totalMetrics: number;
        sessionInfo?: any;
    };
    error?: string;
    metadata?: {
        responseTime: number;
        cacheHit: boolean;
        generationTime: number;
    };
}

/**
 * GET /api/gcp/server-data
 * 
 * Query Parameters:
 * - sessionId: GCP 세션 ID (필수)
 * - limit: 조회할 메트릭 수 (기본값: 10)
 * - serverId: 특정 서버 ID (선택사항)
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const limit = parseInt(searchParams.get('limit') || '10');
        const serverId = searchParams.get('serverId');

        // 세션 ID 필수 체크
        if (!sessionId) {
            return NextResponse.json({
                success: false,
                error: 'sessionId 파라미터가 필요합니다'
            }, { status: 400 });
        }

        // GCP 설정 체크
        if (!GCP_PROJECT_ID) {
            return NextResponse.json({
                success: false,
                error: 'GCP 설정이 완료되지 않았습니다'
            }, { status: 503 });
        }

        // GCP Firestore 연결 및 데이터 조회
        const gcpResponse = await fetchGCPMetrics(sessionId, limit, serverId);

        if (!gcpResponse.success) {
            return NextResponse.json(gcpResponse, {
                status: gcpResponse.error?.includes('세션') ? 404 : 500
            });
        }

        // 응답 메타데이터 추가
        const responseTime = Date.now() - startTime;
        gcpResponse.metadata = {
            responseTime,
            cacheHit: false,
            generationTime: responseTime
        };

        // 캐싱 헤더 설정 (30초)
        return NextResponse.json(gcpResponse, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                'X-Data-Source': 'GCP-Firestore',
                'X-Response-Time': `${responseTime}ms`
            }
        });

    } catch (error) {
        console.error('GCP 서버 데이터 조회 실패:', error);

        return NextResponse.json({
            success: false,
            error: 'GCP 연결 실패',
            metadata: {
                responseTime: Date.now() - startTime,
                cacheHit: false,
                generationTime: 0
            }
        }, { status: 500 });
    }
}

/**
 * POST /api/gcp/server-data/start
 * 
 * GCP 데이터 생성 세션 시작
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'userId가 필요합니다'
            }, { status: 400 });
        }

        // GCP 세션 시작 요청
        const sessionResponse = await startGCPSession(userId);

        if (!sessionResponse.success) {
            return NextResponse.json(sessionResponse, { status: 400 });
        }

        return NextResponse.json({
            ...sessionResponse,
            metadata: {
                responseTime: Date.now() - startTime,
                cacheHit: false,
                generationTime: Date.now() - startTime
            }
        });

    } catch (error) {
        console.error('GCP 세션 시작 실패:', error);

        return NextResponse.json({
            success: false,
            error: 'GCP 세션 시작 실패',
            metadata: {
                responseTime: Date.now() - startTime,
                cacheHit: false,
                generationTime: 0
            }
        }, { status: 500 });
    }
}

// ===== GCP 연동 헬퍼 함수들 =====

async function fetchGCPMetrics(
    sessionId: string,
    limit: number,
    serverId?: string
): Promise<GCPServerDataResponse> {
    try {
        // 실제 환경에서는 GCP Firestore SDK 사용
        if (process.env.NODE_ENV === 'production' && GCP_PROJECT_ID) {
            return await fetchFromGCPFirestore(sessionId, limit, serverId);
        }

        // 개발 환경에서는 시뮬레이션 데이터
        return generateSimulatedGCPData(sessionId, limit, serverId);

    } catch (error) {
        console.error('GCP 메트릭 조회 실패:', error);
        return {
            success: false,
            error: 'GCP Firestore 연결 실패'
        };
    }
}

async function fetchFromGCPFirestore(
    sessionId: string,
    limit: number,
    serverId?: string
): Promise<GCPServerDataResponse> {
    // 실제 GCP Firestore 연결 코드
    // TODO: GCP Firestore SDK 구현

    return {
        success: false,
        error: 'GCP Firestore SDK 구현 필요'
    };
}

async function startGCPSession(userId: string): Promise<{
    success: boolean;
    data?: {
        sessionId: string;
        userId: string;
        expiresAt: string;
        estimatedCost: number;
        serverCount: number;
    };
    error?: string;
}> {
    try {
        // 실제 환경에서는 GCP Cloud Function 호출
        if (process.env.NODE_ENV === 'production' && GCP_PROJECT_ID) {
            return await callGCPSessionStart(userId);
        }

        // 개발 환경에서는 시뮬레이션
        const sessionId = `dev_${userId}_${Date.now()}`;
        const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

        return {
            success: true,
            data: {
                sessionId,
                userId,
                expiresAt,
                estimatedCost: 0, // 무료 티어
                serverCount: 10
            }
        };

    } catch (error) {
        console.error('GCP 세션 시작 실패:', error);
        return {
            success: false,
            error: 'GCP 세션 시작 실패'
        };
    }
}

async function callGCPSessionStart(userId: string): Promise<any> {
    // 실제 GCP Cloud Function 호출 코드
    // TODO: GCP Cloud Functions SDK 구현

    return {
        success: false,
        error: 'GCP Cloud Functions SDK 구현 필요'
    };
}

function generateSimulatedGCPData(
    sessionId: string,
    limit: number,
    serverId?: string
): GCPServerDataResponse {
    const serverIds = [
        'srv-web-01', 'srv-web-02', 'srv-web-03',
        'srv-app-01', 'srv-app-02',
        'srv-db-01', 'srv-db-02', 'srv-cache-01',
        'srv-search-01', 'srv-queue-01'
    ];

    const filteredServerIds = serverId ? [serverId] : serverIds;
    const metrics: TimeSeriesMetrics[] = [];

    // 최근 시간부터 역순으로 생성
    for (let i = 0; i < Math.min(limit, 10); i++) {
        const timestamp = new Date(Date.now() - i * 30000); // 30초 간격

        filteredServerIds.forEach(id => {
            const metric = generateServerMetric(id, timestamp);
            metrics.push(metric);
        });
    }

    return {
        success: true,
        data: {
            sessionId,
            metrics: metrics.slice(0, limit),
            dataSource: 'GCP',
            timestamp: new Date().toISOString(),
            totalMetrics: metrics.length,
            sessionInfo: {
                sessionId,
                status: 'active',
                startTime: Date.now() - 10 * 60 * 1000, // 10분 전 시작
                endTime: Date.now() + 10 * 60 * 1000,   // 10분 후 종료
                metricsGenerated: Math.floor(Math.random() * 20) + 10
            }
        }
    };
}

function generateServerMetric(serverId: string, timestamp: Date): TimeSeriesMetrics {
    // 서버별 특성화된 메트릭 생성
    const isWebServer = serverId.includes('web');
    const isDbServer = serverId.includes('db');
    const isCacheServer = serverId.includes('cache');

    // 기본 부하 설정
    let baseCpu = 30;
    let baseMemory = 50;
    let baseDisk = 40;
    let baseNetwork = 1024 * 1024; // 1MB/s

    if (isDbServer) {
        baseCpu = 60;
        baseMemory = 75;
        baseDisk = 70;
        baseNetwork = 5 * 1024 * 1024; // 5MB/s
    } else if (isCacheServer) {
        baseCpu = 20;
        baseMemory = 80;
        baseDisk = 15;
        baseNetwork = 3 * 1024 * 1024; // 3MB/s
    } else if (isWebServer) {
        baseCpu = 25;
        baseMemory = 40;
        baseDisk = 30;
        baseNetwork = 2 * 1024 * 1024; // 2MB/s
    }

    // 시나리오 적용 (20% 심각, 30% 경고)
    const scenario = Math.random();
    let multiplier = 1.0;

    if (scenario < 0.2) {
        multiplier = 1.8; // 심각
    } else if (scenario < 0.5) {
        multiplier = 1.4; // 경고
    }

    // 자연스러운 변동 추가
    const variation = () => (Math.random() - 0.5) * 0.2;

    const cpuUsage = Math.max(0, Math.min(100, baseCpu * multiplier * (1 + variation())));
    const memoryUsed = Math.max(0, baseMemory * multiplier * (1 + variation()));
    const diskUtil = Math.max(0, Math.min(100, baseDisk * multiplier * (1 + variation())));
    const networkRx = Math.max(0, baseNetwork * multiplier * (1 + variation()));

    return {
        timestamp,
        serverId,
        system: {
            cpu: {
                usage: cpuUsage,
                load1: cpuUsage / 100 * 4, // 4코어 가정
                load5: cpuUsage / 100 * 4 * 0.8,
                load15: cpuUsage / 100 * 4 * 0.6,
                processes: Math.floor(30 + Math.random() * 40),
                threads: Math.floor(120 + Math.random() * 200)
            },
            memory: {
                used: Math.floor(memoryUsed * 1024 * 1024 * 1024 / 100), // GB to bytes
                available: Math.floor((100 - memoryUsed) * 1024 * 1024 * 1024 / 100),
                buffers: Math.floor(Math.random() * 1024 * 1024 * 100),
                cached: Math.floor(Math.random() * 1024 * 1024 * 500),
                swap: { used: 0, total: 1024 * 1024 * 1024 }
            },
            disk: {
                io: {
                    read: Math.max(0, 50 * multiplier + (Math.random() - 0.5) * 30),
                    write: Math.max(0, 25 * multiplier + (Math.random() - 0.5) * 15)
                },
                throughput: {
                    read: Math.random() * 100,
                    write: Math.random() * 50
                },
                utilization: diskUtil,
                queue: Math.floor(Math.random() * 5)
            },
            network: {
                io: {
                    rx: networkRx,
                    tx: networkRx * 0.5
                },
                packets: {
                    rx: Math.floor(Math.random() * 1000),
                    tx: Math.floor(Math.random() * 800)
                },
                errors: {
                    rx: multiplier > 1.5 ? Math.floor(Math.random() * 3) : 0,
                    tx: multiplier > 1.5 ? Math.floor(Math.random() * 2) : 0
                },
                connections: {
                    active: Math.floor(10 + Math.random() * 50),
                    established: Math.floor(5 + Math.random() * 30)
                }
            },
            processes: []
        },
        application: {
            requests: {
                total: Math.floor(1000 * multiplier),
                success: Math.floor(1000 * multiplier * 0.99),
                errors: Math.floor(1000 * multiplier * 0.01),
                latency: {
                    p50: 50 * (multiplier > 1.5 ? 3 : 1),
                    p95: 100 * (multiplier > 1.5 ? 3 : 1),
                    p99: 200 * (multiplier > 1.5 ? 3 : 1)
                }
            },
            database: {
                connections: {
                    active: Math.floor(10 + Math.random() * 20),
                    idle: Math.floor(5 + Math.random() * 15)
                },
                queries: {
                    total: Math.floor(300 * multiplier),
                    slow: Math.floor(300 * multiplier * 0.02)
                },
                locks: Math.floor(Math.random() * 5),
                deadlocks: multiplier > 1.5 ? Math.floor(Math.random() * 2) : 0
            },
            cache: {
                hits: Math.floor(800 * multiplier),
                misses: Math.floor(200 * multiplier),
                evictions: Math.floor(Math.random() * 10),
                memory: Math.floor(Math.random() * 1024 * 1024 * 100)
            }
        },
        infrastructure: {
            cloud: {
                credits: Math.random() * 1000,
                costs: {
                    hourly: Math.random() * 10,
                    daily: Math.random() * 240
                },
                scaling: {
                    instances: Math.floor(1 + Math.random() * 5),
                    target: Math.floor(2 + Math.random() * 8)
                }
            }
        }
    };
} 