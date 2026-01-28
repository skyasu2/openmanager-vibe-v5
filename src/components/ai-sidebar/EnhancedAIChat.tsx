'use client';

import {
  AlertCircle,
  Bot,
  File,
  FileText,
  Image as ImageIcon,
  Paperclip,
  RefreshCw,
  Send,
  Square,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import React, {
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AgentHandoffBadge } from '@/components/ai/AgentHandoffBadge';
import { AgentStatusIndicator } from '@/components/ai/AgentStatusIndicator';
import { WelcomePromptCards } from '@/components/ai/WelcomePromptCards';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import type { AsyncQueryProgress } from '@/hooks/ai/useAsyncAIQuery';
import {
  type FileAttachment,
  formatFileSize,
  useFileAttachments,
} from '@/hooks/ai/useFileAttachments';
import type {
  AgentStatusEventData,
  ClarificationOption,
  ClarificationRequest,
  HandoffEventData,
} from '@/hooks/ai/useHybridAIQuery';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import type { SessionState } from '@/types/session';
import { ClarificationDialog } from './ClarificationDialog';
import { ColdStartErrorBanner } from './chat/ColdStartErrorBanner';
import { JobProgressIndicator } from './JobProgressIndicator';

/**
 * Enhanced AI Chat Props
 */
interface EnhancedAIChatProps {
  /** 자동 장애 보고서 트리거 상태 */
  autoReportTrigger: {
    shouldGenerate: boolean;
    lastQuery?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  /** 모든 메시지 배열 */
  allMessages: EnhancedChatMessage[];
  /** 제한된 메시지 배열 (최대 개수 적용) */
  limitedMessages: EnhancedChatMessage[];
  /** 메시지 끝 참조 (자동 스크롤용) */
  messagesEndRef: RefObject<HTMLDivElement | null>;
  /** 메시지 컴포넌트 */
  MessageComponent: React.ComponentType<{
    message: EnhancedChatMessage;
    onRegenerateResponse?: (messageId: string) => void;
    onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
    isLastMessage?: boolean;
  }>;
  /** 피드백 핸들러 */
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  /** 입력 값 */
  inputValue: string;
  /** 입력 값 변경 핸들러 */
  setInputValue: (value: string) => void;
  /** 메시지 전송 핸들러 (파일 첨부 지원) */
  handleSendInput: (attachments?: FileAttachment[]) => void;
  /** 생성 중 여부 */
  isGenerating: boolean;
  /** 응답 재생성 핸들러 */
  regenerateResponse: (messageId: string) => void;
  /** 현재 사용 중인 엔진 */
  currentEngine?: string;
  /** 라우팅 사유 */
  routingReason?: string;
  /** 🔒 세션 상태 (무료 티어 보호) */
  sessionState?: SessionState;
  /** 🔄 새 세션 시작 핸들러 */
  onNewSession?: () => void;
  /** ⏹️ 생성 중단 핸들러 */
  onStopGeneration?: () => void;
  /** 📊 Job Queue 진행 상태 */
  jobProgress?: AsyncQueryProgress | null;
  /** Job ID */
  jobId?: string | null;
  /** Job 취소 핸들러 */
  onCancelJob?: () => void;
  /** 현재 쿼리 모드 */
  queryMode?: 'streaming' | 'job-queue';
  /** 에러 메시지 */
  error?: string | null;
  /** 에러 초기화 핸들러 */
  onClearError?: () => void;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 명확화 요청 상태 */
  clarification?: ClarificationRequest | null;
  /** 명확화 옵션 선택 핸들러 */
  onSelectClarification?: (option: ClarificationOption) => void;
  /** 커스텀 명확화 입력 핸들러 */
  onSubmitCustomClarification?: (customInput: string) => void;
  /** 명확화 건너뛰기 핸들러 */
  onSkipClarification?: () => void;
  /** 명확화 취소 핸들러 (쿼리 미실행, 상태 정리만) */
  onDismissClarification?: () => void;
  /** 🎯 실시간 Agent 상태 (스트리밍 중 표시) */
  currentAgentStatus?: AgentStatusEventData | null;
  /** 🔄 현재 Handoff 정보 */
  currentHandoff?: HandoffEventData | null;
}

// ============================================================================
// Enhanced AI Chat 컴포넌트
// ============================================================================

/**
 * Enhanced AI Chat 컴포넌트
 *
 * @description
 * - AI 채팅 UI (헤더 + 메시지 영역 + 입력 영역)
 * - 자동 장애 보고서 알림 표시
 * - 메시지 렌더링 및 스크롤 관리
 * - 키보드 단축키 (Ctrl+Enter)
 * - AI 엔진 상태 표시 (AIEngineIndicator)
 */
export const EnhancedAIChat = memo(function EnhancedAIChat({
  autoReportTrigger,
  allMessages,
  limitedMessages,
  messagesEndRef,
  MessageComponent,
  inputValue,
  setInputValue,
  handleSendInput,
  isGenerating,
  regenerateResponse,
  currentEngine: _currentEngine,
  routingReason: _routingReason,
  sessionState,
  onNewSession,
  onStopGeneration,
  onFeedback,
  jobProgress,
  jobId,
  onCancelJob,
  queryMode,
  error,
  onClearError,
  onRetry,
  clarification,
  onSelectClarification,
  onSubmitCustomClarification,
  onSkipClarification,
  onDismissClarification,
  currentAgentStatus,
  currentHandoff,
}: EnhancedAIChatProps) {
  // 🎯 스크롤 컨테이너 ref (사용자 스크롤 위치 확인용)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 🎯 입력창 ref (자동 포커스용)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 🎯 파일 입력 ref (숨겨진 input)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🎯 파일 첨부 훅 (드래그앤드롭, 이미지/PDF/MD 지원)
  const {
    attachments,
    isDragging,
    errors: fileErrors,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors: clearFileErrors,
    dragHandlers,
    canAddMore,
  } = useFileAttachments({ maxFiles: 3 });

  // 🎯 이미지 미리보기 모달 상태
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // 🎯 전송 시 파일 첨부 포함
  const handleSendWithAttachments = useCallback(() => {
    handleSendInput(attachments.length > 0 ? attachments : undefined);
    clearFiles(); // 전송 후 첨부 파일 초기화
  }, [handleSendInput, attachments, clearFiles]);

  // 🎯 파일 선택 다이얼로그 열기
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 🎯 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        addFiles(files);
      }
      // input 초기화 (같은 파일 재선택 가능)
      e.target.value = '';
    },
    [addFiles]
  );

  // 🎯 이미지 썸네일 클릭 핸들러 (확대 미리보기)
  const handleImageClick = useCallback((file: FileAttachment) => {
    if (file.type === 'image' && file.previewUrl) {
      setPreviewImage({ url: file.previewUrl, name: file.name });
    }
  }, []);

  // 🎯 이미지 미리보기 모달 닫기
  const closePreviewModal = useCallback(() => {
    setPreviewImage(null);
  }, []);

  // 🎯 클립보드 붙여넣기 핸들러 (Ctrl+V로 이미지+텍스트 혼합 지원)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      // 현재 입력값 캡처 (클로저에서 사용)
      const currentInput = inputValue;

      // 1. 클립보드 아이템 분류
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // 클립보드 이미지는 이름이 없으므로 기본 이름 생성
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = item.type.split('/')[1] || 'png';
            // 이름이 없는 클립보드 이미지에 이름 부여
            Object.defineProperty(file, 'name', {
              writable: true,
              value: `clipboard-${timestamp}.${extension}`,
            });
            imageFiles.push(file);
          }
        } else if (item.type === 'text/plain') {
          // 이미지와 함께 붙여넣기된 텍스트 처리 (비동기)
          item.getAsString((text) => {
            if (text?.trim() && imageFiles.length > 0) {
              // 이미지+텍스트 혼합: 텍스트도 입력창에 추가
              const newValue = currentInput ? `${currentInput}\n${text}` : text;
              setInputValue(newValue);
            }
          });
        }
      }

      // 2. 이미지가 있으면 파일 첨부 (텍스트는 위에서 비동기로 처리됨)
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
      // 이미지 없으면 기본 동작 (텍스트만 붙여넣기)
    },
    [addFiles, setInputValue, inputValue]
  );

  // 🎯 Best Practice: 메시지 추가 시 자동 스크롤
  // - 사용자가 하단 근처에 있을 때만 스크롤 (읽는 중 방해 방지)
  // - 새 메시지 또는 스트리밍 중일 때 스크롤
  // biome-ignore lint/correctness/useExhaustiveDependencies: limitedMessages.length is intentional trigger
  useEffect(() => {
    const container = scrollContainerRef.current;
    const endElement = messagesEndRef?.current;

    if (!container || !endElement) return;

    // 사용자가 하단에서 100px 이내에 있는지 확인
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    // 조건: 새 메시지가 있거나 스트리밍 중이고 하단 근처에 있을 때
    if (isNearBottom || isGenerating) {
      // requestAnimationFrame으로 DOM 업데이트 후 스크롤
      requestAnimationFrame(() => {
        endElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [limitedMessages.length, isGenerating, messagesEndRef]);

  // 🎯 생성 완료 시 입력창으로 포커스 복귀
  useEffect(() => {
    if (!isGenerating && !sessionState?.isLimitReached) {
      // 약간의 지연을 두어 렌더링 완료 후 포커스 (Mobile Safari 등 호환성)
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined; // TypeScript: 모든 코드 경로에서 반환값 명시
  }, [isGenerating, sessionState?.isLimitReached]);

  return (
    <div className="flex h-full flex-col bg-linear-to-br from-slate-50 to-blue-50">
      {/* 헤더 - 모델 선택 */}
      <div className="border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">자연어 질의</h3>
              <p className="text-xs text-gray-600">AI 기반 대화형 인터페이스</p>
            </div>
          </div>

          {/* AI 엔진 표시기 */}
          {/* AI 엔진 표시기 (Removed) */}
        </div>
      </div>

      {/* 메시지 영역 (중앙 정렬) - ARIA Live Region
          🔧 스트리밍 접근성 최적화 (2026-01-17):
          - aria-busy: 생성 중일 때 스크린 리더에 알림 → 완료까지 대기
          - aria-atomic="false": 전체 재읽기 방지, 변경분만 읽음
          - aria-relevant="additions text": 새 콘텐츠 및 텍스트 변경만 알림 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth will-change-scroll"
        role="log"
        aria-live="polite"
        aria-label="AI 대화 메시지"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-busy={isGenerating}
      >
        <div className="mx-auto max-w-3xl space-y-3 p-3 sm:space-y-4 sm:p-4">
          {/* 자동장애보고서 알림 */}
          {autoReportTrigger.shouldGenerate && (
            <div className="rounded-lg border border-red-200 bg-linear-to-r from-red-50 to-orange-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      자동장애보고서 생성 준비
                    </h4>
                    <p className="text-xs text-red-600">
                      &quot;{autoReportTrigger.lastQuery}&quot;에서{' '}
                      {autoReportTrigger.severity} 수준의 이슈가 감지되었습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 웰컴 화면 (ChatGPT 스타일) - WelcomePromptCards 컴포넌트 사용 */}
          {allMessages.length === 0 && (
            <WelcomePromptCards onPromptClick={setInputValue} />
          )}

          {/* 채팅 메시지들 렌더링 (메모리 효율성 최적화) */}
          {limitedMessages.map((message, index) => {
            const isLastMessage = index === limitedMessages.length - 1;

            return (
              <MessageComponent
                key={message.id}
                message={message}
                onRegenerateResponse={regenerateResponse}
                onFeedback={onFeedback}
                isLastMessage={isLastMessage}
              />
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 💡 명확화 다이얼로그 (모호한 쿼리 시 표시) */}
      {clarification &&
        onSelectClarification &&
        onSubmitCustomClarification &&
        onSkipClarification && (
          <ClarificationDialog
            clarification={clarification}
            onSelectOption={onSelectClarification}
            onSubmitCustom={onSubmitCustomClarification}
            onSkip={onSkipClarification}
            onDismiss={onDismissClarification}
          />
        )}

      {/* 📊 Job Queue 진행률 표시 */}
      {queryMode === 'job-queue' && isGenerating && (
        <JobProgressIndicator
          progress={jobProgress ?? null}
          isLoading={isGenerating}
          jobId={jobId}
          onCancel={onCancelJob}
        />
      )}

      {/* 🎯 실시간 Agent 상태 표시 (스트리밍 모드) */}
      {queryMode === 'streaming' && isGenerating && (
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-2">
          <div className="mx-auto max-w-3xl">
            {/* Agent Status */}
            {currentAgentStatus && (
              <AgentStatusIndicator
                agent={currentAgentStatus.agent}
                status={currentAgentStatus.status}
                compact
              />
            )}
            {/* Handoff Badge */}
            {currentHandoff && (
              <AgentHandoffBadge
                from={currentHandoff.from}
                to={currentHandoff.to}
                reason={currentHandoff.reason}
                compact
              />
            )}
          </div>
        </div>
      )}

      {/* ⚠️ 인라인 에러 표시 */}
      {error && !isGenerating && (
        <ColdStartErrorBanner
          error={error}
          onRetry={onRetry}
          onClearError={onClearError}
        />
      )}

      {/* 🔒 세션 제한 안내 */}
      {sessionState?.isLimitReached && (
        <div className="border-t border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  대화가 길어졌습니다
                </p>
                <p className="text-xs text-blue-600">
                  더 정확한 AI 응답을 위해 새 대화를 시작해주세요
                </p>
              </div>
            </div>
            {onNewSession && (
              <button
                type="button"
                onClick={onNewSession}
                className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>새 대화</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔔 세션 경고 (곧 새 대화 권장) */}
      {sessionState?.isWarning && !sessionState.isLimitReached && (
        <div className="border-t border-slate-200 bg-linear-to-r from-slate-50 to-gray-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">
                💬 대화 {sessionState.count}/20
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                새 주제는 새 대화에서 더 정확해요
              </span>
            </div>
            {onNewSession && (
              <button
                type="button"
                onClick={onNewSession}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                새 대화
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🎯 입력 영역 (ChatGPT 스타일 - 중앙 정렬 + 드래그앤드롭) */}
      <div
        className="relative shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm"
        {...dragHandlers}
      >
        {/* 🎯 드래그앤드롭 오버레이 */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/90">
            <div className="flex flex-col items-center gap-2 text-blue-600">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
              <p className="text-xs text-blue-500">
                이미지, PDF, MD (최대 3개)
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl px-4 py-4">
          {/* 🎯 파일 에러 토스트 */}
          {fileErrors.length > 0 && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div className="space-y-1">
                    {fileErrors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-600">
                        {err.message}
                      </p>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFileErrors}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* 🎯 파일 미리보기 칩 */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  {/* 아이콘 (이미지는 클릭하여 확대) */}
                  {file.type === 'image' ? (
                    file.previewUrl ? (
                      <button
                        type="button"
                        onClick={() => handleImageClick(file)}
                        className="shrink-0 cursor-pointer overflow-hidden rounded transition-opacity hover:opacity-80"
                        title="클릭하여 확대"
                        aria-label={`이미지 확대: ${file.name}`}
                      >
                        <Image
                          src={file.previewUrl}
                          alt={file.name}
                          width={32}
                          height={32}
                          className="rounded object-cover"
                          unoptimized // Base64 data URLs don't need optimization
                        />
                      </button>
                    ) : (
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                    )
                  ) : file.type === 'pdf' ? (
                    <FileText className="h-5 w-5 text-red-500" />
                  ) : (
                    <File className="h-5 w-5 text-gray-500" />
                  )}
                  {/* 파일 정보 */}
                  <div className="max-w-[120px]">
                    <p className="truncate text-xs font-medium text-gray-700">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 메인 입력 컨테이너 (onPaste로 클립보드 이미지 지원) */}
          <div
            className="relative flex items-end rounded-2xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            onPaste={handlePaste}
          >
            {/* 🎯 파일 첨부 버튼 (좌측) */}
            <div className="flex items-center pl-2">
              <button
                type="button"
                onClick={openFileDialog}
                disabled={
                  !canAddMore || isGenerating || sessionState?.isLimitReached
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                title={
                  canAddMore ? '파일 첨부 (이미지, PDF, MD)' : '최대 3개 파일'
                }
                aria-label="파일 첨부"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>

            <AutoResizeTextarea
              ref={textareaRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyboardShortcut={handleSendWithAttachments}
              placeholder={
                sessionState?.isLimitReached
                  ? '새 대화를 시작해주세요'
                  : attachments.length > 0
                    ? '이미지/파일과 함께 질문하세요...'
                    : '메시지를 입력하세요...'
              }
              className="flex-1 resize-none border-none bg-transparent px-2 py-3 pr-14 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-0"
              minHeight={48}
              maxHeight={200}
              maxHeightVh={30}
              aria-label="AI 질문 입력"
              disabled={isGenerating || sessionState?.isLimitReached}
            />

            {/* 전송/중단 버튼 (우하단 내장) */}
            <div className="absolute bottom-2 right-2">
              {isGenerating && onStopGeneration ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm transition-all hover:bg-red-600"
                  title="생성 중단"
                  aria-label="생성 중단"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendWithAttachments}
                  disabled={
                    (!inputValue.trim() && attachments.length === 0) ||
                    isGenerating ||
                    sessionState?.isLimitReached
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="메시지 전송"
                  aria-label="메시지 전송"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 🎯 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.md,text/markdown,text/plain"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            tabIndex={-1}
          />

          {/* 하단 힌트 */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              {sessionState && !sessionState.isWarning && (
                <span>대화 {sessionState.count}/20</span>
              )}
              {attachments.length > 0 && (
                <span className="text-blue-500">
                  📎 {attachments.length}/3 파일
                </span>
              )}
            </div>
            <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
          </div>
        </div>
      </div>

      {/* 🖼️ 이미지 확대 미리보기 모달 */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          onClose={closePreviewModal}
          imageUrl={previewImage.url}
          imageName={previewImage.name}
        />
      )}
    </div>
  );
});

EnhancedAIChat.displayName = 'EnhancedAIChat';
