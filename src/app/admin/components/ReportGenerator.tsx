'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/shared/Modal'; // 가정: Modal 컴포넌트가 존재
import { Loader, AlertTriangle, Wand2 } from 'lucide-react';
import type { AIAnalysisDataset } from '@/types/ai-assistant-input-schema';
import ReactMarkdown from 'react-markdown';

// 임시 모의 데이터
const createMockDataset = (): AIAnalysisDataset => ({
  metadata: {
    generationTime: new Date(),
    timeRange: { start: new Date(Date.now() - 3600 * 1000), end: new Date() },
    serverCount: 1,
    dataPoints: 100,
    version: '1.0.0',
  },
  servers: [],
  metrics: [],
  logs: [
    {
      timestamp: new Date(),
      serverId: 'server-1',
      level: 'ERROR',
      component: 'API-Gateway',
      message: 'Database connection timeout',
      metadata: {},
      structured: {
        category: 'Performance',
        tags: ['db', 'timeout'],
        context: {},
      },
      analysis: { anomaly: true },
    },
  ],
  traces: [],
  patterns: {
    anomalies: [
      {
        type: 'Latency Spike',
        serverId: 'server-1',
        timestamp: new Date(),
        severity: 'Critical',
        description: 'API response time exceeded 5000ms',
        metrics: ['response_time'],
      },
    ],
    correlations: [],
    trends: [],
  },
});

export const ReportGenerator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const mockContext = createMockDataset();
      const response = await fetch('/api/ai/auto-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockContext),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '보고서 생성에 실패했습니다.');
      }

      setReport(result.report);
      setIsModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      );
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wand2 className="h-6 w-6 text-cyan-400" />
            자동 장애 보고서
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-slate-400">
            최근 발생한 장애에 대한 AI 분석 보고서를 생성합니다.
          </p>
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                보고서 생성 중...
              </>
            ) : (
              '지금 보고서 생성'
            )}
          </Button>
        </CardContent>
      </Card>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="AI 장애 분석 보고서"
        >
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-700 bg-red-900/50 p-4 text-red-200">
                <AlertTriangle className="mt-1 h-5 w-5" />
                <div>
                  <h4 className="font-bold">오류 발생</h4>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            {report && (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
