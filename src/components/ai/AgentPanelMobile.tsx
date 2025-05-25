'use client';

import { useState, useRef, useEffect } from 'react';
import AgentQueryBox from './AgentQueryBox';
import AgentResponseView from './AgentResponseView';
import { usePowerStore } from '../../stores/powerStore';
import { smartAIAgent } from '../../services/aiAgent';
import { aiLogger } from '../../lib/logger';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  serverId?: string;
}

interface AgentPanelMobileProps {
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

export default function AgentPanelMobile({ isOpen, onClose }: AgentPanelMobileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailedDashboard, setShowDetailedDashboard] = useState(false);
  const [serverIssues, setServerIssues] = useState<ServerIssue[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats>({
    total: 0,
    online: 0,
    warning: 0,
    critical: 0,
    offline: 0
  });
  const [urgentAlerts, setUrgentAlerts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarHistoryId, setSidebarHistoryId] = useState<string | null>(null);
  
  // 절전 모드 상태
  const { mode, updateActivity } = usePowerStore();
  const isSystemActive = mode === 'active' || mode === 'monitoring';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 브라우저 네비게이션과 독립적인 사이드바 관리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 사이드바 전용 히스토리 엔트리인지 확인
      if (event.state?.aiSidebarAction && event.state?.sidebarId === sidebarHistoryId) {
        // 사이드바 전용 뒤로가기인 경우에만 닫기
        onClose();
        setSidebarHistoryId(null);
      }
      // 일반 페이지 네비게이션은 사이드바에 영향 없음
    };

    if (isOpen) {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, onClose, sidebarHistoryId]);

  // 사이드바 열기 시 전용 히스토리 엔트리 추가
  useEffect(() => {
    if (isOpen && !sidebarHistoryId) {
      const historyId = `ai-sidebar-mobile-${Date.now()}`;
      setSidebarHistoryId(historyId);
      
      // 사이드바 전용 히스토리 엔트리 추가
      window.history.pushState(
        { 
          aiSidebarAction: true, 
          sidebarId: historyId,
          timestamp: Date.now(),
          mobile: true
        }, 
        '', 
        window.location.href
      );
    }
  }, [isOpen, sidebarHistoryId]);

  // 사이드바 닫기 함수 (히스토리 정리 포함)
  const handleClose = () => {
    if (sidebarHistoryId && window.history.state?.sidebarId === sidebarHistoryId) {
      // 사이드바 전용 히스토리 엔트리 제거
      window.history.back();
    } else {
      // 직접 닫기
      onClose();
    }
    setSidebarHistoryId(null);
  };

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
          
          // 긴급 알림 생성
          const alerts = [];
          if (stats.critical > 0) {
            alerts.push(`🚨 ${stats.critical}대 서버에서 심각한 문제 발생`);
          }
          if (stats.offline > 0) {
            alerts.push(`⚠️ ${stats.offline}대 서버가 오프라인 상태`);
          }
          if (stats.warning > 3) {
            alerts.push(`⚠️ ${stats.warning}대 서버에서 경고 발생 - 점검 필요`);
          }
          setUrgentAlerts(alerts);
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

  const handleSendMessage = async (query: string, serverId?: string) => {
    if (!query.trim()) return;

    // 활동 업데이트 및 시스템 자동 활성화
    updateActivity();
    
    // 시스템이 비활성화 상태라면 자동 활성화
    if (!isSystemActive) {
      console.log('🚀 모바일 AI 에이전트에서 시스템 자동 활성화 중...');
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

  const clearChat = () => {
    setMessages([]);
  };

  const quickQuestions = [
    { icon: '💻', text: '전체 서버 상태', query: '전체 서버 상태를 요약해서 알려주세요' },
    { icon: '📊', text: 'CPU 사용률', query: 'CPU 사용률이 높은 서버들을 찾아서 원인을 분석해주세요' },
    { icon: '💾', text: '메모리 부족', query: '메모리 사용률이 높은 서버들을 확인하고 해결방안을 제시해주세요' },
    { icon: '🌐', text: '네트워크 지연', query: '네트워크 지연이 발생한 서버들을 분석해주세요' }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      {/* 모바일 드로어 */}
      <div className="fixed inset-x-0 bottom-0 h-[85vh] bg-white z-50 flex flex-col rounded-t-2xl shadow-2xl">
        {/* 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 🧠 AI 에이전트 헤더 & 상태 표시 */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <i className="fas fa-brain text-white text-sm"></i>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI 에이전트</h2>
              <p className="text-xs text-gray-500">
                {isSystemActive ? '🟢 활성화' : '🔴 대기중'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
              title="대화 내용 지우기"
            >
              <i className="fas fa-broom text-sm text-gray-600"></i>
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
              title="패널 닫기"
            >
              <i className="fas fa-times text-sm text-gray-600"></i>
            </button>
          </div>
        </div>

        {/* 🚨 긴급 알림 바 (문제 발생시만 표시) */}
        {urgentAlerts.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 p-3">
            <div className="space-y-2">
              {urgentAlerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-red-800 text-sm font-medium">
                  <i className="fas fa-exclamation-triangle text-red-600"></i>
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⚠️ 실시간 서버 상태 요약 (한 눈에 보기) */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <i className="fas fa-server text-blue-600"></i>
            실시간 서버 상태
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
              <div className="text-sm font-bold text-green-600">{serverStats.online}</div>
              <div className="text-xs text-gray-600">정상</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
              <div className="text-sm font-bold text-yellow-600">{serverStats.warning}</div>
              <div className="text-xs text-gray-600">경고</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
              <div className="text-sm font-bold text-red-600">{serverStats.critical}</div>
              <div className="text-xs text-gray-600">심각</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
              <div className="text-sm font-bold text-gray-600">{serverStats.offline}</div>
              <div className="text-xs text-gray-600">오프라인</div>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-600">
              총 <span className="font-semibold text-gray-900">{serverStats.total}대</span> 서버 모니터링 중
            </span>
          </div>
        </div>

        {/* 💬 질문 입력창 + ⚡ 빠른 질문 프리셋 */}
        <div className="p-3 border-b border-gray-200">
          <div className="mb-2">
            <AgentQueryBox
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="서버 상태가 어때? 문제가 있는 서버는?"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question.query)}
                className="text-left p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg text-xs transition-all duration-200 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{question.icon}</span>
                  <span className="text-gray-700 group-hover:text-blue-700 font-medium truncate">
                    {question.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 💬 대화 내용 영역 (실시간 스크롤) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-brain text-blue-600"></i>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">AI 에이전트 준비 완료</h3>
              <p className="text-xs text-gray-500">
                위의 빠른 질문 버튼을 사용하거나<br />
                직접 질문을 입력해보세요!
              </p>
            </div>
          )}

          {messages.map((message) => (
            <AgentResponseView
              key={message.id}
              message={message}
              isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 bg-white rounded-lg p-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-xs ml-2">AI가 분석하고 있습니다...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 📊 상세 대시보드 토글 버튼 */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <button
            onClick={() => setShowDetailedDashboard(!showDetailedDashboard)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <i className={`fas ${showDetailedDashboard ? 'fa-eye-slash' : 'fa-chart-line'}`}></i>
            {showDetailedDashboard ? '간단히 보기' : '상세 분석 보기'}
          </button>
          
          {/* 상세 대시보드 영역 */}
          {showDetailedDashboard && (
            <div className="mt-2 space-y-2">
              {/* 문제 서버 상세 목록 */}
              {serverIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <h4 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    문제 서버 상세 ({serverIssues.length}개)
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {serverIssues.map((issue, index) => (
                      <div key={index} className="bg-white rounded p-2 border-l-2 border-l-red-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs text-gray-900">{issue.hostname}</span>
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                            issue.status === 'critical' ? 'bg-red-100 text-red-800' :
                            issue.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {issue.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{issue.issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 빠른 액션 버튼들 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendMessage('현재 가장 심각한 문제가 무엇인지 우선순위별로 분석해주세요')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 p-2 rounded text-xs font-medium transition-colors"
                >
                  🚨 긴급 분석
                </button>
                <button
                  onClick={() => handleSendMessage('모든 서버의 성능 메트릭을 종합하여 최적화 방안을 제시해주세요')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded text-xs font-medium transition-colors"
                >
                  📈 성능 최적화
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 