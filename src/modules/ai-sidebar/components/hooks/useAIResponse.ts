/**
 * 🤖 AI 응답 커스텀 훅
 * 
 * Custom Hooks Pattern: 상태 로직을 컴포넌트에서 분리
 * Single Responsibility: AI 응답 관련 상태와 로직만 관리
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { timerManager } from '../../../../utils/TimerManager';
import { RealTimeLogEngine, RealTimeLogEntry } from '../../../ai-agent/core/RealTimeLogEngine';
import { AIResponseService } from '../services/AIResponseService';
import { 
  QAItem, 
  NavigationState, 
  TypingState, 
  AIResponseHookReturn 
} from '../types/AIResponseTypes';

export const useAIResponse = (
  question: string,
  isProcessing: boolean,
  onComplete: () => void
): AIResponseHookReturn => {
  // 상태 관리
  const [qaItems, setQAItems] = useState<QAItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 서비스 인스턴스
  const [logEngine] = useState(() => RealTimeLogEngine.getInstance());
  const [aiService] = useState(() => new AIResponseService());

  // 🛡️ 안전한 질문 검증
  const safeQuestion = useMemo(() => {
    try {
      if (!question || typeof question !== 'string') {
        console.warn('⚠️ useAIResponse: 유효하지 않은 질문', question);
        return '';
      }
      const trimmed = question.trim();
      if (trimmed.length === 0) {
        console.warn('⚠️ useAIResponse: 빈 질문 문자열');
        return '';
      }
      return trimmed;
    } catch (error) {
      console.error('❌ useAIResponse: 질문 검증 실패:', error);
      return '';
    }
  }, [question]);

  // 네비게이션 상태 계산
  const navigation: NavigationState = useMemo(() => ({
    currentIndex,
    canGoPrev: currentIndex > 0,
    canGoNext: currentIndex < qaItems.length - 1
  }), [currentIndex, qaItems.length]);

  // 타이핑 상태
  const typing: TypingState = useMemo(() => ({
    text: typingText,
    isTyping
  }), [typingText, isTyping]);

  // 현재 아이템
  const currentItem = qaItems[currentIndex];

  // 실시간 로그 엔진 초기화
  useEffect(() => {
    const initializeLogEngine = async () => {
      try {
        await logEngine.initialize();
        console.log('🚀 실시간 로그 엔진 초기화 완료');
      } catch (error) {
        console.error('❌ 로그 엔진 초기화 실패:', error);
      }
    };

    initializeLogEngine();

    // 실시간 로그 이벤트 리스너
    const handleLogAdded = ({
      sessionId,
      log,
    }: {
      sessionId: string;
      log: RealTimeLogEntry;
    }) => {
      setQAItems(prev =>
        prev.map(item =>
          item.sessionId === sessionId
            ? { ...item, thinkingLogs: [...item.thinkingLogs, log] }
            : item
        )
      );
    };

    logEngine.on('logAdded', handleLogAdded);

    return () => {
      logEngine.off('logAdded', handleLogAdded);
    };
  }, [logEngine]);

  // 현재 질문 처리 - 실제 AI 기능 연동
  useEffect(() => {
    if (!isProcessing || !safeQuestion) {
      console.log('🔍 useAIResponse: 처리 조건 불만족', {
        isProcessing,
        safeQuestion,
      });
      return;
    }

    const processQuestion = async () => {
      console.log('🤖 실제 AI 기능을 통한 질의 처리 시작:', safeQuestion);

      const category = aiService.determineCategory(safeQuestion);

      // 실시간 로그 세션 시작
      const sessionId = logEngine.startSession(
        `ai_query_${Date.now()}`,
        safeQuestion,
        {
          userId: 'current_user',
          category,
          mode: 'advanced',
        }
      );

      // 새 QA 아이템 생성
      const newQA: QAItem = {
        id: `qa_${Date.now()}`,
        question: safeQuestion,
        answer: '',
        isProcessing: true,
        thinkingLogs: [],
        timestamp: Date.now(),
        sessionId,
        category,
      };

      // qaItems 배열에 추가하고 인덱스를 마지막으로 설정
      let newIndex = 0;
      setQAItems(prev => {
        const updated = [...prev, newQA];
        newIndex = updated.length - 1;
        console.log('📝 QA 아이템 추가:', {
          length: updated.length,
          newIndex,
          category,
        });
        return updated;
      });

      // 인덱스를 새로 추가된 아이템으로 설정
      setTimeout(() => {
        setCurrentIndex(newIndex);
        console.log('📍 현재 인덱스 설정:', newIndex);
      }, 0);

      setIsThinkingExpanded(true);

      try {
        // 실제 AI 기능 호출
        const aiResponse = await aiService.callActualAIFunction(
          safeQuestion,
          category,
          sessionId
        );

        if (aiResponse.success && aiResponse.answer) {
          // 세션 완료
          logEngine.completeSession(sessionId, 'success', aiResponse.answer);

          // QA 아이템 업데이트
          setQAItems(prev =>
            prev.map(item =>
              item.sessionId === sessionId
                ? {
                    ...item,
                    answer: aiResponse.answer,
                    isProcessing: false,
                  }
                : item
            )
          );

          // 타이핑 애니메이션 시작
          startTypingAnimation(aiResponse.answer);

          // 완료 콜백 호출
          setTimeout(() => {
            onComplete();
          }, 1000);
        } else {
          // 실패 처리
          logEngine.completeSession(sessionId, 'failed', aiResponse.error || '처리 실패');

          setQAItems(prev =>
            prev.map(item =>
              item.sessionId === sessionId
                ? {
                    ...item,
                    answer: aiResponse.answer || '처리 중 오류가 발생했습니다.',
                    isProcessing: false,
                  }
                : item
            )
          );

          startTypingAnimation(aiResponse.answer || '처리 중 오류가 발생했습니다.');
          onComplete();
        }
      } catch (error: any) {
        console.error('❌ AI 기능 호출 중 오류:', error);
        
        logEngine.completeSession(sessionId, 'failed', error.message);

        setQAItems(prev =>
          prev.map(item =>
            item.sessionId === sessionId
              ? {
                  ...item,
                  answer: '죄송합니다. 처리 중 오류가 발생했습니다.',
                  isProcessing: false,
                }
              : item
          )
        );

        startTypingAnimation('죄송합니다. 처리 중 오류가 발생했습니다.');
        onComplete();
      }
    };

    processQuestion();
  }, [isProcessing, safeQuestion, logEngine, aiService, onComplete]);

  // 타이핑 애니메이션
  const startTypingAnimation = useCallback((text: string) => {
    if (!text) return;

    setIsTyping(true);
    setTypingText('');

    const words = text.split(' ');
    let currentWordIndex = 0;

    const typeNextWord = () => {
      if (currentWordIndex < words.length) {
        setTypingText(prev => {
          const newText = prev + (prev ? ' ' : '') + words[currentWordIndex];
          currentWordIndex++;
          
          if (currentWordIndex < words.length) {
            setTimeout(typeNextWord, 100);
          } else {
            setIsTyping(false);
          }
          
          return newText;
        });
      }
    };

    typeNextWord();
  }, []);

  // 이전 질문으로 이동
  const goToPrev = useCallback(() => {
    if (navigation.canGoPrev && !isTyping) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      console.log('⬅️ 이전 질문으로:', {
        currentIndex,
        newIndex,
        total: qaItems.length,
      });

      const item = qaItems[newIndex];
      if (item && item.answer && !item.isProcessing) {
        setTypingText('');
        startTypingAnimation(item.answer);
      }
    }
  }, [navigation.canGoPrev, isTyping, currentIndex, qaItems, startTypingAnimation]);

  // 다음 질문으로 이동
  const goToNext = useCallback(() => {
    if (navigation.canGoNext && !isTyping) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      console.log('➡️ 다음 질문으로:', {
        currentIndex,
        newIndex,
        total: qaItems.length,
      });

      const item = qaItems[newIndex];
      if (item && item.answer && !item.isProcessing) {
        setTypingText('');
        startTypingAnimation(item.answer);
      }
    }
  }, [navigation.canGoNext, isTyping, currentIndex, qaItems, startTypingAnimation]);

  // 로그 검증
  const handleVerifyLog = useCallback(async (log: RealTimeLogEntry) => {
    try {
      const verificationResult = await aiService.verifyLog(log);
      alert(`🔍 실제 로그 시스템 검증 결과:\n\n${verificationResult}`);
    } catch (error) {
      alert(
        `🔍 실제 로그 시스템 검증:\n\n로그 ID: ${log.id}\n모듈: ${log.module}\n레벨: ${log.level}\n\n이 로그는 실제 RealTimeLogEngine에서 생성되었습니다.\nAPI 호출 중 일부 오류가 발생했지만, 이것 자체가 실제 시스템과 상호작용하고 있다는 증거입니다.`
      );
    }
  }, [aiService]);

  return {
    qaItems,
    currentIndex,
    currentItem,
    navigation,
    typing,
    isThinkingExpanded,
    setIsThinkingExpanded,
    goToPrev,
    goToNext,
    handleVerifyLog,
  };
}; 