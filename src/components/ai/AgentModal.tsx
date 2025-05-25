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
  category: 'health' | 'performance' | 'security' | 'analysis';
}

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setServerIssues] = useState<ServerIssue[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats>({
    total: 0,
    online: 0,
    warning: 0,
    critical: 0,
    offline: 0
  });
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'quick-actions' | 'history'>('suggestions');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 절전 모드 상태
  const { mode, updateActivity } = usePowerStore();
  const isSystemActive = mode === 'active' || mode === 'monitoring';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 모달이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

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
    
    // 긴급 상황 기반 제안
    const problemServers = servers.filter(server => 
      server.status !== 'online' || server.cpu > 80 || server.memory > 85
    );
    
    if (problemServers.length > 0) {
      suggestions.push({
        text: `🚨 문제 서버 ${problemServers.length}대 긴급 분석`,
        query: `현재 문제가 있는 서버들을 우선순위별로 분석하고 즉시 해결방안을 제시해주세요`,
        icon: "fas fa-exclamation-triangle",
        urgent: true,
        category: 'health'
      });
    }
    
    if (stats.critical > 0) {
      suggestions.push({
        text: `🔥 심각한 장애 ${stats.critical}대 해결`,
        query: `심각한 상태의 서버들을 즉시 복구하기 위한 단계별 해결방안을 제시해주세요`,
        icon: "fas fa-fire",
        urgent: true,
        category: 'health'
      });
    }
    
    // 성능 관련 제안
    const highCpuServers = servers.filter(server => server.cpu > 70);
    if (highCpuServers.length > 0) {
      suggestions.push({
        text: `⚡ CPU 과부하 ${highCpuServers.length}대 최적화`,
        query: "CPU 사용률이 높은 서버들의 원인을 분석하고 성능 최적화 방안을 제시해주세요",
        icon: "fas fa-microchip",
        urgent: highCpuServers.some(s => s.cpu > 85),
        category: 'performance'
      });
    }
    
    const highMemoryServers = servers.filter(server => server.memory > 75);
    if (highMemoryServers.length > 0) {
      suggestions.push({
        text: `💾 메모리 부족 ${highMemoryServers.length}대 해결`,
        query: "메모리 사용량이 높은 서버들을 분석하고 메모리 최적화 방법을 알려주세요",
        icon: "fas fa-memory",
        urgent: false,
        category: 'performance'
      });
    }
    
    // 보안 및 분석 제안
    suggestions.push(
      {
        text: "🛡️ 보안 상태 종합 점검",
        query: "전체 서버의 보안 상태를 점검하고 취약점 분석 및 보안 강화 방안을 제시해주세요",
        icon: "fas fa-shield-alt",
        urgent: false,
        category: 'security'
      },
      {
        text: "📊 시스템 성능 트렌드 분석",
        query: "최근 시스템 성능 트렌드를 분석하고 향후 용량 계획 및 최적화 방향을 제안해주세요",
        icon: "fas fa-chart-line",
        urgent: false,
        category: 'analysis'
      },
      {
        text: "🔍 이상 패턴 자동 탐지",
        query: "서버들에서 비정상적인 패턴이나 이상징후를 탐지하고 예방 조치를 제안해주세요",
        icon: "fas fa-search",
        urgent: false,
        category: 'analysis'
      },
      {
        text: "📋 종합 장애 보고서 생성",
        query: "현재 시스템의 모든 문제를 종합하여 경영진용 상세 장애 보고서를 작성해주세요",
        icon: "fas fa-file-alt",
        urgent: false,
        category: 'analysis'
      }
    );
    
    setSmartSuggestions(suggestions.slice(0, 8));
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
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuickAction = async (action: string) => {
    const actions: Record<string, { message: string; query: string; icon: string }> = {
      'emergency-scan': {
        message: "🚨 긴급 시스템 스캔을 시작합니다...",
        query: "모든 서버에 대한 긴급 헬스체크를 수행하고 즉시 조치가 필요한 문제들을 우선순위별로 보고해주세요",
        icon: "🚨"
      },
      'performance-boost': {
        message: "⚡ 성능 최적화 분석을 시작합니다...",
        query: "전체 시스템의 성능 병목구간을 분석하고 즉시 적용 가능한 최적화 방안을 제시해주세요",
        icon: "⚡"
      },
      'security-audit': {
        message: "🛡️ 보안 감사를 시작합니다...",
        query: "전체 인프라의 보안 취약점을 스캔하고 보안 강화를 위한 즉시 조치사항을 제안해주세요",
        icon: "🛡️"
      },
      'predictive-analysis': {
        message: "🔮 예측 분석을 시작합니다...",
        query: "현재 시스템 트렌드를 기반으로 향후 발생 가능한 문제를 예측하고 예방 조치를 제안해주세요",
        icon: "🔮"
      }
    };
    
    const actionData = actions[action];
    if (actionData) {
      // 시스템 메시지 추가
      const systemMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: actionData.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      
      // AI 분석 실행
      await handleSendMessage(actionData.query);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'from-red-500 to-pink-500';
      case 'performance': return 'from-blue-500 to-cyan-500';
      case 'security': return 'from-green-500 to-emerald-500';
      case 'analysis': return 'from-purple-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-md">
      <div className={`bg-white rounded-3xl shadow-2xl w-[95%] max-w-6xl transition-all duration-500 ease-out ${
        isMinimized ? 'h-20' : 'h-[90vh]'
      } max-h-[800px] flex flex-col overflow-hidden`}>
        
        {/* 모달 헤더 - 개선된 디자인 */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 relative overflow-hidden">
                     {/* 배경 패턴 */}
           <div className="absolute inset-0 opacity-10">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-white/10"></div>
           </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <i className="fas fa-brain text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI 분석 어시스턴트</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isSystemActive 
                      ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                      : 'bg-red-500/20 text-red-100 border border-red-400/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${isSystemActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    {isSystemActive ? '활성화' : '대기중'}
                  </div>
                  <div className="text-sm opacity-80">
                    서버 {serverStats.total}대 모니터링 중
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-10 h-10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title={isMinimized ? "확장" : "최소화"}
              >
                <i className={`fas ${isMinimized ? 'fa-expand' : 'fa-minus'}`}></i>
              </button>
              <button
                onClick={clearChat}
                className="w-10 h-10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="대화 내용 지우기"
              >
                <i className="fas fa-broom"></i>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 hover:bg-red-500/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="모달 닫기"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* 탭 네비게이션 */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="flex gap-1">
                {[
                  { id: 'suggestions', label: '스마트 제안', icon: 'fas fa-lightbulb' },
                  { id: 'quick-actions', label: '빠른 실행', icon: 'fas fa-bolt' },
                  { id: 'history', label: '대화 기록', icon: 'fas fa-history' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-indigo-600 shadow-sm border border-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <i className={tab.icon}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeTab === 'suggestions' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <i className="fas fa-magic text-indigo-600"></i>
                      현재 상황 기반 스마트 제안
                    </h3>
                    <button
                      onClick={refreshSuggestions}
                      className="p-2 hover:bg-white/70 rounded-xl transition-all duration-200 hover:rotate-180 border border-white/50"
                      title="제안 새로고침"
                    >
                      <i className="fas fa-sync-alt text-indigo-600"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion.query)}
                        className={`group relative p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border ${
                          suggestion.urgent
                            ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-red-300 hover:from-red-600 hover:to-pink-700'
                            : `bg-gradient-to-br ${getCategoryColor(suggestion.category)} text-white border-transparent hover:shadow-2xl`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                            <i className={suggestion.icon}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight">
                              {suggestion.text}
                            </p>
                            {suggestion.urgent && (
                              <div className="mt-2 flex items-center gap-1">
                                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                                <span className="text-xs opacity-90">긴급</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 호버 효과 */}
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'quick-actions' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-rocket text-emerald-600"></i>
                    원클릭 자동 분석
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'emergency-scan', title: '긴급 스캔', desc: '전체 시스템 긴급 점검', icon: 'fas fa-ambulance', color: 'from-red-500 to-red-600' },
                      { id: 'performance-boost', title: '성능 부스트', desc: '성능 최적화 분석', icon: 'fas fa-tachometer-alt', color: 'from-blue-500 to-blue-600' },
                      { id: 'security-audit', title: '보안 감사', desc: '보안 취약점 스캔', icon: 'fas fa-shield-alt', color: 'from-green-500 to-green-600' },
                      { id: 'predictive-analysis', title: '예측 분석', desc: '미래 문제 예측', icon: 'fas fa-crystal-ball', color: 'from-purple-500 to-purple-600' }
                    ].map((action) => (
                      <button
                        key={action.id}
                        onClick={() => executeQuickAction(action.id)}
                        className={`group relative p-6 bg-gradient-to-br ${action.color} text-white rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                            <i className={`${action.icon} text-xl`}></i>
                          </div>
                          <h4 className="font-bold text-lg mb-1">{action.title}</h4>
                          <p className="text-sm opacity-90">{action.desc}</p>
                        </div>
                        
                        {/* 호버 효과 */}
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 대화 영역 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <i className="fas fa-brain text-4xl text-indigo-600"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">AI 분석 어시스턴트 준비 완료!</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                      서버 상태 분석, 장애 진단, 성능 최적화 제안을 도와드립니다.
                      위의 스마트 제안이나 빠른 실행 기능을 사용해보세요.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        실시간 모니터링
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        지능형 분석
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        자동 최적화
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type !== 'user' && (
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                        message.type === 'system' 
                          ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}>
                        {message.type === 'system' ? '⚙️' : '🧠'}
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : message.type === 'system'
                        ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                        : 'bg-white text-gray-800 shadow-lg border border-gray-100'
                    } p-4 rounded-2xl shadow-lg`}>
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </div>
                      <div className={`text-xs mt-2 flex items-center gap-2 ${
                        message.type === 'user' ? 'text-indigo-100' : 'text-gray-500'
                      }`}>
                        <i className="fas fa-clock"></i>
                        {message.timestamp.toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        👤
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      🧠
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">AI가 분석하고 있습니다...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 입력 영역 - 개선된 디자인 */}
              <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(inputValue);
                        }
                      }}
                      placeholder="AI에게 질문하거나 분석을 요청하세요... (Enter로 전송)"
                      className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl outline-none text-sm transition-all duration-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:shadow-lg placeholder-gray-400"
                      autoComplete="off"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <i className="fas fa-keyboard text-sm"></i>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <i className="fas fa-paper-plane text-lg"></i>
                  </button>
                </div>
                
                                 {/* 빠른 입력 힌트 */}
                 <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                   <i className="fas fa-lightbulb"></i>
                   <span>팁: &quot;서버 상태&quot;, &quot;성능 분석&quot;, &quot;보안 점검&quot; 등으로 질문해보세요</span>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 