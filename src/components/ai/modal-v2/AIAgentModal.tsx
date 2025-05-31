'use client';

import { useState, useEffect } from 'react';
import ModalHeader from './components/ModalHeader';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import MobileBottomSheet from './components/MobileBottomSheet';
import NavigationBar from './components/NavigationBar';
import LangGraphThinkingDisplay from './components/LangGraphThinkingDisplay';
import { useModalState } from './hooks/useModalState';
import { useModalNavigation } from './hooks/useModalNavigation';
import { useLangGraphThinking } from './hooks/useLangGraphThinking';
import { FunctionType, HistoryItem } from './types';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import { useServerDataStore } from '@/stores/serverDataStore';
import { useSystemControl } from '@/hooks/useSystemControl';
import { ErrorRecoverySystem } from '@/utils/error-recovery';
import { mcpLangGraphAgent } from '@/services/ai-agent/MCPLangGraphAgent';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAgentModal({ isOpen, onClose }: AIAgentModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [responseMetadata, setResponseMetadata] = useState<any>(null);
  const { state, dispatch, addToHistory, setBottomSheetState } = useModalState();
  const { servers } = useServerDataStore();
  const navigation = useModalNavigation();
  
  // 🧠 LangGraph Thinking Hook 추가
  const thinking = useLangGraphThinking({
    autoAnimate: true,
    animationSpeed: 1200,
    showReActSteps: true,
    maxHistorySteps: 20
  });
  
  // 시스템 제어 훅 추가
  const { recordActivity } = useSystemControl();

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // InteractionLogger 초기화 (브라우저 환경에서만)
  useEffect(() => {
    if (isClient && isOpen) {
      try {
        const logger = InteractionLogger.getInstance();
        logger.loadFromLocalStorage();
      } catch (error) {
        console.warn('InteractionLogger 초기화 실패:', error);
      }
    }
  }, [isOpen, isClient]);

  // 화면 크기에 따른 모바일 상태 감지 (클라이언트에서만)
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      dispatch({ type: 'SET_MOBILE', payload: mobile });
      
      // 모바일 -> 데스크탑 전환 시 바텀시트 상태 초기화
      if (!mobile && state.bottomSheetState !== 'hidden') {
        setBottomSheetState('hidden');
      }
    };

    handleResize(); // 초기 로드 시 실행
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch, setBottomSheetState, state.bottomSheetState, isClient]);

  // 사용자 활동 추적 (AI 모달 사용 시, 디바운스 적용)
  useEffect(() => {
    if (!isClient || !isOpen) return;

    let debounceTimer: NodeJS.Timeout;
    
    const handleUserActivity = () => {
      // 디바운스: 1초 내에 여러 번 호출되면 마지막 호출만 실행
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        recordActivity();
      }, 1000);
    };

    // AI 모달 내 사용자 활동 이벤트 리스너
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // 모달 열림 시 활동 기록 (디바운스 없이)
    recordActivity();

    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isClient, isOpen]);

  // ESC 키로 모달 닫기 & 브라우저 히스토리 차단
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        recordActivity(); // ESC 키도 활동으로 기록
        onClose();
      }
    };

    // 브라우저 뒤로가기/앞으로가기 차단 (모달 열린 상태에서만)
    const handlePopState = (e: PopStateEvent) => {
      if (isOpen) {
        e.preventDefault();
        // 히스토리 상태를 현재로 유지
        window.history.pushState(null, '', window.location.href);
        console.log('🚫 AI 모달 사용 중 - 브라우저 히스토리 이동 차단됨');
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      window.addEventListener('popstate', handlePopState);
      
      // 현재 히스토리 상태에 모달 표시 추가
      window.history.pushState({ aiModalOpen: true }, '', window.location.href);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose, recordActivity]);

  // 히스토리 아이템 선택 핸들러
  const handleSelectHistoryItem = (item: HistoryItem) => {
    recordActivity(); // 히스토리 선택도 활동으로 기록
    dispatch({ type: 'SET_QUESTION', payload: item.question });
    dispatch({ type: 'SET_ANSWER', payload: item.answer });
    dispatch({ type: 'TOGGLE_HISTORY', payload: false });
  };

  // 프리셋으로 돌아가기 핸들러
  const handleBackToPresets = () => {
    recordActivity(); // 초기화도 활동으로 기록
    dispatch({ type: 'SET_QUESTION', payload: '' });
    dispatch({ type: 'SET_ANSWER', payload: '' });
    setResponseMetadata(null);
    console.log('🔄 AI 모달 초기 상태로 돌아감');
  };

  // 서버 데이터 로드 함수
  const loadServerData = async (): Promise<any[]> => {
    try {
      // useServerDataStore에서 서버 데이터 가져오기
      if (servers && servers.length > 0) {
        return servers;
      }
      
      // 서버 데이터가 없으면 API에서 가져오기
      const response = await fetch('/api/servers');
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data.servers : [];
      }
      
      // API 실패 시 기본 서버 데이터 반환
      return [
        { id: 'web-prod-01', name: 'web-prod-01', status: 'healthy', metrics: { cpu: 45, memory: 67, disk: 23 } },
        { id: 'api-prod-01', name: 'api-prod-01', status: 'warning', metrics: { cpu: 78, memory: 82, disk: 45 } },
        { id: 'db-prod-01', name: 'db-prod-01', status: 'healthy', metrics: { cpu: 34, memory: 56, disk: 67 } }
      ];
    } catch (error) {
      console.warn('서버 데이터 로드 실패:', error);
      // 에러 시 기본 서버 데이터 반환
      return [
        { id: 'web-prod-01', name: 'web-prod-01', status: 'healthy', metrics: { cpu: 45, memory: 67, disk: 23 } },
        { id: 'api-prod-01', name: 'api-prod-01', status: 'warning', metrics: { cpu: 78, memory: 82, disk: 45 } },
        { id: 'db-prod-01', name: 'db-prod-01', status: 'healthy', metrics: { cpu: 34, memory: 56, disk: 67 } }
      ];
    }
  };

  // 질문 처리 함수 - LangGraph Agent 통합
  const handleQuestion = async (question: string, functionType?: FunctionType) => {
    if (!question.trim() || state.isLoading) return;

    const startTime = Date.now();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_QUESTION', payload: question });
    dispatch({ type: 'SET_ANSWER', payload: '' });
    
    // 활동 기록
    recordActivity();

    try {
      // 🧠 LangGraph 사고 과정 시작
      const sessionId = `session_${Date.now()}`;
      thinking.startThinking(sessionId, question, 'react');

      // MCP Agent 초기화
      await mcpLangGraphAgent.initialize();

      // MCP 질의 생성
      const mcpQuery = {
        id: `query_${Date.now()}`,
        question,
        context: functionType ? `Function: ${functionType}` : undefined,
        priority: 'medium',
        enabled: true as const,
        category: determineCategoryFromQuestion(question)
      };

      // MCP LangGraph Agent로 처리
      const mcpResponse = await mcpLangGraphAgent.processQuery(mcpQuery);
      
      const responseTime = Date.now() - startTime;
      
      // 메타데이터 설정
      const metadata = {
        intent: mcpResponse.query_id,
        confidence: mcpResponse.confidence,
        responseTime,
        method: 'mcp_langgraph_agent',
        reasoning_steps: mcpResponse.reasoning_steps,
        recommendations: mcpResponse.recommendations,
        related_servers: mcpResponse.related_servers,
        sources: mcpResponse.sources,
        sessionId,
        langGraphEnabled: true,
        thinkingSteps: thinking.allSteps.length
      };
      setResponseMetadata(metadata);

      // 답변 설정
      dispatch({ type: 'SET_ANSWER', payload: mcpResponse.answer });
      
      // 히스토리에 추가
      addToHistory(question, mcpResponse.answer);
      
      // 사고 과정 완료
      thinking.completeThinking(mcpResponse);
      
    } catch (error) {
      console.error('❌ LangGraph Agent 처리 실패:', error);
      
      // 에러 복구 시스템에 기록
      await ErrorRecoverySystem.handleAPIError('/api/ai-agent/langgraph', error as Error);
      
      // 폴백 응답 생성 (최소 3초 대기)
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsed);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // 서버 데이터 재시도 (폴백용)
      let servers: any[] = [];
      try {
        servers = await loadServerData();
      } catch {
        // 서버 데이터도 실패하면 기본 데이터 사용
        servers = [
          { name: 'web-prod-01', status: 'healthy', metrics: { cpu: 45, memory: 67, disk: 23 } },
          { name: 'api-prod-01', status: 'warning', metrics: { cpu: 78, memory: 82, disk: 45 } },
          { name: 'db-prod-01', status: 'healthy', metrics: { cpu: 34, memory: 56, disk: 67 } }
        ];
      }
      
      // 폴백 응답 생성
      const fallbackAnswer = generateEnhancedFallbackResponse(question, servers, error as Error);
      const responseTime = Date.now() - startTime;
      
      // 폴백 메타데이터 설정
      const fallbackMetadata = {
        intent: 'fallback_response',
        confidence: 0.3,
        responseTime,
        method: 'local_fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
        serverState: { servers, totalCount: servers.length },
        sessionId: `fallback_session_${Date.now()}`,
        fallbackUsed: true,
        errorRecoveryApplied: true,
        langGraphEnabled: false
      };
      setResponseMetadata(fallbackMetadata);
      
      dispatch({ type: 'SET_ANSWER', payload: fallbackAnswer });
      
      // 히스토리에 추가
      addToHistory(question, fallbackAnswer);
      
      // 사고 과정 에러 처리
      thinking.processor.errorThinking(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 질문에서 카테고리 결정하는 유틸리티 함수
  const determineCategoryFromQuestion = (question: string): 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general' => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('모니터') || lowerQuestion.includes('감시') || lowerQuestion.includes('상태')) {
      return 'monitoring';
    } else if (lowerQuestion.includes('분석') || lowerQuestion.includes('성능') || lowerQuestion.includes('패턴')) {
      return 'analysis';
    } else if (lowerQuestion.includes('예측') || lowerQuestion.includes('예상') || lowerQuestion.includes('트렌드')) {
      return 'prediction';
    } else if (lowerQuestion.includes('장애') || lowerQuestion.includes('오류') || lowerQuestion.includes('문제') || lowerQuestion.includes('알림')) {
      return 'incident';
    } else {
      return 'general';
    }
  };

  // 향상된 폴백 응답 생성기
  const generateEnhancedFallbackResponse = (question: string, servers: any[], error: Error): string => {
    const lowerQuery = question.toLowerCase();
    
    // 에러 복구 상태 확인
    const recoveryStatus = ErrorRecoverySystem.getErrorStats();
    const isSystemHealthy = ErrorRecoverySystem.isHealthy();
    
    // 기본 에러 메시지
    const errorPrefix = `⚠️ **일시적 제한 모드**\n현재 AI 엔진이 일시적으로 사용할 수 없어 기본 분석 모드로 동작합니다.\n\n`;
    
    if (lowerQuery.includes('cpu') || lowerQuery.includes('씨피유')) {
      // 🚀 안전한 배열 처리: servers가 배열인지 확인
      const safeServers = Array.isArray(servers) ? servers : [];
      
      const avgCpu = safeServers.length > 0 
        ? Math.round(safeServers.reduce((sum, s) => sum + (s.metrics?.cpu || 0), 0) / safeServers.length)
        : 0;
      const highCpuServers = safeServers.filter(s => (s.metrics?.cpu || 0) > 80);
      
      return errorPrefix +
        `🖥️ **CPU 상태 분석**\n\n` +
        `• 전체 서버: ${safeServers.length}대\n` +
        `• 평균 CPU 사용률: **${avgCpu}%**\n` +
        `• 고부하 서버: **${highCpuServers.length}대**\n\n` +
        (highCpuServers.length > 0 
          ? `⚠️ **주의가 필요한 서버:**\n${highCpuServers.map(s => `- ${s.name}: ${s.metrics?.cpu || 0}%`).join('\n')}\n\n`
          : '✅ 모든 서버가 정상 범위 내에서 동작 중입니다.\n\n') +
        `💡 **복구 정보:** ${isSystemHealthy ? '시스템이 곧 정상화될 예정입니다.' : '복구 진행 중입니다.'}`;
    }
    
    if (lowerQuery.includes('메모리') || lowerQuery.includes('memory') || lowerQuery.includes('ram')) {
      // 🚀 안전한 배열 처리: servers가 배열인지 확인
      const safeServers = Array.isArray(servers) ? servers : [];
      
      const avgMemory = safeServers.length > 0 
        ? Math.round(safeServers.reduce((sum, s) => sum + (s.metrics?.memory || 0), 0) / safeServers.length)
        : 0;
      const highMemoryServers = safeServers.filter(s => (s.metrics?.memory || 0) > 85);
      
      return errorPrefix +
        `💾 **메모리 상태 분석**\n\n` +
        `• 전체 서버: ${safeServers.length}대\n` +
        `• 평균 메모리 사용률: **${avgMemory}%**\n` +
        `• 고사용 서버: **${highMemoryServers.length}대**\n\n` +
        (highMemoryServers.length > 0 
          ? `⚠️ **주의가 필요한 서버:**\n${highMemoryServers.map(s => `- ${s.name}: ${s.metrics?.memory || 0}%`).join('\n')}\n\n`
          : '✅ 메모리 사용률이 정상 범위입니다.\n\n') +
        `💡 **복구 정보:** AI 분석 엔진 복구 중, 잠시 후 다시 시도해주세요.`;
    }
    
    if (lowerQuery.includes('서버') && lowerQuery.includes('상태')) {
      // 🚀 안전한 배열 처리: servers가 배열인지 확인
      const safeServers = Array.isArray(servers) ? servers : [];
      
      const healthyCount = safeServers.filter(s => s.status === 'healthy').length;
      const warningCount = safeServers.filter(s => s.status === 'warning').length;
      const criticalCount = safeServers.filter(s => s.status === 'critical').length;
      
      return errorPrefix +
        `📊 **전체 서버 상태**\n\n` +
        `• 총 서버 수: **${safeServers.length}대**\n` +
        `• 정상: **${healthyCount}대** (${Math.round(healthyCount/safeServers.length*100)}%)\n` +
        `• 경고: **${warningCount}대** (${Math.round(warningCount/safeServers.length*100)}%)\n` +
        `• 위험: **${criticalCount}대** (${Math.round(criticalCount/safeServers.length*100)}%)\n\n` +
        (criticalCount > 0 ? '🚨 위험 상태 서버에 대한 즉시 점검이 필요합니다.\n' :
         warningCount > 0 ? '⚠️ 일부 서버에서 경고 상태가 감지되었습니다.\n' :
         '✅ 모든 서버가 정상 상태입니다.\n') +
        `\n💡 **시스템 상태:** ${isSystemHealthy ? '복구 거의 완료' : '복구 진행 중'} (에러 ${recoveryStatus.recentErrors}회)`;
    }
    
    if (lowerQuery.includes('에러') || lowerQuery.includes('오류') || lowerQuery.includes('문제')) {
      return errorPrefix +
        `🔧 **에러 진단 정보**\n\n` +
        `• 에러 유형: ${error.message.includes('timeout') ? 'API 시간 초과' : 
                     error.message.includes('404') ? '서비스 일시 중단' : 
                     error.message.includes('500') ? '서버 내부 오류' : '연결 문제'}\n` +
        `• 최근 에러 횟수: ${recoveryStatus.recentErrors}회\n` +
        `• 시스템 상태: ${isSystemHealthy ? '정상화 중' : '복구 진행 중'}\n\n` +
        `🛠️ **해결 방법:**\n` +
        `• 잠시 후 다시 시도해주세요\n` +
        `• 문제가 지속되면 페이지를 새로고침해주세요\n` +
        `• 기본 모니터링 기능은 정상 동작합니다\n\n` +
        `💡 **예상 복구 시간:** ${isSystemHealthy ? '1-2분 내' : '3-5분 내'}`;
    }
    
    // 기본 응답 (에러 정보 포함)
    // 🚀 안전한 배열 처리: servers가 배열인지 확인
    const safeServers = Array.isArray(servers) ? servers : [];
    
    return errorPrefix +
      `📊 **현재 상황**\n\n` +
      `• 모니터링 서버: **${safeServers.length}대**\n` +
      `• 기본 기능: ✅ 정상 동작\n` +
      `• AI 분석: ⚠️ 일시 중단\n` +
      `• 에러 복구: ${isSystemHealthy ? '✅ 거의 완료' : '🔄 진행 중'}\n\n` +
      `💡 **사용 가능한 질문:**\n` +
      `• "CPU 상태는 어때?"\n` +
      `• "메모리 사용률 확인해줘"\n` +
      `• "서버 상태 요약해줘"\n` +
      `• "에러 상황 알려줘"\n\n` +
      `🔄 **복구 진행 중이니 잠시 후 다시 시도해주세요.**`;
  };

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
    return null;
  }

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* 모달 배경 블러 효과 - 클릭해도 모달이 닫히지 않음 */}
      <div 
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
      />
      
      {/* 모달 컨테이너 - 스크롤 문제 해결 */}
      <div 
        className={`
          relative bg-white rounded-2xl shadow-xl
          w-full max-w-7xl max-h-[90vh]
          animate-scale-in flex flex-col
          ${isMobile ? 'h-[90vh]' : 'h-[80vh]'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          recordActivity(); // 모달 클릭도 활동으로 기록
        }}
      >
        {/* 모달 헤더 */}
        <ModalHeader onClose={() => {
          recordActivity(); // 모달 닫기도 활동으로 기록
          onClose();
        }} />
        
        {/* 네비게이션 바 */}
        <NavigationBar
          canGoBack={navigation.canGoBack}
          canGoForward={navigation.canGoForward}
          currentIndex={navigation.currentIndex}
          history={navigation.history}
          onGoBack={() => {
            recordActivity();
            navigation.goBack();
          }}
          onGoForward={() => {
            recordActivity();
            navigation.goForward();
          }}
          onGoToIndex={(index) => {
            recordActivity();
            navigation.goToIndex(index);
          }}
        />
        
        {/* 모달 바디 - 스크롤 가능하도록 수정 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽 패널 (대화 영역) */}
          <LeftPanel
            isLoading={state.isLoading}
            currentQuestion={state.currentQuestion}
            currentAnswer={state.currentAnswer}
            responseMetadata={responseMetadata}
            setQuestion={(question) => {
              recordActivity();
              dispatch({ type: 'SET_QUESTION', payload: question });
            }}
            sendQuestion={handleQuestion}
            isMobile={isMobile}
            onBackToPresets={handleBackToPresets}
          />
          
          {/* 중앙 패널 (LangGraph 사고 과정) - 사고 중이거나 스텝이 있을 때만 표시 */}
          {(thinking.isThinking || thinking.allSteps.length > 0) && (
            <div className="w-80 border-l border-gray-200 bg-gray-50/50 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200 bg-white">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                    🧠 AI 사고 과정
                    {thinking.isThinking && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {thinking.isThinking ? '분석 진행 중...' : `${thinking.allSteps.length}개 단계 완료`}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <LangGraphThinkingDisplay
                    steps={thinking.allSteps}
                    reactSteps={thinking.reactSteps}
                    currentStep={thinking.currentStep}
                    isThinking={thinking.isThinking}
                    animate={thinking.animate}
                    showReActSteps={true}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 오른쪽 패널 (기능 영역) - 모바일에서는 숨김 */}
          {!isMobile && (
            <RightPanel
              selectedFunction={state.selectedFunction}
              functionData={state.functionData}
              selectFunction={(functionType: FunctionType) => {
                recordActivity();
                dispatch({ type: 'SELECT_FUNCTION', payload: functionType });
              }}
              isMobile={isMobile}
              historyItems={state.history}
              onSelectHistoryItem={handleSelectHistoryItem}
            />
          )}
        </div>
      </div>
      
      {/* 모바일 바텀시트 */}
      {isMobile && (
        <MobileBottomSheet
          state={state.bottomSheetState}
          setState={(newState) => {
            recordActivity();
            setBottomSheetState(newState);
          }}
          selectedFunction={state.selectedFunction}
          selectFunction={(functionType: FunctionType) => {
            recordActivity();
            dispatch({ type: 'SELECT_FUNCTION', payload: functionType });
          }}
          functionData={state.functionData}
        />
      )}
    </div>
  );
} 