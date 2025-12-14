/**
 * 📄 자동 장애 보고서 페이지 컴포넌트
 *
 * 기능:
 * - 실시간 장애 리포트 생성 및 관리
 * - /api/ai/incident-report API 연동
 */

'use client';

import {
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

type TabType = 'reports';

interface IncidentReport {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low';
  timestamp: Date;
  affectedServers: string[];
  description: string;
  status: 'active' | 'resolved' | 'investigating';
  pattern?: string;
  recommendations?: Array<{
    action: string;
    priority: string;
    expected_impact: string;
  }>;
}

interface APIIncidentReport {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_servers: string[];
  pattern?: string;
  recommendations?: Array<{
    action: string;
    priority: string;
    expected_impact: string;
  }>;
  root_cause_analysis?: {
    primary_cause: string;
    contributing_factors: string[];
    confidence: number;
  };
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

const TABS = [
  { id: 'reports' as TabType, label: '보고서 목록', icon: FileText },
];

// ============================================================================
// Helpers
// ============================================================================

function extractNumericValue(value: number | Record<string, unknown>): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'object' || value === null) return 0;

  if ('in' in value && 'out' in value) {
    const inVal = typeof value.in === 'number' ? value.in : 0;
    const outVal = typeof value.out === 'number' ? value.out : 0;
    return (inVal + outVal) / 2;
  }
  if ('used' in value && typeof value.used === 'number') {
    return value.used;
  }
  if ('usage' in value && typeof value.usage === 'number') {
    return value.usage;
  }
  return 0;
}

// ============================================================================
// Component
// ============================================================================

import { useServerQuery } from '@/hooks/useServerQuery';
// ... checks ...
export default function AutoReportPage() {
  // Server data (React Query)
  const { data: servers = [] } = useServerQuery();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('reports');

  // Reports state
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 자동 로드 제거로 초기값 false
  const [_error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Severity mapping
  const mapSeverity = useCallback(
    (apiSeverity: string): 'critical' | 'warning' | 'info' => {
      switch (apiSeverity) {
        case 'critical':
        case 'high':
          return 'critical';
        case 'medium':
          return 'warning';
        default:
          return 'info';
      }
    },
    []
  );

  // Fetch reports from API
  const _fetchReports = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/ai/incident-report');

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.reports) {
        const mappedReports: IncidentReport[] = data.reports.map(
          (report: APIIncidentReport) => ({
            id: report.id,
            title: report.title,
            severity: mapSeverity(report.severity),
            timestamp: new Date(report.created_at),
            affectedServers: report.affected_servers || [],
            description:
              report.root_cause_analysis?.primary_cause ||
              '상세 분석을 확인하세요.',
            status: 'active' as const,
            pattern: report.pattern,
            recommendations: report.recommendations,
          })
        );
        setReports(mappedReports);
      }
    } catch (err) {
      console.error('보고서 조회 실패:', err);
      setError('보고서를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [mapSeverity]);

  // 자동 로드 제거 (2025-12-14)
  // 사용자가 "새 보고서" 버튼 또는 "새로고침" 버튼을 클릭해야 데이터가 로드됨
  // 이전: useEffect(() => { void fetchReports(); }, [fetchReports]);

  // Generate new report
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const metrics = servers.map((server) => ({
        server_id: server.id,
        server_name: server.name,
        cpu: extractNumericValue(server.cpu ?? 0),
        memory: extractNumericValue(server.memory ?? 0),
        disk: extractNumericValue(server.disk ?? 0),
        network: extractNumericValue(server.network ?? 0),
        timestamp: new Date().toISOString(),
      }));

      const response = await fetch('/api/ai/incident-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          metrics,
          notify: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.report) {
        const newReport: IncidentReport = {
          id: data.report.id,
          title: data.report.title,
          severity: mapSeverity(data.report.severity),
          timestamp: new Date(data.report.created_at),
          affectedServers: data.report.affected_servers || [],
          description:
            data.report.root_cause_analysis?.primary_cause ||
            '새로운 이상 징후가 감지되었습니다.',
          status: 'active',
          pattern: data.report.pattern,
          recommendations: data.report.recommendations,
        };

        setReports((prev) => [newReport, ...prev]);
      }
    } catch (err) {
      console.error('보고서 생성 실패:', err);
      setError('보고서 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper functions for UI
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        );
      case 'investigating':
        return (
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
        );
      default:
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
    }
  };

  const filteredReports =
    selectedSeverity === 'all'
      ? reports
      : reports.filter((report) => report.severity === selectedSeverity);

  const handleResolve = (reportId: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, status: 'resolved' as const }
          : report
      )
    );
  };

  const toggleDetail = (reportId: string) => {
    setSelectedReport((prev) => (prev === reportId ? null : reportId));
  };

  // ============================================================================
  // Render: Reports Tab
  // ============================================================================

  const renderReportsTab = () => (
    <>
      {/* Filter */}
      <div className="border-b border-red-200 bg-white/50 p-4">
        <div className="flex space-x-2">
          {[
            { id: 'all', label: '전체', count: reports.length },
            {
              id: 'critical',
              label: '심각',
              count: reports.filter((r) => r.severity === 'critical').length,
            },
            {
              id: 'warning',
              label: '경고',
              count: reports.filter((r) => r.severity === 'warning').length,
            },
            {
              id: 'info',
              label: '정보',
              count: reports.filter((r) => r.severity === 'info').length,
            },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedSeverity(filter.id)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                selectedSeverity === filter.id
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-100'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Report list */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
                <div className="mb-3 h-3 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          filteredReports.map((report, index) => (
            <div
              key={report.id}
              className={`animate-fade-in rounded-lg border p-4 transition-shadow hover:shadow-md ${getSeverityColor(report.severity)}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getSeverityIcon(report.severity)}
                  <h3 className="font-medium text-gray-800">{report.title}</h3>
                  {getStatusIcon(report.status)}
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {report.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <p className="mb-3 text-sm text-gray-600">{report.description}</p>

              {selectedReport === report.id && report.recommendations && (
                <div className="mb-3 rounded-lg bg-white/60 p-3">
                  <h4 className="mb-2 text-xs font-semibold text-gray-700">
                    권장 조치
                  </h4>
                  <ul className="space-y-1">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-gray-600">
                        • {rec.action}{' '}
                        <span className="text-gray-400">
                          (우선순위: {rec.priority})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    영향받는 서버: {report.affectedServers.join(', ') || '없음'}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      report.status === 'active'
                        ? 'bg-red-100 text-red-700'
                        : report.status === 'investigating'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {report.status === 'active'
                      ? '활성'
                      : report.status === 'investigating'
                        ? '조사중'
                        : '해결됨'}
                  </span>

                  <button
                    onClick={() => toggleDetail(report.id)}
                    className={`rounded p-1.5 transition-all duration-200 hover:scale-110 active:scale-90 ${
                      selectedReport === report.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    title="상세보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(report.id)}
                      className="rounded p-1.5 text-gray-400 transition-all duration-200 hover:scale-110 hover:bg-green-100 hover:text-green-600 active:scale-90"
                      title="해결 완료"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    className="rounded p-1.5 text-gray-400 transition-all duration-200 hover:scale-110 hover:bg-gray-100 hover:text-gray-600 active:scale-90"
                    title="보고서 다운로드"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

        {!isLoading && filteredReports.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-700">
              보고서가 없습니다
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              새 보고서를 생성하여 장애 현황을 분석해보세요.
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="inline-flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-all hover:scale-105 hover:bg-red-600 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
              />
              <span>첫 보고서 생성하기</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="border-t border-red-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {reports.filter((r) => r.status === 'active').length}
            </div>
            <div className="text-xs text-gray-500">활성 이슈</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {reports.filter((r) => r.status === 'investigating').length}
            </div>
            <div className="text-xs text-gray-500">조사중</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {reports.filter((r) => r.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-500">해결됨</div>
          </div>
        </div>
      </div>
    </>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <div className="border-b border-red-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                자동 장애보고서
              </h2>
              <p className="text-sm text-gray-600">
                실시간 장애 리포트 생성 및 관리
              </p>
            </div>
          </div>

          {activeTab === 'reports' && (
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-all duration-200 hover:scale-105 hover:bg-red-600 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
              />
              <span>{isGenerating ? '생성 중...' : '새 보고서'}</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-red-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'reports' && renderReportsTab()}
    </div>
  );
}
