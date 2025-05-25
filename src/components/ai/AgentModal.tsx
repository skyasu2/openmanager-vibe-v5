'use client';

import { useState, useRef, useEffect } from 'react';
import { usePowerStore } from '../../stores/powerStore';
import { smartAIAgent } from '../../services/aiAgent';
import { aiLogger } from '../../lib/logger';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  serverId?: string;
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerIssue {
  hostname: string;
  status: 'critical' | 'warning' | 'offline';
  issue: string;
  severity: string;
  lastSeen: string;
}

interface ServerStats {
  total: number;
  online: number;
  warning: number;
  critical: number;
  offline: number;
}

interface SmartSuggestion {
  text: string;
  query: string;
  icon: string;
  urgent: boolean;
}

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverIssues, setServerIssues] = useState<ServerIssue[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats>({
    total: 0,
    online: 0,
    warning: 0,
    critical: 0,
    offline: 0
  });
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 절전 모드 상태
  const { mode, updateActivity } = usePowerStore();
  const isSystemActive = mode === 'active' || mode === 'monitoring';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 서버 상태 및 문제 상황 가져오기
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        
        if (data.success) {
          const servers = data.data;
          
          // 서버 통계 계산
          const stats = {
            total: servers.length,
            online: servers.filter((s: any) => s.status === 'online').length,
            warning: servers.filter((s: any) => s.status === 'warning').length,
            critical: servers.filter((s: any) => s.status === 'critical').length,
            offline: servers.filter((s: any) => s.status === 'offline').length
          };
          setServerStats(stats);
          
          // 문제 서버 목록
          const issues: ServerIssue[] = servers
            .filter((server: any) => server.status !== 'online')
            .map((server: any) => ({
              hostname: server.hostname,
              status: server.status,
              issue: server.alerts?.[0]?.message || `서버가 ${server.status} 상태입니다`,
              severity: server.alerts?.[0]?.severity || server.status,
              lastSeen: new Date(server.lastSeen).toLocaleString('ko-KR')
            }));
          setServerIssues(issues);
          
          // 스마트 제안 생성
          generateSmartSuggestions(servers, stats);
        }
      } catch (error) {
        console.error('서버 데이터 가져오기 실패:', error);
      }
    };

    if (isOpen) {
      fetchServerData();
      // 30초마다 업데이트
      const interval = setInterval(fetchServerData, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const generateSmartSuggestions = (servers: any[], stats: ServerStats) => {
    const suggestions: SmartSuggestion[] = [];
    
    // 문제 서버 기반 제안
    const problemServers = servers.filter(server => 
      server.status !== 'online' || server.cpu > 80 || server.memory > 85
    );
    
    if (problemServers.length > 0) {
      suggestions.push({
        text: `문제 서버 ${problemServers.length}대 분석`,
        query: `현재 문제가 있는 서버들을 분석해주세요`,
        icon: "fas fa-exclamation-triangle",
        urgent: true
      });
    }
    
    if (stats.critical > 0) {
      suggestions.push({
        text: `심각한 문제 ${stats.critical}대 해결`,
        query: `심각한 상태의 서버들을 우선순위별로 분석하고 해결방안을 제시해주세요`,
        icon: "fas fa-fire",
        urgent: true
      });
    }
    
    const highCpuServers = servers.filter(server => server.cpu > 70);
    if (highCpuServers.length > 0) {
      suggestions.push({
        text: "CPU 사용률 높은 서버 확인",
        query: "CPU 사용률이 높은 서버들의 원인을 분석해주세요",
        icon: "fas fa-microchip",
        urgent: highCpuServers.some(s => s.cpu > 85)
      });
    }
    
    const highMemoryServers = servers.filter(server => server.memory > 75);
    if (highMemoryServers.length > 0) {
      suggestions.push({
        text: "메모리 사용량 체크",
        query: "메모리 사용량이 높은 서버들을 최적화할 방법을 알려주세요",
        icon: "fas fa-memory",
        urgent: false
      });
    }
    
    // 기본 제안들
    if (suggestions.length < 3) {
      suggestions.push(
        {
          text: "전체 서버 상태 확인",
          query: "현재 전체 서버 상태를 요약해서 알려주세요",
          icon: "fas fa-server",
          urgent: false
        },
        {
          text: "성능 최적화 제안",
          query: "전체 시스템 성능을 개선할 방법을 제안해주세요",
          icon: "fas fa-rocket",
          urgent: false
        },
        {
          text: "장애 보고서 작성",
          query: "현재 시스템의 모든 문제를 종합하여 상세한 장애 보고서를 작성해주세요",
          icon: "fas fa-file-alt",
          urgent: false
        }
      );
    }
    
    setSmartSuggestions(suggestions.slice(0, 6));
  };

  const handleSendMessage = async (query: string, serverId?: string) => {
    if (!query.trim()) return;

    // 활동 업데이트 및 시스템 자동 활성화
    updateActivity();
    
    // 시스템이 비활성화 상태라면 자동 활성화
    if (!isSystemActive) {
      console.log('🚀 AI 에이전트에서 시스템 자동 활성화 중...');
      const { activateSystem } = usePowerStore.getState();
      activateSystem();
      console.log('✅ 시스템 활성화 완료');
    }

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
      serverId
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputValue('');

    try {
      // 시스템 활성화 후 스마트 AI 에이전트 응답 생성
      const smartResponse = smartAIAgent.generateSmartResponse(query);
      const aiResponse = smartResponse.response;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        serverId
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      aiLogger.error('AI 응답 생성 오류', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeFeature = async (action: string) => {
    const features: Record<string, { message: string; query: string }> = {
      'auto-health-check': {
        message: "전체 서버 헬스체크를 시작합니다...",
        query: "모든 서버의 상태를 종합적으로 분석하고 문제점과 개선사항을 보고해주세요"
      },
      'auto-anomaly-detection': {
        message: "이상징후 탐지 분석을 시작합니다...",
        query: "현재 서버들에서 비정상적인 패턴이나 이상징후가 있는지 분석해주세요"
      },
      'auto-performance-analysis': {
        message: "성능 분석을 시작합니다...",
        query: "각 서버의 성능 지표를 분석하고 병목구간과 최적화 방안을 제시해주세요"
      }
    };
    
    const feature = features[action];
    if (feature) {
      // 시스템 메시지 추가
      const systemMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: feature.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      
      // AI 분석 실행
      await handleSendMessage(feature.query);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const refreshSuggestions = () => {
    // 서버 데이터 다시 가져와서 제안 새로고침
    const fetchAndRefresh = async () => {
      try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        if (data.success) {
          generateSmartSuggestions(data.data, serverStats);
        }
      } catch (error) {
        console.error('제안 새로고침 실패:', error);
      }
    };
    fetchAndRefresh();
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl h-[85vh] max-h-[700px] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-brain text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI 분석 어시스턴트</h2>
              <p className="text-sm opacity-90">
                {isSystemActive ? '🟢 활성화' : '🔴 대기중'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="w-9 h-9 hover:bg-white hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-colors"
              title="대화 내용 지우기"
            >
              <i className="fas fa-broom"></i>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 hover:bg-white hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-colors"
              title="모달 닫기"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* 스마트 제안 영역 */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-lightbulb text-yellow-500"></i>
            <span className="font-semibold text-gray-700 text-sm">현재 상황 기반 추천 질문</span>
            <button
              onClick={refreshSuggestions}
              className="ml-auto p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:rotate-180"
              title="새로고침"
            >
              <i className="fas fa-sync-alt text-gray-600 text-sm"></i>
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {smartSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion.query)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 shadow-sm ${
                  suggestion.urgent
                    ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                }`}
              >
                <i className={suggestion.icon}></i>
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>

        {/* 기능 패널 */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="mb-4">
            <h6 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-robot text-blue-600"></i>
              자동 분석
            </h6>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => executeFeature('auto-health-check')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 shadow-sm"
              >
                <i className="fas fa-heartbeat"></i>
                전체 헬스체크
              </button>
              <button
                onClick={() => executeFeature('auto-anomaly-detection')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 shadow-sm"
              >
                <i className="fas fa-exclamation-triangle"></i>
                이상징후 탐지
              </button>
              <button
                onClick={() => executeFeature('auto-performance-analysis')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 shadow-sm"
              >
                <i className="fas fa-chart-line"></i>
                성능 분석
              </button>
            </div>
          </div>
        </div>

        {/* 대화 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 분석 어시스턴트입니다!</h3>
              <p className="text-gray-600 mb-4">
                서버 상태 분석, 장애 진단, 성능 최적화 제안을 도와드립니다.
              </p>
              <p className="text-sm text-gray-500">
                위의 <strong>추천 질문</strong>이나 <strong>자동 분석</strong>을 사용해보세요.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type !== 'user' && (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'system' ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {message.type === 'system' ? '⚙️' : '🧠'}
                </div>
              )}
              
              <div className={`max-w-[70%] p-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-200 text-gray-700 text-sm italic'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}>
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              
              {message.type === 'user' && (
                <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                🧠
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-600 ml-2">AI가 분석하고 있습니다...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="자유롭게 질문하거나 분석을 요청하세요..."
              className="flex-1 p-3 border-2 border-gray-300 rounded-xl outline-none text-sm transition-all duration-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:shadow-lg"
              autoComplete="off"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 