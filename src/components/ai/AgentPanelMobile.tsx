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

export default function AgentPanelMobile({ isOpen, onClose }: AgentPanelMobileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIncidentReport, setShowIncidentReport] = useState(false);
  const [serverIssues, setServerIssues] = useState<ServerIssue[]>([]);
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

  // 서버 문제 상황 가져오기
  useEffect(() => {
    const fetchServerIssues = async () => {
      try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        
        if (data.success) {
          const issues: ServerIssue[] = data.data
            .filter((server: any) => server.status !== 'online')
            .map((server: any) => ({
              hostname: server.hostname,
              status: server.status,
              issue: server.alerts?.[0]?.message || `서버가 ${server.status} 상태입니다`,
              severity: server.alerts?.[0]?.severity || server.status,
              lastSeen: new Date(server.lastSeen).toLocaleString('ko-KR')
            }));
          
          setServerIssues(issues);
        }
      } catch (error) {
        console.error('서버 이슈 정보 가져오기 실패:', error);
      }
    };

    if (isOpen) {
      fetchServerIssues();
      // 30초마다 업데이트
      const interval = setInterval(fetchServerIssues, 30000);
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

  const generateIncidentReport = async () => {
    const reportQuery = `현재 시스템에서 발생한 모든 장애와 경고 상황을 종합하여 상세한 장애 보고서를 작성해주세요. 
    
문제가 있는 서버들:
${serverIssues.map(issue => `- ${issue.hostname}: ${issue.status} (${issue.issue})`).join('\n')}

다음 항목들을 포함해주세요:
1. 장애 요약
2. 영향받는 서비스
3. 근본 원인 분석
4. 해결 방안
5. 예방 조치`;

    await handleSendMessage(reportQuery);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const quickQuestions = [
    { icon: '💻', text: '전체 서버 상태', query: '전체 서버 상태를 요약해서 알려주세요' },
    { icon: '⚠️', text: '문제 서버 확인', query: '현재 문제가 있는 서버들을 자세히 분석해주세요' },
    { icon: '📊', text: 'CPU 사용률', query: 'CPU 사용률이 높은 서버들을 찾아서 원인을 분석해주세요' },
    { icon: '💾', text: '메모리 부족', query: '메모리 사용률이 높은 서버들을 확인하고 해결방안을 제시해주세요' }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* 장애 보고서 모달 */}
      {showIncidentReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-orange-600 text-white">
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <h2 className="font-bold">장애 보고서</h2>
                  <p className="text-xs opacity-90">시스템 장애 상황</p>
                </div>
              </div>
              <button
                onClick={() => setShowIncidentReport(false)}
                className="w-8 h-8 hover:bg-white hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* 장애 요약 */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i>
                    장애 요약
                  </h3>
                  <p className="text-red-700 text-sm">
                    총 <span className="font-bold">{serverIssues.length}개</span> 서버에서 문제가 발생했습니다.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-lg font-bold text-red-600">
                        {serverIssues.filter(s => s.status === 'critical').length}
                      </div>
                      <div className="text-xs text-gray-600">Critical</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {serverIssues.filter(s => s.status === 'warning').length}
                      </div>
                      <div className="text-xs text-gray-600">Warning</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <div className="text-lg font-bold text-gray-600">
                        {serverIssues.filter(s => s.status === 'offline').length}
                      </div>
                      <div className="text-xs text-gray-600">Offline</div>
                    </div>
                  </div>
                </div>

                {/* 문제 서버 목록 */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-server"></i>
                    문제 서버 목록
                  </h3>
                  {serverIssues.map((issue, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-l-red-500">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{issue.hostname}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.status === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{issue.issue}</p>
                    </div>
                  ))}
                </div>

                {/* AI 분석 요청 버튼 */}
                <button
                  onClick={() => {
                    setShowIncidentReport(false);
                    generateIncidentReport();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-brain"></i>
                  AI 상세 분석 요청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <i className="fas fa-brain text-white text-sm"></i>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI 에이전트</h2>
              <p className="text-xs text-gray-500">OpenManager AI</p>
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

        {/* 질문 입력창 - 최상단 */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <AgentQueryBox
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="AI에게 질문하세요..."
          />
        </div>

        {/* 빠른 질문 프리셋 */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">빠른 질문</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question.query)}
                className="text-left p-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-xs transition-all duration-200 group"
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

        {/* 장애 보고서 버튼 */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={() => setShowIncidentReport(true)}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <i className="fas fa-exclamation-triangle"></i>
            자동 장애 보고서
            {serverIssues.length > 0 && (
              <span className="bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                {serverIssues.length}
              </span>
            )}
          </button>
        </div>

        {/* 문제 서버 요약 */}
        {serverIssues.length > 0 && (
          <div className="p-3 border-b border-gray-200 bg-red-50">
            <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-red-600"></i>
              문제 서버 ({serverIssues.length}개)
            </h3>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {serverIssues.map((issue, index) => (
                <div key={index} className="bg-white rounded p-2 border-l-3 border-l-red-500">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-gray-900">{issue.hostname}</span>
                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                      issue.status === 'critical' ? 'bg-red-100 text-red-800' :
                      issue.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {issue.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{issue.issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 대화 내용 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-brain text-lg text-purple-600"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">AI 에이전트 준비 완료</h3>
              <p className="text-xs text-gray-500">
                위의 질문 입력창이나 빠른 질문 버튼을<br />
                사용해서 대화를 시작하세요!
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
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-xs ml-2">AI가 응답을 생성하고 있습니다...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </>
  );
} 