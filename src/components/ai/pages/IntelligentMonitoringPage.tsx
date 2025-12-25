/**
 * 이상감지/예측 페이지 v5.0
 *
 * 버튼 클릭으로 서버 상태 분석 및 예측
 * - Cloud Run /api/ai/analyze-server 호출
 * - 이상 탐지 + 트렌드 예측 + AI 인사이트 표시
 *
 * v5.0 변경사항 (2025-12-26):
 * - 복잡한 설정 UI 제거
 * - 서버 선택 + 분석 시작 버튼 간소화
 * - Cloud Run 응답 타입에 맞춘 결과 표시
 */

'use client';

import { Monitor, Play, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import AnalysisResultsCard from '@/components/ai/AnalysisResultsCard';
import type { CloudRunAnalysisResponse } from '@/types/intelligent-monitoring.types';

export default function IntelligentMonitoringPage() {
  // 상태
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CloudRunAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 분석 실행
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/ai/intelligent-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_server',
          serverId: selectedServer || undefined,
          analysisType: 'full',
        }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || '분석 실패');
      }

      setResult(data.data as CloudRunAnalysisResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 초기화
  const resetAnalysis = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            이상감지/예측
          </h1>
        </div>
      </header>

      {/* 컨트롤 영역 */}
      <div className="border-b border-gray-100 bg-white p-4">
        <div className="flex items-center gap-4">
          {/* 서버 선택 */}
          <div className="flex-1">
            <label
              htmlFor="server-select"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              분석 대상
            </label>
            <select
              id="server-select"
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              disabled={isAnalyzing}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">전체 시스템</option>
              <option value="web-server-01">웹 서버 01</option>
              <option value="web-server-02">웹 서버 02</option>
              <option value="db-server-01">DB 서버 01</option>
              <option value="api-server-01">API 서버 01</option>
            </select>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-end gap-2">
            <button
              onClick={resetAnalysis}
              disabled={isAnalyzing || (!result && !error)}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className="mr-1.5 inline h-4 w-4" />
              초기화
            </button>
            <button
              onClick={() => void runAnalysis()}
              disabled={isAnalyzing}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2 text-sm font-medium text-white shadow-md hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="mr-1.5 inline h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Play className="mr-1.5 inline h-4 w-4" />
                  분석 시작
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnalysisResultsCard
          result={result}
          isLoading={isAnalyzing}
          error={error}
          onRetry={() => void runAnalysis()}
        />
      </div>
    </div>
  );
}
