/**
 * 🤖 AI 강화 채팅 컴포넌트
 *
 * 기능:
 * - AI 엔진 선택
 * - 메시지 주고받기
 * - 생각 과정 시각화
 * - 자동 장애 보고서 연동
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  Sparkles,
  StopCircle,
} from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type FC, type FormEvent } from 'react';

// 타입 임포트
import type { AutoReportTrigger, ChatMessage } from '../types/ai-sidebar-types';

// 컴포넌트 임포트
import { AIEngineSelector } from './AIEngineSelector';
import { ChatMessageItem } from './ChatMessageItem';

interface AIEnhancedChatProps {
  selectedEngine: string;
  currentEngine?: string;
  onEngineChange: (engine: string) => void;
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  autoReportTrigger: AutoReportTrigger;
  onAutoReportGenerate: () => void;
  onAutoReportDismiss: () => void;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onRegenerateResponse: (messageId: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  showPresets: boolean;
  onTogglePresets: () => void;
  currentPresetIndex: number;
  onPresetQuestion: (question: string) => void;
  onPreviousPresets: () => void;
  onNextPresets: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  className?: string;
}

export const AIEnhancedChat: FC<AIEnhancedChatProps> = ({
  selectedEngine,
  currentEngine,
  onEngineChange,
  chatMessages,
  isGenerating,
  autoReportTrigger,
  onAutoReportGenerate,
  onAutoReportDismiss,
  onSendMessage,
  onStopGeneration,
  onRegenerateResponse,
  inputValue,
  onInputChange,
  showPresets,
  onTogglePresets,
  currentPresetIndex,
  onPresetQuestion,
  onPreviousPresets,
  onNextPresets,
  canGoPrevious,
  canGoNext,
  className = '',
}: AIEnhancedChatProps) => {
  // 스크롤 관리를 위한 ref와 상태
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 스크롤 위치 확인 함수
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px 여유값
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const atBottom = isAtBottom();
    setIsUserScrolled(!atBottom);
  };

  // 새 메시지나 생성 상태 변경 시 자동 스크롤
  useEffect(() => {
    if (!isUserScrolled) {
      scrollToBottom();
    }
  }, [chatMessages, isGenerating, isUserScrolled]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      // 메시지 전송 시 자동 스크롤 모드로 전환
      setIsUserScrolled(false);
      onSendMessage();
    }
  };

  return (
    <div
      className={`flex h-full flex-col bg-gray-50 ${className}`}
      data-testid="ai-enhanced-chat"
    >
      {/* 헤더 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                자연어 질의
              </h3>
              <p className="text-xs text-gray-600">
                AI와 대화하며 시스템을 관리하세요
              </p>
            </div>
          </div>

          {/* 엔진 선택 버튼 */}
          <AIEngineSelector
            selectedEngine={selectedEngine}
            currentEngine={currentEngine || selectedEngine}
            onEngineChange={onEngineChange}
          />
        </div>
      </div>

      {/* 자동 장애 보고서 트리거 */}
      <Fragment>
        {autoReportTrigger?.shouldGenerate && (
          <div
            className="flex-shrink-0 border-b border-amber-200 bg-amber-50 p-3 sm:p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-amber-800">
                  자동 장애 보고서 생성
                </h4>
                <p className="mt-1 text-xs text-amber-700">
                  {autoReportTrigger.severity} 수준의 이슈가 감지되었습니다.
                  {autoReportTrigger.lastQuery &&
                    ` (쿼리: ${autoReportTrigger.lastQuery})`}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={onAutoReportGenerate}
                    className="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-600"
                  >
                    자동 생성
                  </button>
                  <button
                    onClick={onAutoReportDismiss}
                    className="rounded bg-gray-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-600"
                  >
                    나중에
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Fragment>

      {/* 메시지 영역 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4"
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-sm text-gray-600">
                AI 어시스턴트와 대화를 시작하세요
              </p>
              <p className="text-xs text-gray-500">
                시스템 상태, 로그 분석, 최적화 제안 등을 문의할 수 있습니다
              </p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onRegenerateResponse={onRegenerateResponse}
              />
            ))}

            {/* 생성 중 표시 */}
            {isGenerating && (
              <div
                className="flex justify-start"
              >
                <div className="flex items-start space-x-2">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="_animate-bounce h-2 w-2 rounded-full bg-purple-500"></div>
                        <div
                          className="_animate-bounce h-2 w-2 rounded-full bg-purple-500"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="_animate-bounce h-2 w-2 rounded-full bg-purple-500"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        AI가 생각하고 있습니다...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 스크롤 타겟 - 항상 메시지 맨 아래에 위치 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 영역 */}
      {showPresets && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-800">
              💡 추천 질문
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={onPreviousPresets}
                disabled={!canGoPrevious}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="이전 프리셋 질문"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">
                {currentPresetIndex + 1}
              </span>
              <button
                onClick={onNextPresets}
                disabled={!canGoNext}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="다음 프리셋 질문"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="질문을 입력하세요... (Shift+Enter로 줄바꿈)"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isGenerating}
            />
          </div>

          <button
            type="button"
            onClick={onTogglePresets}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              showPresets
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💡
          </button>
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex items-center space-x-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-600"
            >
              <StopCircle className="h-3 w-3" />
              <span>중지</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="flex items-center space-x-1 rounded-lg bg-purple-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              <span>전송</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
