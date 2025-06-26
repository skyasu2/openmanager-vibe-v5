/**
 * React 관련 타입 안전성을 위한 유틸리티 함수들
 */

import React, { DependencyList, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 안전한 useEffect 래퍼
export function useSafeEffect(
    effect: () => void | (() => void | undefined),
    deps?: DependencyList
): void {
    useEffect(() => {
        const cleanup = effect();
        return cleanup;
    }, deps);
}

// 비동기 useEffect를 위한 안전한 래퍼
export function useAsyncEffect(
    effect: () => Promise<void | (() => void | undefined)>,
    deps?: DependencyList
): void {
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        effect().then(result => {
            if (typeof result === 'function') {
                cleanup = result;
            }
        }).catch(error => {
            console.error('Async effect error:', error);
        });

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, deps);
}

// 조건부 useEffect
export function useConditionalEffect(
    effect: () => void | (() => void | undefined),
    condition: boolean,
    deps?: DependencyList
): void {
    useEffect(() => {
        if (condition) {
            return effect();
        }
    }, [condition, ...(deps || [])]);
}

// 타이머 기반 useEffect (자동 정리)
export function useTimerEffect(
    effect: () => void,
    delay: number,
    deps?: DependencyList
): void {
    useEffect(() => {
        const timer = setTimeout(effect, delay);
        return () => clearTimeout(timer);
    }, deps);
}

// 인터벌 기반 useEffect (자동 정리)
export function useIntervalEffect(
    effect: () => void,
    interval: number,
    deps?: DependencyList
): void {
    useEffect(() => {
        const timer = setInterval(effect, interval);
        return () => clearInterval(timer);
    }, deps);
}

// 이벤트 리스너 useEffect (자동 정리)
export function useEventListenerEffect<K extends keyof WindowEventMap>(
    event: K,
    handler: (event: WindowEventMap[K]) => void,
    deps?: DependencyList
): void {
    useEffect(() => {
        window.addEventListener(event, handler);
        return () => window.removeEventListener(event, handler);
    }, deps);
}

// DOM 요소 이벤트 리스너 useEffect
export function useElementEventEffect<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | null,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    deps?: DependencyList
): void {
    useEffect(() => {
        if (!element) return;

        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }, [element, event, handler, ...(deps || [])]);
}

// 안전한 state 업데이트 체크
export function useMountedRef(): React.RefObject<boolean> {
    const mountedRef = { current: true };

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    return mountedRef;
}

// 컴포넌트 마운트 상태 확인 후 안전한 상태 업데이트
export function useSafeSetState<T>(
    initialState: T
): [T, (newState: T | ((prevState: T) => T)) => void] {
    const [state, setState] = useState(initialState);
    const mountedRef = useMountedRef();

    const safeSetState = useCallback((newState: T | ((prevState: T) => T)) => {
        if (mountedRef.current) {
            setState(newState);
        }
    }, [mountedRef]);

    return [state, safeSetState];
}

// 디바운스된 useEffect
export function useDebouncedEffect(
    effect: () => void | (() => void | undefined),
    delay: number,
    deps?: DependencyList
): void {
    useEffect(() => {
        const handler = setTimeout(() => {
            const cleanup = effect();
            return cleanup;
        }, delay);

        return () => clearTimeout(handler);
    }, [...(deps || []), delay]);
}

// 쓰로틀된 useEffect
export function useThrottledEffect(
    effect: () => void,
    delay: number,
    deps?: DependencyList
): void {
    const lastRun = useRef(Date.now());

    useEffect(() => {
        if (Date.now() - lastRun.current >= delay) {
            effect();
            lastRun.current = Date.now();
        }
    }, deps);
}

// 배열 안전 접근을 위한 hook
export function useSafeArrayAccess<T>(array: T[], index: number): T | undefined {
    return useMemo(() => {
        return array && array.length > index && index >= 0 ? array[index] : undefined;
    }, [array, index]);
}

// 객체 안전 접근을 위한 hook
export function useSafeObjectAccess<T, K extends keyof T>(
    obj: T | null | undefined,
    key: K
): T[K] | undefined {
    return useMemo(() => {
        return obj?.[key];
    }, [obj, key]);
}

// 안전한 로컬 스토리지 접근
export function useLocalStorage<T>(
    key: string,
    defaultValue: T
): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            if (typeof window !== 'undefined') {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            }
            return defaultValue;
        } catch (error) {
            console.error('Error reading localStorage:', error);
            return defaultValue;
        }
    });

    const setValue = useCallback((value: T) => {
        try {
            setStoredValue(value);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error('Error setting localStorage:', error);
        }
    }, [key]);

    return [storedValue, setValue];
}

// 안전한 세션 스토리지 접근
export function useSessionStorage<T>(
    key: string,
    defaultValue: T
): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            if (typeof window !== 'undefined') {
                const item = window.sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            }
            return defaultValue;
        } catch (error) {
            console.error('Error reading sessionStorage:', error);
            return defaultValue;
        }
    });

    const setValue = useCallback((value: T) => {
        try {
            setStoredValue(value);
            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error('Error setting sessionStorage:', error);
        }
    }, [key]);

    return [storedValue, setValue];
} 