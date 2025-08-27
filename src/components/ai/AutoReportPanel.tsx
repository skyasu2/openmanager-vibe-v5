/**
 * 📄 자동 장애 보고서 조회 패널 컴포넌트 (사이드 패널용)
 *
 * - 자동 생성된 보고서 조회
 * - 보고서 다운로드
 * - 실시간 상태 확인
 * - 보고서 관리는 관리 페이지에서만 가능
 */

'use client';

import { useMemo } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import BasePanelLayout from './shared/BasePanelLayout';

interface ReportData {
  id: string;
  title: string;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'error';
  type: 'daily' | 'incident' | 'performance' | 'security';
  summary: string;
  details: {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    totalIncidents: number;
    resolvedIncidents: number;
    avgResponseTime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

interface AutoReportPanelProps {
  className?: string;
}

const AutoReportPanel: FC<AutoReportPanelProps> = ({
  className = '',
}) => {
  // 데이터 로딩 (30초마다 자동 새로고침)
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 실제 API에서 데이터 로드
  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/auto-report');

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // API 응답 데이터를 컴포넌트 형식에 맞게 변환
        const transformedReports = data.data.map((report: unknown) => {
          if (
            typeof report === 'object' &&
            report !== null &&
            'generatedAt' in report
          ) {
            return {
              ...(report as Record<string, unknown>),
              generatedAt: new Date((report as any).generatedAt),
            };
          }
          return report;
        });
        setReports(transformedReports);
      } else {
        console.error('보고서 데이터 로드 실패:', data.error);
        // 실패 시 빈 배열로 설정
        setReports([]);
      }
    } catch (error) {
      console.error('보고서 API 호출 실패:', error);
      // 에러 시 빈 배열로 설정
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 30초마다 자동 새로고침
  useEffect(() => {
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, [loadReports]);

  const reload = useCallback(() => {
    loadReports();
  }, [loadReports]);

  // 필터 상태 관리
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'daily' | 'incident' | 'performance' | 'security'
  >('all');

  // 필터 설정
  const reportTypes = [
    { id: 'all', label: '전체', icon: '📊' },
    { id: 'daily', label: '일일 보고서', icon: '📋' },
    { id: 'incident', label: '장애 분석', icon: '🚨' },
    { id: 'performance', label: '성능 분석', icon: '⚡' },
    { id: 'security', label: '보안 상태', icon: '🔒' },
  ];

  // 필터링된 보고서들
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return selectedFilter === 'all'
      ? reports
      : reports.filter((report: ReportData) => report.type === selectedFilter);
  }, [reports, selectedFilter]);

  // 유틸리티 함수들
  const downloadReport = (reportId: string) => {
    console.log('보고서 다운로드:', reportId);
    alert('보고서 다운로드가 시작됩니다.');
  };

  const getStatusIcon = (status: ReportData['status']) => {
    switch (status) {
      case 'generating':
        return <Clock className="_animate-pulse h-4 w-4 text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusText = (status: ReportData['status']) => {
    switch (status) {
      case 'generating':
        return '생성 중';
      case 'completed':
        return '완료';
      case 'error':
        return '오류';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeMap = {
      daily: '📋',
      incident: '🚨',
      performance: '⚡',
      security: '🔒',
    };
    return typeMap[type as keyof typeof typeMap] || '📊';
  };

  return (
    <BasePanelLayout
      title="자동 보고서"
      subtitle="AI가 자동 생성한 분석 보고서"
      icon={<FileText className="h-4 w-4 text-white" />}
      iconGradient="bg-gradient-to-br from-green-500 to-blue-600"
      onRefresh={reload}
      isLoading={isLoading}
      adminPath="/admin"
      adminLabel="관리"
      filters={reportTypes}
      selectedFilter={selectedFilter}
      onFilterChange={(filterId) => setSelectedFilter(filterId as any)}
      bottomInfo={{
        primary: '🤖 보고서는 AI가 자동으로 분석하여 생성합니다',
        secondary:
          '보고서 스케줄링 및 상세 관리는 관리자 페이지에서 가능합니다',
      }}
      className={className}
    >
      {/* 보고서 목록 */}
      <div className="p-4">
        <div className="space-y-3">
          {filteredReports.map((report: ReportData) => (
            <div
              key={report.id}
              className="rounded-lg border border-gray-600/30 bg-gray-800/50 p-4 transition-colors hover:bg-gray-700/30"
            >
              {/* 보고서 헤더 */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(report.type)}</span>
                    <h4 className="text-sm font-medium text-white">
                      {report.title}
                    </h4>
                    {getStatusIcon(report.status)}
                    <span className="text-xs text-gray-400">
                      {getStatusText(report.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {report.generatedAt.toLocaleString()}
                  </p>
                </div>

                {report.status === 'completed' && (
                  <button
                    onClick={() => downloadReport(report.id)}
                    className="rounded-lg border border-green-500/30 bg-green-500/20 p-2 text-green-300 transition-colors hover:bg-green-500/30"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 보고서 요약 */}
              <p className="mb-3 text-sm text-gray-200">{report.summary}</p>

              {/* 보고서 상세 통계 (완료된 보고서만) */}
              {report.status === 'completed' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-700/30 p-2">
                    <div className="mb-1 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-green-400" />
                      <span className="text-gray-400">정상 서버</span>
                    </div>
                    <span className="font-medium text-green-300">
                      {report.details.healthyServers}/
                      {report.details.totalServers}
                    </span>
                  </div>

                  <div className="rounded-lg bg-gray-700/30 p-2">
                    <div className="mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-400" />
                      <span className="text-gray-400">경고</span>
                    </div>
                    <span className="font-medium text-yellow-300">
                      {report.details.warningServers}
                    </span>
                  </div>

                  <div className="rounded-lg bg-gray-700/30 p-2">
                    <div className="mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-blue-400" />
                      <span className="text-gray-400">CPU</span>
                    </div>
                    <span className="font-medium text-blue-300">
                      {report.details.cpuUsage}%
                    </span>
                  </div>

                  <div className="rounded-lg bg-gray-700/30 p-2">
                    <div className="mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-purple-400" />
                      <span className="text-gray-400">응답시간</span>
                    </div>
                    <span className="font-medium text-purple-300">
                      {report.details.avgResponseTime}ms
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="mt-8 text-center text-gray-500">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">
                {selectedFilter === 'all'
                  ? '생성된 보고서가 없습니다'
                  : `${reportTypes.find((t) => t.id === selectedFilter)?.label} 보고서가 없습니다`}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                보고서는 자동으로 주기적으로 생성됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </BasePanelLayout>
  );
};

export default AutoReportPanel;
