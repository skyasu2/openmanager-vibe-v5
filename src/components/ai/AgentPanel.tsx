'use client';

import { useState, useRef, useEffect } from 'react';
import AgentQueryBox from './AgentQueryBox';
import AgentResponseView from './AgentResponseView';
import { usePowerStore } from '../../stores/powerStore';
import { smartAIAgent } from '../../services/aiAgent';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  serverId?: string;
}

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialServerId?: string;
}

export default function AgentPanel({ isOpen, onClose, initialQuery, initialServerId }: AgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // 초기 쿼리가 있으면 자동으로 실행
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery, initialServerId);
    }
  }, [initialQuery, isOpen]);

  const handleSendMessage = async (query: string, serverId?: string) => {
    if (!query.trim()) return;

    // 활동 업데이트
    updateActivity();

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
      let aiResponse: string;
      
      if (isSystemActive) {
        // 스마트 AI 에이전트 응답 생성
        const smartResponse = smartAIAgent.generateSmartResponse(query);
        aiResponse = smartResponse.response;
      } else {
        // 절전 모드 응답
        aiResponse = '💤 시스템이 절전 모드입니다. 랜딩 페이지에서 시스템을 활성화해주세요.';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        serverId
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI 응답 오류:', error);
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

  const simulateAIResponse = async (query: string, serverId?: string): Promise<string> => {
    // 간단한 키워드 기반 응답 시뮬레이션
    const lowerQuery = query.toLowerCase();
    
    if (serverId) {
      if (lowerQuery.includes('분석') || lowerQuery.includes('상태')) {
        return `🔍 **${serverId} 서버 분석 결과**

**현재 상태:** 정상 운영 중
**위험 요소:** 
- CPU 사용률이 평균보다 높음 (85%)
- 메모리 사용률 증가 추세 감지

**권장사항:**
1. 불필요한 프로세스 정리
2. 메모리 최적화 수행
3. 로드 밸런싱 고려

**예상 영향도:** 중간
**조치 우선순위:** 높음`;
      }
      
      if (lowerQuery.includes('로그') || lowerQuery.includes('에러')) {
        return `📋 **${serverId} 로그 분석**

**최근 24시간 로그 요약:**
- 총 이벤트: 1,247건
- 에러: 3건 (모두 해결됨)
- 경고: 15건

**주요 이슈:**
- SSL 인증서 만료 경고 (7일 남음)
- 디스크 사용량 증가

**해결책:**
1. SSL 인증서 갱신 스케줄링
2. 로그 로테이션 설정 확인`;
      }
    }
    
    if (lowerQuery.includes('서버') && lowerQuery.includes('상태')) {
      return `📊 **전체 서버 상태 요약**

**온라인:** 4대 (67%)
**경고:** 1대 (17%) 
**오프라인:** 1대 (17%)

**주의 필요 서버:**
- DB-EU-002: 높은 리소스 사용률
- CACHE-US-004: 연결 끊김

**권장 조치:**
1. DB-EU-002 리소스 최적화
2. CACHE-US-004 재시작 시도`;
    }
    
    if (lowerQuery.includes('성능') || lowerQuery.includes('모니터링')) {
      return `⚡ **성능 모니터링 결과**

**전체 시스템 성능:**
- 평균 응답시간: 245ms
- 처리량: 1,523 req/sec
- 가용성: 99.7%

**최적화 기회:**
1. 캐시 히트율 개선 (현재 78%)
2. 데이터베이스 쿼리 최적화
3. CDN 활용도 증대`;
    }

    // 기본 응답
    return `안녕하세요! 🤖 OpenManager AI입니다.

다음과 같은 질문을 도와드릴 수 있습니다:
- 서버 상태 분석
- 성능 최적화 제안  
- 로그 분석 및 문제 해결
- 예측 알림 및 권장사항

구체적인 서버명이나 상황을 알려주시면 더 정확한 분석을 제공해드리겠습니다!`;
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 w-96 h-full bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <i className="fas fa-brain text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
          </div>
          <div>
            <h2 className="font-semibold">AI 에이전트</h2>
            <p className="text-xs opacity-90">OpenManager AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="w-8 h-8 hover:bg-white hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-colors"
            title="대화 내용 지우기"
          >
            <i className="fas fa-broom text-sm bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent"></i>
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-white hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-colors"
            title="패널 닫기"
          >
            <i className="fas fa-times text-sm bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent"></i>
          </button>
        </div>
      </div>

      {/* 대화 내용 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-brain text-2xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 에이전트에게 질문하세요</h3>
            <p className="text-sm text-gray-500 mb-4">서버 상태, 성능 분석, 문제 해결 등<br />무엇이든 물어보세요!</p>
            
            {/* 빠른 질문 버튼들 */}
            <div className="space-y-2">
              <button
                onClick={() => handleSendMessage('전체 서버 상태는 어떤가요?')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                💻 전체 서버 상태는 어떤가요?
              </button>
              <button
                onClick={() => handleSendMessage('성능 이슈가 있는 서버를 찾아주세요')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                ⚡ 성능 이슈가 있는 서버를 찾아주세요
              </button>
              <button
                onClick={() => handleSendMessage('최근 에러 로그를 분석해주세요')}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                🔍 최근 에러 로그를 분석해주세요
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <AgentResponseView
            key={message.id}
            message={message}
            isLoading={false}
          />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
              <i className="fas fa-brain"></i>
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">분석 중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 p-4">
        <AgentQueryBox
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="서버에 대해 질문해보세요..."
        />
      </div>
    </div>
  );
} 