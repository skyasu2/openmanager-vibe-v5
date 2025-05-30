/**
 * 🔍 실시간 AI 로그 모니터 컴포넌트
 * 
 * AI 관리 페이지에서 실시간 로그를 모니터링하고 관리
 * - SSE를 통한 실시간 로그 스트리밍
 * - 로그 필터링 및 검색
 * - 세션별 로그 관리
 * - 로그 패턴 동적 관리
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'ANALYSIS';
  module: string;
  message: string;
  details?: string;
  sessionId: string;
  metadata: {
    processingTime?: number;
    confidence?: number;
    algorithm?: string;
    dataSource?: string;
    apiCall?: boolean;
    cacheHit?: boolean;
    [key: string]: any;
  };
}

interface SessionInfo {
  sessionId: string;
  questionId: string;
  question: string;
  startTime: number;
  status: 'active' | 'completed' | 'failed';
  logCount: number;
}

interface RealTimeLogMonitorProps {
  className?: string;
  autoStart?: boolean;
  maxLogs?: number;
}

export const RealTimeLogMonitor: React.FC<RealTimeLogMonitorProps> = ({
  className = '',
  autoStart = true,
  maxLogs = 1000
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [filter, setFilter] = useState({
    level: '',
    module: '',
    sessionId: '',
    search: ''
  });
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트시 자동 시작
  useEffect(() => {
    if (autoStart) {
      startStreaming();
    }

    return () => {
      stopStreaming();
    };
  }, [autoStart]);

  // 로그 스크롤 자동
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  /**
   * 실시간 스트리밍 시작
   */
  const startStreaming = () => {
    if (eventSourceRef.current) {
      stopStreaming();
    }

    const url = selectedSession 
      ? `/api/ai-agent/admin/logs/realtime?action=stream&sessionId=${selectedSession}`
      : '/api/ai-agent/admin/logs/realtime?action=stream';

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsStreaming(true);
      console.log('🔗 실시간 로그 스트림 연결됨');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('✅ 로그 스트림 연결 확인:', data.message);
          return;
        }

        if (data.type === 'log' && data.data) {
          const newLog: LogEntry = data.data;
          
          setLogs(prev => {
            const updated = [...prev, newLog];
            // 최대 로그 수 제한
            return updated.length > maxLogs ? updated.slice(-maxLogs) : updated;
          });

          // 세션 정보 업데이트
          updateSessionInfo(newLog);
        }
      } catch (error) {
        console.error('로그 데이터 파싱 오류:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('실시간 로그 스트림 오류:', error);
      setIsStreaming(false);
      
      // 3초 후 재연결 시도
      setTimeout(() => {
        if (!eventSource.readyState || eventSource.readyState === EventSource.CLOSED) {
          startStreaming();
        }
      }, 3000);
    };
  };

  /**
   * 실시간 스트리밍 중지
   */
  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  /**
   * 세션 정보 업데이트
   */
  const updateSessionInfo = (log: LogEntry) => {
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.sessionId === log.sessionId);
      
      if (existingIndex !== -1) {
        // 기존 세션 업데이트
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          logCount: updated[existingIndex].logCount + 1,
          status: log.metadata.sessionEnd ? 
            (log.level === 'SUCCESS' ? 'completed' : 'failed') : 
            'active'
        };
        return updated;
      } else {
        // 새 세션 추가
        const newSession: SessionInfo = {
          sessionId: log.sessionId,
          questionId: log.metadata.questionId || 'unknown',
          question: log.metadata.question || log.message,
          startTime: Date.now(),
          status: 'active',
          logCount: 1
        };
        return [...prev, newSession];
      }
    });
  };

  /**
   * 로그 필터링
   */
  const filteredLogs = logs.filter(log => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.module && log.module !== filter.module) return false;
    if (filter.sessionId && log.sessionId !== filter.sessionId) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        log.message.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.module.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });

  /**
   * 로그 레벨 스타일
   */
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ANALYSIS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WARNING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * 로그 레벨 아이콘
   */
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4" />;
      case 'PROCESSING':
        return <Activity className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  /**
   * 로그 내보내기
   */
  const exportLogs = () => {
    const exportData = {
      exportTime: new Date().toISOString(),
      totalLogs: filteredLogs.length,
      sessions: sessions,
      logs: filteredLogs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 로그 상세 토글
   */
  const toggleDetails = (logId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              실시간 AI 로그 모니터
            </h3>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            isStreaming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span>{isStreaming ? '실시간 연결됨' : '연결 끊김'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm transition-colors ${
              isStreaming 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isStreaming ? '중지' : '시작'}</span>
          </button>

          <button
            onClick={() => setLogs([])}
            className="px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>지우기</span>
          </button>

          <button
            onClick={exportLogs}
            className="px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>내보내기</span>
          </button>
        </div>
      </div>

      {/* 필터 및 통계 */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* 검색 */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="로그 검색..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 */}
          <select
            value={filter.level}
            onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 레벨</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="ANALYSIS">ANALYSIS</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            value={filter.sessionId}
            onChange={(e) => setFilter(prev => ({ ...prev, sessionId: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 세션</option>
            {sessions.map(session => (
              <option key={session.sessionId} value={session.sessionId}>
                {session.sessionId.slice(0, 8)}... ({session.logCount}개)
              </option>
            ))}
          </select>
        </div>

        {/* 통계 */}
        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>총 로그: {filteredLogs.length}</span>
          <span>활성 세션: {sessions.filter(s => s.status === 'active').length}</span>
          <span>완료된 세션: {sessions.filter(s => s.status === 'completed').length}</span>
          <span>실패한 세션: {sessions.filter(s => s.status === 'failed').length}</span>
        </div>
      </div>

      {/* 로그 목록 */}
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.02 }}
              className="border dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* 레벨 배지 */}
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getLogLevelStyle(log.level)}`}>
                    {getLogLevelIcon(log.level)}
                    <span>{log.level}</span>
                  </div>

                  {/* 로그 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                        [{log.module}]
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                      </span>
                      <span className="text-xs text-gray-400">
                        세션: {log.sessionId.slice(0, 8)}...
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {log.message}
                    </p>
                    
                    {log.details && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {log.details}
                      </p>
                    )}

                    {/* 메타데이터 (펼쳐진 경우) */}
                    {showDetails[log.id] && log.metadata && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs font-mono overflow-hidden"
                      >
                        <div className="text-gray-700 dark:text-gray-300">
                          <strong>메타데이터:</strong>
                        </div>
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key} className="text-gray-600 dark:text-gray-400">
                            <span className="text-blue-600 dark:text-blue-400">{key}:</span> {JSON.stringify(value)}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 상세 보기 토글 */}
                <button
                  onClick={() => toggleDetails(log.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="상세 정보 보기"
                >
                  {showDetails[log.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {isStreaming ? '로그를 기다리는 중...' : '스트리밍을 시작하여 로그를 확인하세요.'}
          </div>
        )}
        
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default RealTimeLogMonitor; 