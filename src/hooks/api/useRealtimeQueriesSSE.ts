/**
 * 🔄 SSE 기반 실시간 쿼리 훅 (Vercel 호환)
 * 
 * WebSocket 대체 솔루션으로 Server-Sent Events 사용
 * - Vercel Functions와 완전 호환
 * - 타입 안전 구현
 * - 자동 재연결 및 에러 처리
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

// 🔧 쿼리 키 정의 (단순화)
const serverKeys = {
    lists: () => ['servers'] as const,
    detail: (id: string) => ['servers', id] as const,
};

const systemKeys = {
    health: () => ['system', 'health'] as const,
};

// 🔧 SSE 연결 상태
type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// 📨 SSE 메시지 타입
interface SSERealtimeMessage {
    type: 'connection' | 'server-metrics' | 'system-summary' | 'ai-prediction' | 'system-analysis' | 'prediction-error' | 'ping' | 'error';
    data?: any;
    message?: string;
    serverId?: string;
    timestamp: string;
    priority?: 'normal' | 'high' | 'urgent' | 'critical';
}

// 🔧 SSE 설정
interface SSEConfig {
    serverEndpoint?: string;
    predictionEndpoint?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    autoConnect?: boolean;
}

// 🔄 실시간 서버 상태 업데이트 (SSE)
export const useRealtimeServersSSE = (config: SSEConfig = {}) => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const isManuallyClosedRef = useRef(false);

    const {
        serverEndpoint = '/api/sse/servers',
        reconnectInterval = 5000,
        maxReconnectAttempts = 5,
        autoConnect = true,
    } = config;

    // 📊 연결 상태
    const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<SSERealtimeMessage | null>(null);
    const [messageCount, setMessageCount] = useState(0);

    // 🔄 SSE 연결
    const connect = useCallback(() => {
        if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
            console.log('⚠️ 서버 SSE 이미 연결됨');
            return;
        }

        console.log('🔄 서버 SSE 연결 시작:', serverEndpoint);
        setConnectionStatus('connecting');
        isManuallyClosedRef.current = false;

        try {
            const eventSource = new EventSource(serverEndpoint);
            eventSourceRef.current = eventSource;

            // 연결 성공
            eventSource.onopen = () => {
                console.log('✅ 서버 SSE 연결 성공');
                setConnectionStatus('connected');
                reconnectAttemptsRef.current = 0;
            };

            // 메시지 수신
            eventSource.onmessage = (event) => {
                try {
                    const message: SSERealtimeMessage = JSON.parse(event.data);

                    // 연결 확인 및 핑 메시지는 무시
                    if (message.type === 'connection' || message.type === 'ping') {
                        return;
                    }

                    console.log(`📨 서버 SSE 메시지 [${message.type}]:`, message);
                    setLastMessage(message);
                    setMessageCount(prev => prev + 1);

                    // 메시지 타입별 처리
                    switch (message.type) {
                        case 'server-metrics':
                            // 서버 메트릭 업데이트
                            if (message.serverId && message.data) {
                                queryClient.setQueryData(serverKeys.lists(), (oldData: any[]) => {
                                    if (!oldData) return [{ id: message.serverId, ...message.data }];

                                    const updatedServers = [...oldData];
                                    const existingIndex = updatedServers.findIndex(
                                        (server: any) => server.id === message.serverId
                                    );

                                    if (existingIndex >= 0) {
                                        updatedServers[existingIndex] = {
                                            ...updatedServers[existingIndex],
                                            ...message.data,
                                            lastUpdate: message.timestamp,
                                        };
                                    } else {
                                        updatedServers.push({
                                            id: message.serverId,
                                            ...message.data,
                                            lastUpdate: message.timestamp,
                                        });
                                    }

                                    return updatedServers;
                                });

                                // 특정 서버 상세 정보도 업데이트
                                queryClient.setQueryData(
                                    serverKeys.detail(message.serverId),
                                    (oldData: any) => oldData ? { ...oldData, ...message.data } : message.data
                                );
                            }
                            break;

                        case 'system-summary':
                            // 시스템 요약 업데이트
                            if (message.data) {
                                queryClient.setQueryData(systemKeys.health(), (oldData: any) => {
                                    return oldData ? { ...oldData, ...message.data } : message.data;
                                });
                            }
                            break;

                        case 'error':
                            console.error('❌ 서버 SSE 에러:', message.message);
                            setConnectionStatus('error');
                            break;
                    }

                    // 우선순위별 로그 처리
                    if (message.priority === 'critical' || message.priority === 'urgent') {
                        console.error(`🚨 ${message.data?.serverName || '시스템'}: ${message.data?.prediction || message.message}`);
                    } else if (message.priority === 'high') {
                        console.warn(`⚠️ ${message.data?.serverName || '시스템'}: ${message.data?.prediction || message.message}`);
                    }

                } catch (error) {
                    console.error('❌ 서버 SSE 메시지 파싱 오류:', error);
                }
            };

            // 연결 오류
            eventSource.onerror = (error) => {
                console.error('❌ 서버 SSE 연결 오류:', error);
                setConnectionStatus('error');

                // 자동 재연결 (최대 시도 횟수 내에서)
                if (!isManuallyClosedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    console.log(`🔄 서버 SSE 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

                    setTimeout(() => {
                        eventSource.close();
                        connect(); // 재귀적 재연결
                    }, reconnectInterval * reconnectAttemptsRef.current);
                } else {
                    console.warn('⚠️ 서버 SSE 최대 재연결 시도 초과 - 폴백 모드');
                    setConnectionStatus('disconnected');
                    eventSource.close();
                }
            };

        } catch (error) {
            console.error('❌ 서버 SSE 연결 생성 실패:', error);
            setConnectionStatus('error');
        }
    }, [serverEndpoint, reconnectInterval, maxReconnectAttempts, queryClient]);

    // 🔌 연결 해제
    const disconnect = useCallback(() => {
        console.log('🔌 서버 SSE 연결 해제');
        isManuallyClosedRef.current = true;

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setConnectionStatus('disconnected');
        setLastMessage(null);
    }, []);

    // 🔄 수동 재연결
    const reconnect = useCallback(() => {
        console.log('🔄 서버 SSE 수동 재연결');
        disconnect();

        setTimeout(() => {
            reconnectAttemptsRef.current = 0;
            connect();
        }, 1000);
    }, [connect, disconnect]);

    // 🚀 자동 연결
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [connect, disconnect, autoConnect]);

    return {
        // 연결 상태
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        isConnecting: connectionStatus === 'connecting',

        // 데이터
        lastMessage,
        messageCount,
        reconnectAttempts: reconnectAttemptsRef.current,

        // 제어 함수
        connect,
        disconnect,
        reconnect,

        // 설정
        endpoint: serverEndpoint,
        maxReconnectAttempts,
    };
};

// 🧠 실시간 AI 예측 (SSE)
export const useRealtimePredictionsSSE = (config: SSEConfig = {}) => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const isManuallyClosedRef = useRef(false);

    const {
        predictionEndpoint = '/api/sse/predictions',
        reconnectInterval = 5000,
        maxReconnectAttempts = 5,
        autoConnect = true,
    } = config;

    // 📊 연결 상태
    const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('disconnected');
    const [lastPrediction, setLastPrediction] = useState<SSERealtimeMessage | null>(null);
    const [predictionCount, setPredictionCount] = useState(0);

    // 🔄 SSE 연결
    const connect = useCallback(() => {
        if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
            console.log('⚠️ 예측 SSE 이미 연결됨');
            return;
        }

        console.log('🧠 AI 예측 SSE 연결 시작:', predictionEndpoint);
        setConnectionStatus('connecting');
        isManuallyClosedRef.current = false;

        try {
            const eventSource = new EventSource(predictionEndpoint);
            eventSourceRef.current = eventSource;

            // 연결 성공
            eventSource.onopen = () => {
                console.log('✅ AI 예측 SSE 연결 성공');
                setConnectionStatus('connected');
                reconnectAttemptsRef.current = 0;
            };

            // 메시지 수신
            eventSource.onmessage = (event) => {
                try {
                    const message: SSERealtimeMessage = JSON.parse(event.data);

                    // 연결 확인 및 핑 메시지는 무시
                    if (message.type === 'connection' || message.type === 'ping') {
                        return;
                    }

                    console.log(`🧠 AI 예측 SSE 메시지 [${message.type}]:`, message);
                    setLastPrediction(message);
                    setPredictionCount(prev => prev + 1);

                    // 메시지 타입별 처리
                    switch (message.type) {
                        case 'ai-prediction':
                            // AI 예측 결과 업데이트
                            if (message.data) {
                                queryClient.setQueryData(['predictions'], (oldData: any[]) => {
                                    const newPrediction = {
                                        id: `pred_${Date.now()}`,
                                        serverId: message.serverId,
                                        ...message.data,
                                        timestamp: message.timestamp,
                                    };

                                    const updatedPredictions = [...(oldData || []), newPrediction];
                                    return updatedPredictions.slice(-50); // 최근 50개만 유지
                                });
                            }
                            break;

                        case 'system-analysis':
                            // 시스템 분석 결과 업데이트
                            if (message.data) {
                                queryClient.setQueryData(['system-analysis'], message.data);
                            }
                            break;

                        case 'prediction-error':
                            console.error('❌ AI 예측 에러:', message.message);
                            break;
                    }

                    // 중요한 예측에 대한 알림
                    if (message.priority === 'critical' || message.priority === 'urgent') {
                        console.error(`🚨 AI 예측: ${message.data?.serverName} - ${message.data?.prediction}`);
                    }

                } catch (error) {
                    console.error('❌ AI 예측 SSE 메시지 파싱 오류:', error);
                }
            };

            // 연결 오류
            eventSource.onerror = (error) => {
                console.error('❌ AI 예측 SSE 연결 오류:', error);
                setConnectionStatus('error');

                // 자동 재연결
                if (!isManuallyClosedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    console.log(`🔄 AI 예측 SSE 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

                    setTimeout(() => {
                        eventSource.close();
                        connect();
                    }, reconnectInterval * reconnectAttemptsRef.current);
                } else {
                    console.warn('⚠️ AI 예측 SSE 최대 재연결 시도 초과');
                    setConnectionStatus('disconnected');
                    eventSource.close();
                }
            };

        } catch (error) {
            console.error('❌ AI 예측 SSE 연결 생성 실패:', error);
            setConnectionStatus('error');
        }
    }, [predictionEndpoint, reconnectInterval, maxReconnectAttempts, queryClient]);

    // 🔌 연결 해제
    const disconnect = useCallback(() => {
        console.log('🔌 AI 예측 SSE 연결 해제');
        isManuallyClosedRef.current = true;

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setConnectionStatus('disconnected');
        setLastPrediction(null);
    }, []);

    // 🔄 수동 재연결
    const reconnect = useCallback(() => {
        console.log('🔄 AI 예측 SSE 수동 재연결');
        disconnect();

        setTimeout(() => {
            reconnectAttemptsRef.current = 0;
            connect();
        }, 1000);
    }, [connect, disconnect]);

    // 🚀 자동 연결
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [connect, disconnect, autoConnect]);

    return {
        // 연결 상태
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        isConnecting: connectionStatus === 'connecting',

        // 데이터
        lastPrediction,
        predictionCount,
        reconnectAttempts: reconnectAttemptsRef.current,

        // 제어 함수
        connect,
        disconnect,
        reconnect,

        // 설정
        endpoint: predictionEndpoint,
        maxReconnectAttempts,
    };
};

// 🔄 통합 실시간 데이터 훅 (SSE)
export const useRealtimeDataSSE = (
    options: {
        servers?: boolean;
        predictions?: boolean;
    } = {}
) => {
    const { servers = true, predictions = true } = options;

    // 서버 메트릭 SSE
    const serverSSE = useRealtimeServersSSE({
        autoConnect: servers,
    });

    // AI 예측 SSE
    const predictionSSE = useRealtimePredictionsSSE({
        autoConnect: predictions,
    });

    // 🔄 전체 재연결
    const reconnectAll = useCallback(() => {
        console.log('🔄 모든 SSE 연결 재시작');

        if (servers) {
            serverSSE.reconnect();
        }

        if (predictions) {
            predictionSSE.reconnect();
        }
    }, [servers, predictions, serverSSE, predictionSSE]);

    // 🔌 전체 연결 해제
    const disconnectAll = useCallback(() => {
        console.log('🔌 모든 SSE 연결 해제');

        if (servers) {
            serverSSE.disconnect();
        }

        if (predictions) {
            predictionSSE.disconnect();
        }
    }, [servers, predictions, serverSSE, predictionSSE]);

    return {
        // 개별 SSE 상태
        servers: serverSSE,
        predictions: predictionSSE,

        // 전체 연결 상태
        isAllConnected:
            (!servers || serverSSE.isConnected) &&
            (!predictions || predictionSSE.isConnected),

        isAnyConnecting:
            (servers && serverSSE.isConnecting) ||
            (predictions && predictionSSE.isConnecting),

        // 전체 제어
        reconnectAll,
        disconnectAll,

        // 통계
        totalMessages:
            (servers ? serverSSE.messageCount : 0) +
            (predictions ? predictionSSE.predictionCount : 0),
    };
}; 