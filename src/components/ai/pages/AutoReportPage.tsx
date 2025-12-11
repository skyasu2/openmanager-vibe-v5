/**
 * 📄 자동 장애 보고서 페이지 컴포넌트 (통합)
 *
 * 기능:
 * - 실시간 장애 리포트 생성 및 관리
 * - 장애 케이스 학습 (MLLearningCenter 통합)
 * - /api/ai/incident-report API 연동
 * - /api/ai/ml/train API 연동
 */

'use client';

import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle,
  CheckSquare,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

type TabType = 'reports' | 'learning';

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

interface LearningProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

interface LearningResult {
  patternsLearned?: number;
  accuracyImprovement?: number;
  confidence?: number;
  insights?: string[];
  nextRecommendation?: string;
  timestamp: Date;
}

// ============================================================================
// Constants
// ============================================================================

const TABS = [
  { id: 'reports' as TabType, label: '보고서 목록', icon: FileText },
  { id: 'learning' as TabType, label: '장애 케이스 학습', icon: Brain },
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
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Learning state (장애 케이스 학습)
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    timeElapsed: 0,
  });
  const [learningResults, setLearningResults] = useState<LearningResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<LearningResult | null>(
    null
  );

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

  // Initial load
  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

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

  // Learning step description
  const getStepDescription = useCallback((progress: number): string => {
    if (progress < 20) return '과거 장애 데이터 수집 중...';
    if (progress < 40) return '장애 이력 패턴 분석 중...';
    if (progress < 60) return '예방 모델 훈련 중...';
    if (progress < 80) return '예측 정확도 검증 중...';
    if (progress < 100) return '학습 결과 생성 중...';
    return '학습 완료!';
  }, []);

  // Start incident learning
  const startIncidentLearning = useCallback(async () => {
    if (learningProgress.status === 'running') return;

    setLearningProgress({
      status: 'running',
      progress: 0,
      currentStep: getStepDescription(0),
      timeElapsed: 0,
    });

    const startTime = Date.now();

    const progressTimer = setInterval(() => {
      setLearningProgress((prev) => {
        const newProgress = Math.min(prev.progress + 10, 90);
        const elapsed = Date.now() - startTime;

        return {
          ...prev,
          progress: newProgress,
          currentStep: getStepDescription(newProgress),
          timeElapsed: elapsed,
          estimatedTimeRemaining:
            elapsed > 0
              ? (100 - newProgress) * (elapsed / newProgress)
              : undefined,
        };
      });
    }, 500);

    try {
      const response = await fetch('/api/ai/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'incident',
          timeRange: '24h',
          config: { sensitivity: 'medium' },
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || '학습 결과가 없습니다.');
      }

      const result: LearningResult = {
        patternsLearned: data.result.patternsLearned,
        accuracyImprovement: data.result.accuracyImprovement,
        confidence: data.result.confidence,
        insights: data.result.insights,
        nextRecommendation: data.result.nextRecommendation,
        timestamp: new Date(data.result.timestamp),
      };

      clearInterval(progressTimer);
      setLearningProgress({
        status: 'completed',
        progress: 100,
        currentStep: '학습 완료!',
        timeElapsed: Date.now() - startTime,
      });

      setLearningResults((prev) => [result, ...prev]);
      setSelectedResult(result);
    } catch (err) {
      clearInterval(progressTimer);
      console.error('장애 케이스 학습 실패:', err);
      setLearningProgress({
        status: 'error',
        progress: 0,
        currentStep: '학습 실패',
        timeElapsed: 0,
      });
    }
  }, [learningProgress.status, getStepDescription]);

  // Reset learning
  const resetLearning = useCallback(() => {
    setLearningProgress({
      status: 'idle',
      progress: 0,
      currentStep: '',
      timeElapsed: 0,
    });
    setSelectedResult(null);
  }, []);

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
  // Render: Learning Tab
  // ============================================================================

  const renderLearningTab = () => (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Learning Card */}
      <div className="mb-4 rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-pink-500">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">장애 케이스 학습</h3>
            <p className="text-sm text-gray-600">
              과거 장애 사례를 분석하여 예방책을 학습합니다
            </p>
          </div>
        </div>

        {/* Progress Display */}
        {learningProgress.status === 'running' && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {learningProgress.currentStep}
              </span>
              <span className="text-sm font-medium text-red-600">
                {learningProgress.progress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300"
                style={{ width: `${learningProgress.progress}%` }}
              />
            </div>
            {learningProgress.estimatedTimeRemaining && (
              <p className="mt-2 text-xs text-gray-500">
                예상 남은 시간:{' '}
                {Math.ceil(learningProgress.estimatedTimeRemaining / 1000)}초
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={startIncidentLearning}
            disabled={learningProgress.status === 'running'}
            className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 py-3 text-white transition-all duration-200 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {learningProgress.status === 'running' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>학습 중...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>학습 시작</span>
              </>
            )}
          </button>

          {learningProgress.status !== 'idle' && (
            <button
              onClick={resetLearning}
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-600 transition-all hover:bg-gray-100"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Result Detail */}
      {selectedResult && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="mb-3 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-bold text-green-800">최근 학습 결과</h4>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white p-3 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {selectedResult.patternsLearned ?? 0}
              </div>
              <div className="text-xs text-gray-500">학습된 패턴</div>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                +{selectedResult.accuracyImprovement ?? 0}%
              </div>
              <div className="text-xs text-gray-500">정확도 향상</div>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedResult.confidence ?? 0}%
              </div>
              <div className="text-xs text-gray-500">신뢰도</div>
            </div>
          </div>

          {selectedResult.insights && selectedResult.insights.length > 0 && (
            <div className="mb-3">
              <h5 className="mb-2 text-sm font-semibold text-gray-700">
                주요 인사이트
              </h5>
              <ul className="space-y-1">
                {selectedResult.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedResult.nextRecommendation && (
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                💡 {selectedResult.nextRecommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Learning History */}
      {learningResults.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 font-bold text-gray-800">학습 히스토리</h4>
          <div className="space-y-2">
            {learningResults.map((result, index) => (
              <button
                key={index}
                onClick={() => setSelectedResult(result)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  selectedResult === result
                    ? 'bg-red-100 border border-red-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                      장애 케이스 학습
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span>패턴: {result.patternsLearned ?? 0}개</span>
                  <span>정확도: +{result.accuracyImprovement ?? 0}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {learningProgress.status === 'idle' && learningResults.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Brain className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-700">
            장애 케이스 학습을 시작하세요
          </h3>
          <p className="text-sm text-gray-500">
            과거 장애 이력을 분석하여 예방책을 학습합니다
          </p>
        </div>
      )}
    </div>
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
                실시간 장애 리포트 + 케이스 학습
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
      {activeTab === 'learning' && renderLearningTab()}
    </div>
  );
}
