'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, Server, Database, Zap, Brain, Globe, Key, Settings, AlertTriangle, Download, BarChart3, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

interface KeyManagerStatus {
    timestamp: string;
    environment: string;
    keyManager: string;
    summary: {
        total: number;
        valid: number;
        invalid: number;
        missing: number;
        successRate: number;
    };
    services?: Array<{
        service: string;
        status: 'active' | 'missing' | 'invalid';
        source: 'env' | 'default' | 'encrypted';
        preview: string;
        lastChecked: string;
    }>;
}

const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Supabase')) return <Database className="w-5 h-5" />;
    if (serviceName.includes('Redis')) return <Zap className="w-5 h-5" />;
    if (serviceName.includes('Google AI')) return <Brain className="w-5 h-5" />;
    if (serviceName.includes('Render')) return <Server className="w-5 h-5" />;
    if (serviceName.includes('Vercel')) return <Globe className="w-5 h-5" />;
    return <Server className="w-5 h-5" />;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'connected': return 'bg-green-500';
        case 'error': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
};

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'connected': return 'default';
        case 'error': return 'destructive';
        default: return 'secondary';
    }
};

export default function DevToolsPage() {
    const [servicesData, setServicesData] = useState<ServicesStatusResponse | null>(null);
    const [keyManager, setKeyManager] = useState<KeyManagerStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [keyManagerLoading, setKeyManagerLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchServicesStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/dev/services-status');
            const data = await response.json();
            setServicesData(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('서비스 상태 확인 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKeyManagerStatus = async () => {
        try {
            setKeyManagerLoading(true);
            const response = await fetch('/api/dev/key-manager?action=status');
            const data = await response.json();
            setKeyManager(data);
        } catch (error) {
            console.error('키 관리자 상태 확인 실패:', error);
        } finally {
            setKeyManagerLoading(false);
        }
    };

    useEffect(() => {
        fetchServicesStatus();
        fetchKeyManagerStatus();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchServicesStatus();
                fetchKeyManagerStatus();
            }, 30000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const handleQuickSetup = async () => {
        try {
            setKeyManagerLoading(true);
            const response = await fetch('/api/dev/key-manager?action=quick-setup');
            const data = await response.json();

            if (data.success) {
                alert(`✅ ${data.message}`);
                await fetchKeyManagerStatus();
                await fetchServicesStatus();
            } else {
                alert(`❌ ${data.message}`);
            }
        } catch (error) {
            alert(`❌ 빠른 설정 실패: ${error}`);
        } finally {
            setKeyManagerLoading(false);
        }
    };

    const handleGenerateEnv = async () => {
        try {
            setKeyManagerLoading(true);
            const response = await fetch('/api/dev/key-manager?action=generate-env');
            const data = await response.json();

            if (data.success) {
                alert(`✅ ${data.message}\n📁 위치: ${data.path}`);
                await fetchKeyManagerStatus();
            } else {
                alert(`❌ ${data.message}`);
            }
        } catch (error) {
            alert(`❌ 파일 생성 실패: ${error}`);
        } finally {
            setKeyManagerLoading(false);
        }
    };

    const formatResponseTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
            case 'active':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
            case 'missing':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'invalid':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default:
                return <AlertTriangle className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
            case 'active':
                return <Badge variant="default" className="bg-green-100 text-green-800">활성화</Badge>;
            case 'error':
            case 'missing':
                return <Badge variant="destructive">오류</Badge>;
            case 'invalid':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">무효</Badge>;
            default:
                return <Badge variant="outline">알 수 없음</Badge>;
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'default':
                return '��';
            case 'encrypted':
                return '🔐';
            case 'env':
            default:
                return '📝';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            🛠️ 개발자 도구
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            OpenManager Vibe v5 - 외부 서비스 실시간 상태 모니터링
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant={autoRefresh ? "default" : "outline"}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
                        </Button>

                        <Button
                            onClick={fetchServicesStatus}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            수동 새로고침
                        </Button>
                    </div>
                </div>

                {/* 키 관리자 섹션 */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Key className="h-5 w-5" />
                                <CardTitle>🔑 DevKeyManager</CardTitle>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchKeyManagerStatus}
                                    disabled={keyManagerLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${keyManagerLoading ? 'animate-spin' : ''}`} />
                                    새로고침
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateEnv}
                                    disabled={keyManagerLoading}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    .env 생성
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleQuickSetup}
                                    disabled={keyManagerLoading}
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    빠른 설정
                                </Button>
                            </div>
                        </div>
                        <CardDescription>
                            통합 API 키 관리 시스템 - 개발 효율성 우선
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {keyManager ? (
                            <div className="space-y-4">
                                {/* 요약 정보 */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{keyManager.summary.total}</div>
                                        <div className="text-sm text-muted-foreground">총 서비스</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{keyManager.summary.valid}</div>
                                        <div className="text-sm text-muted-foreground">활성화</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">{keyManager.summary.invalid}</div>
                                        <div className="text-sm text-muted-foreground">무효</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">{keyManager.summary.missing}</div>
                                        <div className="text-sm text-muted-foreground">누락</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${keyManager.summary.successRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {keyManager.summary.successRate}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">성공률</div>
                                    </div>
                                </div>

                                <Separator />

                                {/* 서비스별 상태 */}
                                {keyManager.services && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">서비스별 상태</h4>
                                        <div className="grid gap-2">
                                            {keyManager.services.map((service, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        {getStatusIcon(service.status)}
                                                        <div>
                                                            <div className="font-medium">{service.service}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {getSourceIcon(service.source)} {service.preview}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusBadge(service.status)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 환경 정보 */}
                                <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>환경: {keyManager.environment}</div>
                                        <div>버전: {keyManager.keyManager}</div>
                                        <div>확인 시간: {new Date(keyManager.timestamp).toLocaleString('ko-KR')}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">키 관리자 상태를 확인하는 중...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* 컨텍스트 캐시 모니터링 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🚀 컨텍스트 캐시 모니터링
                            <Badge variant="outline" className="text-xs">AI 최적화</Badge>
                        </CardTitle>
                        <CardDescription>
                            통합 컨텍스트 캐싱 레이어 성능 모니터링 (시연용 최적화 적용)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">캐시 히트율</p>
                                            <p className="text-2xl font-bold text-green-600">---%</p>
                                        </div>
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-600 text-sm">⚡</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">메모리 사용량</p>
                                            <p className="text-2xl font-bold text-blue-600">--KB</p>
                                        </div>
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-sm">💾</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Redis 연결</p>
                                            <p className="text-2xl font-bold text-purple-600">확인중</p>
                                        </div>
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 text-sm">🔗</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                🎯 AI 최적화 적용 현황
                                <Badge variant="secondary" className="text-xs">시연용</Badge>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">메모리 최적화:</p>
                                    <ul className="text-slate-600 dark:text-slate-400 ml-4 list-disc">
                                        <li>패턴 저장소: 20개 → 10개</li>
                                        <li>결과 저장소: 50개 → 25개</li>
                                        <li>쿼리 히스토리: 20개 → 15개</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">캐시 최적화:</p>
                                    <ul className="text-slate-600 dark:text-slate-400 ml-4 list-disc">
                                        <li>TTL: 1시간 → 30분</li>
                                        <li>로컬 캐시: 100개 제한</li>
                                        <li>정리 주기: 5분마다</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                캐시 새로고침
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                성능 리포트
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                캐시 정리
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 터미널 명령어 가이드 */}
                <Card>
                    <CardHeader>
                        <CardTitle>💻 터미널 명령어</CardTitle>
                        <CardDescription>
                            개발 효율성을 위한 CLI 도구들
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="bg-muted p-3 rounded font-mono text-sm">
                                <div className="text-green-600 mb-2"># 키 관리</div>
                                <div>npm run dev:keys status      # 키 상태 확인</div>
                                <div>npm run dev:keys setup       # 빠른 설정</div>
                                <div>npm run dev:keys generate    # .env.local 생성</div>
                                <div>npm run dev:keys report      # 상세 리포트</div>
                            </div>
                            <div className="bg-muted p-3 rounded font-mono text-sm">
                                <div className="text-blue-600 mb-2"># 서비스 관리</div>
                                <div>npm run check-services       # 서비스 상태 확인</div>
                                <div>npm run dev:setup-keys       # 통합 설정</div>
                                <div>npm run dev:monitor          # 모니터링 모드</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 기존 서비스 상태 섹션 */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Settings className="h-5 w-5" />
                                <CardTitle>🔄 외부 서비스 상태</CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchServicesStatus}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                새로고침
                            </Button>
                        </div>
                        <CardDescription>
                            Supabase, Redis, Google AI, MCP 서버 연결 상태
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* 요약 카드 */}
                        {servicesData && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">총 서비스</p>
                                                <p className="text-2xl font-bold">{servicesData.summary.total}</p>
                                            </div>
                                            <Server className="w-8 h-8 text-slate-400" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">연결됨</p>
                                                <p className="text-2xl font-bold text-green-600">{servicesData.summary.connected}</p>
                                            </div>
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">오류</p>
                                                <p className="text-2xl font-bold text-red-600">{servicesData.summary.errors}</p>
                                            </div>
                                            <XCircle className="w-8 h-8 text-red-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">평균 응답시간</p>
                                                <p className="text-2xl font-bold">{formatResponseTime(servicesData.summary.averageResponseTime)}</p>
                                            </div>
                                            <Clock className="w-8 h-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* 서비스 상태 카드들 */}
                        {servicesData && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {servicesData.services.map((service, index) => (
                                    <Card key={index} className="relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(service.status)}`} />

                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {getServiceIcon(service.name)}
                                                    <CardTitle className="text-lg">{service.name}</CardTitle>
                                                </div>
                                                <Badge variant={getStatusBadgeVariant(service.status)}>
                                                    {service.status === 'connected' ? '연결됨' :
                                                        service.status === 'error' ? '오류' : '알 수 없음'}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                응답시간: {formatResponseTime(service.responseTime)}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent>
                                            {service.status === 'error' && service.error && (
                                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">오류:</p>
                                                    <p className="text-sm text-red-600 dark:text-red-400">{service.error}</p>
                                                </div>
                                            )}

                                            {service.details && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">상세 정보:</p>
                                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                                        <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                                                            {JSON.stringify(service.details, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 마지막 업데이트 시간 */}
                {lastUpdated && (
                    <div className="text-center text-sm text-muted-foreground">
                        마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
                    </div>
                )}

                {/* 개발 팁 */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            💡 개발 팁
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">터미널에서 상태 확인:</p>
                                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                                    curl http://localhost:3000/api/dev/services-status
                                </code>
                            </div>
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">환경변수 확인:</p>
                                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                                    .env.local 파일 생성 필요
                                </code>
                            </div>
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">자동 새로고침:</p>
                                <p className="text-slate-600 dark:text-slate-400">10초마다 자동으로 상태 업데이트</p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">실시간 모니터링:</p>
                                <p className="text-slate-600 dark:text-slate-400">개발 중 이 페이지를 열어두세요</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 