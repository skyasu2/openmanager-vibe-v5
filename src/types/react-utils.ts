/**
 * React 관련 타입 안전성을 위한 유틸리티 함수들
 * v2.0 - react-hooks/exhaustive-deps 경고 해결 버전
 */

import type { DependencyList } from 'react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 컴포넌트 마운트 상태 확인
export function useMountedRef(): React.MutableRefObject<boolean> {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

// 컴포넌트 마운트 상태 확인 후 안전한 상태 업데이트
export function useSafeSetState<T>(
  _initialState: T
): [T, (newState: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState(_initialState);
  const mountedRef = useMountedRef();

  const safeSetState = useCallback(
    (newState: T | ((prevState: T) => T)) => {
      if (mountedRef.current) {
        setState(newState);
      }
    },
    [mountedRef] // mountedRef 의존성 추가
  );

  return [state, safeSetState];
}

// 타이머 기반 useEffect (자동 정리)
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // callback이 변경되면 ref 업데이트
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const timer = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);
}

// 인터벌 기반 useEffect (자동 정리)
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // callback이 변경되면 ref 업데이트
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const timer = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(timer);
  }, [delay]);
}

// 이벤트 리스너 useEffect (자동 정리)
export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  // handler가 변경되면 ref 업데이트
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: WindowEventMap[K]) => {
      savedHandler.current(event);
    };

    window.addEventListener(event, eventListener, options);
    return () => window.removeEventListener(event, eventListener, options);
  }, [event, options]);
}

// DOM 요소 이벤트 리스너 useEffect
export function useElementEvent<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  // handler가 변경되면 ref 업데이트
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: HTMLElementEventMap[K]) => {
      savedHandler.current(event);
    };

    element.addEventListener(event, eventListener, options);
    return () => element.removeEventListener(event, eventListener, options);
  }, [element, event, options]);
}

// 디바운스된 값
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 디바운스된 콜백
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // callback이 변경되면 ref 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// 쓰로틀된 콜백
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // callback이 변경되면 ref 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  ) as T;

  // cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// 이전 값 추적
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 배열 안전 접근을 위한 hook
export function useSafeArrayAccess<T>(
  array: T[],
  index: number
): T | undefined {
  return useMemo(() => {
    return array && array.length > index && index >= 0
      ? array[index]
      : undefined;
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
): [T, (value: T | ((prev: T) => T)) => void] {
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

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// 안전한 세션 스토리지 접근
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
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

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error setting sessionStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// 조건부 렌더링을 위한 hook
export function useConditionalEffect(
  effect: () => void | (() => void),
  condition: boolean,
  deps: DependencyList
): void {
  const savedEffect = useRef(effect);

  // effect가 변경되면 ref 업데이트
  useEffect(() => {
    savedEffect.current = effect;
  }, [effect]);

  useEffect(() => {
    if (condition) {
      return savedEffect.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, ...deps]);
}

// 비동기 상태 관리
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
): {
  loading: boolean;
  error: E | null;
  data: T | null;
  execute: () => Promise<void>;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err as E);
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { loading, error, data, execute };
}

// 윈도우 크기 감지
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// 네트워크 상태 감지
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
