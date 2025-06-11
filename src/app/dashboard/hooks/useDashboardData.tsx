'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLoadingState, LoadingStepInput } from './useLoadingState';

export interface DashboardData {
    servers: Server[];
    metrics: SystemMetrics;
    insights: AIInsight[];
    alerts: SystemAlert[];
    lastUpdated: string;
}

export interface Server {
    id: string;
    name: string;
    status: 'online' | 'warning' | 'offline';
    cpu: number;
    memory: number;
    disk: number;
    uptime: string;
    location: string;
    alerts: number;
    lastUpdate: Date;
    services: string[];
}

export interface SystemMetrics {
    totalServers: number;
    onlineServers: number;
    warningServers: number;
    offlineServers: number;
    averageCpu: number;
    averageMemory: number;
    averageDisk: number;
    totalAlerts: number;
}

export interface AIInsight {
    id: string;
    type: 'prediction' | 'anomaly' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    createdAt: string;
}

export interface SystemAlert {
    id: string;
    serverId: string;
    type: 'cpu' | 'memory' | 'disk' | 'network' | 'service';
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    timestamp: string;
    resolved: boolean;
}

export interface UseDashboardDataOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
    skipCondition?: boolean;
    onDataLoaded?: (data: DashboardData) => void;
    onError?: (error: string) => void;
}

/**
 * 🔄 Enhanced Dashboard Data Hook
 * 
 * 대시보드 데이터를 안전하게 페칭하고 관리합니다.
 * 
 * Features:
 * - 단계별 데이터 로딩
 * - 자동 새로고침
 * - 에러 처리 및 재시도
 * - 메모리 누수 방지
 * - 캐시 관리
 */
export function useDashboardData(options: UseDashboardDataOptions = {}) {
    const {
        autoRefresh = true,
        refreshInterval = 30000, // 30초
        skipCondition = false,
        onDataLoaded,
        onError,
    } = options;

    // 컴포넌트 마운트 상태 추적
    const isMountedRef = useRef(true);
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    // 데이터 상태
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);

    // 로딩 단계 정의
    const loadingSteps: LoadingStepInput[] = [
        {
            id: 'system-check',
            label: '시스템 연결',
            description: '서버 상태 확인 중...',
            duration: 500,
        },
        {
            id: 'servers-fetch',
            label: '서버 데이터',
            description: '서버 목록 및 메트릭 로드 중...',
            duration: 1000,
        },
        {
            id: 'ai-analysis',
            label: 'AI 분석',
            description: 'AI 인사이트 생성 중...',
            duration: 800,
        },
        {
            id: 'alerts-fetch',
            label: '알림 수집',
            description: '시스템 알림 확인 중...',
            duration: 300,
        },
        {
            id: 'finalization',
            label: '데이터 정리',
            description: '최종 데이터 처리 중...',
            duration: 200,
        },
    ];

    // 로딩 상태 관리
    const loadingState = useLoadingState({
        steps: loadingSteps,
        autoStart: false,
        skipCondition,
        onStepComplete: (step) => {
            console.log(`✅ Dashboard loading step completed: ${step.label}`);
        },
        onComplete: () => {
            console.log('🎉 Dashboard data loading completed');
        },
        onError: (error, step) => {
            console.error(`❌ Dashboard loading step failed: ${step.label}`, error);
            onError?.(error);
        },
    });

    // API 호출 함수들
    const fetchServers = async (): Promise<Server[]> => {
        const response = await fetch('/api/servers', {
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`서버 데이터 로드 실패: ${response.status}`);
        }

        return response.json();
    };

    const fetchMetrics = async (): Promise<SystemMetrics> => {
        const response = await fetch('/api/metrics', {
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`메트릭 데이터 로드 실패: ${response.status}`);
        }

        return response.json();
    };

    const fetchAIInsights = async (): Promise<AIInsight[]> => {
        const response = await fetch('/api/ai/insights', {
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            throw new Error(`AI 인사이트 로드 실패: ${response.status}`);
        }

        return response.json();
    };

    const fetchAlerts = async (): Promise<SystemAlert[]> => {
        const response = await fetch('/api/alerts', {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`알림 데이터 로드 실패: ${response.status}`);
        }

        return response.json();
    };

    // 메인 데이터 로딩 함수
    const loadDashboardData = useCallback(async (): Promise<void> => {
        if (!isMountedRef.current) return;

        try {
            setError(null);
            retryCountRef.current = 0;

            // 스킵 조건 확인
            if (skipCondition) {
                const mockData: DashboardData = {
                    servers: [],
                    metrics: {
                        totalServers: 0,
                        onlineServers: 0,
                        warningServers: 0,
                        offlineServers: 0,
                        averageCpu: 0,
                        averageMemory: 0,
                        averageDisk: 0,
                        totalAlerts: 0,
                    },
                    insights: [],
                    alerts: [],
                    lastUpdated: new Date().toISOString(),
                };

                setData(mockData);
                onDataLoaded?.(mockData);
                return;
            }

            // 단계별 데이터 로딩 시작
            loadingState.startLoading();

            // 1. 시스템 연결 확인
            await new Promise(resolve => setTimeout(resolve, 500));

            // 2. 서버 데이터 로드
            const servers = await fetchServers();
            if (!isMountedRef.current) return;

            // 3. AI 분석 실행
            const insights = await fetchAIInsights();
            if (!isMountedRef.current) return;

            // 4. 알림 데이터 로드
            const alerts = await fetchAlerts();
            if (!isMountedRef.current) return;

            // 5. 메트릭 계산
            const metrics = calculateMetrics(servers, alerts);

            // 6. 최종 데이터 구성
            const dashboardData: DashboardData = {
                servers,
                metrics,
                insights,
                alerts,
                lastUpdated: new Date().toISOString(),
            };

            setData(dashboardData);
            setLastFetchTime(Date.now());
            onDataLoaded?.(dashboardData);

        } catch (error) {
            if (!isMountedRef.current) return;

            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            console.error('❌ Dashboard data loading failed:', errorMessage);

            setError(errorMessage);
            onError?.(errorMessage);

            // 재시도 로직
            if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                console.log(`🔄 Retrying dashboard data load (${retryCountRef.current}/${maxRetries})`);
                setTimeout(loadDashboardData, 2000 * retryCountRef.current);
            }
        }
    }, [skipCondition, loadingState, onDataLoaded, onError]);

    // 메트릭 계산 함수
    const calculateMetrics = (servers: Server[], alerts: SystemAlert[]): SystemMetrics => {
        const totalServers = servers.length;
        const onlineServers = servers.filter(s => s.status === 'online').length;
        const warningServers = servers.filter(s => s.status === 'warning').length;
        const offlineServers = servers.filter(s => s.status === 'offline').length;

        const averageCpu = totalServers > 0
            ? servers.reduce((sum, s) => sum + s.cpu, 0) / totalServers
            : 0;

        const averageMemory = totalServers > 0
            ? servers.reduce((sum, s) => sum + s.memory, 0) / totalServers
            : 0;

        const averageDisk = totalServers > 0
            ? servers.reduce((sum, s) => sum + s.disk, 0) / totalServers
            : 0;

        const totalAlerts = alerts.filter(a => !a.resolved).length;

        return {
            totalServers,
            onlineServers,
            warningServers,
            offlineServers,
            averageCpu: Math.round(averageCpu * 100) / 100,
            averageMemory: Math.round(averageMemory * 100) / 100,
            averageDisk: Math.round(averageDisk * 100) / 100,
            totalAlerts,
        };
    };

    // 수동 새로고침
    const refreshData = useCallback(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // 자동 새로고침 설정
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            if (isMountedRef.current && Date.now() - lastFetchTime > refreshInterval) {
                loadDashboardData();
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, lastFetchTime, loadDashboardData]);

    // 초기 데이터 로드
    useEffect(() => {
        loadDashboardData();

        return () => {
            isMountedRef.current = false;
        };
    }, [loadDashboardData]);

    return {
        // 데이터
        data,
        error,
        lastFetchTime,

        // 로딩 상태
        isLoading: loadingState.isLoading,
        progress: loadingState.progress,
        currentStep: loadingState.currentStep,
        steps: loadingState.steps,
        estimatedTimeRemaining: loadingState.estimatedTimeRemaining,
        elapsedTime: loadingState.elapsedTime,
        isCompleted: loadingState.isCompleted,
        hasError: loadingState.hasError || !!error,

        // 액션
        refreshData,
        retryCount: retryCountRef.current,
        maxRetries,

        // 유틸리티
        isDataFresh: () => Date.now() - lastFetchTime < refreshInterval,
        getServerById: (id: string) => data?.servers.find(s => s.id === id),
        getActiveAlerts: () => data?.alerts.filter(a => !a.resolved) || [],
        getCriticalAlerts: () => data?.alerts.filter(a => !a.resolved && a.severity === 'critical') || [],
    };
} 