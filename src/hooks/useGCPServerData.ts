/**
 * GCP 서버 데이터 생성기 React Hook
 * TDD 방식으로 완성된 GCP 데이터 생성기를 React에서 사용하기 위한 훅
 */

import { BaselineDataset, HistoricalDataPoint, ServerMetric } from '@/services/gcp/TDDGCPDataGenerator';
import { useCallback, useEffect, useState } from 'react';

interface GCPServerDataState {
    dataset: BaselineDataset | null;
    realtimeMetrics: ServerMetric[];
    historicalData: HistoricalDataPoint[];
    activeSession: string | null;
    isSessionActive: boolean;
    loading: boolean;
    error: string | null;
}

interface UseGCPServerDataReturn extends GCPServerDataState {
    // 기본 데이터셋
    generateBaselineDataset: () => Promise<void>;

    // 세션 관리
    startSession: (sessionId: string) => Promise<void>;
    stopSession: (sessionId: string) => Promise<void>;
    getSessionStatus: (sessionId: string) => Promise<void>;

    // 메트릭 생성
    generateRealtimeMetrics: (sessionId: string) => Promise<void>;
    generateScenarioMetrics: (scenario: 'normal' | 'warning' | 'critical') => Promise<void>;
    generateHistoricalPattern: (startDate: string, endDate: string) => Promise<void>;

    // 유틸리티
    clearData: () => void;
    clearError: () => void;
}

export function useGCPServerData(): UseGCPServerDataReturn {
    const [state, setState] = useState<GCPServerDataState>({
        dataset: null,
        realtimeMetrics: [],
        historicalData: [],
        activeSession: null,
        isSessionActive: false,
        loading: false,
        error: null,
    });

    const setLoading = (loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    };

    const setError = (error: string | null) => {
        setState(prev => ({ ...prev, error, loading: false }));
    };

    const generateBaselineDataset = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/gcp/data-generator');
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    dataset: result.data,
                    loading: false,
                    error: null
                }));
            } else {
                setError(result.error || '데이터셋 생성에 실패했습니다.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
        }
    }, []);

    const startSession = useCallback(async (sessionId: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/gcp/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start_session', sessionId })
            });
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    activeSession: sessionId,
                    isSessionActive: true,
                    loading: false,
                    error: null
                }));
            } else {
                setError(result.error || '세션 시작에 실패했습니다.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
        }
    }, []);

    const stopSession = useCallback(async (sessionId: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/gcp/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop_session', sessionId })
            });
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    activeSession: null,
                    isSessionActive: false,
                    loading: false,
                    error: null
                }));
            } else {
                setError(result.error || '세션 정지에 실패했습니다.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
        }
    }, []);

    const getSessionStatus = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch('/api/gcp/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'session_status', sessionId })
            });
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    isSessionActive: result.isActive,
                    activeSession: result.isActive ? sessionId : null
                }));
            }
        } catch (error) {
            console.error('세션 상태 확인 오류:', error);
        }
    }, []);

    const generateRealtimeMetrics = useCallback(async (sessionId: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/gcp/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate_metrics', sessionId })
            });
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    realtimeMetrics: result.data,
                    loading: false,
                    error: null
                }));
            } else {
                setError(result.error || '실시간 메트릭 생성에 실패했습니다.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
        }
    }, []);

    const generateScenarioMetrics = useCallback(async (scenario: 'normal' | 'warning' | 'critical') => {
        setLoading(true);
        try {
            const response = await fetch('/api/gcp/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'scenario_metrics', scenario })
            });
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    realtimeMetrics: result.data,
                    loading: false,
                    error: null
                }));
            } else {
                setError(result.error || '시나리오 메트릭 생성에 실패했습니다.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
        }
    }, []);

    const generateHistoricalPattern = useCallback(async (startDate: string, endDate: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/gcp/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'historical_pattern',
                    startDate,
                    endDate
                })
            });
            const result = await response.json();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    historicalData: result.data,
                    loading: false,
                    error: null
                }));
            } else {
                setError(result.error || '히스토리컬 패턴 생성에 실패했습니다.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
        }
    }, []);

    const clearData = useCallback(() => {
        setState(prev => ({
            ...prev,
            dataset: null,
            realtimeMetrics: [],
            historicalData: [],
            error: null
        }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // 활성 세션 모니터링 (5초마다)
    useEffect(() => {
        if (state.activeSession) {
            const interval = setInterval(() => {
                getSessionStatus(state.activeSession!);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [state.activeSession, getSessionStatus]);

    return {
        ...state,
        generateBaselineDataset,
        startSession,
        stopSession,
        getSessionStatus,
        generateRealtimeMetrics,
        generateScenarioMetrics,
        generateHistoricalPattern,
        clearData,
        clearError,
    };
} 