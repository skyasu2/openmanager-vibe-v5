/**
 * 🚀 간단한 AI 사이드바
 *
 * - CSS 기반 타이핑 효과
 * - 자동 장애보고서 기능
 * - AI 질의응답
 * - 목업 기능들
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  FileText,
  TrendingUp,
  Search,
  Database,
  Brain,
  Settings,
  Send,
  Download,
  AlertTriangle,
  Server,
  Clock,
} from 'lucide-react';
import SafeCSSTypingEffect from '../../../components/ui/SafeCSSTypingEffect';
import { IncidentReportTab } from './IncidentReportTab';

interface SimpleAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const FUNCTION_MENU = [
  {
    id: 'chat',
    icon: MessageCircle,
    label: 'AI 질의응답',
    description: 'AI와 자연어로 시스템 질의',
    color: 'text-blue-500',
  },
  {
    id: 'incident-report',
    icon: FileText,
    label: '자동 장애보고서',
    description: '육하원칙 기반 장애보고서 생성',
    color: 'text-red-500',
  },
  {
    id: 'prediction',
    icon: TrendingUp,
    label: 'AI 예측 분석',
    description: '서버 성능 및 장애 예측',
    color: 'text-green-500',
  },
  {
    id: 'search',
    icon: Search,
    label: '통합 검색',
    description: '로그 및 메트릭 검색',
    color: 'text-purple-500',
  },
  {
    id: 'database',
    icon: Database,
    label: '데이터 분석',
    description: '실시간 데이터 분석',
    color: 'text-orange-500',
  },
  {
    id: 'brain',
    icon: Brain,
    label: 'AI 학습',
    description: 'AI 모델 학습 및 개선',
    color: 'text-pink-500',
  },
  {
    id: 'settings',
    icon: Settings,
    label: '설정',
    description: 'AI 시스템 설정',
    color: 'text-gray-500',
  },
];

const SAMPLE_QUESTIONS = [
  '현재 서버 상태는 어떤가요?',
  '성능 이상이 있는 서버를 찾아주세요',
  'CPU 사용률이 높은 서버는?',
  '메모리 사용량 분석해주세요',
  '네트워크 트래픽 상태는?',
  '최근 에러 로그를 확인해주세요',
];

export const SimpleAISidebar: React.FC<SimpleAISidebarProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTypingId, setCurrentTypingId] = useState<string | null>(null);

  /**
   * 🤖 AI 응답 생성
   */
  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('서버') && lowerQuestion.includes('상태')) {
      return `🔍 **현재 서버 상태 분석 결과:**

📊 **전체 현황:**
- 총 12개 서버 운영 중
- 정상: 9개 (75%)
- 경고: 2개 (17%)
- 심각: 1개 (8%)

⚠️ **주의 필요 서버:**
- web-prod-01: CPU 85% (경고)
- api-prod-02: 메모리 89% (심각)

💡 **권장사항:**
1. api-prod-02 서버 즉시 점검 필요
2. web-prod-01 프로세스 최적화 검토
3. 로드 밸런싱 재조정 고려

📈 **추세 분석:**
지난 24시간 동안 전반적인 성능 저하 추세가 관찰됩니다. 트래픽 증가에 따른 스케일링을 검토해보세요.`;
    }

    if (lowerQuestion.includes('성능') || lowerQuestion.includes('이상')) {
      return `🔍 **성능 이상 감지 결과:**

🚨 **감지된 이상 징후:**
- api-prod-02: 응답시간 2.5초 (평소 0.3초)
- db-prod-01: 연결 수 급증 (200% 증가)
- cache-prod-01: 히트율 급감 (85% → 45%)

📊 **근본 원인 분석:**
1. 데이터베이스 쿼리 성능 저하
2. 캐시 무효화 빈발
3. 동시 접속자 수 급증

🛠️ **즉시 조치사항:**
1. 느린 쿼리 최적화
2. 캐시 전략 재검토
3. 서버 리소스 확장`;
    }

    if (lowerQuestion.includes('cpu')) {
      return `💻 **CPU 사용률 분석:**

🔥 **높은 CPU 사용률 서버:**
1. web-prod-01: 85.2%
2. worker-prod-03: 78.9%
3. api-prod-02: 92.1% ⚠️

📈 **사용률 추세:**
- 평균 CPU 사용률: 67% (전일 대비 +15%)
- 피크 시간대: 14:00-16:00
- 최고 사용률: 92.1% (api-prod-02)

⚡ **최적화 권장사항:**
1. api-prod-02 긴급 점검 필요
2. 프로세스 분산 처리 검토
3. 오토스케일링 임계값 조정`;
    }

    if (lowerQuestion.includes('메모리')) {
      return `🧠 **메모리 사용량 분석:**

📊 **메모리 현황:**
- 평균 사용률: 72%
- 최고 사용률: 89% (api-prod-02)
- 메모리 누수 의심: 2개 서버

⚠️ **주의 서버:**
1. api-prod-02: 89% (위험)
2. cache-prod-01: 81% (경고)
3. worker-prod-03: 76% (주의)

🔍 **분석 결과:**
- api-prod-02에서 메모리 누수 패턴 감지
- 지난 6시간 동안 지속적 증가 추세
- GC 빈도 증가로 성능 영향

💡 **권장 조치:**
1. 애플리케이션 재시작 검토
2. 메모리 프로파일링 수행
3. 힙 덤프 분석`;
    }

    if (lowerQuestion.includes('네트워크')) {
      return `🌐 **네트워크 트래픽 분석:**

📡 **트래픽 현황:**
- 총 인바운드: 2.3 GB/h
- 총 아웃바운드: 1.8 GB/h
- 평균 지연시간: 45ms

📊 **서버별 트래픽:**
1. web-prod-01: 850 MB/h
2. api-prod-02: 1.2 GB/h
3. cdn-edge-01: 680 MB/h

⚡ **성능 지표:**
- 패킷 손실률: 0.02%
- 대역폭 사용률: 67%
- 연결 성공률: 99.8%

🔍 **이상 징후:**
- api-prod-02에서 비정상적 트래픽 급증
- 특정 IP에서 반복적 요청 패턴
- SSL 핸드셰이크 지연 증가`;
    }

    if (lowerQuestion.includes('로그') || lowerQuestion.includes('에러')) {
      return `📋 **최근 에러 로그 분석:**

🚨 **에러 요약 (최근 1시간):**
- 총 에러 수: 47건
- 심각도 높음: 12건
- 심각도 중간: 23건
- 심각도 낮음: 12건

🔍 **주요 에러 패턴:**
1. Database connection timeout (15건)
2. Memory allocation failed (8건)
3. API rate limit exceeded (12건)
4. SSL certificate validation error (7건)

📊 **에러 발생 서버:**
- api-prod-02: 28건 (59%)
- db-prod-01: 12건 (26%)
- web-prod-01: 7건 (15%)

💡 **권장 조치:**
1. 데이터베이스 연결 풀 설정 검토
2. 메모리 할당 정책 최적화
3. API 레이트 리미팅 조정
4. SSL 인증서 갱신 확인`;
    }

    // 기본 응답
    return `🤖 **AI 분석 결과:**

질문해주신 "${question}"에 대해 분석했습니다.

📊 **현재 시스템 상태:**
- 전체적으로 안정적인 상태를 유지하고 있습니다
- 일부 서버에서 성능 최적화가 필요합니다
- 실시간 모니터링을 통해 지속적으로 추적 중입니다

💡 **추가 도움이 필요하시면:**
- 구체적인 서버명이나 메트릭을 명시해주세요
- "서버 상태", "성능 분석", "에러 로그" 등의 키워드를 사용해보세요

🔍 더 자세한 분석이 필요하시면 언제든 말씀해주세요!`;
  };

  /**
   * 💬 메시지 전송 처리
   */
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // AI 응답 생성
    setTimeout(
      () => {
        const aiResponse = generateAIResponse(content);
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date(),
          isTyping: true,
        };

        setMessages(prev => [...prev, aiMessage]);
        setCurrentTypingId(aiMessage.id);
        setIsProcessing(false);
      },
      1000 + Math.random() * 2000
    );
  };

  /**
   * 🎯 타이핑 완료 처리
   */
  const handleTypingComplete = (messageId: string) => {
    setCurrentTypingId(null);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  /**
   * 📝 샘플 질문 클릭 처리
   */
  const handleSampleQuestion = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  /**
   * 🎨 목업 컴포넌트 렌더링
   */
  const renderMockupTab = (
    icon: React.ElementType,
    title: string,
    description: string
  ) => {
    const Icon = icon;
    return (
      <div className='h-full flex items-center justify-center p-8'>
        <div className='text-center'>
          <Icon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>{title}</h3>
          <p className='text-gray-500 mb-4'>{description}</p>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
            <p className='text-sm text-blue-700'>🚀 개발 중인 기능입니다</p>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex ${className}`}
    >
      {/* 사이드 탭 메뉴 */}
      <div className='w-16 bg-gradient-to-b from-purple-500 to-pink-500 flex flex-col items-center py-2 gap-0.5'>
        {FUNCTION_MENU.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative group p-1 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-lg transform scale-110'
                  : 'hover:bg-white/20 hover:scale-105'
              }`}
              title={item.label}
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? item.color : 'text-white'
                }`}
              />

              {/* 툴팁 */}
              <div className='absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10'>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* 메인 콘텐츠 */}
      <div className='flex-1 flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg'>
              <span className='text-white text-sm font-bold'>AI</span>
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                AI 어시스턴트
              </h2>
              <p className='text-sm text-gray-600'>
                {FUNCTION_MENU.find(item => item.id === activeTab)
                  ?.description || 'AI와 자연어로 시스템 질의'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100'
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title='사이드바 닫기'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* 탭별 콘텐츠 */}
        <div className='flex-1 overflow-hidden'>
          {activeTab === 'chat' && (
            <div className='h-full flex flex-col'>
              {/* 샘플 질문 */}
              {messages.length === 0 && (
                <div className='p-4 border-b border-gray-200'>
                  <h4 className='text-sm font-medium text-gray-700 mb-2'>
                    💡 샘플 질문
                  </h4>
                  <div className='grid grid-cols-1 gap-2'>
                    {SAMPLE_QUESTIONS.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSampleQuestion(question)}
                        disabled={isProcessing}
                        className='text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors disabled:opacity-50'
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 메시지 영역 */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.type === 'ai' && message.isTyping ? (
                        <SafeCSSTypingEffect
                          text={message.content}
                          speed={2}
                          showCursor={true}
                          onComplete={() => handleTypingComplete(message.id)}
                          className='text-sm whitespace-pre-wrap'
                        />
                      ) : (
                        <div className='text-sm whitespace-pre-wrap'>
                          {message.content}
                        </div>
                      )}
                      <div
                        className={`text-xs mt-1 ${
                          message.type === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className='flex justify-start'>
                    <div className='bg-gray-100 p-3 rounded-lg'>
                      <div className='flex items-center space-x-2'>
                        <div className='flex space-x-1'>
                          <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                          <div
                            className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                        <span className='text-sm text-gray-500'>
                          AI가 답변을 생성하고 있습니다...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 입력 영역 */}
              <div className='border-t border-gray-200 p-4'>
                <div className='flex space-x-2'>
                  <input
                    type='text'
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={e =>
                      e.key === 'Enter' && handleSendMessage(inputValue)
                    }
                    placeholder='AI에게 질문하세요...'
                    disabled={isProcessing}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm'
                  />
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={isProcessing || !inputValue.trim()}
                    className='px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    <Send className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incident-report' && <IncidentReportTab />}

          {activeTab === 'prediction' &&
            renderMockupTab(
              TrendingUp,
              'AI 예측 분석',
              '서버 성능 및 장애 예측 기능을 준비 중입니다.'
            )}
          {activeTab === 'search' &&
            renderMockupTab(
              Search,
              '통합 검색',
              '로그 및 메트릭 통합 검색 기능을 준비 중입니다.'
            )}
          {activeTab === 'database' &&
            renderMockupTab(
              Database,
              '데이터 분석',
              '실시간 데이터 분석 기능을 준비 중입니다.'
            )}
          {activeTab === 'brain' &&
            renderMockupTab(
              Brain,
              'AI 학습',
              'AI 모델 학습 및 개선 기능을 준비 중입니다.'
            )}
          {activeTab === 'settings' &&
            renderMockupTab(
              Settings,
              'AI 설정',
              'AI 시스템 설정 기능을 준비 중입니다.'
            )}
        </div>
      </div>
    </motion.div>
  );
};
