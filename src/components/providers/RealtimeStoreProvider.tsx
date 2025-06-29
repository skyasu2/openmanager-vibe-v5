/**
 * 🔄 통합 실시간 스토어 프로바이더 v1.0 - 2025.06.27 KST
 * 
 * ✅ 앱 전체 실시간 데이터 관리
 * ✅ 자동 폴링 시작/중단 제어
 * ✅ 페이지 가시성 최적화
 * ✅ 메모리 누수 방지
 */

'use client';

import { useRealtimeControl } from '@/stores/globalRealtimeStore';
import { useEffect, useRef } from 'react';

interface RealtimeStoreProviderProps {
    children: React.ReactNode;
}

export function RealtimeStoreProvider({ children }: RealtimeStoreProviderProps) {
    const { isPolling, startPolling, stopPolling } = useRealtimeControl();
    const hasInitialized = useRef(false);

    useEffect(() => {
        // 앱 시작시 한 번만 초기화
        if (!hasInitialized.current) {
            console.log('🚀 OpenManager Vibe v5 - 통합 실시간 시스템 초기화 (KST):',
                new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

            startPolling();
            hasInitialized.current = true;
        }

        // 앱 종료시 정리
        const handleBeforeUnload = () => {
            if (isPolling) {
                console.log('🛑 앱 종료 - 실시간 폴링 중단');
                stopPolling();
            }
        };

        // 페이지 가시성 최적화
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (!isPolling) {
                    console.log('👁️ 앱 활성화 - 실시간 폴링 재시작');
                    startPolling();
                }
            } else if (document.visibilityState === 'hidden') {
                // 백그라운드에서도 최소한의 폴링은 유지 (관리자 알림 등을 위해)
                console.log('📱 앱 백그라운드 이동 - 폴링 유지 (최적화 모드)');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isPolling, startPolling, stopPolling]);

    // 개발 환경에서 폴링 상태 모니터링
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const logInterval = setInterval(() => {
                console.log('📊 실시간 폴링 상태:', {
                    isPolling,
                    timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
                    visibility: document.visibilityState
                });
            }, 60000); // 1분마다 로그

            return () => clearInterval(logInterval);
        }
    }, [isPolling]);

    return <>{children}</>;
} 