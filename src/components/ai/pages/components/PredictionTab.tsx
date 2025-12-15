'use client';

import { Server, Shield, Target, TrendingUp } from 'lucide-react';

interface PredictionData {
  serverId: string;
  serverName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedIssues: string[];
  confidence: number;
  timeToFailure?: string;
  recommendations: string[];
}

interface PredictionTabProps {
  predictions: PredictionData[];
  isLoading: boolean;
  onRefreshPredictions: () => void;
}

export default function PredictionTab({
  predictions,
  isLoading,
  onRefreshPredictions,
}: PredictionTabProps) {
  const getRiskColor = (level: PredictionData['riskLevel']) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
    }
  };

  const getRiskIcon = (level: PredictionData['riskLevel']) => {
    switch (level) {
      case 'low':
        return Shield;
      case 'medium':
        return Target;
      case 'high':
        return TrendingUp;
      case 'critical':
        return Server;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">장애 예측 분석</h3>
        </div>
        <button
          onClick={onRefreshPredictions}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg disabled:opacity-50"
        >
          <TrendingUp className="h-4 w-4" />
          예측 갱신
        </button>
      </div>

      <div className="grid gap-4">
        {predictions.map((prediction) => {
          const RiskIcon = getRiskIcon(prediction.riskLevel);
          return (
            <div
              key={prediction.serverId}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">{prediction.serverName}</span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getRiskColor(prediction.riskLevel)}`}
                >
                  <RiskIcon className="h-4 w-4" />
                  {prediction.riskLevel.toUpperCase()}
                </div>
              </div>

              {prediction.predictedIssues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    예상 문제점
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {prediction.predictedIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  신뢰도: {prediction.confidence}%
                </span>
                {prediction.timeToFailure && (
                  <span className="text-gray-500">
                    예상 시점: {prediction.timeToFailure}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
