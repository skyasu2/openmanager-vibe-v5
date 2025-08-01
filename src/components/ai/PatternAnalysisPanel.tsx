/**
 * 📊 패턴 분석 조회 패널 컴포넌트 (사이드 패널용)
 *
 * - 장애 패턴 분석 결과 조회
 * - 트렌드 요약 확인
 * - 예측 정보 표시
 * - 상세 분석은 관리 페이지에서만 가능
 */

'use client';

import { useDataLoader } from '@/hooks/useDataLoader';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Clock,
  FileText,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import BasePanelLayout from './shared/BasePanelLayout';

interface PatternData {
  id: string;
  title: string;
  type: 'failure' | 'performance' | 'security' | 'trend';
  severity: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  description: string;
  lastDetected: Date;
  affectedServers: number;
  predictedNext?: string;
}

interface PatternAnalysisPanelProps {
  className?: string;
}

// Mock 데이터 생성 함수
const generateMockPatterns = (): PatternData[] => [
  {
    id: 'pattern_1',
    title: 'CPU 사용량 증가 패턴',
    type: 'performance',
    severity: 'medium',
    trend: 'increasing',
    confidence: 0.87,
    description:
      '최근 3일간 오후 2-4시에 CPU 사용량이 지속적으로 증가하는 패턴이 감지되었습니다.',
    lastDetected: new Date(Date.now() - 1800000), // 30분 전
    affectedServers: 5,
    predictedNext: '내일 오후 2시경',
  },
  {
    id: 'pattern_2',
    title: '주기적 메모리 누수',
    type: 'failure',
    severity: 'high',
    trend: 'stable',
    confidence: 0.92,
    description:
      'Server-07에서 24시간 주기로 메모리 사용량이 점진적으로 증가하다 갑자기 감소하는 패턴이 반복됩니다.',
    lastDetected: new Date(Date.now() - 3600000), // 1시간 전
    affectedServers: 1,
    predictedNext: '내일 오전 9시경',
  },
  {
    id: 'pattern_3',
    title: '비정상 로그인 시도 증가',
    type: 'security',
    severity: 'medium',
    trend: 'increasing',
    confidence: 0.78,
    description: '특정 IP 대역에서 반복적인 로그인 실패가 증가하고 있습니다.',
    lastDetected: new Date(Date.now() - 900000), // 15분 전
    affectedServers: 8,
    predictedNext: '현재 진행 중',
  },
  {
    id: 'pattern_4',
    title: '디스크 I/O 병목 패턴',
    type: 'performance',
    severity: 'low',
    trend: 'decreasing',
    confidence: 0.65,
    description:
      '오전 시간대 디스크 I/O 대기시간이 높아지는 패턴이 감소하는 추세입니다.',
    lastDetected: new Date(Date.now() - 7200000), // 2시간 전
    affectedServers: 3,
    predictedNext: '패턴 약화 중',
  },
];

const PatternAnalysisPanel: React.FC<PatternAnalysisPanelProps> = ({
  className = '',
}) => {
  // 🔧 자동 장애 보고서 연결 상태
  const [autoReportStatus, setAutoReportStatus] = useState<{
    isGenerating: boolean;
    lastPatternId?: string;
    reportId?: string;
  }>({
    isGenerating: false,
  });

  // 데이터 로딩 (1분마다 자동 새로고침)
  const {
    data: patterns,
    isLoading,
    reload,
  } = useDataLoader({
    loadData: async () => {
      // 실제 API 시도
      try {
        const response = await fetch('/api/ai/pattern-analysis');
        if (response.ok) {
          const data = await response.json();
          return data.patterns || generateMockPatterns();
        }
      } catch (error) {
        console.warn('패턴 분석 API 실패, Mock 데이터 사용:', error);
      }

      // API 실패 시에만 Mock 사용
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5초 로딩 지연
      return generateMockPatterns();
    },
    refreshInterval: 60000, // 1분마다 새로고침
  });

  // 필터 상태 관리
  const [selectedType, setSelectedType] = React.useState<
    'all' | 'failure' | 'performance' | 'security' | 'trend'
  >('all');

  // 필터 설정
  const patternTypes = [
    { id: 'all', label: '전체', icon: '📊' },
    { id: 'failure', label: '장애 패턴', icon: '🚨' },
    { id: 'performance', label: '성능 트렌드', icon: '⚡' },
    { id: 'security', label: '보안 패턴', icon: '🔒' },
    { id: 'trend', label: '사용량 트렌드', icon: '📈' },
  ];

  // 필터링된 패턴들
  const filteredPatterns = useMemo(() => {
    if (!patterns) return [];
    return selectedType === 'all'
      ? patterns
      : patterns.filter(
          (pattern: PatternData) => pattern.type === selectedType
        );
  }, [patterns, selectedType]);

  // 유틸리티 함수들
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return '높음';
      case 'medium':
        return '중간';
      case 'low':
        return '낮음';
      default:
        return '알 수 없음';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-400" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'failure':
        return '🚨';
      case 'performance':
        return '⚡';
      case 'security':
        return '🔒';
      case 'trend':
        return '📈';
      default:
        return '📊';
    }
  };

  // 🤖 자동 장애 보고서 생성 함수
  const generateAutoReportFromPattern = async (pattern: PatternData) => {
    if (autoReportStatus.isGenerating) {
      console.warn('⚠️ 이미 보고서 생성 중입니다.');
      return;
    }

    setAutoReportStatus({
      isGenerating: true,
      lastPatternId: pattern.id,
    });

    try {
      console.log('🤖 패턴 기반 자동 장애 보고서 생성 시작:', pattern.title);

      const response = await fetch('/api/ai/auto-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'pattern_analysis',
          patternId: pattern.id,
          patternData: {
            title: pattern.title,
            type: pattern.type,
            severity: pattern.severity,
            confidence: pattern.confidence,
            description: pattern.description,
            affectedServers: pattern.affectedServers,
            lastDetected: pattern.lastDetected,
            predictedNext: pattern.predictedNext,
          },
          reportType:
            pattern.type === 'failure'
              ? 'incident'
              : pattern.type === 'security'
                ? 'security'
                : 'performance',
          priority:
            pattern.severity === 'high'
              ? 'urgent'
              : pattern.severity === 'medium'
                ? 'normal'
                : 'low',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAutoReportStatus({
          isGenerating: false,
          reportId: result.reportId,
        });

        // 성공 알림
        alert(
          `✅ 자동 장애 보고서가 생성되었습니다!\n보고서 ID: ${result.reportId}`
        );

        // 자동 보고서 페이지로 이동 (부모 컴포넌트에 알림)
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: 'NAVIGATE_TO_AUTO_REPORT',
              reportId: result.reportId,
            },
            '*'
          );
        }
      } else {
        throw new Error(result.error || '보고서 생성 실패');
      }
    } catch (error) {
      console.error('❌ 자동 장애 보고서 생성 실패:', error);
      setAutoReportStatus({
        isGenerating: false,
      });
      alert(
        `❌ 보고서 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  };

  return (
    <BasePanelLayout
      title="패턴 분석"
      subtitle="AI가 감지한 시스템 패턴"
      icon={<BarChart3 className="h-4 w-4 text-white" />}
      iconGradient="bg-gradient-to-br from-orange-500 to-pink-600"
      onRefresh={reload}
      isLoading={isLoading}
      adminPath="/admin"
      adminLabel="상세분석"
      filters={patternTypes}
      selectedFilter={selectedType}
      onFilterChange={(filterId) => setSelectedType(filterId as any)}
      bottomInfo={{
        primary: '🤖 AI가 실시간으로 시스템 패턴을 분석합니다',
        secondary: '상세 패턴 분석 및 대응 전략은 관리자 페이지에서 확인하세요',
      }}
      className={className}
    >
      {/* 패턴 목록 */}
      <div className="p-4">
        <div className="space-y-3">
          {filteredPatterns.map((pattern: PatternData) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-gray-600/30 bg-gray-800/50 p-4 transition-colors hover:bg-gray-700/30"
            >
              {/* 패턴 헤더 */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(pattern.type)}</span>
                    <h4 className="font-medium text-gray-800">
                      {pattern.title}
                    </h4>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${getSeverityColor(
                        pattern.severity
                      )}`}
                    >
                      {getSeverityText(pattern.severity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(pattern.trend)}
                      <span className="capitalize">{pattern.trend}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>
                        {(pattern.confidence * 100).toFixed(0)}% 신뢰도
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.round(
                          (Date.now() - pattern.lastDetected.getTime()) / 60000
                        )}
                        분 전
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🤖 자동 장애 보고서 생성 버튼 */}
                <div className="flex items-center gap-2">
                  {/* 심각도가 medium 이상일 때만 자동 보고서 버튼 표시 */}
                  {(pattern.severity === 'high' ||
                    pattern.severity === 'medium') && (
                    <button
                      onClick={() => generateAutoReportFromPattern(pattern)}
                      disabled={
                        autoReportStatus.isGenerating &&
                        autoReportStatus.lastPatternId === pattern.id
                      }
                      className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                        autoReportStatus.isGenerating &&
                        autoReportStatus.lastPatternId === pattern.id
                          ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'
                          : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                      }`}
                      title="이 패턴을 기반으로 자동 장애 보고서 생성"
                    >
                      {autoReportStatus.isGenerating &&
                      autoReportStatus.lastPatternId === pattern.id ? (
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                          <span>생성중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>보고서 생성</span>
                        </div>
                      )}
                    </button>
                  )}

                  {/* 패턴 상세 보기 버튼 */}
                  <button
                    onClick={() => {
                      console.log('패턴 상세 보기:', pattern.id);
                      alert(
                        `패턴 상세 정보:\n\n${pattern.description}\n\n영향 서버: ${pattern.affectedServers}대\n예상 다음 발생: ${pattern.predictedNext}`
                      );
                    }}
                    className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    title="패턴 상세 정보 보기"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 패턴 설명 */}
              <p className="mb-3 text-sm text-gray-200">
                {pattern.description}
              </p>

              {/* 패턴 상세 정보 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-gray-700/30 p-2">
                  <div className="mb-1 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-blue-400" />
                    <span className="text-gray-400">영향 서버</span>
                  </div>
                  <span className="font-medium text-blue-300">
                    {pattern.affectedServers}대
                  </span>
                </div>

                <div className="rounded-lg bg-gray-700/30 p-2">
                  <div className="mb-1 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-purple-400" />
                    <span className="text-gray-400">다음 예측</span>
                  </div>
                  <span className="text-xs font-medium text-purple-300">
                    {pattern.predictedNext}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredPatterns.length === 0 && (
            <div className="mt-8 text-center text-gray-500">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">
                {selectedType === 'all'
                  ? '감지된 패턴이 없습니다'
                  : `${patternTypes.find((t) => t.id === selectedType)?.label} 패턴이 없습니다`}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                AI가 지속적으로 패턴을 분석하고 있습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </BasePanelLayout>
  );
};

export default PatternAnalysisPanel;
