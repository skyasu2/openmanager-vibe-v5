/**
 * 🌐 SWR 기반 최적화 대시보드
 * 
 * ⚠️ Silent fallback 금지 - 모든 에러 상태를 명시적으로 표시
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
    status: 'healthy' | 'warning' | 'critical' | 'offline' | 'ERROR';
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
    // 에러 상태 메타데이터 추가
    isErrorState?: boolean;
    errorMessage?: string;
    errorMetadata?: any;
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
    // 에러 상태 정보 추가
    isErrorState?: boolean;
    errorMetadata?: any;
    userMessage?: string;
}

interface DashboardResponse {
    success: boolean;
    data?: DashboardData;
    error?: string;
    // 명시적 에러 상태 정보
    isErrorState?: boolean;
    errorMetadata?: any;
    userMessage?: string;
    recommendations?: string[];
    metadata?: {
        responseTime: number;
        cacheHit: boolean;
        redisKeys: number;
        serversLoaded: number;
    };
}

/**
 * 📡 SWR Fetcher 함수 - 에러 상태 명시적 처리
 */
const fetcher = async (url: string): Promise<DashboardData> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`🚨 API 오류 (${response.status}): ${response.statusText}`);
    }

    const result: DashboardResponse = await response.json();

    // ❌ API 응답에서 에러 상태 확인
    if (!result.success) {
        const errorMsg = result.isErrorState
            ? `🚨 시스템 오류: ${result.userMessage || result.error || '알 수 없는 오류'}`
            : `❌ 데이터 로드 실패: ${result.error || '알 수 없는 오류'}`;

        const error = new Error(errorMsg);
        (error as any).isSystemError = result.isErrorState;
        (error as any).errorMetadata = result.errorMetadata;
        (error as any).recommendations = result.recommendations;
        throw error;
    }

    if (!result.data) {
        throw new Error('🚨 응답 데이터가 없습니다');
    }

    return result.data;
};

/**
 * 🌐 최적화된 대시보드 메인 컴포넌트
 */
export const OptimizedDashboard: React.FC = () => {
    // SWR 설정: 에러 상태 명시적 처리
    const { data, error, isLoading, mutate } = useSWR<DashboardData>(
        '/api/dashboard',
        fetcher,
        {
            refreshInterval: 60000,
            revalidateOnFocus: false,
            dedupingInterval: 30000,
            errorRetryCount: 2, // 재시도 횟수 줄임 (빠른 에러 표시)
            errorRetryInterval: 10000, // 재시도 간격 증가
            revalidateOnReconnect: true,
            onError: (error) => {
                // 에러 발생 시 명시적 로깅
                console.error('🚨 대시보드 데이터 로드 실패:', error);
            }
        }
    );

    /**
     * 🔄 수동 새로고침 핸들러
     */
    const handleRefresh = async () => {
        try {
            await fetch('/api/dashboard', { method: 'POST' });
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

    // ❌ 에러 상태 - 명시적 에러 표시
    if (error) {
        return <DashboardError error={error} onRetry={handleRefresh} />;
    }

    // 데이터가 없는 경우
    if (!data) {
        return <DashboardEmpty onRefresh={handleRefresh} />;
    }

    // 🚨 데이터는 있지만 에러 상태인 경우 (정적 에러 데이터)
    if (data.isErrorState) {
        return <DashboardErrorState data={data} onRefresh={handleRefresh} />;
    }

    return (
        <div className="space-y-6">
            {/* 대시보드 헤더 */}
            <DashboardHeader
                stats={data.stats}
                lastUpdate={data.lastUpdate}
                dataSource={data.dataSource}
                onRefresh={handleRefresh}
                isErrorState={data.isErrorState}
            />

            {/* 서버 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(data.servers).map(([id, server]) => (
                    <ServerCard key={id} server={server} isErrorState={server.isErrorState} />
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
 * 🚨 시스템 에러 상태 대시보드
 * 정적 에러 데이터를 받았을 때 명시적으로 에러 상태임을 표시
 */
const DashboardErrorState: React.FC<{
    data: DashboardData;
    onRefresh: () => void;
}> = ({ data, onRefresh }) => {
    return (
        <div className="space-y-6">
            {/* 에러 상태 알림 배너 */}
            <Card className="border-red-500 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        🚨 시스템 오류 상태
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-red-600 font-medium">
                            {data.userMessage || '실제 서버 데이터를 가져올 수 없습니다'}
                        </p>
                        <p className="text-sm text-red-500">
                            아래 표시된 데이터는 실제 서버 상태가 아닌 정적 에러 데이터입니다.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={onRefresh}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                🔄 다시 시도
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                🔄 페이지 새로고침
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 에러 상태 통계 */}
            <DashboardHeader
                stats={data.stats}
                lastUpdate={data.lastUpdate}
                dataSource={`❌ ERROR: ${data.dataSource}`}
                onRefresh={onRefresh}
                isErrorState={true}
            />

            {/* 에러 서버 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(data.servers).map(([id, server]) => (
                    <ServerCard key={id} server={server} isErrorState={true} />
                ))}
            </div>

            {/* 에러 상태 푸터 */}
            <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-4">
                    <p className="text-sm text-red-600 text-center">
                        ⚠️ 이 화면의 모든 데이터는 실제 서버 상태가 아닙니다. 시스템 관리자에게 문의하세요.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

/**
 * 🖥️ 개별 서버 카드 - 에러 상태 명시적 표시
 */
const ServerCard: React.FC<{
    server: ServerData;
    isErrorState?: boolean;
}> = ({ server, isErrorState = false }) => {
    const getStatusColor = (status: string) => {
        if (isErrorState || status === 'ERROR') {
            return 'text-red-700 bg-red-100 border-red-300';
        }

        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100 border-green-300';
            case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
            case 'critical': return 'text-red-600 bg-red-100 border-red-300';
            case 'offline': return 'text-gray-600 bg-gray-100 border-gray-300';
            default: return 'text-red-700 bg-red-100 border-red-300';
        }
    };

    const getStatusIcon = (status: string) => {
        if (isErrorState || status === 'ERROR') {
            return '🚨';
        }

        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'critical': return '🔴';
            case 'offline': return '⚫';
            default: return '❌';
        }
    };

    const getStatusText = (status: string) => {
        if (isErrorState || status === 'ERROR') {
            return 'ERROR';
        }

        switch (status) {
            case 'healthy': return '정상';
            case 'warning': return '경고';
            case 'critical': return '위험';
            case 'offline': return '오프라인';
            default: return 'ERROR';
        }
    };

    return (
        <Card className={`${isErrorState ? 'border-red-500 bg-red-50' : ''}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium truncate">
                        {isErrorState ? `🚨 ${server.name}` : server.name}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(server.status)}`}>
                        {getStatusIcon(server.status)} {getStatusText(server.status)}
                    </span>
                </div>
                {isErrorState && (
                    <p className="text-xs text-red-600 mt-1">
                        ⚠️ 실제 데이터 아님
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {/* CPU 사용률 */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">CPU</span>
                        <span className={`text-sm font-medium ${isErrorState ? 'text-red-600' : ''}`}>
                            {isErrorState ? '-- %' : `${server.cpu}%`}
                        </span>
                    </div>

                    {/* 메모리 사용률 */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">메모리</span>
                        <span className={`text-sm font-medium ${isErrorState ? 'text-red-600' : ''}`}>
                            {isErrorState ? '-- %' : `${server.memory}%`}
                        </span>
                    </div>

                    {/* 디스크 사용률 */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">디스크</span>
                        <span className={`text-sm font-medium ${isErrorState ? 'text-red-600' : ''}`}>
                            {isErrorState ? '-- %' : `${server.disk}%`}
                        </span>
                    </div>

                    {/* 업타임 */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">업타임</span>
                        <span className={`text-sm font-medium ${isErrorState ? 'text-red-600' : ''}`}>
                            {isErrorState ? '연결 실패' : `${Math.floor(server.uptime / 3600)}h`}
                        </span>
                    </div>

                    {/* 에러 상태 추가 정보 */}
                    {isErrorState && server.errorMessage && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                            <p className="text-xs text-red-700">
                                {server.errorMessage}
                            </p>
                        </div>
                    )}
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
 * ❌ 대시보드 에러 상태 컴포넌트 - 명시적 에러 표시
 */
const DashboardError: React.FC<{
    error: Error & {
        isSystemError?: boolean;
        errorMetadata?: any;
        recommendations?: string[];
    };
    onRetry: () => void;
}> = ({ error, onRetry }) => {
    const isSystemError = (error as any).isSystemError || false;
    const recommendations = (error as any).recommendations || [];

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md border-red-500 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        {isSystemError ? '🚨 시스템 오류' : '❌ 데이터 로드 실패'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* 에러 메시지 */}
                        <div className="bg-red-100 border border-red-300 rounded p-3">
                            <p className="text-red-700 font-medium text-sm">
                                {error.message}
                            </p>
                        </div>

                        {/* 시스템 에러일 경우 추가 설명 */}
                        {isSystemError && (
                            <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                                <p className="text-yellow-800 text-sm">
                                    <strong>⚠️ 중요:</strong> 이는 시스템 레벨 오류입니다.
                                    실제 서버 데이터에 접근할 수 없는 상태입니다.
                                </p>
                            </div>
                        )}

                        {/* 권장사항 */}
                        {recommendations.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">권장 조치:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-blue-500">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 액션 버튼들 */}
                        <div className="flex gap-2">
                            <button
                                onClick={onRetry}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                🔄 다시 시도
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                                🔄 페이지 새로고침
                            </button>
                        </div>

                        {/* 관리자 연락 안내 */}
                        {isSystemError && (
                            <div className="text-center">
                                <p className="text-xs text-gray-600">
                                    문제가 지속되면 시스템 관리자에게 문의하세요
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

/**
 * 📭 대시보드 빈 상태 컴포넌트
 */
const DashboardEmpty: React.FC<{
    onRefresh: () => void;
}> = ({ onRefresh }) => {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md border-gray-300">
                <CardHeader>
                    <CardTitle className="text-gray-700 flex items-center gap-2">
                        📭 데이터 없음
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-center">
                        <p className="text-gray-600">
                            대시보드에 표시할 서버 데이터가 없습니다.
                        </p>
                        <button
                            onClick={onRefresh}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            🔄 데이터 새로고침
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
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

/**
 * 📊 대시보드 헤더 (통계 요약) - 에러 상태 표시 개선
 */
const DashboardHeader: React.FC<{
    stats: DashboardData['stats'];
    lastUpdate: string;
    dataSource: string;
    onRefresh: () => void;
    isErrorState?: boolean;
}> = ({ stats, lastUpdate, dataSource, onRefresh, isErrorState = false }) => {
    return (
        <div className="space-y-4">
            {/* 에러 상태 경고 배너 */}
            {isErrorState && (
                <Card className="border-red-500 bg-red-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-red-600 text-lg">🚨</span>
                                <span className="text-red-700 font-medium">
                                    에러 상태: 실제 데이터를 가져올 수 없습니다
                                </span>
                            </div>
                            <button
                                onClick={onRefresh}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                다시 시도
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={isErrorState ? 'border-red-300 bg-red-50' : ''}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isErrorState ? 'text-red-600' : 'text-gray-600'}`}>
                            총 서버 {isErrorState ? '(에러 상태)' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isErrorState ? 'text-red-600' : ''}`}>
                            {isErrorState ? '--' : stats.total}
                        </div>
                    </CardContent>
                </Card>

                <Card className={isErrorState ? 'border-red-300 bg-red-50' : ''}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isErrorState ? 'text-red-600' : 'text-green-600'}`}>
                            정상 {isErrorState ? '(데이터 없음)' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isErrorState ? 'text-red-600' : 'text-green-600'}`}>
                            {isErrorState ? '--' : stats.healthy}
                        </div>
                    </CardContent>
                </Card>

                <Card className={isErrorState ? 'border-red-300 bg-red-50' : ''}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isErrorState ? 'text-red-600' : 'text-yellow-600'}`}>
                            경고 {isErrorState ? '(데이터 없음)' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isErrorState ? 'text-red-600' : 'text-yellow-600'}`}>
                            {isErrorState ? '--' : stats.warning}
                        </div>
                    </CardContent>
                </Card>

                <Card className={isErrorState ? 'border-red-300 bg-red-50' : ''}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${isErrorState ? 'text-red-600' : 'text-red-600'}`}>
                            위험 {isErrorState ? '(데이터 없음)' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold text-red-600`}>
                            {isErrorState ? '--' : stats.critical}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}; 