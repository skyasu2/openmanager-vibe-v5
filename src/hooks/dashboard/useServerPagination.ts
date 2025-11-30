import { useMemo, useState } from 'react';
import { calculatePagination } from '@/utils/dashboard/server-utils';

export function useServerPagination<T>(
  items: T[],
  initialPageSize: number = 15
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const { paginatedItems, totalPages } = useMemo(() => {
    return calculatePagination(items, currentPage, pageSize);
  }, [items, currentPage, pageSize]);

  const changePageSize = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    changePageSize,
    paginatedItems,
    totalPages,
  };
}
