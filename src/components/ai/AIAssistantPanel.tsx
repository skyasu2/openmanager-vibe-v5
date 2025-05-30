'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalHeader from './modal-v2/components/ModalHeader';
import LeftPanel from './modal-v2/components/LeftPanel';
import { useModalState } from './modal-v2/hooks/useModalState';
import { FunctionType, HistoryItem } from './modal-v2/types';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import { useServerDataStore } from '@/stores/serverDataStore';
import { useSystemControl } from '@/hooks/useSystemControl';
import { ErrorRecoverySystem } from '@/utils/error-recovery';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 패널 애니메이션 설정
const panelVariants = {
  hidden: { 
    x: '100%',
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 400,
      duration: 0.4
    }
  },
  exit: { 
    x: '100%',
    opacity: 0,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 400,
      duration: 0.3
    }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

// 메인 컨텐츠 애니메이션 변수 (좌측으로 밀리는 효과)
const mainContentVariants = {
  normal: {
    transform: 'translateX(0px)',
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 400,
      duration: 0.4
    }
  },
  pushed: {
    transform: 'translateX(-350px)', // 좌측으로 350px 밀기
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 400,
      duration: 0.4
    }
  }
};

export default function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [responseMetadata, setResponseMetadata] = useState<any>(null);
  const { state, dispatch, addToHistory } = useModalState();
  const { servers } = useServerDataStore();
  
  // 시스템 제어 훅 추가
  const { recordActivity } = useSystemControl();

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // localStorage에서 패널 상태 복원
  useEffect(() => {
    if (isClient) {
      const savedState = localStorage.getItem('ai-panel-state');
      if (savedState) {
        try {
          const { wasOpen } = JSON.parse(savedState);
          // 필요시 상태 복원 로직 추가
        } catch (error) {
          console.warn('패널 상태 복원 실패:', error);
        }
      }
    }
  }, [isClient]);

  // 패널 상태를 localStorage에 저장
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('ai-panel-state', JSON.stringify({ wasOpen: isOpen }));
    }
  }, [isOpen, isClient]);

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

  // 화면 크기에 따른 반응형 상태 감지 (클라이언트에서만)
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      dispatch({ type: 'SET_MOBILE', payload: mobile });
      
      // 모바일 -> 데스크탑 전환 시 상태 초기화 (바텀시트 제거로 단순화)
      if (!mobile) {
        // 모바일에서 데스크탑으로 전환 시 추가 초기화 작업이 필요하면 여기에 추가
      }
    };

    handleResize(); // 초기 로드 시 실행
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch, isClient]);

  // 사용자 활동 추적 (AI 패널 사용 시, 디바운스 적용)
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

    // AI 패널 내 사용자 활동 이벤트 리스너
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // 패널 열림 시 활동 기록 (디바운스 없이)
    recordActivity();

    return () => {
      clearTimeout(debounceTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isClient, isOpen, recordActivity]);

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
    console.log('🔄 AI 패널 초기 상태로 돌아감');
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

  // 질문 전송 핸들러 - 개선된 에러 처리 (원본 모달과 동일한 방식)
  const handleSendQuestion = async (question: string) => {
    if (!question.trim() || state.isLoading) return;

    const startTime = Date.now();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_QUESTION', payload: question });
    dispatch({ type: 'SET_ANSWER', payload: '' });
    
    // 활동 기록
    recordActivity();

    try {
      // 서버 데이터 로드 (빠른 실패를 위해 타임아웃 단축)
      const servers = await Promise.race([
        loadServerData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server data timeout')), 5000)
        )
      ]) as any[];

      // 🚀 개선된 AI 에이전트 호출 - 다단계 폴백 시스템 (원본과 동일)
      let aiResponse: Response | null = null;
      let finalData: any = null;

      try {
        // 1차: 최적화된 엔진 시도
        console.log('🚀 1차: 최적화 엔진 시도...');
        aiResponse = await fetch('/api/ai-agent/optimized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'smart-query',
            query: question,
            options: { timeout: 10000, priority: 'high',
        enabled: true }
          })
        });

        if (!aiResponse.ok) {
          throw new Error(`최적화 엔진 실패: ${aiResponse.status}`);
        }

        finalData = await aiResponse.json();
        console.log('✅ 최적화 엔진 성공');

      } catch (optimizedError) {
        console.warn('⚠️ 최적화 엔진 실패, 통합 엔진으로 전환:', optimizedError);
        
        // 에러 복구 시스템에 기록
        await ErrorRecoverySystem.handleAPIError('/api/ai-agent/optimized', optimizedError as Error);

        try {
          // 2차: 통합 엔진 시도 (이미 수정한 엔진)
          console.log('🔄 2차: 통합 엔진 시도...');
          aiResponse = await fetch('/api/ai-agent/integrated', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'smart-query',
              query: question,
              options: {
                timeout: 12000,
                priority: 'high',
        enabled: true,
                enableFallback: true
              }
            })
          });

          if (!aiResponse.ok) {
            throw new Error(`통합 엔진 실패: ${aiResponse.status}`);
          }

          finalData = await aiResponse.json();
          console.log('✅ 통합 엔진 성공');

        } catch (integratedError) {
          console.warn('⚠️ 통합 엔진도 실패, 로컬 폴백 사용:', integratedError);
          
          // 에러 복구 시스템에 기록
          await ErrorRecoverySystem.handleAPIError('/api/ai-agent/integrated', integratedError as Error);
          
          throw new Error('모든 AI 엔진 실패');
        }
      }

      // AI 응답 처리
      if (finalData?.success && finalData?.response) {
        const responseTime = Date.now() - startTime;
        
        // 성공적인 AI 응답
        const metadata = {
          intent: finalData.metadata?.intent || 'ai_response',
          confidence: finalData.metadata?.confidence || 0.8,
          responseTime,
          method: finalData.metadata?.method || 'integrated',
          fallbackUsed: finalData.metadata?.fallbackUsed || false,
          serverState: { servers, totalCount: servers.length },
          sessionId: finalData.metadata?.sessionId || `session_${Date.now()}`
        };
        
        setResponseMetadata(metadata);
        dispatch({ type: 'SET_ANSWER', payload: finalData.response });
        
        // 히스토리에 추가
        addToHistory(question, finalData.response);

        // InteractionLogger에 기록
        try {
          const logger = InteractionLogger.getInstance();
          await logger.logInteraction({
            query: question,
            intent: metadata.intent,
            confidence: metadata.confidence,
            response: finalData.response,
            contextData: {
              serverState: metadata.serverState,
              activeMetrics: ['cpu', 'memory', 'disk'],
              timeOfDay: new Date().toTimeString().split(' ')[0],
              userRole: 'admin',
              sessionId: metadata.sessionId
            },
            responseTime: metadata.responseTime
          });
        } catch (error) {
          console.warn('InteractionLogger 기록 실패:', error);
        }
        
      } else {
        // AI 응답이 올바르지 않은 경우
        throw new Error(finalData?.error || 'AI 응답 형식 오류');
      }

    } catch (error) {
      console.warn('🏠 모든 AI 엔진 실패, 로컬 폴백 모드로 전환:', error);
      
      // 에러 복구 시스템에 최종 에러 기록
      await ErrorRecoverySystem.handleAPIError('/api/ai-agent/fallback', error as Error);
      
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
      
      // 폴백 응답 시에도 활동 기록
      recordActivity();
      
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
        errorRecoveryApplied: true
      };
      setResponseMetadata(fallbackMetadata);
      
      dispatch({ type: 'SET_ANSWER', payload: fallbackAnswer });
      
      // 히스토리에 추가
      addToHistory(question, fallbackAnswer);

      // 폴백 응답도 InteractionLogger에 기록
      try {
        const logger = InteractionLogger.getInstance();
        await logger.logInteraction({
          query: question,
          intent: fallbackMetadata.intent,
          confidence: fallbackMetadata.confidence,
          response: fallbackAnswer,
          contextData: {
            serverState: fallbackMetadata.serverState,
            activeMetrics: ['cpu', 'memory', 'disk'],
            timeOfDay: new Date().toTimeString().split(' ')[0],
            userRole: 'admin',
            sessionId: fallbackMetadata.sessionId
          },
          responseTime: fallbackMetadata.responseTime
        });
      } catch (logError) {
        console.warn('폴백 응답 InteractionLogger 기록 실패:', logError);
      }
      
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 향상된 폴백 응답 생성 함수
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

  // 패널 너비 계산 - 반응형 최적화
  const getPanelWidth = () => {
    if (isMobile) return '100vw'; // 모바일: 전체 화면
    if (isTablet) return '420px'; // 태블릿: 중간 크기
    return '600px'; // 데스크탑: 큰 크기 (700px에서 600px로 조정)
  };

  // 메인 컨텐츠 밀림 거리 계산
  const getContentPushDistance = () => {
    if (isMobile) return '0px'; // 모바일에서는 밀지 않음
    if (isTablet) return '210px'; // 태블릿: 절반만 밀기
    return '300px'; // 데스크탑: 절반만 밀기
  };

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 사이드바용 투명 오버레이 - 블러 효과 제거 */}
          <motion.div 
            className="panel-overlay fixed inset-0 bg-transparent z-[999]"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => {
              recordActivity();
              onClose();
            }}
          />
          
          {/* AI Assistant 사이드바 */}
          <motion.div
            id="ai-assistant-panel"
            className={`
              ai-assistant-panel fixed top-0 right-0 h-screen bg-white 
              shadow-[-4px_0_24px_rgba(0,0,0,0.12)] z-[1000] 
              overflow-hidden flex flex-col border-l border-gray-200
              ${isMobile ? 'w-full' : ''}
            `}
            style={{ 
              width: getPanelWidth(),
              maxHeight: '100vh'
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="complementary"
            aria-label="AI Assistant Sidebar"
            onClick={(e) => {
              e.stopPropagation();
              recordActivity();
            }}
          >
            {/* 패널 헤더 */}
            <div className="panel-header border-b border-gray-200 bg-white">
              <ModalHeader onClose={() => {
                recordActivity();
                onClose();
              }} />
            </div>
            
            {/* 네비게이션 바 제거 - 사이드바에서는 불필요 */}
            
            {/* 패널 바디 - 스크롤 가능 */}
            <div className="panel-body flex-1 overflow-hidden flex flex-col">
              {isMobile ? (
                // 모바일: 전체 화면 사용
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-auto">
                    <LeftPanel
                      isLoading={state.isLoading}
                      currentQuestion={state.currentQuestion}
                      currentAnswer={state.currentAnswer}
                      responseMetadata={responseMetadata}
                      setQuestion={(question) => {
                        recordActivity();
                        dispatch({ type: 'SET_QUESTION', payload: question });
                      }}
                      sendQuestion={handleSendQuestion}
                      isMobile={isMobile}
                      onBackToPresets={handleBackToPresets}
                    />
                  </div>
                </div>
              ) : (
                // 데스크탑/태블릿: 전체 영역 사용
                <div className="h-full overflow-auto">
                  <LeftPanel
                    isLoading={state.isLoading}
                    currentQuestion={state.currentQuestion}
                    currentAnswer={state.currentAnswer}
                    responseMetadata={responseMetadata}
                    setQuestion={(question) => {
                      recordActivity();
                      dispatch({ type: 'SET_QUESTION', payload: question });
                    }}
                    sendQuestion={handleSendQuestion}
                    isMobile={isMobile}
                    onBackToPresets={handleBackToPresets}
                  />
                  
                  {/* 빠른 기능 버튼 - 사이드바 하단에 간소화 */}
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4">
                      <div className="text-xs text-gray-500 mb-3">빠른 기능</div>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            recordActivity();
                            dispatch({ type: 'SELECT_FUNCTION', payload: 'cost-analysis' });
                          }}
                          className="w-full p-3 text-sm bg-white rounded-lg border hover:bg-gray-50 transition-colors text-left"
                        >
                          🔍 시스템 분석
                        </button>
                        <button
                          onClick={() => {
                            recordActivity();
                            dispatch({ type: 'TOGGLE_HISTORY', payload: true });
                          }}
                          className="w-full p-3 text-sm bg-white rounded-lg border hover:bg-gray-50 transition-colors text-left"
                        >
                          📝 히스토리
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* 모바일 바텀시트 제거 - 사이드바에서는 불필요 */}
        </>
      )}
    </AnimatePresence>
  );
} 