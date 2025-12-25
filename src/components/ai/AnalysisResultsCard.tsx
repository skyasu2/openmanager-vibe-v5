/**
 * 이상감지/예측 분석 결과 카드 v1.0
 *
 * Cloud Run /api/ai/analyze-server 응답을 시각화
 * - 현재 상태 (이상 탐지): CPU/Memory/Disk 메트릭별 상태
 * - 예측 (트렌드): 1시간 후 예측값과 변화율
 * - AI 인사이트: 패턴 분석 권장사항
 */

'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Cpu,
  HardDrive,
  Lightbulb,
  MemoryStick,
  RefreshCw,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import type {
  CloudRunAnalysisResponse,
  CloudRunAnomalyDetection,
  CloudRunPatternAnalysis,
  CloudRunTrendPrediction,
  MetricAnomalyResult,
  MetricTrendResult,
} from '@/types/intelligent-monitoring.types';

interface AnalysisResultsCardProps {
  result: CloudRunAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

// 메트릭 아이콘 매핑
const metricIcons: Record<string, React.ReactNode> = {
  cpu: <Cpu className="h-5 w-5" />,
  memory: <MemoryStick className="h-5 w-5" />,
  disk: <HardDrive className="h-5 w-5" />,
};

// 메트릭 라벨 한글화
const metricLabels: Record<string, string> = {
  cpu: 'CPU',
  memory: '메모리',
  disk: '디스크',
};

// 심각도별 색상
const severityColors: Record<string, string> = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-red-600 bg-red-50 border-red-200',
};

// 트렌드 아이콘
function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case 'increasing':
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case 'decreasing':
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return <ArrowRight className="h-4 w-4 text-gray-400" />;
  }
}

// 이상 탐지 결과 카드
function AnomalyCard({
  metric,
  data,
}: {
  metric: string;
  data: MetricAnomalyResult;
}) {
  const icon = metricIcons[metric] || <Cpu className="h-5 w-5" />;
  const label = metricLabels[metric] || metric.toUpperCase();
  const colorClass = data.isAnomaly
    ? severityColors[data.severity]
    : 'text-green-600 bg-green-50 border-green-200';

  return (
    <div className={`rounded-lg border p-3 ${colorClass}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        {data.isAnomaly ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
      </div>
      <div className="text-2xl font-bold">{Math.round(data.currentValue)}%</div>
      <div className="mt-1 text-xs opacity-75">
        {data.isAnomaly ? `이상 감지 (${data.severity})` : '정상 범위'}
      </div>
    </div>
  );
}

// 트렌드 예측 카드
function TrendCard({
  metric,
  data,
}: {
  metric: string;
  data: MetricTrendResult;
}) {
  const icon = metricIcons[metric] || <Cpu className="h-5 w-5" />;
  const label = metricLabels[metric] || metric.toUpperCase();
  const isRising = data.trend === 'increasing';
  const bgColor = isRising
    ? 'bg-orange-50 border-orange-200'
    : 'bg-gray-50 border-gray-200';
  const textColor = isRising ? 'text-orange-700' : 'text-gray-700';

  return (
    <div className={`rounded-lg border p-3 ${bgColor}`}>
      <div className={`mb-2 flex items-center justify-between ${textColor}`}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <TrendIcon trend={data.trend} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${textColor}`}>
          {Math.round(data.predictedValue)}%
        </span>
        <span
          className={`text-sm ${data.changePercent > 0 ? 'text-red-500' : data.changePercent < 0 ? 'text-green-500' : 'text-gray-400'}`}
        >
          {data.changePercent > 0 ? '+' : ''}
          {data.changePercent.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1 text-xs opacity-75">
        {data.trend === 'increasing'
          ? '상승 추세'
          : data.trend === 'decreasing'
            ? '하락 추세'
            : '안정'}
      </div>
    </div>
  );
}

// 이상 탐지 섹션
function AnomalySection({ data }: { data: CloudRunAnomalyDetection }) {
  const metrics = Object.entries(data.results);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold text-gray-800">현재 상태</h3>
        {data.hasAnomalies && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {data.anomalyCount}개 이상 감지
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map(([metric, result]) => (
          <AnomalyCard key={metric} metric={metric} data={result} />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        알고리즘: {data._algorithm}
      </div>
    </div>
  );
}

// 트렌드 예측 섹션
function TrendSection({ data }: { data: CloudRunTrendPrediction }) {
  const metrics = Object.entries(data.results);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold text-gray-800">
          {data.predictionHorizon} 후 예측
        </h3>
        {data.summary.hasRisingTrends && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            상승 추세 감지
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map(([metric, result]) => (
          <TrendCard key={metric} metric={metric} data={result} />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        알고리즘: {data._algorithm}
      </div>
    </div>
  );
}

// AI 인사이트 섹션
function InsightSection({ data }: { data: CloudRunPatternAnalysis }) {
  if (!data.analysisResults || data.analysisResults.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold text-gray-800">AI 인사이트</h3>
      </div>
      <div className="space-y-2">
        {data.analysisResults.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg bg-purple-50 p-3"
          >
            <span className="mt-0.5 text-purple-400">•</span>
            <div>
              <span className="text-sm text-purple-800">{item.insights}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-600">
                  {item.pattern}
                </span>
                <span className="text-xs text-purple-400">
                  신뢰도 {Math.round(item.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function AnalysisResultsCard({
  result,
  isLoading,
  error,
  onRetry,
}: AnalysisResultsCardProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-gray-600">분석 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">분석 실패</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              다시 시도
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  // 결과 없음 (초기 상태)
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8">
        <TrendingUp className="h-10 w-10 text-gray-400" />
        <p className="mt-3 text-gray-600">
          &quot;분석 시작&quot; 버튼을 클릭하여 서버 상태를 분석하세요
        </p>
      </div>
    );
  }

  // 결과 표시
  return (
    <div className="space-y-4">
      {/* 이상 탐지 */}
      {result.anomalyDetection && (
        <AnomalySection data={result.anomalyDetection} />
      )}

      {/* 트렌드 예측 */}
      {result.trendPrediction && <TrendSection data={result.trendPrediction} />}

      {/* AI 인사이트 */}
      {result.patternAnalysis && (
        <InsightSection data={result.patternAnalysis} />
      )}

      {/* 메타 정보 */}
      <div className="text-center text-xs text-gray-400">
        분석 시간: {new Date(result.timestamp).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
