'use client';

import { useState, useEffect } from 'react';
import ModalHeader from './components/ModalHeader';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import MobileBottomSheet from './components/MobileBottomSheet';
import NavigationBar from './components/NavigationBar';
import { useModalState } from './hooks/useModalState';
import { useModalNavigation } from './hooks/useModalNavigation';
import { FunctionType, HistoryItem } from './types';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import { useServerDataStore } from '@/stores/serverDataStore';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAgentModal({ isOpen, onClose }: AIAgentModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [responseMetadata, setResponseMetadata] = useState<any>(null);
  const { state, dispatch, addToHistory, setBottomSheetState } = useModalState();
  const { servers } = useServerDataStore();
  const navigation = useModalNavigation();

  // InteractionLogger 초기화 (브라우저 환경에서만)
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const logger = InteractionLogger.getInstance();
      logger.loadFromLocalStorage();
    }
  }, [isOpen]);

  // 화면 크기에 따른 모바일 상태 감지
  useEffect(() => {
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
  }, [dispatch, setBottomSheetState, state.bottomSheetState]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // 히스토리 아이템 선택 핸들러
  const handleSelectHistoryItem = (item: HistoryItem) => {
    dispatch({ type: 'SET_QUESTION', payload: item.question });
    dispatch({ type: 'SET_ANSWER', payload: item.answer });
    dispatch({ type: 'TOGGLE_HISTORY', payload: false });
  };

  // 질문 전송 핸들러
  const handleSendQuestion = async (question: string) => {
    const startTime = Date.now();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_QUESTION', payload: question });
    
    // 네비게이션 히스토리에 질문 추가
    navigation.addToHistory({
      type: 'question',
      title: question.length > 50 ? question.substring(0, 50) + '...' : question,
      data: { question, timestamp: startTime }
    });
    
    try {
      // 실제 AI 에이전트 API 호출
      const apiPromise = fetch('/api/ai-agent/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question,
          serverData: servers,
          context: {
            totalServers: servers.length,
            timestamp: new Date().toISOString()
          }
        }),
      });

      // 최소 3초는 생각하는 모습을 보여주기 위해 딜레이 추가
      const minThinkingTime = new Promise(resolve => setTimeout(resolve, 3000));
      
      // API 호출과 최소 대기 시간을 병렬로 실행
      const [response] = await Promise.all([apiPromise, minThinkingTime]);

      if (!response.ok) {
        throw new Error(`AI 에이전트 오류: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.success ? data.data.response : '죄송합니다. 응답을 생성할 수 없습니다.';
      const responseTime = Date.now() - startTime;
      
      // 응답 메타데이터 설정
      const metadata = {
        intent: data.data?.intent || 'general_query',
        confidence: data.data?.confidence || 0.5,
        responseTime,
        serverState: { servers, totalCount: servers.length },
        sessionId: data.data?.metadata?.sessionId || `session_${Date.now()}`
      };
      setResponseMetadata(metadata);
      
      dispatch({ type: 'SET_ANSWER', payload: answer });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // 히스토리에 추가
      addToHistory(question, answer);
      
    } catch (error) {
      console.error('AI 에이전트 호출 실패:', error);
      
      // 폴백도 최소 시간 보장
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsed);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // 폴백 응답 생성
      const fallbackAnswer = generateFallbackResponse(question, servers);
      const responseTime = Date.now() - startTime;
      
      // 폴백 메타데이터 설정
      const fallbackMetadata = {
        intent: 'fallback_response',
        confidence: 0.3,
        responseTime,
        serverState: { servers, totalCount: servers.length },
        sessionId: `fallback_session_${Date.now()}`
      };
      setResponseMetadata(fallbackMetadata);
      
      dispatch({ type: 'SET_ANSWER', payload: fallbackAnswer });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // 히스토리에 추가
      addToHistory(question, fallbackAnswer);
    }
  };

  // 폴백 응답 생성기
  const generateFallbackResponse = (question: string, servers: any[]): string => {
    const lowerQuery = question.toLowerCase();
    
    if (lowerQuery.includes('cpu') || lowerQuery.includes('씨피유')) {
      const avgCpu = servers.length > 0 
        ? Math.round(servers.reduce((sum, s) => sum + (s.metrics?.cpu || 0), 0) / servers.length)
        : 0;
      const highCpuServers = servers.filter(s => (s.metrics?.cpu || 0) > 80);
      
      return `🖥️ **CPU 상태 분석**\n\n` +
        `• 전체 서버: ${servers.length}대\n` +
        `• 평균 CPU 사용률: **${avgCpu}%**\n` +
        `• 고부하 서버: **${highCpuServers.length}대**\n\n` +
        (highCpuServers.length > 0 
          ? `⚠️ **주의가 필요한 서버:**\n${highCpuServers.map(s => `- ${s.name}: ${s.metrics?.cpu || 0}%`).join('\n')}`
          : '✅ 모든 서버가 정상 범위 내에서 동작 중입니다.');
    }
    
    if (lowerQuery.includes('메모리') || lowerQuery.includes('memory') || lowerQuery.includes('ram')) {
      const avgMemory = servers.length > 0 
        ? Math.round(servers.reduce((sum, s) => sum + (s.metrics?.memory || 0), 0) / servers.length)
        : 0;
      const highMemoryServers = servers.filter(s => (s.metrics?.memory || 0) > 85);
      
      return `💾 **메모리 상태 분석**\n\n` +
        `• 전체 서버: ${servers.length}대\n` +
        `• 평균 메모리 사용률: **${avgMemory}%**\n` +
        `• 고사용 서버: **${highMemoryServers.length}대**\n\n` +
        (highMemoryServers.length > 0 
          ? `⚠️ **주의가 필요한 서버:**\n${highMemoryServers.map(s => `- ${s.name}: ${s.metrics?.memory || 0}%`).join('\n')}`
          : '✅ 메모리 사용률이 정상 범위입니다.');
    }
    
    if (lowerQuery.includes('서버') && lowerQuery.includes('상태')) {
      const healthyCount = servers.filter(s => s.status === 'healthy').length;
      const warningCount = servers.filter(s => s.status === 'warning').length;
      const criticalCount = servers.filter(s => s.status === 'critical').length;
      
      return `📊 **전체 서버 상태**\n\n` +
        `• 총 서버 수: **${servers.length}대**\n` +
        `• 정상: **${healthyCount}대** (${Math.round(healthyCount/servers.length*100)}%)\n` +
        `• 경고: **${warningCount}대** (${Math.round(warningCount/servers.length*100)}%)\n` +
        `• 위험: **${criticalCount}대** (${Math.round(criticalCount/servers.length*100)}%)\n\n` +
        (criticalCount > 0 ? '🚨 위험 상태 서버에 대한 즉시 점검이 필요합니다.' :
         warningCount > 0 ? '⚠️ 일부 서버에서 경고 상태가 감지되었습니다.' :
         '✅ 모든 서버가 정상 상태입니다.');
    }
    
    // 기본 응답
    return `현재 **${servers.length}대**의 서버를 모니터링하고 있습니다.\n\n` +
      `💡 다음과 같은 질문을 해보세요:\n` +
      `• "CPU 상태는 어때?"\n` +
      `• "메모리 사용률 확인해줘"\n` +
      `• "서버 상태 요약해줘"\n` +
      `• "성능 분석 결과 보여줘"`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center animate-fade-in">
      {/* 모달 배경 블러 효과 - 클릭해도 모달이 닫히지 않음 */}
      <div 
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
      />
      
      {/* 모달 컨테이너 */}
      <div 
        className={`
          relative bg-white rounded-2xl shadow-xl overflow-hidden
          w-full max-w-7xl max-h-[90vh]
          animate-scale-in
          ${isMobile ? 'h-[90vh]' : 'h-[80vh]'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <ModalHeader onClose={onClose} />
        
        {/* 네비게이션 바 */}
        <NavigationBar
          canGoBack={navigation.canGoBack}
          canGoForward={navigation.canGoForward}
          currentIndex={navigation.currentIndex}
          history={navigation.history}
          onGoBack={navigation.goBack}
          onGoForward={navigation.goForward}
          onGoToIndex={navigation.goToIndex}
        />
        
        {/* 모달 바디 */}
        <div className={`
          flex flex-col md:flex-row h-[calc(100%-112px)]
          ${isMobile ? 'overflow-y-auto' : ''}
        `}>
          {/* 왼쪽 패널 (질문-답변 영역) */}
          <LeftPanel
            isLoading={state.isLoading}
            currentQuestion={state.currentQuestion}
            currentAnswer={state.currentAnswer}
            responseMetadata={responseMetadata}
            setQuestion={(question) => dispatch({ type: 'SET_QUESTION', payload: question })}
            sendQuestion={handleSendQuestion}
            isMobile={isMobile}
          />
          
          {/* 오른쪽 패널 (기능 영역) - 모바일에서는 숨김 */}
          {!isMobile && (
            <RightPanel
              selectedFunction={state.selectedFunction}
              functionData={state.functionData}
              selectFunction={(functionType: FunctionType) => 
                dispatch({ type: 'SELECT_FUNCTION', payload: functionType })
              }
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
          setState={setBottomSheetState}
          selectedFunction={state.selectedFunction}
          selectFunction={(functionType: FunctionType) => 
            dispatch({ type: 'SELECT_FUNCTION', payload: functionType })
          }
          functionData={state.functionData}
        />
      )}
    </div>
  );
} 