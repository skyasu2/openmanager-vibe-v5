/**
 * 📝 LogDashboard Log Viewer Tab
 *
 * Main log viewer interface with:
 * - Search and filtering controls
 * - Log list with expandable details
 * - Level/category badges and filtering
 * - Interactive log expansion
 */

// framer-motion 제거 - CSS 애니메이션 사용
import { Eye, FileText, Filter, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TabsContent } from '../ui/tabs';
import type {
  LogData,
  LogFilters,
  LogLevel,
  LogCategory,
} from './LogDashboard.types';

// Color mappings (duplicated from main file for consistency)
const levelColors: Record<string, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
  critical: '#DC2626',
};

const categoryColors: Record<string, string> = {
  'ai-engine': '#8B5CF6',
  fallback: '#F59E0B',
  performance: '#10B981',
  mcp: '#6366F1',
  'google-ai': '#3B82F6',
  rag: '#059669',
  system: '#6B7280',
  user: '#EC4899',
  security: '#DC2626',
};

interface LogViewerProps {
  data: LogData;
  filters: LogFilters;
  updateFilters: (updates: Partial<LogFilters>) => void;
}

export function LogDashboardLogViewer({
  data,
  filters,
  updateFilters,
}: LogViewerProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const handleExpandLog = useCallback(
    (logId: string) => {
      setExpandedLog(expandedLog === logId ? null : logId);
    },
    [expandedLog]
  );

  return (
    <TabsContent value="logs" className="space-y-6">
      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 검색 */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="로그 검색..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* 레벨 필터 */}
            <div>
              <label
                htmlFor="log-level-filter"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                레벨
              </label>
              <select
                id="log-level-filter"
                multiple
                value={filters.selectedLevels}
                onChange={(e) =>
                  updateFilters({
                    selectedLevels: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value as LogLevel
                    ),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {Object.keys(levelColors).map((level) => (
                  <option key={level} value={level}>
                    {level.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label
                htmlFor="log-category-filter"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                카테고리
              </label>
              <select
                id="log-category-filter"
                multiple
                value={filters.selectedCategories}
                onChange={(e) =>
                  updateFilters({
                    selectedCategories: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value as LogCategory
                    ),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {Object.keys(categoryColors).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 소스 필터 */}
            <div>
              <label
                htmlFor="log-source-filter"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                소스
              </label>
              <input
                id="log-source-filter"
                type="text"
                placeholder="소스 이름..."
                value={filters.selectedSource}
                onChange={(e) =>
                  updateFilters({ selectedSource: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            {/* 제한 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                제한
              </label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  updateFilters({ limit: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value={50}>50개</option>
                <option value={100}>100개</option>
                <option value={200}>200개</option>
                <option value={500}>500개</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>로그 목록 ({data.logs.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <React.Fragment>
              {data.logs.map((log) => (
                <div
                  key={log.id}
                  className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  onClick={() => handleExpandLog(log.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          style={{
                            backgroundColor: levelColors[log.level],
                            color: 'white',
                          }}
                          className="text-xs"
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {log.source}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{log.message}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('ko-KR')}
                      </p>
                      <Eye className="mt-1 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* 확장된 로그 상세 정보 */}
                  <React.Fragment>
                    {expandedLog === log.id && (
                      <div
                        className="mt-4 border-t pt-4"
                      >
                        {log.data !== undefined && (
                          <div className="mb-2">
                            <p className="mb-1 text-xs font-medium text-gray-600">
                              데이터:
                            </p>
                            <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.metadata && (
                          <div className="mb-2">
                            <p className="mb-1 text-xs font-medium text-gray-600">
                              메타데이터:
                            </p>
                            <div className="space-y-1 text-xs text-gray-500">
                              {Object.entries(log.metadata).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span>{' '}
                                    {String(value)}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {log.error && (
                          <div className="mb-2">
                            <p className="mb-1 text-xs font-medium text-red-600">
                              에러:
                            </p>
                            <div className="rounded bg-red-50 p-2 text-xs text-red-700">
                              <p>
                                <span className="font-medium">이름:</span>{' '}
                                {log.error.name}
                              </p>
                              <p>
                                <span className="font-medium">메시지:</span>{' '}
                                {log.error.message}
                              </p>
                              {log.error.stack && (
                                <pre className="mt-1 overflow-x-auto text-xs">
                                  {log.error.stack}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}

                        {log.tags && log.tags.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-gray-600">
                              태그:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {log.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                </div>
              ))}
            </React.Fragment>

            {data.logs.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p>조건에 맞는 로그가 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
