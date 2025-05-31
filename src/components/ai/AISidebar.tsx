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
  Network,
  ChevronLeft,
  ChevronRight,
  Minimize2
} from 'lucide-react';

interface AIStatus {
  agent: 'active' | 'inactive' | 'error';
  mcp: 'connected' | 'disconnected' | 'error';
  analytics: 'running' | 'idle' | 'error';
}

export function AISidebar() {
  const { isAIAdminMode, isAuthenticated } = useSystemStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    agent: 'inactive',
    mcp: 'disconnected',
    analytics: 'idle'
  });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);

  // AI 모드가 아니거나 인증되지 않은 경우 표시하지 않음
  if (!isAIAdminMode || !isAuthenticated) {
    return null;
  }

  // AI 상태 모니터링
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const agentResponse = await fetch('/api/ai/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'status_check', mode: 'heartbeat' })
        });

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

    checkAIStatus();
    const statusInterval = setInterval(checkAIStatus, 30000);
    return () => clearInterval(statusInterval);
  }, []);

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
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'inactive':
      case 'disconnected':
      case 'idle':
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default:
        return <AlertTriangle className="w-3 h-3 text-gray-400" />;
    }
  };

  // 최소화된 상태
  if (isMinimized) {
    return (
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg border border-purple-500/30 text-white transition-all duration-300"
        >
          <Brain className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-sm border-l border-purple-500/30 shadow-2xl z-50 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-16'
      }`}
    >
      {/* 사이드바 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">AI 에이전트</h3>
              {aiStatus.agent === 'active' && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-purple-600/30 rounded text-purple-400 hover:text-white transition-colors mx-auto"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 확장된 사이드바 내용 */}
      {isExpanded && (
        <div className="flex flex-col h-full">
          {/* AI 상태 섹션 */}
          <div className="p-4 border-b border-purple-500/30">
            <h4 className="text-sm font-medium text-purple-300 mb-3">시스템 상태</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">AI 에이전트</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(aiStatus.agent)}
                  <span className="text-gray-400 capitalize">{aiStatus.agent}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Network className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">MCP</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(aiStatus.mcp)}
                  <span className="text-gray-400 capitalize">{aiStatus.mcp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">분석 엔진</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(aiStatus.analytics)}
                  <span className="text-gray-400 capitalize">{aiStatus.analytics}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 채팅 섹션 */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-purple-500/30">
              <h4 className="text-sm font-medium text-purple-300 mb-3">AI 채팅</h4>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">AI 에이전트에게 질문해보세요</p>
                  <p className="text-xs mt-1 opacity-70">예: "서버 상태는?"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                        msg.type === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-700 text-gray-100'
                      }`}>
                        <p>{msg.message}</p>
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
            <div className="p-4 border-t border-purple-500/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="질문하기..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  disabled={aiStatus.agent !== 'active'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || aiStatus.agent !== 'active'}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Zap className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 실시간 분석 섹션 */}
          <div className="p-4 border-t border-purple-500/30">
            <h4 className="text-sm font-medium text-purple-300 mb-3">실시간 분석</h4>
            <div className="space-y-3">
              {/* 성능 분석 */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <h5 className="text-xs font-medium text-white">성능</h5>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">CPU:</span>
                    <span className="text-green-400">양호</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">메모리:</span>
                    <span className="text-yellow-400">주의</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">디스크:</span>
                    <span className="text-green-400">정상</span>
                  </div>
                </div>
              </div>

              {/* 예측 분석 */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <h5 className="text-xs font-medium text-white">예측</h5>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">트래픽:</span>
                    <span className="text-blue-400">2h 후 증가</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">장애 위험:</span>
                    <span className="text-green-400">낮음</span>
                  </div>
                </div>
              </div>

              {/* AI 추천 */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <h5 className="text-xs font-medium text-white">AI 추천</h5>
                </div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>• 메모리 정리 권장</div>
                  <div>• 캐시 최적화</div>
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="p-4 border-t border-purple-500/30">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 text-purple-300 text-xs font-medium transition-colors">
                <Settings className="w-3 h-3 mx-auto mb-1" />
                설정
              </button>
              <button className="p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 text-purple-300 text-xs font-medium transition-colors">
                <FileText className="w-3 h-3 mx-auto mb-1" />
                보고서
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 