/**
 * 🔍 AI 분석 관리자 페이지 v2.0
 * 
 * 실시간 AI 로그 모니터링과 분석 기능
 * - 실시간 AI 엔진 로그 스트리밍
 * - 오픈소스 기술 스택 추적
 * - AI 성능 메트릭 분석
 * - 관리자 전용 상세 로그 뷰
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Activity,
  Database,
  Network,
  Code,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { RealTimeThinkingViewer } from '@/components/ai/RealTimeThinkingViewer';
import { useRealTimeAILogs } from '@/hooks/useRealTimeAILogs';

export default function AIAnalysisPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [showAllSessions, setShowAllSessions] = useState(true);

  // 실시간 AI 로그 훅 (관리자 모드)
  const {
    logs: realTimeLogs,
    isConnected,
    isProcessing,
    currentEngine,
    techStack,
    connectionStatus,
    clearLogs,
    reconnect,
    addManualLog
  } = useRealTimeAILogs({
    sessionId: showAllSessions ? undefined : selectedSessionId,
    mode: 'admin',
    maxLogs: 100,
    autoReconnect: true
  });

  // 테스트 로그 추가
  const handleAddTestLog = async () => {
    try {
      await addManualLog({
        engine: 'test-engine',
        message: '테스트 로그 메시지입니다',
        level: 'INFO',
        metadata: {
          technology: 'manual-test',
          confidence: 0.95,
          processingTime: 150
        }
      });
    } catch (error) {
      console.error('테스트 로그 추가 실패:', error);
    }
  };

  // 로그 다운로드
  const handleDownloadLogs = () => {
    const logData = JSON.stringify(realTimeLogs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI 분석 모니터링</h1>
                <p className="text-gray-600 mt-1">실시간 AI 엔진 로그 및 성능 분석</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddTestLog}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="테스트 로그 추가"
              >
                <Code className="w-4 h-4 mr-2 inline" />
                테스트 로그
              </button>

              <button
                onClick={handleDownloadLogs}
                disabled={realTimeLogs.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="로그 다운로드"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                다운로드
              </button>

              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="로그 초기화"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 상태 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">연결 상태</p>
                <p className={`text-2xl font-bold ${isConnected ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {isConnected ? '연결됨' : '연결 끊김'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-red-100'
                }`}>
                <Network className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-red-600'
                  }`} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 로그 수</p>
                <p className="text-2xl font-bold text-blue-600">{realTimeLogs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">현재 엔진</p>
                <p className="text-2xl font-bold text-purple-600">
                  {currentEngine || 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">기술 스택</p>
                <p className="text-2xl font-bold text-orange-600">{techStack.size}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 필터 및 설정 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              로그 필터 설정
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세션 모드
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={showAllSessions}
                    onChange={() => setShowAllSessions(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">모든 세션</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!showAllSessions}
                    onChange={() => setShowAllSessions(false)}
                    className="mr-2"
                  />
                  <span className="text-sm">특정 세션</span>
                </label>
              </div>
            </div>

            {!showAllSessions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  세션 ID
                </label>
                <input
                  type="text"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  placeholder="세션 ID 입력..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연결 제어
              </label>
              <button
                onClick={reconnect}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                재연결
              </button>
            </div>
          </div>
        </div>

        {/* 실시간 AI 로그 뷰어 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              실시간 AI 로그 모니터링
            </h2>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? '실시간 연결됨' :
                  connectionStatus === 'connecting' ? '연결 중...' :
                    '연결 끊김'}
              </span>
            </div>
          </div>

          <RealTimeThinkingViewer
            sessionId={showAllSessions ? undefined : selectedSessionId}
            isExpanded={true}
            showTechStack={true}
            mode="admin"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
} 