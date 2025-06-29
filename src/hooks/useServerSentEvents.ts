/**
 * 🔄 Server-Sent Events Hook
 * 
 * Vercel 호환 실시간 데이터 스트리밍
 * - WebSocket 대체 솔루션
 * - 자동 재연결 및 에러 처리
 * - 다중 채널 지원
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SSEConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    lastMessage: any;
    messageCount: number;
    connectionId: string | null;
}

export interface SSEMessage {
    type: string;
    data?: any;
    message?: string;
    timestamp: string;
    serverId?: string;
    priority?: 'normal' | 'high' | 'urgent' | 'critical';
}

export interface UseServerSentEventsOptions {
    endpoint: string;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    onMessage?: (message: SSEMessage) => void;
    onError?: (error: Error) => void;
    onConnect?: (connectionId: string) => void;
    onDisconnect?: () => void;
    messageFilter?: (message: SSEMessage) => boolean;
}

export function useServerSentEvents(options: UseServerSentEventsOptions) {
    const {
        endpoint,
        autoReconnect = true,
        maxReconnectAttempts = 5,
        reconnectInterval = 5000,
        onMessage,
        onError,
        onConnect,
        onDisconnect,
        messageFilter,
    } = options;

    // 연결 상태 관리
    const [connectionState, setConnectionState] = useState<SSEConnectionState>({
        isConnected: false,
        isConnecting: false,
        error: null,
        lastMessage: null,
        messageCount: 0,
        connectionId: null,
    });

    // 메시지 히스토리 (최근 100개)
    const [messageHistory, setMessageHistory] = useState<SSEMessage[]>([]);

    // 내부 상태 관리
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isManuallyClosedRef = useRef(false);

    // 🔄 SSE 연결 함수
    const connect = useCallback(() => {
        if (eventSourceRef.current?.readyState === EventSource.OPEN) {
            console.log('⚠️ SSE 이미 연결됨:', endpoint);
            return;
        }

        console.log('🔄 SSE 연결 시작:', endpoint);

        setConnectionState(prev => ({
            ...prev,
            isConnecting: true,
            error: null,
        }));

        try {
            // EventSource 생성 (SSE 연결)
            const eventSource = new EventSource(endpoint);
            eventSourceRef.current = eventSource;

            // 연결 성공
            eventSource.onopen = () => {
                console.log('✅ SSE 연결 성공:', endpoint);

                setConnectionState(prev => ({
                    ...prev,
                    isConnected: true,
                    isConnecting: false,
                    error: null,
                }));

                // 재연결 카운터 리셋
                reconnectAttemptsRef.current = 0;
            };

            // 메시지 수신
            eventSource.onmessage = (event) => {
                try {
                    const message: SSEMessage = JSON.parse(event.data);

                    // 메시지 필터링
                    if (messageFilter && !messageFilter(message)) {
                        return;
                    }

                    console.log(`📨 SSE 메시지 수신 [${message.type}]:`, message);

                    // 연결 확인 메시지 처리
                    if (message.type === 'connection') {
                        setConnectionState(prev => ({
                            ...prev,
                            connectionId: message.data?.connectionId || null,
                        }));

                        if (onConnect && message.data?.connectionId) {
                            onConnect(message.data.connectionId);
                        }
                        return;
                    }

                    // Ping 메시지는 무시
                    if (message.type === 'ping') {
                        return;
                    }

                    // 상태 업데이트
                    setConnectionState(prev => ({
                        ...prev,
                        lastMessage: message,
                        messageCount: prev.messageCount + 1,
                    }));

                    // 메시지 히스토리 업데이트 (최근 100개만 유지)
                    setMessageHistory(prev => {
                        const newHistory = [...prev, message];
                        return newHistory.slice(-100);
                    });

                    // 콜백 실행
                    if (onMessage) {
                        onMessage(message);
                    }

                    // 우선순위별 알림 처리 (콘솔 로그)
                    if (message.priority === 'critical' || message.priority === 'urgent') {
                        console.error(`🚨 ${message.data?.serverName || '시스템'}: ${message.data?.prediction || message.message}`);
                    } else if (message.priority === 'high') {
                        console.warn(`⚠️ ${message.data?.serverName || '시스템'}: ${message.data?.prediction || message.message}`);
                    }

                } catch (error) {
                    console.error('❌ SSE 메시지 파싱 오류:', error, event.data);
                }
            };

            // 연결 오류
            eventSource.onerror = (error) => {
                console.error('❌ SSE 연결 오류:', error);

                const errorMessage = '실시간 데이터 연결 오류';

                setConnectionState(prev => ({
                    ...prev,
                    isConnected: false,
                    isConnecting: false,
                    error: errorMessage,
                }));

                if (onError) {
                    onError(new Error(errorMessage));
                }

                // 자동 재연결 시도
                if (autoReconnect && !isManuallyClosedRef.current) {
                    handleReconnect();
                }
            };

        } catch (error) {
            console.error('❌ SSE 연결 생성 실패:', error);

            setConnectionState(prev => ({
                ...prev,
                isConnected: false,
                isConnecting: false,
                error: error instanceof Error ? error.message : 'SSE 연결 실패',
            }));

            if (onError) {
                onError(error instanceof Error ? error : new Error('SSE 연결 실패'));
            }
        }
    }, [endpoint, autoReconnect, onMessage, onError, onConnect, messageFilter]);

    // 🔄 재연결 처리
    const handleReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.warn('⚠️ SSE 최대 재연결 시도 초과');

            setConnectionState(prev => ({
                ...prev,
                error: '연결 재시도 한계 도달 - 페이지를 새로고침해주세요',
            }));

            console.error('실시간 데이터 연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
            return;
        }

        reconnectAttemptsRef.current++;

        console.log(`🔄 SSE 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

        reconnectTimeoutRef.current = setTimeout(() => {
            connect();
        }, reconnectInterval * reconnectAttemptsRef.current);

    }, [connect, maxReconnectAttempts, reconnectInterval]);

    // 🔌 연결 해제
    const disconnect = useCallback(() => {
        console.log('🔌 SSE 연결 해제');

        isManuallyClosedRef.current = true;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setConnectionState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
        }));

        if (onDisconnect) {
            onDisconnect();
        }
    }, [onDisconnect]);

    // 🔄 수동 재연결
    const reconnect = useCallback(() => {
        console.log('🔄 수동 SSE 재연결');

        disconnect();

        setTimeout(() => {
            isManuallyClosedRef.current = false;
            reconnectAttemptsRef.current = 0;
            connect();
        }, 1000);
    }, [disconnect, connect]);

    // 메시지 전송 (SSE는 단방향이므로 별도 API 호출)
    const sendMessage = useCallback(async (message: any) => {
        console.warn('⚠️ SSE는 단방향 통신입니다. 별도 API를 통해 메시지를 전송하세요.');

        // 향후 확장: WebSocket fallback 또는 별도 API 호출
        throw new Error('SSE는 단방향 통신만 지원합니다');
    }, []);

    // 🎯 생명주기 관리
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // 메시지 필터링 유틸리티
    const getMessagesByType = useCallback((messageType: string) => {
        return messageHistory.filter(msg => msg.type === messageType);
    }, [messageHistory]);

    const getMessagesByServer = useCallback((serverId: string) => {
        return messageHistory.filter(msg => msg.serverId === serverId);
    }, [messageHistory]);

    const getLatestMessage = useCallback((messageType?: string) => {
        if (!messageType) return connectionState.lastMessage;

        const filtered = messageHistory.filter(msg => msg.type === messageType);
        return filtered[filtered.length - 1] || null;
    }, [messageHistory, connectionState.lastMessage]);

    return {
        // 연결 상태
        ...connectionState,

        // 메시지 데이터
        messageHistory,

        // 제어 함수
        connect,
        disconnect,
        reconnect,
        sendMessage,

        // 유틸리티 함수
        getMessagesByType,
        getMessagesByServer,
        getLatestMessage,

        // 연결 정보
        endpoint,
        reconnectAttempts: reconnectAttemptsRef.current,
        maxReconnectAttempts,
    };
} 