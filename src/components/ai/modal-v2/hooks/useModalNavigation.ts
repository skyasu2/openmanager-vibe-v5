'use client';

import { useState, useCallback, useEffect } from 'react';

interface NavigationItem {
  id: string;
  type: 'question' | 'function' | 'history';
  title: string;
  data: any;
  timestamp: number;
}

export function useModalNavigation() {
  const [history, setHistory] = useState<NavigationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // 네비게이션 아이템 추가
  const addToHistory = useCallback((item: Omit<NavigationItem, 'id' | 'timestamp'>) => {
    const newItem: NavigationItem = {
      ...item,
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setHistory(prev => {
      // 현재 위치 이후의 히스토리 제거 (새로운 경로)
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newItem);
      
      // 최대 50개까지만 유지
      return newHistory.slice(-50);
    });

    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  // 뒤로가기
  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  // 앞으로가기
  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  // 특정 인덱스로 이동
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
      return history[index];
    }
    return null;
  }, [history]);

  // 현재 아이템 가져오기
  const getCurrentItem = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 좌측 화살표: 뒤로가기
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
      
      // Alt + 우측 화살표: 앞으로가기
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward]);

  return {
    history,
    currentIndex,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
    addToHistory,
    goBack,
    goForward,
    goToIndex,
    getCurrentItem
  };
} 