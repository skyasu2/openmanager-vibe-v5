import { useState, useEffect } from 'react';

/**
 * 🎯 useResponsivePageSize Hook
 *
 * 화면 크기에 따른 동적 페이지 크기 관리
 * - Mobile (< 640px): 6개
 * - Tablet (< 1024px): 9개
 * - Desktop (>= 1024px): 15개
 */
export function useResponsivePageSize(initialSize: number = 3) {
  const [pageSize, setPageSize] = useState(initialSize);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newPageSize: number;

      if (width < 640) {
        newPageSize = 6;
      } else if (width < 1024) {
        newPageSize = 9;
      } else {
        newPageSize = 15;
      }

      if (newPageSize !== pageSize && pageSize <= 15) {
        setPageSize(newPageSize);
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, [pageSize]);

  return { pageSize, setPageSize };
}
