/**
 * 🌐 SWR 기반 최적화 대시보드
 * 
 * Redis 직접 읽기 + Batch API + SWR 아키텍처
 * 월 사용량 90% 절약, 실시간성 유지
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import useSWR from 'swr';

interface ServerData {
    id: string;
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    cpu: number;
    memory: number;
    disk: number;
    network: {
        in: number;
        out: number;
    };
    uptime: number;
    lastUpdated: string;
    source: string;
}

interface DashboardData {
    servers: Record<string, ServerData>;
    stats: {
        total: number;
        healthy: number;
        warning: number;
        critical: number;
        avgCpu: number;
        avgMemory: number;
        avgDisk: number;
    };
    lastUpdate: string;
    dataSource: string;
}

interface DashboardResponse {
    success: boolean;
    data?: DashboardData;
    error?: string;
    metadata?: {
        responseTime: number;
        cacheHit: boolean;
        redisKeys: number;
        serversLoaded: number;
    };
}

/**
 * 📡 SWR Fetcher 함수
 */
const fetcher = async (url: string): Promise<DashboardData> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: DashboardResponse = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || '대시보드 데이터 로드 실패');
    }

    return result.data;
};

/**
 * 🌐 최적화된 대시보드 메인 컴포넌트
 */
export const OptimizedDashboard: React.FC = () => {
    // SWR 설정: 1분 간격 자동 업데이트, 30초 중복 제거, 포커스 시 재검증 비활성화
    const { data, error, isLoading, mutate } = useSWR<DashboardData>(
        '/api/dashboard',
        fetcher,
        {
            refreshInterval: 60000, // 1분마다 자동 새로고침
            revalidateOnFocus: false, // 포커스 시 재검증 비활성화 (불필요한 API 호출 방지)
            dedupingInterval: 30000, // 30초 중복 제거
            errorRetryCount: 3, // 오류 시 3회 재시도
            errorRetryInterval: 5000, // 5초 간격으로 재시도
            revalidateOnReconnect: true, // 네트워크 재연결 시 재검증
        }
    );

    /**
     * 🔄 수동 새로고침 핸들러
     */
    const handleRefresh = async () => {
        try {
            // 1. 서버 캐시 무효화 요청
            await fetch('/api/dashboard', { method: 'POST' });

            // 2. SWR 캐시 무효화 및 재요청
            await mutate();

            console.log('✅ 대시보드 수동 새로고침 완료');
        } catch (error) {
            console.error('❌ 대시보드 새로고침 실패:', error);
        }
    };

    // 로딩 상태
    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // 에러 상태
    if (error) {
        return <DashboardError error={error} onRetry={handleRefresh} />;
    }

    // 데이터가 없는 경우
    if (!data) {
        return <DashboardEmpty onRefresh={handleRefresh} />;
    }

    return (
        <div className="space-y-6">
            {/* 대시보드 헤더 */}
            <DashboardHeader
                stats={data.stats}
                lastUpdate={data.lastUpdate}
                dataSource={data.dataSource}
                onRefresh={handleRefresh}
            />

            {/* 서버 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(data.servers).map(([id, server]) => (
                    <ServerCard key={id} server={server} />
                ))}
            </div>

            {/* 대시보드 푸터 */}
            <DashboardFooter
                serverCount={data.stats.total}
                dataSource={data.dataSource}
                lastUpdate={data.lastUpdate}
            />
        </div>
    );
};

/**
 * 📊 대시보드 헤더 (통계 요약)
 */
const DashboardHeader: React.FC<{
    stats: DashboardData['stats'];
    lastUpdate: string;
    dataSource: string;
    onRefresh: () => void;
}> = ({ stats, lastUpdate, dataSource, onRefresh }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">총 서버</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">정상</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-600">경고</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">위험</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                </CardContent>
            </Card>
        </div>
    );
};

/**
 * 🖥️ 서버 카드 컴포넌트
 */
const ServerCard: React.FC<{ server: ServerData }> = ({ server }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
            case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'critical': return '🚨';
            default: return '❓';
        }
    };

    return (
        <Card className={`transition-all hover:shadow-md ${getStatusColor(server.status)}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{server.name}</span>
                    <span className="text-lg">{getStatusIcon(server.status)}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between text-xs">
                    <span>CPU:</span>
                    <span className="font-medium">{server.cpu}%</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>메모리:</span>
                    <span className="font-medium">{server.memory}%</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>디스크:</span>
                    <span className="font-medium">{server.disk}%</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>네트워크:</span>
                    <span className="font-medium">{server.network.in}↓ {server.network.out}↑</span>
                </div>
                <div className="pt-2 border-t text-xs text-gray-500">
                    <div>업타임: {Math.floor(server.uptime / 3600)}시간</div>
                    <div>소스: {server.source}</div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * 💀 로딩 스켈레톤
 */
const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

/**
 * ❌ 에러 상태 컴포넌트
 */
const DashboardError: React.FC<{
    error: Error;
    onRetry: () => void;
}> = ({ error, onRetry }) => {
    return (
        <Card className="text-center py-12">
            <CardContent>
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">대시보드 로드 실패</h3>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    다시 시도
                </button>
            </CardContent>
        </Card>
    );
};

/**
 * 📭 빈 상태 컴포넌트
 */
const DashboardEmpty: React.FC<{
    onRefresh: () => void;
}> = ({ onRefresh }) => {
    return (
        <Card className="text-center py-12">
            <CardContent>
                <div className="text-gray-400 text-6xl mb-4">📭</div>
                <h3 className="text-lg font-semibold mb-2">서버 데이터 없음</h3>
                <p className="text-gray-600 mb-4">Redis에서 서버 데이터를 찾을 수 없습니다.</p>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    새로고침
                </button>
            </CardContent>
        </Card>
    );
};

/**
 * 📄 대시보드 푸터
 */
const DashboardFooter: React.FC<{
    serverCount: number;
    dataSource: string;
    lastUpdate: string;
}> = ({ serverCount, dataSource, lastUpdate }) => {
    return (
        <div className="text-center text-xs text-gray-500 mt-8 p-4 bg-gray-50 rounded">
            <div>
                {serverCount}개 서버 • 데이터 소스: {dataSource} •
                마지막 업데이트: {new Date(lastUpdate).toLocaleString('ko-KR')}
            </div>
            <div className="mt-1">
                🌐 Google Cloud → Redis → Vercel 최적화 아키텍처 • SWR 캐싱 활성화
            </div>
        </div>
    );
}; 