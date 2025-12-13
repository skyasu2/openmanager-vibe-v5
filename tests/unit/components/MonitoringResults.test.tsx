/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MonitoringResults from '@/components/ai/MonitoringResults';
import type { ExtendedIntelligentAnalysisResult } from '@/types/intelligent-monitoring.types';

// Helper function for severity color (matches component usage)
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'border-red-500 bg-red-50 text-red-800';
    case 'high':
      return 'border-orange-500 bg-orange-50 text-orange-800';
    case 'medium':
      return 'border-yellow-500 bg-yellow-50 text-yellow-800';
    case 'low':
    default:
      return 'border-green-500 bg-green-50 text-green-800';
  }
};

// Mock the monitoring result with correct interface
const mockResult: ExtendedIntelligentAnalysisResult = {
  analysisId: 'test-analysis-123',
  timestamp: new Date().toISOString(),
  request: {
    serverId: 'server-1',
    analysisType: 'anomaly-detection',
    targetMetrics: ['cpu', 'memory'],
    timeRange: '1h',
  } as ExtendedIntelligentAnalysisResult['request'],
  anomalyDetection: {
    status: 'completed',
    confidence: 0.92,
    processingTime: 500,
    anomalies: [
      { type: 'spike', metric: 'cpu', severity: 'high' },
      { type: 'trend', metric: 'memory', severity: 'medium' },
    ],
    summary: 'CPU 및 메모리에서 이상 패턴이 감지되었습니다.',
  } as ExtendedIntelligentAnalysisResult['anomalyDetection'],
  rootCauseAnalysis: {
    status: 'completed',
    confidence: 0.85,
    processingTime: 800,
    causes: [{ description: 'Memory leak in application', probability: 0.8 }],
    aiInsights: [
      { engine: 'Gemini', confidence: 0.9, insight: 'Memory leak detected' },
    ],
    summary: '애플리케이션 메모리 누수가 주요 원인으로 식별되었습니다.',
  } as ExtendedIntelligentAnalysisResult['rootCauseAnalysis'],
  predictiveMonitoring: {
    status: 'completed',
    confidence: 0.78,
    processingTime: 600,
    predictions: [{ metric: 'memory', trend: 'increasing', timeframe: '2h' }],
    recommendations: [
      '메모리 사용량 모니터링 강화',
      '애플리케이션 재시작 고려',
    ],
    summary: '향후 2시간 내 메모리 사용량 증가가 예상됩니다.',
  } as ExtendedIntelligentAnalysisResult['predictiveMonitoring'],
  overallResult: {
    severity: 'high',
    actionRequired: true,
    priorityActions: [
      'Critical Memory Usage - Server memory usage exceeds 90%',
      '메모리 누수 애플리케이션 재시작',
    ],
    summary:
      '시스템에 높은 심각도의 문제가 감지되었습니다. 즉각적인 조치가 필요합니다.',
    confidence: 0.85,
    totalProcessingTime: 1900,
  },
};

describe('MonitoringResults', () => {
  it('renders monitoring results summary', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    // Check for "통합 분석 결과" heading
    expect(screen.getByText('통합 분석 결과')).toBeInTheDocument();
  });

  it('displays severity level correctly', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    // Check for severity text (component displays "심각도: HIGH")
    expect(screen.getByText(/심각도: HIGH/i)).toBeInTheDocument();
  });

  it('shows confidence score', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    // Check for confidence percentage - 85% appears in multiple sections (overallResult and rootCauseAnalysis)
    const confidenceElements = screen.getAllByText(/신뢰도: 85%/);
    expect(confidenceElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays priority actions', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    expect(
      screen.getByText(
        'Critical Memory Usage - Server memory usage exceeds 90%'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('메모리 누수 애플리케이션 재시작')
    ).toBeInTheDocument();
  });

  it('shows anomaly detection results', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    expect(screen.getByText('이상 탐지 결과')).toBeInTheDocument();
    expect(screen.getByText(/감지된 이상: 2개/)).toBeInTheDocument();
    expect(screen.getByText(/신뢰도: 92%/)).toBeInTheDocument();
  });

  it('handles empty/null results gracefully (shows ready state)', () => {
    render(
      <MonitoringResults
        result={null}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    // Check for ready state message
    expect(screen.getByText('AI 분석 준비 완료')).toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    const mockOnRetry = vi.fn();
    render(
      <MonitoringResults
        result={null}
        error="분석 중 오류가 발생했습니다."
        getSeverityColor={getSeverityColor}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('분석 실행 오류')).toBeInTheDocument();
    expect(
      screen.getByText('분석 중 오류가 발생했습니다.')
    ).toBeInTheDocument();

    // Test retry button
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('shows root cause analysis results', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    expect(screen.getByText('근본 원인 분석')).toBeInTheDocument();
    expect(screen.getByText(/식별된 원인: 1개/)).toBeInTheDocument();
    expect(screen.getByText(/AI 인사이트: 1개/)).toBeInTheDocument();
  });

  it('shows predictive monitoring results', () => {
    render(
      <MonitoringResults
        result={mockResult}
        error={null}
        getSeverityColor={getSeverityColor}
      />
    );

    expect(screen.getByText('예측적 모니터링')).toBeInTheDocument();
    expect(screen.getByText(/예측 결과: 1개/)).toBeInTheDocument();
    expect(screen.getByText(/권장사항: 2개/)).toBeInTheDocument();
  });
});
