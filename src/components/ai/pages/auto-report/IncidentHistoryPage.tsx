/**
 * 장애 보고서 히스토리 페이지
 *
 * Supabase에 저장된 과거 장애 보고서 조회
 */

'use client';

import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { IncidentTimeline } from './IncidentTimeline';
import type { IncidentReport } from './types';
import { getSeverityColor, getSeverityLabel } from './utils';

interface HistoryFilters {
  severity: string;
  status: string;
  dateRange: 'all' | '7d' | '30d' | '90d';
  search: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DBIncidentReport {
  id: string;
  title: string;
  severity: string;
  pattern: string | null;
  affected_servers: string[];
  anomalies: Array<{
    server_id: string;
    server_name: string;
    metric: string;
    value: number;
    severity: string;
  }>;
  root_cause_analysis: {
    primary_cause?: string;
  };
  recommendations: Array<{
    action: string;
    priority: string;
    expected_impact: string;
  }>;
  timeline: Array<{
    timestamp: string;
    event: string;
    severity: string;
  }>;
  status: string;
  created_at: string;
  resolved_at: string | null;
  system_summary?: {
    total_servers: number;
    healthy_servers: number;
    warning_servers: number;
    critical_servers: number;
  };
}

// 🔧 P3: 메모이제이션된 리포트 카드 컴포넌트 (map 내 인라인 핸들러 최적화)
interface ReportCardProps {
  report: IncidentReport;
  isSelected: boolean;
  onSelect: (report: IncidentReport) => void;
  formatDate: (date: Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const ReportCard = memo(function ReportCard({
  report,
  isSelected,
  onSelect,
  formatDate,
  getStatusBadge,
}: ReportCardProps) {
  const handleClick = useCallback(() => {
    onSelect(report);
  }, [onSelect, report]);

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-lg border bg-white p-4 text-left transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSeverityColor(report.severity)}`}
            >
              {getSeverityLabel(report.severity)}
            </span>
            {getStatusBadge(report.status)}
          </div>
          <h3 className="mt-2 truncate font-medium text-gray-800">
            {report.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {report.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {formatDate(report.timestamp)}
          </div>
          {report.affectedServers.length > 0 && (
            <div className="mt-1 text-xs text-gray-400">
              {report.affectedServers.length}개 서버 영향
            </div>
          )}
        </div>
      </div>
    </button>
  );
});

ReportCard.displayName = 'ReportCard';

function mapDBToIncidentReport(db: DBIncidentReport): IncidentReport {
  return {
    id: db.id,
    title: db.title,
    severity: db.severity as IncidentReport['severity'],
    timestamp: new Date(db.created_at),
    affectedServers: db.affected_servers || [],
    description: db.root_cause_analysis?.primary_cause || '',
    status: db.status as IncidentReport['status'],
    pattern: db.pattern || undefined,
    recommendations: db.recommendations,
    systemSummary: db.system_summary
      ? {
          totalServers: db.system_summary.total_servers,
          healthyServers: db.system_summary.healthy_servers,
          warningServers: db.system_summary.warning_servers,
          criticalServers: db.system_summary.critical_servers,
        }
      : undefined,
    anomalies: db.anomalies,
    timeline: db.timeline,
  };
}

// 🔧 P3: 모듈 레벨 상수로 호이스팅 (매 호출마다 객체 생성 방지)
const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-100 text-red-700 border-red-200',
  investigating: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
  active: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  open: '열림',
  investigating: '조사중',
  resolved: '해결됨',
  closed: '종료',
  active: '활성',
};

export const IncidentHistoryPage = memo(function IncidentHistoryPage() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(
    null
  );

  const [filters, setFilters] = useState<HistoryFilters>({
    severity: 'all',
    status: 'all',
    dateRange: '30d',
    search: '',
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [showFilters, setShowFilters] = useState(false);

  // 🔧 P3: 검색 입력 debounce (300ms) - API 과다 호출 방지
  const [searchInput, setSearchInput] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔧 StrictMode 이슈 수정: AbortController 추가
  const fetchReports = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        if (filters.severity !== 'all') {
          params.append('severity', filters.severity);
        }
        if (filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.dateRange !== 'all') {
          params.append('dateRange', filters.dateRange);
        }
        if (filters.search) {
          params.append('search', filters.search);
        }

        const response = await fetch(`/api/ai/incident-report?${params}`, {
          signal,
        });
        if (!response.ok) {
          throw new Error('보고서 조회 실패');
        }

        const data = await response.json();

        if (data.success) {
          const mappedReports = (data.reports || []).map(mapDBToIncidentReport);
          setReports(mappedReports);
          setPagination((prev) => ({
            ...prev,
            total: data.total || mappedReports.length,
            totalPages:
              data.totalPages ||
              Math.ceil((data.total || mappedReports.length) / prev.limit),
          }));
        }
      } catch (err) {
        // AbortError는 정상적인 cleanup이므로 무시
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        // 🔧 P3: 언마운트 상태에서 상태 업데이트 방지
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [pagination.page, pagination.limit, filters]
  );

  useEffect(() => {
    const abortController = new AbortController();
    fetchReports(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [fetchReports]);

  // 🔧 새로고침 버튼 핸들러 (AbortController 없이 수동 호출)
  const handleRefresh = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  // 🔧 P3: useCallback으로 핸들러 메모이제이션
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof HistoryFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  // 🔧 P3: 검색 입력 debounce 핸들러 (300ms 지연 후 API 호출)
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      // 이전 타이머 취소
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      // 300ms 후 실제 필터 업데이트
      searchDebounceRef.current = setTimeout(() => {
        handleFilterChange('search', value);
        searchDebounceRef.current = null; // 🔧 P3: 타이머 완료 후 ref 정리
      }, 300);
    },
    [handleFilterChange]
  );

  // 🔧 P3: 컴포넌트 언마운트 시 debounce 타이머 정리
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleSeverityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleFilterChange('severity', e.target.value);
    },
    [handleFilterChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleFilterChange('status', e.target.value);
    },
    [handleFilterChange]
  );

  const handleDateRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleFilterChange('dateRange', e.target.value);
    },
    [handleFilterChange]
  );

  // 🔧 P3: 토글 및 네비게이션 핸들러 메모이제이션
  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handlePrevPage = useCallback(() => {
    handlePageChange(pagination.page - 1);
  }, [handlePageChange, pagination.page]);

  const handleNextPage = useCallback(() => {
    handlePageChange(pagination.page + 1);
  }, [handlePageChange, pagination.page]);

  const handleReportSelect = useCallback((report: IncidentReport) => {
    setSelectedReport(report);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedReport(null);
  }, []);

  const clearFilters = useCallback(() => {
    // 🔧 사이드이펙트 수정: 대기 중인 debounce 타이머 취소 (race condition 방지)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchInput('');
    setFilters({
      severity: 'all',
      status: 'all',
      dateRange: '30d',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // 🔧 사이드이펙트 수정: ReportCard에 전달되는 함수들 메모이제이션
  const formatDate = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }, []);

  // 🔧 P3: 모듈 레벨 상수 사용 (STATUS_STYLES, STATUS_LABELS)
  const getStatusBadge = useCallback(
    (status: string) => (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.open}`}
      >
        {STATUS_LABELS[status] || status}
      </span>
    ),
    []
  );

  return (
    <div className="flex h-full flex-col bg-linear-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-r from-blue-500 to-indigo-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                보고서 히스토리
              </h2>
              <p className="text-sm text-gray-600">과거 장애 보고서 조회</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFilters}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              필터
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b border-gray-200 bg-white/50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search - 🔧 P3: debounced searchInput 사용 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="보고서 검색..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={filters.severity}
              onChange={handleSeverityChange}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">모든 심각도</option>
              <option value="critical">심각</option>
              <option value="high">높음</option>
              <option value="medium">중간</option>
              <option value="low">낮음</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">모든 상태</option>
              <option value="open">열림</option>
              <option value="investigating">조사중</option>
              <option value="resolved">해결됨</option>
              <option value="closed">종료</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">전체 기간</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
            </select>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
              초기화
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Reports List */}
        <div
          className={`flex-1 overflow-y-auto p-4 ${selectedReport ? 'w-1/2' : 'w-full'}`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-medium text-gray-700">
                보고서가 없습니다
              </h3>
              <p className="text-sm text-gray-500">
                조건에 맞는 보고서가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  isSelected={selectedReport?.id === report.id}
                  onSelect={handleReportSelect}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Report Detail Panel */}
        {selectedReport && (
          <div className="w-1/2 overflow-y-auto border-l border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">보고서 상세</h3>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Report Info */}
            <div className="mb-6 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSeverityColor(selectedReport.severity)}`}
                  >
                    {getSeverityLabel(selectedReport.severity)}
                  </span>
                  {getStatusBadge(selectedReport.status)}
                  {selectedReport.pattern && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {selectedReport.pattern}
                    </span>
                  )}
                </div>
                <h4 className="mt-2 text-xl font-bold text-gray-800">
                  {selectedReport.title}
                </h4>
                <p className="mt-2 text-gray-600">
                  {selectedReport.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(selectedReport.timestamp)}
                </div>
                <div>{selectedReport.affectedServers.length}개 서버 영향</div>
              </div>
            </div>

            {/* System Summary */}
            {selectedReport.systemSummary && (
              <div className="mb-6">
                <h5 className="mb-3 font-medium text-gray-700">시스템 요약</h5>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="text-lg font-bold text-gray-700">
                      {selectedReport.systemSummary.totalServers}
                    </div>
                    <div className="text-xs text-gray-500">전체</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {selectedReport.systemSummary.healthyServers}
                    </div>
                    <div className="text-xs text-gray-500">정상</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-3 text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {selectedReport.systemSummary.warningServers}
                    </div>
                    <div className="text-xs text-gray-500">주의</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-center">
                    <div className="text-lg font-bold text-red-600">
                      {selectedReport.systemSummary.criticalServers}
                    </div>
                    <div className="text-xs text-gray-500">위험</div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {selectedReport.timeline && selectedReport.timeline.length > 0 && (
              <div className="mb-6">
                <h5 className="mb-3 font-medium text-gray-700">타임라인</h5>
                <IncidentTimeline events={selectedReport.timeline} />
              </div>
            )}

            {/* Recommendations */}
            {selectedReport.recommendations &&
              selectedReport.recommendations.length > 0 && (
                <div>
                  <h5 className="mb-3 font-medium text-gray-700">권장 조치</h5>
                  <div className="space-y-2">
                    {selectedReport.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-700">
                            {rec.action}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : rec.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          예상 효과: {rec.expected_impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>총 {pagination.total}개 보고서</span>
          <span>
            {pagination.page * pagination.limit - pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            표시 중
          </span>
        </div>
      </div>
    </div>
  );
});

export default IncidentHistoryPage;
