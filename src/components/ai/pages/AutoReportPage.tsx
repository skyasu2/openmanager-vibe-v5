/**
 * 📄 자동 장애 보고서 페이지 v2.1
 *
 * 기능:
 * - 실시간 장애 리포트 생성 및 관리
 * - /api/ai/incident-report API 연동
 * - 전체 서버 종합 분석 표시
 *
 * v2.1 변경사항 (2025-12-26):
 * - 전체 서버 상태 요약 표시 강화
 * - 종합 분석 결과 시각화 개선
 * - 영향받는 서버 상세 표시
 */

'use client';

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Server,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

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
  // 전체 시스템 분석 데이터
  systemSummary?: {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
  };
  anomalies?: Array<{
    server_id: string;
    server_name: string;
    metric: string;
    value: number;
    severity: string;
  }>;
  timeline?: Array<{
    timestamp: string;
    event: string;
    severity: string;
  }>;
}

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

  // Reports state
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, _setIsLoading] = useState(false); // 자동 로드 제거로 초기값 false
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [downloadMenuId, setDownloadMenuId] = useState<string | null>(null);
  // 에러 상태 관리 추가
  const [error, setError] = useState<string | null>(null);

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

  // Generate new report
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null); // 에러 초기화

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

      // Fallback 응답 처리
      if (data.source === 'fallback' || !data.success) {
        setError(
          data.message ||
            '보고서 생성 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.'
        );
        return;
      }

      // 보고서 데이터 없음 처리
      if (!data.report) {
        setError('보고서 데이터를 받지 못했습니다. 다시 시도해주세요.');
        return;
      }

      if (data.success && data.report) {
        // 시스템 요약: API 데이터 우선, 없으면 로컬 계산
        const apiSystemSummary = data.report.system_summary;
        const systemSummary = apiSystemSummary
          ? {
              totalServers: apiSystemSummary.total_servers ?? metrics.length,
              healthyServers: apiSystemSummary.healthy_servers ?? 0,
              warningServers: apiSystemSummary.warning_servers ?? 0,
              criticalServers: apiSystemSummary.critical_servers ?? 0,
            }
          : {
              totalServers: metrics.length,
              healthyServers: metrics.filter(
                (m) => m.cpu < 70 && m.memory < 70 && m.disk < 80
              ).length,
              warningServers: metrics.filter(
                (m) =>
                  (m.cpu >= 70 && m.cpu < 85) ||
                  (m.memory >= 70 && m.memory < 85) ||
                  (m.disk >= 80 && m.disk < 90)
              ).length,
              criticalServers: metrics.filter(
                (m) => m.cpu >= 85 || m.memory >= 85 || m.disk >= 90
              ).length,
            };

        // 이상 항목: API 데이터 우선, 없으면 로컬 계산
        const apiAnomalies = data.report.anomalies;
        const anomalies =
          Array.isArray(apiAnomalies) && apiAnomalies.length > 0
            ? apiAnomalies
            : metrics
                .filter((m) => m.cpu >= 70 || m.memory >= 70 || m.disk >= 80)
                .flatMap((m) => {
                  const items = [];
                  if (m.cpu >= 70)
                    items.push({
                      server_id: m.server_id,
                      server_name: m.server_name,
                      metric: 'CPU',
                      value: m.cpu,
                      severity: m.cpu >= 85 ? 'critical' : 'warning',
                    });
                  if (m.memory >= 70)
                    items.push({
                      server_id: m.server_id,
                      server_name: m.server_name,
                      metric: 'Memory',
                      value: m.memory,
                      severity: m.memory >= 85 ? 'critical' : 'warning',
                    });
                  if (m.disk >= 80)
                    items.push({
                      server_id: m.server_id,
                      server_name: m.server_name,
                      metric: 'Disk',
                      value: m.disk,
                      severity: m.disk >= 90 ? 'critical' : 'warning',
                    });
                  return items;
                });

        const newReport: IncidentReport = {
          id: data.report.id,
          title: data.report.title,
          severity: mapSeverity(data.report.severity),
          timestamp: new Date(data.report.created_at),
          affectedServers: data.report.affected_servers || [],
          description:
            data.report.root_cause_analysis?.primary_cause ||
            data.report.description ||
            '새로운 이상 징후가 감지되었습니다.',
          status: 'active',
          pattern: data.report.pattern,
          recommendations: data.report.recommendations,
          systemSummary,
          anomalies,
          timeline: data.report.timeline,
        };

        setReports((prev) => [newReport, ...prev]);
      }
    } catch (err) {
      console.error('보고서 생성 실패:', err);
      setError(
        err instanceof Error
          ? err.message
          : '보고서 생성 중 오류가 발생했습니다.'
      );
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

  // Download report as markdown file
  const handleDownload = (report: IncidentReport, format: 'md' | 'txt') => {
    const timestamp =
      report.timestamp instanceof Date
        ? report.timestamp.toLocaleString('ko-KR')
        : new Date().toLocaleString('ko-KR');
    const extension = format;
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    const reportId = report.id || `report-${Date.now()}`;

    let content = '';

    if (format === 'md') {
      // 베스트 프랙티스 기반 장애 보고서 템플릿 (ITIL 준수)
      const severityKo =
        {
          critical: '🔴 긴급',
          high: '🟠 높음',
          warning: '🟡 경고',
          medium: '🟡 보통',
          low: '🟢 낮음',
          info: '🔵 정보',
        }[report.severity] || report.severity;

      const statusKo =
        {
          active: '🔴 진행 중',
          investigating: '🟡 조사 중',
          resolved: '🟢 해결됨',
        }[report.status] || report.status;

      // 시스템 요약 섹션 생성
      const systemSummarySection = report.systemSummary
        ? `## 📊 시스템 영향 분석

| 구분 | 서버 수 |
|------|---------|
| 전체 서버 | ${report.systemSummary.totalServers}대 |
| 정상 | ${report.systemSummary.healthyServers}대 |
| 경고 | ${report.systemSummary.warningServers}대 |
| 위험 | ${report.systemSummary.criticalServers}대 |

**영향도**: 전체 인프라의 ${Math.round(((report.systemSummary.warningServers + report.systemSummary.criticalServers) / report.systemSummary.totalServers) * 100)}%가 영향받음

`
        : '';

      // 타임라인 섹션 생성
      const timelineSection =
        report.timeline && report.timeline.length > 0
          ? `## ⏱️ 이벤트 타임라인

| 시간 | 이벤트 | 심각도 |
|------|--------|--------|
${report.timeline.map((t) => `| ${t.timestamp} | ${t.event} | ${t.severity} |`).join('\n')}

`
          : '';

      // 이상 감지 상세 섹션 생성
      const anomaliesSection =
        report.anomalies && report.anomalies.length > 0
          ? `## 🔍 이상 감지 상세

| 서버 | 메트릭 | 값 | 심각도 |
|------|--------|-----|--------|
${report.anomalies.map((a) => `| ${a.server_name || a.server_id} | ${a.metric} | ${typeof a.value === 'number' ? a.value.toFixed(1) : a.value} | ${a.severity} |`).join('\n')}

`
          : '';

      // 권장 조치 섹션 생성
      const recommendationsSection =
        report.recommendations && report.recommendations.length > 0
          ? `## 🛠️ 권장 조치 및 복구 계획

${report.recommendations
  .map(
    (r, i) => `### ${i + 1}. ${r.action}
- **우선순위**: ${r.priority}
- **예상 효과**: ${r.expected_impact}`
  )
  .join('\n\n')}

## 🛡️ 재발 방지 대책

${
  report.recommendations
    .filter((r) => r.priority === 'high' || r.priority === '높음')
    .map((r, i) => `${i + 1}. ${r.action} - 정기 점검 항목에 추가`)
    .join('\n') || '- 모니터링 임계값 재검토\n- 알림 규칙 최적화'
}

`
          : '';

      content = `# 📋 ${report.title || '장애 보고서'}

> **문서 버전**: 1.0 | **보고서 ID**: ${reportId}

---

## 📌 요약 (Executive Summary)

| 항목 | 내용 |
|------|------|
| **심각도** | ${severityKo} |
| **상태** | ${statusKo} |
| **발생 시간** | ${timestamp} |
| **영향 서버** | ${report.affectedServers.length}대 |

**개요**: ${report.description.split('.')[0] || report.description}

---

## 📝 상세 설명

${report.description}

## 🖥️ 영향받는 서버

${report.affectedServers.length > 0 ? report.affectedServers.map((s) => `- \`${s}\``).join('\n') : '- 없음'}

${systemSummarySection}${timelineSection}${anomaliesSection}${
  report.pattern
    ? `## 🔬 근본 원인 분석 (RCA)

### 감지된 패턴
${report.pattern}

### 추정 원인
- 리소스 사용량 증가로 인한 성능 저하
- 임계값 초과 이벤트 발생

`
    : ''
}${recommendationsSection}---

## 📎 부록

- **보고서 생성 도구**: OpenManager VIBE AI Engine
- **분석 기준**: 실시간 메트릭 + AI 패턴 분석
- **문서 형식**: ITIL Major Incident Report Template 준수

---
*자동 생성된 장애 보고서 - OpenManager VIBE v5*
*Generated at: ${timestamp}*
`;
    } else {
      // TXT 형식 - 베스트 프랙티스 기반
      const titleText = report.title || '장애 보고서';

      // 시스템 요약 (TXT)
      const systemSummaryTxt = report.systemSummary
        ? `
시스템 영향 분석
----------------
전체 서버: ${report.systemSummary.totalServers}대
정상: ${report.systemSummary.healthyServers}대
경고: ${report.systemSummary.warningServers}대
위험: ${report.systemSummary.criticalServers}대
`
        : '';

      // 타임라인 (TXT)
      const timelineTxt =
        report.timeline && report.timeline.length > 0
          ? `
이벤트 타임라인
---------------
${report.timeline.map((t) => `[${t.timestamp}] ${t.event} (${t.severity})`).join('\n')}
`
          : '';

      // 이상 감지 (TXT)
      const anomaliesTxt =
        report.anomalies && report.anomalies.length > 0
          ? `
이상 감지 상세
--------------
${report.anomalies.map((a) => `- ${a.server_name || a.server_id}: ${a.metric} = ${typeof a.value === 'number' ? a.value.toFixed(1) : a.value} (${a.severity})`).join('\n')}
`
          : '';

      content = `${titleText}
${'='.repeat(titleText.length)}

[요약]
보고서 ID: ${reportId}
심각도: ${report.severity}
상태: ${report.status}
생성 시간: ${timestamp}
영향 서버: ${report.affectedServers.length}대

설명
----
${report.description}

영향받는 서버
------------
${report.affectedServers.length > 0 ? report.affectedServers.join(', ') : '없음'}
${systemSummaryTxt}${timelineTxt}${anomaliesTxt}${report.pattern ? `근본 원인 분석\n--------------\n${report.pattern}\n` : ''}
${
  report.recommendations && report.recommendations.length > 0
    ? `권장 조치 및 복구 계획\n----------------------\n${report.recommendations.map((r, i) => `${i + 1}. ${r.action}\n   - 우선순위: ${r.priority}\n   - 예상 효과: ${r.expected_impact}`).join('\n\n')}\n`
    : ''
}
---
자동 생성된 장애 보고서 - OpenManager VIBE v5
문서 형식: ITIL Major Incident Report Template
`;
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-report-${reportId.slice(0, 8)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // Render: Reports Tab
  // ============================================================================

  const renderReportsTab = () => (
    <>
      {/* Filter */}
      <div className="border-b border-gray-200 bg-white/50 p-4">
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

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  보고서 생성 실패
                </p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="rounded-lg p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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

              {/* 시스템 요약 (항상 표시) */}
              {report.systemSummary && (
                <div className="mb-3 grid grid-cols-4 gap-2 rounded-lg bg-white/60 p-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700">
                      {report.systemSummary.totalServers}
                    </div>
                    <div className="text-xs text-gray-500">전체</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {report.systemSummary.healthyServers}
                    </div>
                    <div className="text-xs text-gray-500">정상</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {report.systemSummary.warningServers}
                    </div>
                    <div className="text-xs text-gray-500">주의</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {report.systemSummary.criticalServers}
                    </div>
                    <div className="text-xs text-gray-500">위험</div>
                  </div>
                </div>
              )}

              {selectedReport === report.id && (
                <div className="space-y-3">
                  {/* 이상 항목 */}
                  {report.anomalies && report.anomalies.length > 0 && (
                    <div className="rounded-lg bg-white/60 p-3">
                      <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-700">
                        <Activity className="h-3 w-3" />
                        감지된 이상 항목
                      </h4>
                      <div className="space-y-1">
                        {report.anomalies.slice(0, 5).map((anomaly, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-600">
                              {anomaly.server_name} - {anomaly.metric}
                            </span>
                            <span
                              className={`font-medium ${
                                anomaly.severity === 'critical'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                              }`}
                            >
                              {Math.round(anomaly.value)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 권장 조치 */}
                  {report.recommendations &&
                    report.recommendations.length > 0 && (
                      <div className="rounded-lg bg-white/60 p-3">
                        <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-700">
                          <TrendingUp className="h-3 w-3" />
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

                  {/* 패턴 */}
                  {report.pattern && (
                    <div className="rounded-lg bg-purple-50 p-3">
                      <h4 className="mb-1 text-xs font-semibold text-purple-700">
                        감지된 패턴
                      </h4>
                      <p className="text-xs text-purple-600">
                        {report.pattern}
                      </p>
                    </div>
                  )}
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

                  <div className="relative">
                    <button
                      onClick={() =>
                        setDownloadMenuId((prev) =>
                          prev === report.id ? null : report.id
                        )
                      }
                      className="rounded p-1.5 text-gray-400 transition-all duration-200 hover:scale-110 hover:bg-gray-100 hover:text-gray-600 active:scale-90"
                      title="보고서 다운로드"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {downloadMenuId === report.id && (
                      <div className="absolute bottom-full right-0 z-10 mb-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                        <button
                          onClick={() => {
                            handleDownload(report, 'md');
                            setDownloadMenuId(null);
                          }}
                          className="flex w-full items-center space-x-2 rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span>Markdown (.md)</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDownload(report, 'txt');
                            setDownloadMenuId(null);
                          }}
                          className="flex w-full items-center space-x-2 rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span>Text (.txt)</span>
                        </button>
                      </div>
                    )}
                  </div>
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
      <div className="border-t border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
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
    <div className="flex h-full flex-col bg-linear-to-br from-slate-50 to-pink-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-r from-red-500 to-pink-500">
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
        </div>
      </div>

      {/* Content */}
      {renderReportsTab()}
    </div>
  );
}
