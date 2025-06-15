'use client';

import { useState } from 'react';

export interface ResultCardData {
  id: string;
  title: string;
  category: 'urgent' | 'warning' | 'normal' | 'recommendation';
  content: string;
  timestamp: Date;
  metrics?: {
    label: string;
    value: string | number;
    status: 'good' | 'warning' | 'critical';
  }[];
  actions?: {
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }[];
  expandable?: boolean;
  metadata?: {
    apiUsed?: string;
    confidence?: number;
    method?: string;
    patterns?: string[];
    [key: string]: any;
  };
}

interface ResultCardProps {
  data: ResultCardData;
  onRemove?: (id: string) => void;
  className?: string;
}

export default function ResultCard({ data, onRemove, className = '' }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryStyles = (category: ResultCardData['category']) => {
    switch (category) {
      case 'urgent':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          header: 'bg-gradient-to-r from-red-500 to-red-600',
          icon: 'fas fa-exclamation-triangle',
          iconBg: 'bg-red-100 text-red-600'
        };
      case 'warning':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          header: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          icon: 'fas fa-exclamation-circle',
          iconBg: 'bg-yellow-100 text-yellow-600'
        };
      case 'normal':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          header: 'bg-gradient-to-r from-green-500 to-green-600',
          icon: 'fas fa-check-circle',
          iconBg: 'bg-green-100 text-green-600'
        };
      case 'recommendation':
        return {
          border: 'border-purple-200',
          bg: 'bg-purple-50',
          header: 'bg-gradient-to-r from-purple-500 to-purple-600',
          icon: 'fas fa-lightbulb',
          iconBg: 'bg-purple-100 text-purple-600'
        };
    }
  };

  const getMetricStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  const getActionVariantStyles = (variant: 'primary' | 'secondary' | 'danger') => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  const styles = getCategoryStyles(data.category);

  return (
    <div className={`rounded-2xl shadow-lg border-2 ${styles.border} ${styles.bg} overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* 카드 헤더 */}
      <div className={`${styles.header} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
              <i className={`${styles.icon} text-lg`}></i>
            </div>
            <div>
              <h3 className="font-bold text-lg">{data.title}</h3>
              <p className="text-sm opacity-90">
                {data.timestamp.toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {data.expandable && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                title={isExpanded ? "접기" : "펼치기"}
              >
                <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(data.id)}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors"
                title="카드 제거"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className="p-4">
        {/* 메트릭 정보 */}
        {data.metrics && data.metrics.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.metrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
                  <div className={`text-lg font-bold px-2 py-1 rounded-lg inline-block ${getMetricStatusColor(metric.status)}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주요 내용 */}
        <div className={`text-gray-800 leading-relaxed ${!isExpanded && data.expandable ? 'line-clamp-3' : ''}`}>
          {data.content}
        </div>

        {/* 확장 내용 */}
        {isExpanded && data.expandable && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-gray-700 leading-relaxed">
              {/* 메타데이터 정보 표시 */}
              {data.metadata && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">분석 정보</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {data.metadata.apiUsed && (
                      <div>
                        <span className="text-gray-500">API:</span>
                        <span className={`ml-1 px-2 py-1 rounded ${
                          data.metadata.apiUsed === 'optimized' ? 'bg-green-100 text-green-700' :
                          data.metadata.apiUsed === 'pattern-matching' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {data.metadata.apiUsed}
                        </span>
                      </div>
                    )}
                    {data.metadata.confidence !== undefined && (
                      <div>
                        <span className="text-gray-500">신뢰도:</span>
                        <span className={`ml-1 px-2 py-1 rounded ${
                          data.metadata.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                          data.metadata.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {(data.metadata.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {data.metadata.method && (
                      <div>
                        <span className="text-gray-500">방법:</span>
                        <span className="ml-1 text-gray-700">{data.metadata.method}</span>
                      </div>
                    )}
                    {data.metadata.patterns && data.metadata.patterns.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-500">매칭 패턴:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {data.metadata.patterns.map((pattern: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                              {pattern}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 기본 상세 정보 */}
              <p className="text-sm">
                상세 분석 결과 및 추가 정보가 여기에 표시됩니다. 
                서버 로그, 성능 지표, 보안 스캔 결과 등의 세부 사항을 포함할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        {data.actions && data.actions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {data.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${getActionVariantStyles(action.variant)}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 