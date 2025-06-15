/**
 * 🔄 AI 에이전트 로그 조회 패널 컴포넌트 (사이드 패널용)
 * 
 * - AI 추론 과정 로그 조회
 * - 실시간 활동 상태 확인
 * - 최근 작업 이력 표시
 * - 상세 로그 관리는 관리 페이지에서만 가능
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Activity,
  Brain,
  Zap,
  Target
} from 'lucide-react';
import BasePanelLayout from './shared/BasePanelLayout';
import { useMockDataLoader } from '@/hooks/useDataLoader';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  level: 'info' | 'warning' | 'error' | 'success';
  step: string;
  content: string;
  duration?: number;
  confidence?: number;
}

interface AgentLogPanelProps {
  className?: string;
}

// Mock 데이터 생성 함수
const generateMockLogs = (): LogEntry[] => [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 30000), // 30초 전
    type: 'analysis',
    level: 'success',
    step: '서버 상태 분석 완료',
    content: '16개 서버의 메트릭 데이터를 성공적으로 분석했습니다. CPU, 메모리, 디스크 사용률을 종합 평가하였습니다.',
    duration: 1250,
    confidence: 0.94
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 120000), // 2분 전
    type: 'pattern_matching',
    level: 'warning',
    step: '이상 패턴 감지',
    content: 'Server-07에서 메모리 사용률이 지속적으로 증가하는 패턴을 감지했습니다.',
    duration: 890,
    confidence: 0.87
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 180000), // 3분 전
    type: 'reasoning',
    level: 'info',
    step: '추론 엔진 초기화',
    content: '질의응답을 위한 컨텍스트를 로드하고 추론 엔진을 초기화했습니다.',
    duration: 650
  },
  {
    id: 'log_4',
    timestamp: new Date(Date.now() - 300000), // 5분 전
    type: 'data_processing',
    level: 'success',
    step: '실시간 데이터 수집',
    content: '프로메테우스로부터 최근 1시간 메트릭 데이터를 수집하고 전처리를 완료했습니다.',
    duration: 2100,
    confidence: 0.98
  },
  {
    id: 'log_5',
    timestamp: new Date(Date.now() - 420000), // 7분 전
    type: 'response_generation',
    level: 'success',
    step: '질의응답 생성',
    content: '사용자 질문에 대한 응답을 생성했습니다: "현재 서버 상태는 어떻습니까?"',
    duration: 1800,
    confidence: 0.92
  },
  {
    id: 'log_6',
    timestamp: new Date(Date.now() - 600000), // 10분 전
    type: 'analysis',
    level: 'error',
    step: '메트릭 분석 실패',
    content: 'Server-15의 메트릭 데이터 수집 중 연결 오류가 발생했습니다. 재시도 중...',
    duration: 500
  }
];

const AgentLogPanel: React.FC<AgentLogPanelProps> = ({ className = '' }) => {
  // 데이터 로딩 (10초마다 자동 새로고침)
  const { data: logs, isLoading, reload } = useMockDataLoader(
    generateMockLogs,
    800, // 0.8초 로딩 지연
    10000 // 10초마다 새로고침
  );

  // 필터 상태 관리
  const [selectedType, setSelectedType] = React.useState<'all' | 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation'>('all');

  // 필터 설정
  const logTypes = [
    { id: 'all', label: '전체', icon: '📋' },
    { id: 'analysis', label: '분석', icon: '🔍' },
    { id: 'reasoning', label: '추론', icon: '🧠' },
    { id: 'data_processing', label: '데이터 처리', icon: '⚡' },
    { id: 'pattern_matching', label: '패턴 매칭', icon: '🎯' },
    { id: 'response_generation', label: '응답 생성', icon: '💬' }
  ];

  // 필터링된 로그들
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return selectedType === 'all' 
      ? logs 
      : logs.filter(log => log.type === selectedType);
  }, [logs, selectedType]);

  // 유틸리티 함수들
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'info': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return '🔍';
      case 'reasoning': return '🧠';
      case 'data_processing': return '⚡';
      case 'pattern_matching': return '🎯';
      case 'response_generation': return '💬';
      default: return '📋';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <BasePanelLayout
      title="AI 에이전트 로그"
      subtitle="실시간 AI 추론 과정"
      icon={<Brain className="w-4 h-4 text-white" />}
      iconGradient="bg-gradient-to-br from-cyan-500 to-blue-600"
      onRefresh={reload}
      isLoading={isLoading}
      adminPath="/admin/ai-agent/logs"
      adminLabel="상세관리"
      filters={logTypes}
      selectedFilter={selectedType}
      onFilterChange={(filterId) => setSelectedType(filterId as any)}
      bottomInfo={{
        primary: '🤖 AI 에이전트의 실시간 추론 과정을 확인할 수 있습니다',
        secondary: '상세 로그 분석 및 필터링은 관리자 페이지에서 가능합니다'
      }}
      className={className}
    >
      {/* 로그 목록 */}
      <div className="p-4">
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3 hover:bg-gray-700/30 transition-colors"
            >
              {/* 로그 헤더 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getTypeIcon(log.type)}</span>
                    <span className="text-white font-medium text-sm">{log.step}</span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                    {log.duration && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {formatDuration(log.duration)}
                      </div>
                    )}
                    {log.confidence && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {Math.round(log.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 로그 내용 */}
              <p className="text-gray-200 text-sm leading-relaxed">{log.content}</p>
            </motion.div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {selectedType === 'all' 
                  ? '표시할 로그가 없습니다'
                  : `${logTypes.find(t => t.id === selectedType)?.label} 로그가 없습니다`
                }
              </p>
              <p className="text-xs text-gray-600 mt-1">
                AI 에이전트가 활동 중일 때 로그가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </BasePanelLayout>
  );
};

export default AgentLogPanel; 