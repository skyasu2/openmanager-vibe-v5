import { useCallback, useState } from 'react';

/**
 * 🔧 공통 Toggle 상태 관리 훅
 * isOpen, isVisible, isExpanded 등에 사용
 */
export function useToggle(_initialValue: boolean = false) {
  const [value, setValue] = useState(_initialValue);

  const toggle = useCallback(() => setValue((prev) => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
  };
}

/**
 * 🔧 공통 Loading 상태 관리 훅
 * API 호출, 비동기 작업 등에 사용
 */
export function useLoading(_initialValue: boolean = false) {
  const [isLoading, setIsLoading] = useState(_initialValue);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        const result = await asyncFn();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    setIsLoading,
  };
}

/**
 * 🔧 공통 Index 상태 관리 훅
 * 배열 순회, 페이지네이션 등에 사용
 */
export function useIndex(maxIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev < maxIndex - 1 ? prev + 1 : prev));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < maxIndex) {
        setCurrentIndex(index);
      }
    },
    [maxIndex]
  );

  const reset = useCallback(() => setCurrentIndex(0), []);

  return {
    currentIndex,
    next,
    prev,
    goTo,
    reset,
    setCurrentIndex,
    isFirst: currentIndex === 0,
    isLast: currentIndex === maxIndex - 1,
  };
}

/**
 * 🔧 공통 배열 상태 관리 훅
 * 목록 데이터 관리에 사용
 */
export function useArray<T>(_initialArray: T[] = []) {
  const [array, setArray] = useState<T[]>(_initialArray);

  const push = useCallback((item: T) => {
    setArray((prev) => [...prev, item]);
  }, []);

  const remove = useCallback((index: number) => {
    setArray((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setArray((prev) =>
      prev.map((oldItem, i) => (i === index ? item : oldItem))
    );
  }, []);

  const clear = useCallback(() => setArray([]), []);

  return {
    array,
    push,
    remove,
    update,
    clear,
    setArray,
    length: array.length,
    isEmpty: array.length === 0,
  };
}
