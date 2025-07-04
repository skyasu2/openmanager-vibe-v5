import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

/**
 * 자동 로그아웃 훅 v1.0
 * OpenManager Vibe v5 - 베르셀 사용량 최적화
 * 
 * 기능:
 * 1. 사용자 활동 추적 (마우스, 키보드, 터치)
 * 2. 10분 비활성 시 자동 로그아웃
 * 3. 로그아웃 전 1분 경고 알림
 * 4. 모든 백그라운드 작업 중지
 * 
 * 사용법:
 * const { remainingTime, isWarning } = useAutoLogout();
 */

interface AutoLogoutOptions {
    timeoutMinutes?: number;
    warningMinutes?: number;
    onWarning?: () => void;
    onLogout?: () => void;
}

interface AutoLogoutReturn {
    remainingTime: number;
    isWarning: boolean;
    resetTimer: () => void;
    forceLogout: () => void;
}

export function useAutoLogout(options: AutoLogoutOptions = {}): AutoLogoutReturn {
    const {
        timeoutMinutes = 10,
        warningMinutes = 1,
        onWarning,
        onLogout
    } = options;

    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const isWarningRef = useRef<boolean>(false);

    // 남은 시간 계산
    const getRemainingTime = useCallback(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
        return Math.max(0, Math.floor(remaining / 1000));
    }, [timeoutMinutes]);

    // 로그아웃 실행
    const executeLogout = useCallback(async () => {
        console.log('🔒 자동 로그아웃 실행 - 베르셀 사용량 최적화');

        try {
            // 1. 사용자 세션 정리
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            localStorage.removeItem('google_oauth_token');

            // 2. 백그라운드 작업 중지 신호
            localStorage.setItem('system_inactive', 'true');
            localStorage.setItem('auto_logout_time', new Date().toISOString());

            // 3. React Query 캐시 정리 (안전한 타입 체크)
            if (typeof window !== 'undefined') {
                const globalWindow = window as any;
                if (globalWindow.queryClient && typeof globalWindow.queryClient.clear === 'function') {
                    globalWindow.queryClient.clear();
                }
            }

            // 4. 모든 타이머 정리
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

            // 5. 사용자 콜백 실행
            onLogout?.();

            // 6. 로그인 페이지로 리다이렉트
            router.push('/login?reason=timeout');

        } catch (error) {
            console.error('자동 로그아웃 중 오류:', error);
            // 오류가 발생해도 로그아웃 처리
            router.push('/login?reason=error');
        }
    }, [router, onLogout]);

    // 경고 알림 실행
    const executeWarning = useCallback(() => {
        console.log('⚠️ 자동 로그아웃 경고 - 1분 후 로그아웃');
        isWarningRef.current = true;
        onWarning?.();

        // 브라우저 알림
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('OpenManager 자동 로그아웃 경고', {
                body: `1분 후 자동 로그아웃됩니다. 계속 사용하려면 화면을 클릭하세요.`,
                icon: '/favicon.ico',
                tag: 'auto-logout-warning',
                requireInteraction: true
            });
        }
    }, [onWarning]);

    // 타이머 리셋
    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        isWarningRef.current = false;

        // 기존 타이머 정리
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

        // 경고 타이머 설정 (9분 후)
        const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
        warningTimeoutRef.current = setTimeout(executeWarning, warningTime);

        // 로그아웃 타이머 설정 (10분 후)
        const logoutTime = timeoutMinutes * 60 * 1000;
        timeoutRef.current = setTimeout(executeLogout, logoutTime);

        console.log(`⏱️ 자동 로그아웃 타이머 리셋: ${timeoutMinutes}분 후 로그아웃`);
    }, [timeoutMinutes, warningMinutes, executeWarning, executeLogout]);

    // 사용자 활동 감지 이벤트들
    const activityEvents = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click',
        'focus'
    ];

    // 활동 감지 핸들러
    const handleActivity = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    // 페이지 가시성 변경 처리
    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === 'visible') {
            resetTimer();
        }
    }, [resetTimer]);

    // 컴포넌트 마운트 시 이벤트 리스너 등록
    useEffect(() => {
        // 초기 타이머 설정
        resetTimer();

        // 활동 감지 이벤트 등록
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // 페이지 가시성 변경 이벤트
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 브라우저 알림 권한 요청
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            // 이벤트 리스너 제거
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            // 타이머 정리
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, [handleActivity, handleVisibilityChange, resetTimer]);

    return {
        remainingTime: getRemainingTime(),
        isWarning: isWarningRef.current,
        resetTimer,
        forceLogout: executeLogout
    };
} 