'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Activity, Clock, Server, RefreshCw } from 'lucide-react';

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
}

interface AnomalyFeedProps {
    className?: string;
    maxItems?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
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

export function AnomalyFeed({
    className = '',
    maxItems = 20,
    autoRefresh = true,
    refreshInterval = 10000
}: AnomalyFeedProps) {
    const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // 이상 징후 데이터 가져오기
    const fetchAnomalies = useCallback(async () => {
        try {
            setError(null);

            const response = await fetch('/api/ai/anomaly-detection', {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error(`이상 징후 데이터 조회 실패: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.anomalies)) {
                // 최신 순으로 정렬하고 최대 개수 제한
                const sortedAnomalies = data.anomalies
                    .sort((a: AnomalyData, b: AnomalyData) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .slice(0, maxItems);

                setAnomalies(sortedAnomalies);
                setLastUpdated(new Date());
            } else {
                throw new Error(data.error || '이상 징후 데이터 형식 오류');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
            console.error('이상 징후 데이터 조회 오류:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [maxItems]);

    // 자동 새로고침
    useEffect(() => {
        fetchAnomalies();

        if (autoRefresh && refreshInterval > 0) {
            const interval = setInterval(fetchAnomalies, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchAnomalies, autoRefresh, refreshInterval]);

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
        setLoading(true);
        fetchAnomalies();
    };

    return (
        <Card className={`${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    이상 징후 피드
                </CardTitle>
                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(lastUpdated.toISOString())}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
                        오류: {error}
                    </div>
                )}

                <ScrollArea className="h-[400px] pr-4">
                    {loading && anomalies.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Activity className="h-4 w-4 animate-pulse" />
                                이상 징후 데이터 로딩 중...
                            </div>
                        </div>
                    ) : anomalies.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>현재 감지된 이상 징후가 없습니다.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {anomalies.map((anomaly) => (
                                <div
                                    key={anomaly.id}
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
                                                    <span className="text-sm font-medium">
                                                        {anomaly.serverName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTime(anomaly.timestamp)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-foreground mb-2">
                                        {anomaly.message}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <span>현재값: {anomaly.value.toFixed(2)}</span>
                                            <span>임계값: {anomaly.threshold.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Server className="h-3 w-3" />
                                            {anomaly.serverId}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
} 