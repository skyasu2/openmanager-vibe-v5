'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkSystemState, validateSystemForOperation, type SystemStateInfo } from '@/utils/systemStateChecker';
import { AlertTriangle, CheckCircle, Loader2, Power, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemStateCheckerProps {
    showDetails?: boolean;
    autoRefresh?: boolean;
    className?: string;
}

export function SystemStateChecker({
    showDetails = true,
    autoRefresh = false,
    className = ''
}: SystemStateCheckerProps) {
    const [systemState, setSystemState] = useState<SystemStateInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSystemState = async () => {
        try {
            setLoading(true);
            setError(null);
            const state = await checkSystemState();
            setSystemState(state);
        } catch (err) {
            setError(err instanceof Error ? err.message : '시스템 상태 확인 실패');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemState();
    }, []);

    useEffect(() => {
        if (autoRefresh && systemState?.isSystemActive) {
            const interval = setInterval(fetchSystemState, 30000); // 30초마다 새로고침
            return () => clearInterval(interval);
        }
    }, [autoRefresh, systemState?.isSystemActive]);

    const getStatusColor = (powerMode: string, isActive: boolean) => {
        if (!isActive) return 'destructive';
        switch (powerMode) {
            case 'active': return 'default';
            case 'monitoring': return 'secondary';
            case 'emergency': return 'destructive';
            default: return 'outline';
        }
    };

    const getStatusIcon = (powerMode: string, isActive: boolean) => {
        if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
        if (!isActive) return <Power className="h-4 w-4" />;
        switch (powerMode) {
            case 'active': return <CheckCircle className="h-4 w-4" />;
            case 'monitoring': return <Settings className="h-4 w-4" />;
            case 'emergency': return <AlertTriangle className="h-4 w-4" />;
            default: return <Power className="h-4 w-4" />;
        }
    };

    const testSystemOperation = async () => {
        if (!systemState) return;

        try {
            const validation = await validateSystemForOperation('테스트 작업');
            alert(`작업 실행 가능: ${validation.canProceed ? '예' : '아니오'}\n이유: ${validation.reason}`);
        } catch (err) {
            alert(`검증 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
        }
    };

    if (error) {
        return (
            <Card className={`border-red-200 ${className}`}>
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        시스템 상태 확인 오류
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchSystemState} variant="outline" size="sm">
                        다시 시도
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        {systemState && getStatusIcon(systemState.powerMode, systemState.isSystemActive)}
                        시스템 상태
                    </span>
                    <div className="flex items-center gap-2">
                        {systemState && (
                            <Badge variant={getStatusColor(systemState.powerMode, systemState.isSystemActive)}>
                                {systemState.isSystemActive ? '활성' : '비활성'}
                            </Badge>
                        )}
                        <Button
                            onClick={fetchSystemState}
                            variant="ghost"
                            size="sm"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '새로고침'}
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {systemState && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">전원 모드</label>
                                <p className="text-lg font-semibold capitalize">{systemState.powerMode}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">데이터 수집</label>
                                <p className="text-lg font-semibold">
                                    {systemState.isDataCollecting ? '활성' : '비활성'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">상태 설명</label>
                            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">
                                {systemState.reason}
                            </p>
                        </div>

                        {showDetails && (
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>작업 실행 가능:</span>
                                        <Badge variant={systemState.shouldSkipOperation ? 'destructive' : 'default'}>
                                            {systemState.shouldSkipOperation ? '차단됨' : '허용됨'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>자동 새로고침:</span>
                                        <Badge variant={autoRefresh ? 'default' : 'outline'}>
                                            {autoRefresh ? '활성' : '비활성'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button onClick={testSystemOperation} variant="outline" size="sm">
                                작업 실행 테스트
                            </Button>
                            {systemState.isSystemActive && (
                                <Button
                                    onClick={() => window.open('/admin', '_blank')}
                                    variant="secondary"
                                    size="sm"
                                >
                                    관리자 대시보드
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
} 