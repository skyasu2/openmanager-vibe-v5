'use client';

/**
 * 🤖 AI 사이드바 전체 기능 통합 컴포넌트
 *
 * - 자연어 질의 입력
 * - 프리셋 질문 버튼들
 * - 채팅 인터페이스
 * - 자동 장애 보고서 생성
 * - AI 인사이트 표시
 */

import { useState, useRef, useEffect } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  Brain,
  FileText,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Search,
  Lightbulb,
} from 'lucide-react';
import { PRESET_QUESTIONS } from '@/stores/useAISidebarStore';
import AIInsightsCard from './AIInsightsCard';

interface AISidebarContentProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type?: 'text' | 'report' | 'analysis';
}

export default function AISidebarContent({ onClose }: AISidebarContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content:
        '안녕하세요! 시스템 모니터링과 관련된 질문을 해주세요. 아래 프리셋 질문을 클릭하거나 직접 입력하실 수 있습니다.',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'reports' | 'insights'>(
    'chat'
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // AI 응답 시뮬레이션 (실제로는 API 호출)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(content),
        role: 'assistant',
        timestamp: new Date(),
        type: content.includes('보고서') ? 'report' : 'text',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // AI 응답 생성 (실제로는 API 연동)
  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (
      lowerInput.includes('성능') ||
      lowerInput.includes('cpu') ||
      lowerInput.includes('메모리')
    ) {
      return `현재 시스템 성능 분석 결과:

📊 **전체 현황**
- 온라인 서버: 8대 (정상)
- 평균 CPU 사용률: 65%
- 평균 메모리 사용률: 72%

⚠️ **주의사항**
- 서버 #3: CPU 사용률 85% (모니터링 필요)
- 서버 #7: 메모리 사용률 88% (최적화 권장)

💡 **권장사항**
1. 고사용률 서버들의 프로세스 최적화
2. 부하 분산 설정 검토
3. 자동 스케일링 고려`;
    }

    if (
      lowerInput.includes('보안') ||
      lowerInput.includes('위험') ||
      lowerInput.includes('취약점')
    ) {
      return `🔒 **보안 상태 분석**

✅ **정상 항목**
- 모든 서버 방화벽 활성화
- 최신 보안 패치 적용됨
- SSL 인증서 유효

⚠️ **주의 항목**
- 서버 #2: 비정상적 네트워크 활동 감지
- 로그인 시도 횟수 증가 (지난 1시간)

🛡️ **권장 조치**
1. 네트워크 트래픽 상세 분석
2. 접근 로그 검토
3. 비밀번호 정책 강화 검토`;
    }

    if (
      lowerInput.includes('장애') ||
      lowerInput.includes('보고서') ||
      lowerInput.includes('리포트')
    ) {
      return `📋 **자동 장애 보고서 생성**

🕐 **분석 기간**: ${new Date().toLocaleDateString('ko-KR')} 00:00 ~ 현재

🎯 **주요 지표**
- 전체 가동률: 99.2%
- 평균 응답시간: 120ms
- 에러율: 0.08%

❌ **발생한 문제들**
1. 서버 #5 일시적 응답 지연 (13:24-13:27)
2. 네트워크 순간 끊김 (15:41, 3초)

✅ **해결된 문제들**
- 데이터베이스 연결 풀 최적화 완료
- 메모리 누수 패치 적용

🔍 **향후 모니터링 포인트**
- 서버 #3, #7 리소스 사용량 추이
- 네트워크 안정성 지속 관찰`;
    }

    if (
      lowerInput.includes('예측') ||
      lowerInput.includes('미래') ||
      lowerInput.includes('전망')
    ) {
      return `🔮 **AI 예측 분석**

📈 **다음 24시간 예측**
- 트래픽 증가 예상: 오후 2-4시 (+30%)
- 리소스 사용률 피크: 오후 3시경
- 장애 가능성: 매우 낮음 (5%)

⚡ **예방 조치 제안**
1. 서버 #3 프로세스 최적화 (우선순위: 높음)
2. 로드밸런서 설정 검토 (우선순위: 중간)
3. 백업 시스템 상태 확인 (우선순위: 낮음)

🎯 **최적화 기회**
- 비사용 서비스 정리로 메모리 10% 절약 가능
- 캐시 전략 개선으로 응답속도 20% 향상 가능`;
    }

    // 기본 응답
    return `이해했습니다. "${userInput}"에 대해 분석하고 있습니다.

현재 시스템 상태를 종합적으로 검토하여 관련 정보를 제공드리겠습니다. 더 구체적인 정보가 필요하시면 아래와 같이 질문해 주세요:

• "현재 성능 상태는?" - 실시간 성능 지표
• "보안 위험 요소는?" - 보안 상태 점검  
• "장애 보고서 생성" - 자동 리포트 작성
• "향후 예측 분석" - AI 기반 예측 정보

어떤 부분을 더 자세히 알아보시겠습니까?`;
  };

  // 프리셋 질문 클릭 처리
  const handlePresetClick = (question: string) => {
    handleSendMessage(question);
  };

  // 자동 장애 보고서 생성
  const generateAutoReport = () => {
    handleSendMessage('시스템 전체 장애 보고서를 생성해주세요');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col bg-white shadow-lg">
      {/* 헤더 */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                AI 어시스턴트
              </h2>
              <p className="text-xs text-gray-500">실시간 모니터링 분석</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="mt-4 flex gap-1">
          {[
            { id: 'chat', label: '채팅', icon: Bot },
            { id: 'reports', label: '보고서', icon: FileText },
            { id: 'insights', label: '인사이트', icon: Brain },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'chat' | 'reports' | 'insights')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <>
            {/* 프리셋 질문 */}
            <div className="border-b border-gray-100 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                빠른 질문
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_QUESTIONS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.question)}
                    className="rounded-lg bg-gray-50 p-2 text-left text-xs transition-colors hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    <div className="mb-1 flex items-center gap-1">
                      {preset.category === 'performance' && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                      {preset.category === 'security' && (
                        <Shield className="h-3 w-3 text-red-500" />
                      )}
                      {preset.category === 'prediction' && (
                        <Brain className="h-3 w-3 text-purple-500" />
                      )}
                      {preset.category === 'analysis' && (
                        <Search className="h-3 w-3 text-blue-500" />
                      )}
                      <span className="font-medium capitalize">
                        {preset.category}
                      </span>
                    </div>
                    <div className="text-gray-600">{preset.question}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={generateAutoReport}
                disabled={isLoading}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 p-3 font-medium text-white transition-all hover:from-purple-600 hover:to-blue-700 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" />
                  자동 장애 보고서 생성
                </div>
              </button>
            </div>

            {/* 채팅 메시지 */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.type === 'report'
                            ? 'border border-purple-200 bg-purple-50'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <div
                        className={`mt-1 text-xs opacity-70 ${
                          message.role === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'order-1 mr-2 bg-blue-500'
                        : 'order-2 ml-2 bg-gray-300'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div
                  className="flex justify-start"
                >
                  <div className="rounded-lg bg-gray-100 p-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="_animate-bounce h-2 w-2 rounded-full bg-gray-400"></div>
                      <div
                        className="_animate-bounce h-2 w-2 rounded-full bg-gray-400"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="_animate-bounce h-2 w-2 rounded-full bg-gray-400"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <span className="text-sm">분석 중...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && handleSendMessage(inputValue)
                  }
                  placeholder="자연어로 질문하세요..."
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <div className="overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium text-gray-800">
                    실시간 시스템 리포트
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• 전체 서버 상태: 정상</div>
                  <div>• 평균 응답시간: 120ms</div>
                  <div>• 에러율: 0.08%</div>
                  <div>
                    • 마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              </div>

              <button
                onClick={generateAutoReport}
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-3 font-medium text-white transition-all hover:from-green-600 hover:to-emerald-700"
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  상세 보고서 생성
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendMessage('성능 분석 보고서')}
                  className="rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  성능 분석
                </button>
                <button
                  onClick={() => handleSendMessage('보안 상태 보고서')}
                  className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  보안 점검
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="overflow-y-auto p-4">
            <AIInsightsCard className="mb-4" />

            <div className="space-y-3">
              <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-purple-800">AI 추천</h3>
                </div>
                <p className="text-sm text-purple-700">
                  서버 #3의 CPU 사용률이 85%에 도달했습니다. 프로세스 최적화를
                  권장합니다.
                </p>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">주의 사항</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  네트워크 트래픽이 평소보다 20% 증가했습니다. 모니터링을
                  강화하세요.
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-green-800">성능 향상</h3>
                </div>
                <p className="text-sm text-green-700">
                  최근 최적화로 전체 응답시간이 15% 개선되었습니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
