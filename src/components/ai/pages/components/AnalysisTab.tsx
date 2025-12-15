'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import MonitoringResults from '@/components/ai/MonitoringResults';
import MonitoringWorkflow, {
  defaultWorkflowSteps,
} from '@/components/ai/MonitoringWorkflow';
import type {
  ExtendedIntelligentAnalysisResult,
  IntelligentAnalysisRequest,
} from '@/types/intelligent-monitoring.types';

interface AnalysisTabProps {
  analysisResult: ExtendedIntelligentAnalysisResult | null;
  isAnalyzing: boolean;
  onStartAnalysis: (request: IntelligentAnalysisRequest) => void;
  onResetAnalysis: () => void;
}

export default function AnalysisTab({
  analysisResult,
  isAnalyzing,
  onStartAnalysis,
  onResetAnalysis,
}: AnalysisTabProps) {
  const [_workflowSteps, _setWorkflowSteps] = useState(defaultWorkflowSteps);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">AI 이상감지 분석</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onResetAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() =>
            onStartAnalysis({ message: 'Start analysis', serverId: 'default' })
          }
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
        </button>
      </div>

      {analysisResult && (
        <MonitoringResults
          result={analysisResult}
          error={null}
          getSeverityColor={() => 'text-blue-600'}
        />
      )}
    </div>
  );
}
