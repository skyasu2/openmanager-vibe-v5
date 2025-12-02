/**
 * 📄 자동 장애 보고서 페이지 컴포넌트
 *
 * 실시간 장애 리포트 생성 및 관리
 * - /api/ai/incident-report API 연동
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useServerDataStore } from '@/components/providers/StoreProvider';
import type { EnhancedServerMetrics } from '@/types/server';

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

// API 응답 타입
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

// 숫자 값 추출 헬퍼 함수
function extractNumericValue(value: number | Record<string, unknown>): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'object' || value === null) return 0;

  // 네트워크 타입: { in: number, out: number }
  if ('in' in value && 'out' in value) {
    const inVal = typeof value.in === 'number' ? value.in : 0;
    const outVal = typeof value.out === 'number' ? value.out : 0;
    return (inVal + outVal) / 2;
  }
  // 메모리 타입: { used: number }
  if ('used' in value && typeof value.used === 'number') {
    return value.used;
  }
  // 일반 타입: { usage: number }
  if ('usage' in value && typeof value.usage === 'number') {
    return value.usage;
  }
  return 0;
}

export default function AutoReportPage() {
  // 실시간 서버 데이터 가져오기
  const servers = useServerDataStore(
    (state: { servers: EnhancedServerMetrics[] }) => state.servers
  );

  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [_isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // severity 매핑 함수 (순수 함수, 컴포넌트 상태에 의존하지 않음)
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

  // API에서 보고서 목록 가져오기
  const fetchReports = useCallback(async () => {
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

  // 초기 로드
  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  // 새 보고서 생성 (실제 API 호출)
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // 서버 메트릭 데이터 준비
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
          <div className="_animate-pulse h-2 w-2 rounded-full bg-red-500" />
        );
      case 'investigating':
        return (
          <div className="_animate-pulse h-2 w-2 rounded-full bg-yellow-500" />
        );
      default:
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
    }
  };

  const filteredReports =
    selectedSeverity === 'all'
      ? reports
      : reports.filter((report) => report.severity === selectedSeverity);

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-red-50 to-pink-50">
      {/* 헤더 */}
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
              <p className="text-sm text-gray-600">실시간 장애 리포트 생성</p>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-all duration-200 hover:bg-red-600 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
            />
            <span>{isGenerating ? '생성 중...' : '새 보고서'}</span>
          </button>
        </div>
      </div>

      {/* 필터 */}
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

      {/* 보고서 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {filteredReports.map((report, index) => (
          <div
            key={report.id}
            className={`rounded-lg border p-4 animate-fade-in transition-shadow hover:shadow-md ${getSeverityColor(report.severity)}`}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  영향받는 서버: {report.affectedServers.join(', ')}
                </span>
              </div>

              <div className="flex space-x-2">
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
                  className="p-1 text-gray-400 transition-all duration-200 hover:text-gray-600 hover:scale-110 active:scale-90"
                  title="보고서 다운로드"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">해당 조건의 보고서가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 통계 */}
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
    </div>
  );
}
