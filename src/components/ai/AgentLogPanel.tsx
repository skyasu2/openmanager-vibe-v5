/**
 * 🔄 AI 에이전트 로그 조회 패널 컴포넌트 (사이드 패널용)
 *
 * - AI 추론 과정 로그 조회
 * - 실시간 활동 상태 확인
 * - 최근 작업 이력 표시
 * - 상세 로그 관리는 관리 페이지에서만 가능
 */

'use client';

import { useMockDataLoader } from '@/hooks/useDataLoader';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import BasePanelLayout from './shared/BasePanelLayout';

interface LogEntry {
  id: string;
  timestamp: Date;
  type:
    | 'analysis'
    | 'reasoning'
    | 'data_processing'
    | 'pattern_matching'
    | 'response_generation'
    | 'thinking'
    | 'user_query';
  level: 'info' | 'warning' | 'error' | 'success';
  step: string;
  content: string;
  duration?: number;
  confidence?: number;
  sessionId?: string;
  category?: string;
  aiEngine?: string;
  patternDetected?: boolean;
}

interface AgentLogPanelProps {
  className?: string;
}

// Mock 데이터 생성 함수 (사고 과정 및 질의 로그 포함)
const generateMockLogs = (): LogEntry[] => [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 30000), // 30초 전
    type: 'user_query',
    level: 'info',
    step: '사용자 질의 수신',
    content: '질문: "현재 서버 상태는 어떻습니까?" - Multi-AI 협력 처리 시작',
    sessionId: 'session_001',
    category: 'server_status',
    aiEngine: 'Multi-AI-Orchestrator',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 35000), // 35초 전
    type: 'thinking',
    level: 'success',
    step: '질문 의도 분석 완료',
    content:
      'NLP-Analyzer가 질문 의도를 성공적으로 파악했습니다. 서버 상태 조회 요청으로 분류.',
    duration: 1250,
    confidence: 0.94,
    sessionId: 'session_001',
    aiEngine: 'NLP-Analyzer',
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 40000), // 40초 전
    type: 'thinking',
    level: 'success',
    step: '패턴 매칭 검색 완료',
    content:
      'Pattern-Matcher가 기존 패턴 데이터베이스에서 유사한 사례 3건을 발견했습니다.',
    duration: 890,
    confidence: 0.87,
    sessionId: 'session_001',
    aiEngine: 'Pattern-Matcher',
    patternDetected: true,
  },
  {
    id: 'log_4',
    timestamp: new Date(Date.now() - 45000), // 45초 전
    type: 'thinking',
    level: 'success',
    step: '다중 AI 엔진 협력 완료',
    content:
      'MCP, RAG, Google AI가 협력하여 최적 답변을 생성했습니다. 신뢰도 92%',
    duration: 2100,
    confidence: 0.92,
    sessionId: 'session_001',
    aiEngine: 'Multi-AI-Orchestrator',
  },
  {
    id: 'log_5',
    timestamp: new Date(Date.now() - 120000), // 2분 전
    type: 'pattern_matching',
    level: 'warning',
    step: '이상 패턴 감지',
    content:
      'Server-07에서 메모리 사용률이 지속적으로 증가하는 패턴을 감지했습니다. 자동 장애 보고서 생성 예약됨.',
    duration: 890,
    confidence: 0.87,
    patternDetected: true,
    category: 'memory_leak',
  },
  {
    id: 'log_6',
    timestamp: new Date(Date.now() - 180000), // 3분 전
    type: 'analysis',
    level: 'success',
    step: '서버 상태 분석 완료',
    content:
      '16개 서버의 메트릭 데이터를 성공적으로 분석했습니다. CPU, 메모리, 디스크 사용률을 종합 평가하였습니다.',
    duration: 1250,
    confidence: 0.94,
  },
  {
    id: 'log_7',
    timestamp: new Date(Date.now() - 300000), // 5분 전
    type: 'user_query',
    level: 'info',
    step: '사용자 질의 수신',
    content:
      '질문: "메모리 사용량이 높은 서버가 있나요?" - 패턴 분석 모드 활성화',
    sessionId: 'session_002',
    category: 'memory_analysis',
    aiEngine: 'Pattern-Analyzer',
  },
  {
    id: 'log_8',
    timestamp: new Date(Date.now() - 420000), // 7분 전
    type: 'response_generation',
    level: 'success',
    step: '질의응답 생성',
    content:
      '사용자 질문에 대한 응답을 생성했습니다. 자동 장애 보고서와 연결 완료.',
    duration: 1800,
    confidence: 0.92,
    sessionId: 'session_002',
  },
];

const AgentLogPanel: React.FC<AgentLogPanelProps> = ({ className = '' }) => {
  // 🔧 관리자 기능 상태
  const [adminMode, setAdminMode] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [exportInProgress, setExportInProgress] = useState(false);

  // 데이터 로딩 (10초마다 자동 새로고침)
  const {
    data: logs,
    isLoading,
    reload,
  } = useMockDataLoader(
    generateMockLogs,
    800, // 0.8초 로딩 지연
    10000 // 10초마다 새로고침
  );

  // 필터 상태 관리
  const [selectedType, setSelectedType] = React.useState<
    | 'all'
    | 'analysis'
    | 'reasoning'
    | 'data_processing'
    | 'pattern_matching'
    | 'response_generation'
    | 'thinking'
    | 'user_query'
  >('all');

  // 필터 설정 (사고 과정 및 질의 로그 포함)
  const logTypes = [
    { id: 'all', label: '전체', icon: '📋' },
    { id: 'user_query', label: '사용자 질의', icon: '🤔' },
    { id: 'thinking', label: '사고 과정', icon: '🧠' },
    { id: 'analysis', label: '분석', icon: '🔍' },
    { id: 'pattern_matching', label: '패턴 매칭', icon: '🎯' },
    { id: 'response_generation', label: '응답 생성', icon: '💬' },
    { id: 'reasoning', label: '추론', icon: '🧠' },
    { id: 'data_processing', label: '데이터 처리', icon: '⚡' },
  ];

  // 🔍 세션별 그룹화된 로그
  const sessionGroups = useMemo(() => {
    if (!logs) return new Map();

    const groups = new Map<string, LogEntry[]>();
    logs.forEach(log => {
      if (log.sessionId) {
        if (!groups.has(log.sessionId)) {
          groups.set(log.sessionId, []);
        }
        groups.get(log.sessionId)!.push(log);
      }
    });

    // 각 그룹 내에서 시간순 정렬
    groups.forEach(group => {
      group.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });

    return groups;
  }, [logs]);

  // 🎯 패턴 감지 로그만 필터링
  const patternDetectionLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => log.patternDetected);
  }, [logs]);

  // 📊 로그 통계
  const logStats = useMemo(() => {
    if (!logs)
      return { total: 0, thinking: 0, queries: 0, patterns: 0, sessions: 0 };

    return {
      total: logs.length,
      thinking: logs.filter(log => log.type === 'thinking').length,
      queries: logs.filter(log => log.type === 'user_query').length,
      patterns: logs.filter(log => log.patternDetected).length,
      sessions: sessionGroups.size,
    };
  }, [logs, sessionGroups]);

  // 🤖 관리자 기능: 로그 내보내기
  const exportLogsToCSV = async () => {
    if (!logs || exportInProgress) return;

    setExportInProgress(true);

    try {
      const csvContent = [
        'ID,Timestamp,Type,Level,Step,Content,Duration,Confidence,SessionID,AIEngine,PatternDetected',
        ...logs.map(log =>
          [
            log.id,
            log.timestamp.toISOString(),
            log.type,
            log.level,
            log.step,
            `"${log.content.replace(/"/g, '""')}"`,
            log.duration || '',
            log.confidence || '',
            log.sessionId || '',
            log.aiEngine || '',
            log.patternDetected || false,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ai-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      console.log('✅ AI 로그 CSV 내보내기 완료');
    } catch (error) {
      console.error('❌ 로그 내보내기 실패:', error);
      alert('로그 내보내기에 실패했습니다.');
    } finally {
      setExportInProgress(false);
    }
  };

  // 🔍 세션 상세 보기
  const viewSessionDetails = (sessionId: string) => {
    setSelectedSession(sessionId);
    setAdminMode(true);
  };

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
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className='w-4 h-4' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4' />;
      case 'error':
        return <AlertTriangle className='w-4 h-4' />;
      case 'info':
        return <Activity className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return '🔍';
      case 'reasoning':
        return '🧠';
      case 'data_processing':
        return '⚡';
      case 'pattern_matching':
        return '🎯';
      case 'response_generation':
        return '💬';
      case 'thinking':
        return '🧠';
      case 'user_query':
        return '🤔';
      default:
        return '📋';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <BasePanelLayout
      title='AI 에이전트 로그'
      subtitle={`실시간 AI 활동 추적 (${logStats.total}개 로그, ${logStats.sessions}개 세션)`}
      icon={<Brain className='w-4 h-4 text-white' />}
      iconGradient='bg-gradient-to-br from-purple-500 to-pink-600'
      onRefresh={reload}
      isLoading={isLoading}
      adminPath='/admin/ai-agent'
      adminLabel='상세 관리'
      filters={logTypes}
      selectedFilter={selectedType}
      onFilterChange={filterId => setSelectedType(filterId as any)}
      bottomInfo={{
        primary: '🧠 AI 사고 과정과 질의응답 로그를 실시간으로 추적합니다',
        secondary: `🎯 패턴 감지: ${logStats.patterns}건 | 🤔 질의: ${logStats.queries}건 | 🧠 사고: ${logStats.thinking}건`,
      }}
      className={className}
    >
      {/* 관리자 기능 패널 */}
      {adminMode && (
        <div className='p-4 bg-purple-50 border-b border-purple-200'>
          <div className='flex items-center justify-between mb-3'>
            <h4 className='font-semibold text-purple-800'>🔧 관리자 기능</h4>
            <button
              onClick={() => setAdminMode(false)}
              className='text-purple-600 hover:text-purple-800'
            >
              ✕
            </button>
          </div>

          <div className='flex items-center gap-3 text-sm'>
            <button
              onClick={exportLogsToCSV}
              disabled={exportInProgress}
              className={`px-3 py-1 rounded border ${
                exportInProgress
                  ? 'bg-gray-100 text-gray-400 border-gray-300'
                  : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
              }`}
            >
              {exportInProgress ? '내보내는 중...' : '📊 CSV 내보내기'}
            </button>

            <span className='text-purple-600'>
              📈 통계: 총 {logStats.total}개 로그, {logStats.sessions}개 세션
            </span>
          </div>
        </div>
      )}

      {/* 로그 목록 */}
      <div className='p-4'>
        {/* 세션 그룹별 표시 (사고 과정 시각화) */}
        {selectedType === 'thinking' || selectedType === 'user_query' ? (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='font-semibold text-gray-800'>
                🧠 세션별 사고 과정
              </h4>
              <button
                onClick={() => setAdminMode(!adminMode)}
                className='text-sm text-purple-600 hover:text-purple-800'
              >
                {adminMode ? '관리 모드 끄기' : '관리 모드 켜기'}
              </button>
            </div>

            {Array.from(sessionGroups.entries()).map(
              ([sessionId, sessionLogs]) => (
                <motion.div
                  key={sessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h5 className='font-medium text-gray-800'>
                        세션: {sessionId}
                      </h5>
                      <p className='text-sm text-gray-600'>
                        {sessionLogs.length}개 로그 |
                        {sessionLogs[0]?.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => viewSessionDetails(sessionId)}
                      className='text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200'
                    >
                      상세 보기
                    </button>
                  </div>

                  <div className='space-y-2'>
                    {sessionLogs.slice(0, 3).map((log: LogEntry) => (
                      <div
                        key={log.id}
                        className='flex items-center gap-3 p-2 bg-white rounded border'
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${getLevelColor(log.level)}`}
                        >
                          {getLevelIcon(log.level)}
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>
                              {log.step}
                            </span>
                            {log.aiEngine && (
                              <span className='text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded'>
                                {log.aiEngine}
                              </span>
                            )}
                            {log.confidence && (
                              <span className='text-xs text-green-600'>
                                {Math.round(log.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <p className='text-xs text-gray-600 mt-1'>
                            {log.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {sessionLogs.length > 3 && (
                      <p className='text-xs text-gray-500 text-center'>
                        ... 및 {sessionLogs.length - 3}개 더
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            )}
          </div>
        ) : (
          // 기존 로그 목록 표시
          <div className='space-y-3'>
            {filteredLogs.map((log: LogEntry) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 hover:bg-gray-700/30 transition-colors'
              >
                {/* 로그 헤더 */}
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-lg'>{getTypeIcon(log.type)}</span>
                      <h4 className='font-medium text-white'>{log.step}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${getLevelColor(
                          log.level
                        )}`}
                      >
                        {log.level.toUpperCase()}
                      </span>
                      {log.patternDetected && (
                        <span className='text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full'>
                          🎯 패턴 감지
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-3 text-sm text-gray-400'>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-4 h-4' />
                        <span>{log.timestamp.toLocaleString()}</span>
                      </div>
                      {log.duration && (
                        <div className='flex items-center gap-1'>
                          <Zap className='w-4 h-4' />
                          <span>{log.duration}ms</span>
                        </div>
                      )}
                      {log.confidence && (
                        <div className='flex items-center gap-1'>
                          <Target className='w-4 h-4' />
                          <span>
                            {Math.round(log.confidence * 100)}% 신뢰도
                          </span>
                        </div>
                      )}
                      {log.sessionId && (
                        <button
                          onClick={() => viewSessionDetails(log.sessionId!)}
                          className='text-xs text-purple-400 hover:text-purple-300'
                        >
                          세션: {log.sessionId}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 로그 내용 */}
                <p className='text-gray-300 text-sm leading-relaxed'>
                  {log.content}
                </p>

                {/* AI 엔진 정보 */}
                {log.aiEngine && (
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded'>
                      🤖 {log.aiEngine}
                    </span>
                    {log.category && (
                      <span className='text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded'>
                        📂 {log.category}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {filteredLogs.length === 0 && !isLoading && (
          <div className='text-center py-8 text-gray-500'>
            <Activity className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p>선택한 필터에 해당하는 로그가 없습니다.</p>
          </div>
        )}
      </div>
    </BasePanelLayout>
  );
};

export default AgentLogPanel;
