'use client';

import React, { useState, useEffect } from 'react';
import { useSystemStore } from '@/stores/useSystemStore';
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Zap, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Cpu,
  Database,
  Network
} from 'lucide-react';

interface AIStatus {
  agent: 'active' | 'inactive' | 'error';
  mcp: 'connected' | 'disconnected' | 'error';
  analytics: 'running' | 'idle' | 'error';
}

export function AIFeaturesPanel() {
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    agent: 'inactive',
    mcp: 'disconnected',
    analytics: 'idle'
  });
  const [chatMessages, setChatMessages] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');

  const { isAIAdminMode, isAuthenticated } = useSystemStore();

  // AI 상태 모니터링 - Hook 규칙 준수
  useEffect(() => {
    // AI 모드가 아니거나 인증되지 않은 경우 조기 종료
    if (!isAIAdminMode || !isAuthenticated) {
      return;
    }

    const checkAIStatus = async () => {
      try {
        // AI 에이전트 상태 확인
        const agentResponse = await fetch('/api/ai/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'status_check', mode: 'heartbeat' })
        });

        // MCP 상태 확인
        const mcpResponse = await fetch('/api/ai/mcp/test');

        setAIStatus({
          agent: agentResponse.ok ? 'active' : 'error',
          mcp: mcpResponse.ok ? 'connected' : 'error',
          analytics: 'running'
        });
      } catch (error) {
        console.error('❌ AI Status check failed:', error);
        setAIStatus({
          agent: 'error',
          mcp: 'error',
          analytics: 'error'
        });
      }
    };

    // 초기 상태 확인
    checkAIStatus();

    // 주기적 상태 확인 (30초마다)
    const statusInterval = setInterval(checkAIStatus, 30000);

    return () => clearInterval(statusInterval);
  }, [isAIAdminMode, isAuthenticated]);

  // AI 모드가 아니거나 인증되지 않은 경우 표시하지 않음
  if (!isAIAdminMode || !isAuthenticated) {
    return null;
  }

  // AI 채팅 메시지 전송
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      type: 'user' as const,
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      const response = await fetch('/api/ai/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: chatInput,
          mode: 'chat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          type: 'ai' as const,
          message: data.result?.answer || '응답을 받을 수 없습니다.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          type: 'ai' as const,
          message: '죄송합니다. 현재 AI 에이전트가 응답할 수 없습니다.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('❌ AI Chat error:', error);
      const errorMessage = {
        type: 'ai' as const,
        message: '네트워크 오류가 발생했습니다.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // 상태 아이콘 렌더링
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'inactive':
      case 'disconnected':
      case 'idle':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* AI 상태 모니터링 패널 */}
      <div className="bg-purple-900/30 rounded-xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI 시스템 상태</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-white">AI 에이전트</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(aiStatus.agent)}
              <span className="text-sm text-gray-300 capitalize">{aiStatus.agent}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-purple-400" />
              <span className="text-white">MCP 시스템</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(aiStatus.mcp)}
              <span className="text-sm text-gray-300 capitalize">{aiStatus.mcp}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-white">AI 분석 엔진</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(aiStatus.analytics)}
              <span className="text-sm text-gray-300 capitalize">{aiStatus.analytics}</span>
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 text-purple-300 text-sm font-medium transition-colors">
            <Settings className="w-4 h-4 mx-auto mb-1" />
            AI 설정
          </button>
          <button className="p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 text-purple-300 text-sm font-medium transition-colors">
            <FileText className="w-4 h-4 mx-auto mb-1" />
            분석 보고서
          </button>
        </div>
      </div>

      {/* AI 채팅 인터페이스 */}
      <div className="bg-purple-900/30 rounded-xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI 에이전트 채팅</h3>
          <div className="ml-auto">
            {aiStatus.agent === 'active' && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                온라인
              </div>
            )}
          </div>
        </div>

        {/* 채팅 메시지 영역 */}
        <div className="h-64 overflow-y-auto mb-4 p-4 bg-slate-800/50 rounded-lg">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-400 mt-16">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>AI 에이전트에게 서버 상태를 질문해보세요</p>
              <p className="text-xs mt-1">예: &quot;CPU 사용률이 어떻게 되나요?&quot;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-700 text-gray-100'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 채팅 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="AI 에이전트에게 질문하기..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            disabled={aiStatus.agent !== 'active'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatInput.trim() || aiStatus.agent !== 'active'}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 실시간 AI 분석 패널 */}
      <div className="lg:col-span-2 bg-purple-900/30 rounded-xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">실시간 AI 분석</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 서버 성능 분석 */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h4 className="font-medium text-white">성능 분석</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">CPU 최적화:</span>
                <span className="text-green-400">양호</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">메모리 사용:</span>
                <span className="text-yellow-400">주의</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">디스크 I/O:</span>
                <span className="text-green-400">정상</span>
              </div>
            </div>
          </div>

          {/* 예측 분석 */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-green-400" />
              <h4 className="font-medium text-white">예측 분석</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">트래픽 증가:</span>
                <span className="text-blue-400">2시간 후</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">리소스 부족:</span>
                <span className="text-green-400">없음</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">장애 위험:</span>
                <span className="text-green-400">낮음</span>
              </div>
            </div>
          </div>

          {/* 추천 사항 */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h4 className="font-medium text-white">AI 추천</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-gray-300">
                • 메모리 정리 스케줄링
              </div>
              <div className="text-gray-300">
                • 백그라운드 프로세스 최적화
              </div>
              <div className="text-gray-300">
                • 캐시 설정 조정
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 