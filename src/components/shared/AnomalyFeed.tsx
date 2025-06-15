'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertTriangle,
    Activity,
    Clock,
    Server,
    RefreshCw,
    ServerCrash,
    Zap,
    CheckCircle2
} from 'lucide-react';
import useSWR from 'swr';

interface AnomalyData {
    id: string;
    serverId: string;
    serverName: string;
    type: 'cpu' | 'memory' | 'disk' | 'network' | 'response_time' | 'error_rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: string;
    status: 'active' | 'resolved' | 'investigating';
    source?: 'metrics' | 'logs';
    description?: string;
    metric?: string;
}

interface AnomalyFeedProps {
    className?: string;
    maxItems?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
    variant?: 'admin' | 'dashboard';
    showDetails?: boolean;
}

const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
};

const typeIcons = {
    cpu: '🔥',
    memory: '💾',
    disk: '💿',
    network: '🌐',
    response_time: '⏱️',
    error_rate: '❌'
};

// SWR fetcher 함수
const fetcher = (url: string) =>
    fetch(url, {
        headers: {
            'Cache-Control': 'no-cache',
        },
    }).then(res => {
        if (!res.ok) {
            throw new Error(`이상 징후 데이터 조회 실패: ${res.status}`);
        }
        return res.json();
    });

// 아이콘 컴포넌트
const AnomalyIcon: React.FC<{ anomaly: AnomalyData }> = ({ anomaly }) => {
    if (anomaly.source === 'logs') {
        return (
            <ServerCrash
                className={`w-5 h-5 ${anomaly.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}
            />
        );
    }
    return (
        <Zap
            className={`w-5 h-5 ${anomaly.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}
        />
    );
};

export function AnomalyFeed({
    className = '',
    maxItems = 20,
    autoRefresh = true,
    refreshInterval = 10000,
    variant = 'admin',
    showDetails = true
}: AnomalyFeedProps) {
    const [manualRefresh, setManualRefresh] = useState(0);

    // SWR을 사용한 데이터 페칭 (Dashboard 스타일)
    const { data, error, isLoading, mutate } = useSWR(
        `/api/ai/anomaly-detection?refresh=${manualRefresh}`,
        fetcher,
        {
            refreshInterval: autoRefresh ? refreshInterval : 0,
            revalidateOnFocus: false,
            fallbackData: {
                success: true,
                anomalies: []
            },
        }
    );

    const anomalies: AnomalyData[] = data?.anomalies || [];
    const sortedAnomalies = anomalies
        .sort((a: AnomalyData, b: AnomalyData) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, maxItems);

    // 시간 포맷팅
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) { // 1분 미만
            return '방금 전';
        } else if (diff < 3600000) { // 1시간 미만
            return `${Math.floor(diff / 60000)}분 전`;
        } else if (diff < 86400000) { // 24시간 미만
            return `${Math.floor(diff / 3600000)}시간 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // 수동 새로고침
    const handleRefresh = () => {
        setManualRefresh(prev => prev + 1);
        mutate();
    };

    // Dashboard 스타일 렌더링
    if (variant === 'dashboard') {
        return (
            <Card className={`bg-slate-800/50 border-slate-700 h-full ${className}`}>
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                        실시간 이상 징후 피드
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[30rem] overflow-y-auto pr-2">
                    {isLoading && sortedAnomalies.length === 0 && (
                        <p className="text-slate-400">피드 로딩 중...</p>
                    )}
                    {error && <p className="text-red-400">오류: {error.message}</p>}
                    {sortedAnomalies.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-slate-500">
                            <CheckCircle2 className="mx-auto h-12 w-12" />
                            <p className="mt-4">탐지된 이상 징후가 없습니다.</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {sortedAnomalies.map((anomaly, index) => (
                            <div
                                key={anomaly.id || index}
                                className="flex items-start gap-4 p-3 bg-slate-700/50 rounded-lg"
                            >
                                <AnomalyIcon anomaly={anomaly} />
                                <div className="flex-1">
                                    <p className="text-slate-200 font-medium">
                                        {anomaly.description || anomaly.message}
                                    </p>
                                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                        <Badge
                                            variant={
                                                anomaly.severity === 'critical'
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className={
                                                anomaly.severity === 'medium' || anomaly.severity === 'high'
                                                    ? 'bg-yellow-600/50 border-yellow-500'
                                                    : ''
                                            }
                                        >
                                            {anomaly.severity}
                                        </Badge>
                                        <span>
                                            {formatTime(anomaly.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Admin 스타일 렌더링 (기본)
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    이상 징후 피드
                </CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(new Date().toISOString())}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
                        오류: {error.message}
                    </div>
                )}

                <ScrollArea className="h-[400px] pr-4">
                    {isLoading && sortedAnomalies.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Activity className="h-4 w-4 animate-pulse" />
                                이상 징후 데이터 로딩 중...
                            </div>
                        </div>
                    ) : sortedAnomalies.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>현재 감지된 이상 징후가 없습니다.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedAnomalies.map((anomaly, index) => (
                                <div
                                    key={anomaly.id || index}
                                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{typeIcons[anomaly.type]}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={severityColors[anomaly.severity]}
                                                    >
                                                        {anomaly.severity.toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {anomaly.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium mt-1">
                                                    {anomaly.serverName || `Server ${anomaly.serverId}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTime(anomaly.timestamp)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-2">
                                        {anomaly.description || anomaly.message}
                                    </p>

                                    {showDetails && (
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>값: {anomaly.value}</span>
                                            <span>임계값: {anomaly.threshold}</span>
                                            <Badge
                                                variant={anomaly.status === 'active' ? 'destructive' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {anomaly.status}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

// 기본 export와 named export 모두 제공
export default AnomalyFeed; 