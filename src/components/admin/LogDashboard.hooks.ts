/**
 * 📡 LogDashboard Hooks & Utilities
 * 
 * Data fetching and utility functions for the log dashboard:
 * - API data fetching with filtering
 * - Export functionality (JSON, CSV, TXT)
 * - Log clearing operations
 * - Auto-refresh management
 */

import { useCallback, useEffect, useState } from 'react';
import type { LogData, LogFilters, ExportOptions, LogEntry } from './LogDashboard.types';

/**
 * Custom hook for log dashboard data management
 */
export function useLogDashboard() {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 📡 로그 데이터 가져오기
  const fetchLogData = useCallback(async (filters: LogFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.selectedLevels.length > 0) {
        params.append('levels', filters.selectedLevels.join(','));
      }
      if (filters.selectedCategories.length > 0) {
        params.append('categories', filters.selectedCategories.join(','));
      }
      if (filters.selectedSource) {
        params.append('source', filters.selectedSource);
      }
      if (filters.searchQuery) {
        params.append('search', filters.searchQuery);
      }
      if (filters.timeRange.start && filters.timeRange.end) {
        params.append('startTime', filters.timeRange.start);
        params.append('endTime', filters.timeRange.end);
      }
      params.append('limit', filters.limit.toString());
      params.append('includeStats', 'true');
      params.append('includeStatus', 'true');

      const response = await fetch(`/api/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `API 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '로그를 가져오는데 실패했습니다.');
      }

      setData(result.data);
    } catch (err) {
      console.error('로그 데이터 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 자동 새로고침 효과
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if we have filters setup
      if (data !== null) {
        // Re-fetch with current filters - this would need to be handled by parent component
        console.log('Auto-refresh triggered');
      }
    }, 30000); // 30초마다 새로고침

    return () => clearInterval(interval);
  }, [autoRefresh, data]);

  return {
    data,
    loading,
    error,
    autoRefresh,
    setAutoRefresh,
    fetchLogData,
    refetch: () => {
      if (data !== null) {
        // This would trigger a refetch with current filters
        setLoading(true);
      }
    },
  };
}

/**
 * 로그 내보내기 유틸리티
 */
export const useLogExport = () => {
  const exportLogs = useCallback(async (
    logs: LogEntry[],
    options: ExportOptions = {
      format: 'json',
      includeMetadata: true,
      includeStackTrace: false,
    }
  ) => {
    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      const filteredLogs = options.dateRange 
        ? logs.filter(log => {
            const logTime = new Date(log.timestamp);
            const startTime = new Date(options.dateRange.start);
            const endTime = new Date(options.dateRange.end);
            return logTime >= startTime && logTime <= endTime;
          })
        : logs;

      switch (options.format) {
        case 'json': {
          const exportData = filteredLogs.map(log => ({
            ...log,
            ...(options.includeMetadata ? {} : { metadata: undefined }),
            ...(options.includeStackTrace ? {} : { 
              error: log.error ? { 
                name: log.error.name, 
                message: log.error.message 
              } : undefined 
            }),
          }));
          
          content = JSON.stringify(exportData, null, 2);
          filename = `logs_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        }

        case 'csv': {
          const headers = [
            'Timestamp',
            'Level', 
            'Category',
            'Source',
            'Message',
            ...(options.includeMetadata ? ['Metadata'] : []),
            ...(options.includeStackTrace ? ['Error'] : []),
          ];

          const rows = filteredLogs.map(log => [
            log.timestamp,
            log.level,
            log.category,
            log.source,
            `"${log.message.replace(/"/g, '""')}"`,
            ...(options.includeMetadata ? [JSON.stringify(log.metadata || {})] : []),
            ...(options.includeStackTrace ? [JSON.stringify(log.error || {})] : []),
          ]);

          content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
          filename = `logs_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        }

        case 'txt': {
          content = filteredLogs
            .map(log => {
              let line = `[${log.timestamp}] ${log.level.toUpperCase()} [${log.category}] ${log.source}: ${log.message}`;
              
              if (options.includeMetadata && log.metadata) {
                line += `\n  Metadata: ${JSON.stringify(log.metadata)}`;
              }
              
              if (options.includeStackTrace && log.error) {
                line += `\n  Error: ${log.error.name}: ${log.error.message}`;
                if (log.error.stack) {
                  line += `\n  Stack: ${log.error.stack}`;
                }
              }
              
              return line;
            })
            .join('\n\n');
          
          filename = `logs_${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
          break;
        }

        default:
          throw new Error(`지원되지 않는 내보내기 형식: ${options.format}`);
      }

      // 파일 다운로드
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      return { success: true, filename, count: filteredLogs.length };
    } catch (err) {
      console.error('로그 내보내기 오류:', err);
      throw new Error(err instanceof Error ? err.message : '내보내기 실패');
    }
  }, []);

  return { exportLogs };
};

/**
 * 로그 삭제 유틸리티
 */
export const useLogClear = () => {
  const clearLogs = useCallback(async (
    filters?: Partial<LogFilters>
  ): Promise<{ success: boolean; deletedCount: number }> => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.selectedLevels?.length) {
          params.append('levels', filters.selectedLevels.join(','));
        }
        if (filters.selectedCategories?.length) {
          params.append('categories', filters.selectedCategories.join(','));
        }
        if (filters.selectedSource) {
          params.append('source', filters.selectedSource);
        }
        if (filters.timeRange?.start && filters.timeRange?.end) {
          params.append('startTime', filters.timeRange.start);
          params.append('endTime', filters.timeRange.end);
        }
      }

      const response = await fetch(`/api/logs?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`삭제 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '로그 삭제에 실패했습니다.');
      }

      return { success: true, deletedCount: result.deletedCount || 0 };
    } catch (err) {
      console.error('로그 삭제 오류:', err);
      throw new Error(err instanceof Error ? err.message : '로그 삭제 실패');
    }
  }, []);

  return { clearLogs };
};