'use client';

import { useState, useEffect } from 'react';
import ModalHeader from './components/ModalHeader';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import MobileBottomSheet from './components/MobileBottomSheet';
import { useModalState } from './hooks/useModalState';
import { FunctionType, HistoryItem } from './types';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAgentModal({ isOpen, onClose }: AIAgentModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { state, dispatch, addToHistory, setBottomSheetState } = useModalState();

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
  const handleSendQuestion = (question: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_QUESTION', payload: question });
    
    // TODO: 실제 AI 에이전트 호출 및 응답 처리
    setTimeout(() => {
      const answer = `이 부분은 실제 AI 에이전트에서 "${question}"에 대한 응답으로 대체됩니다.`;
      
      dispatch({ type: 'SET_ANSWER', payload: answer });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // 히스토리에 추가
      addToHistory(question, answer);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center animate-fade-in">
      {/* 모달 배경 블러 효과 */}
      <div 
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
        onClick={onClose}
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
        
        {/* 모달 바디 */}
        <div className={`
          flex flex-col md:flex-row h-[calc(100%-64px)]
          ${isMobile ? 'overflow-y-auto' : ''}
        `}>
          {/* 왼쪽 패널 (질문-답변 영역) */}
          <LeftPanel
            isLoading={state.isLoading}
            currentQuestion={state.currentQuestion}
            currentAnswer={state.currentAnswer}
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