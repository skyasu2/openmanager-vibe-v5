'use client';

/**
 * 🤖 AI Chat Interface (Shared Component)
 *
 * Supports:
 * - Sidebar Mode (Fixed width, Overlay)
 * - Fullscreen Mode (Page content)
 * - Embedded Mode (Inside 3-pane layout)
 * - Uses Global State (Zustand) for persistence
 */

import {
  ArrowUp,
  Bot,
  ChevronUp,
  FileText,
  Maximize2,
  Minimize2,
  Plus,
  Square,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import ThinkingProcessVisualizer from '@/components/ai/ThinkingProcessVisualizer';
import { useServerDataStore } from '@/components/providers/StoreProvider';
import { type ChatMessage, useAIChatStore } from '@/stores/ai-chat-store';
import type { EnhancedServerMetrics } from '@/types/server';

function extractNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('usage' in obj && typeof obj.usage === 'number') return obj.usage;
    if ('used' in obj && typeof obj.used === 'number') return obj.used;
  }
  return 0;
}

interface AIChatInterfaceProps {
  mode: 'sidebar' | 'fullscreen';
  embedded?: boolean;
  onClose?: () => void;
}

export default function AIChatInterface({
  mode,
  embedded,
  onClose,
}: AIChatInterfaceProps) {
  const router = useRouter();
  const servers = useServerDataStore(
    (state: { servers: EnhancedServerMetrics[] }) => state.servers
  );

  // 🔄 Global State (Zustand)
  const {
    messages,
    inputValue,
    isLoading,
    isThinkingMode,
    attachments,
    setInputValue,
    setIsLoading,
    setIsThinkingMode,
    addMessage,
    addAttachment,
    removeAttachment,
    clearAttachments,
  } = useAIChatStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Textarea Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // File Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          const type = file.type.startsWith('image/') ? 'image' : 'file';
          addAttachment({
            type,
            url: event.target!.result as string,
            name: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send Message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if ((!content.trim() && attachments.length === 0) || isLoading) return;

      const currentAttachments = [...attachments];
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: content.trim(),
        role: 'user',
        timestamp: new Date(),
        attachments: currentAttachments.map((a) => a.url),
      };

      const images = currentAttachments
        .filter((a) => a.type === 'image')
        .map((a) => a.url);

      const documents = currentAttachments
        .filter((a) => a.type === 'file')
        .map((a) => ({
          name: a.name,
          content: a.url.split(',')[1],
        }));

      addMessage(userMessage);
      setInputValue('');
      clearAttachments();
      setIsLoading(true);

      abortControllerRef.current = new AbortController();

      try {
        const totalServers = servers.length;
        const warningServers = servers.filter(
          (s) => s.status === 'warning'
        ).length;
        const criticalServers = servers.filter(
          (s) => s.status === 'critical'
        ).length;
        const avgCpu = Math.round(
          servers.reduce((sum, s) => sum + extractNumericValue(s.cpu ?? 0), 0) /
            (servers.length || 1)
        );

        const response = await fetch('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: content,
            context: 'dashboard',
            thinking: isThinkingMode,
            includeThinking: true,
            images,
            documents,
            metadata: {
              totalServers,
              warningServers,
              criticalServers,
              avgCpu,
              timestamp: new Date().toISOString(),
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();

        addMessage({
          id: (Date.now() + 1).toString(),
          content: data.response || '응답 없음',
          role: 'assistant',
          timestamp: new Date(),
          thinkingSteps: data.thinkingSteps,
          engine: data.engine,
          responseTime: data.responseTime,
        });
      } catch (error: unknown) {
        const isAbortError =
          error instanceof Error && error.name === 'AbortError';
        if (!isAbortError) {
          console.error('AI Error:', error);
          addMessage({
            id: Date.now().toString(),
            content: '오류가 발생했습니다. 다시 시도해주세요.',
            role: 'assistant',
            error: true,
            timestamp: new Date(),
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      isLoading,
      servers,
      isThinkingMode,
      attachments,
      addMessage,
      setInputValue,
      clearAttachments,
      setIsLoading,
    ]
  );

  const handleStop = () => abortControllerRef.current?.abort();

  // Paste Handler
  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file) {
      e.preventDefault();
      processFile(file);
    }
  };

  // Drag & Drop Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        addAttachment({
          type,
          url: event.target!.result as string,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (mode === 'sidebar') {
      onClose?.(); // Close sidebar first
      router.push('/dashboard/ai-assistant');
    } else {
      router.back(); // Go back if in fullscreen
    }
  };

  const containerClasses = embedded
    ? 'flex flex-col h-full w-full bg-[#1e1e1e] text-gray-100'
    : mode === 'sidebar'
      ? 'fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col border-l border-gray-800 bg-[#1e1e1e] text-gray-100 shadow-2xl'
      : 'flex flex-col h-full w-full bg-[#1e1e1e] text-gray-100';

  return (
    <div className={containerClasses}>
      {/* 🔹 Header */}
      {!embedded && (
        <div className="flex items-center justify-between border-b border-gray-800 bg-[#252526] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-200">
                AI Assistant {mode === 'fullscreen' ? '(Full Page)' : ''}
              </h2>
              <p className="text-[10px] text-gray-400">
                {isThinkingMode ? 'Gemini 3 Pro (High)' : 'Gemini 2.5 (Auto)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Maximize/Minimize Button */}
            <button
              onClick={toggleFullscreen}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
              title={mode === 'sidebar' ? '전체 화면으로 전환' : '돌아가기'}
            >
              {mode === 'sidebar' ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-5 w-5" />
              )}
            </button>

            {/* Close Button (Sidebar Only) */}
            {mode === 'sidebar' && (
              <button
                onClick={onClose}
                className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Chat Area */}
      <div
        className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="region"
        aria-label="Chat area with drag and drop support"
      >
        <div
          className={`flex-1 space-y-6 overflow-y-auto p-4 custom-scrollbar ${mode === 'fullscreen' && !embedded ? 'max-w-4xl mx-auto w-full' : ''}`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 flex gap-2 overflow-x-auto">
                    {message.attachments.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={img}
                        alt="attached"
                        className="h-24 w-auto rounded-lg border border-gray-700 object-cover"
                      />
                    ))}
                  </div>
                )}

                {message.role === 'assistant' &&
                  message.thinkingSteps &&
                  message.thinkingSteps.length > 0 && (
                    <div className="mb-2 w-full">
                      <ThinkingProcessVisualizer
                        steps={message.thinkingSteps}
                        isActive={false}
                      />
                    </div>
                  )}

                <div
                  className={`rounded-lg p-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[#007fd4] text-white'
                      : message.error
                        ? 'bg-red-900/50 text-red-200 border border-red-800'
                        : 'bg-[#2d2d2d] text-gray-200 border border-gray-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>

                <span className="mt-1 text-[10px] text-gray-500">
                  {message.role === 'assistant' && message.engine && (
                    <>{message.engine} · </>
                  )}
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div
              className={`flex items-center gap-2 text-xs text-gray-500 animate-pulse ${mode === 'fullscreen' ? 'pl-2' : ''}`}
            >
              <Bot className="h-3 w-3" />
              <span>AI가 답변을 생성하고 있습니다...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 🔹 Input Area */}
      <div
        className={`border-t border-gray-800 bg-[#252526] p-4 ${mode === 'fullscreen' && !embedded ? 'pb-8' : ''}`}
      >
        <div
          className={
            mode === 'fullscreen' && !embedded ? 'max-w-4xl mx-auto w-full' : ''
          }
        >
          {attachments.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto">
              {attachments.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt="preview"
                      className="h-16 w-16 rounded-md object-cover border border-gray-600"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md border border-gray-600 bg-gray-800">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col rounded-xl border border-gray-700 bg-[#1e1e1e] transition-colors focus-within:border-gray-600">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage(inputValue);
                }
              }}
              onPaste={handlePaste}
              placeholder="무엇이든 물어보세요... (Shift+Enter 줄바꿈)"
              className="max-h-60 min-h-[50px] w-full resize-none bg-transparent p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-hidden"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between border-t border-gray-800/50 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.txt,.md"
                  multiple={false}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  title="파일/이미지 추가"
                >
                  <Plus className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setIsThinkingMode(!isThinkingMode)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isThinkingMode
                      ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <ChevronUp className="h-3 w-3" />
                  <span>{isThinkingMode ? 'Planning' : 'Auto'}</span>
                </button>

                <button className="hidden items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 sm:flex">
                  <ChevronUp className="h-3 w-3" />
                  <span>{isThinkingMode ? 'Gemini 3 Pro' : 'Gemini 2.5'}</span>
                </button>
              </div>

              <div>
                {isLoading ? (
                  <button
                    onClick={handleStop}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-red-600 transition-all"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => void handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() && attachments.length === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007fd4] text-white transition-all hover:bg-[#0060a0] disabled:bg-gray-800 disabled:text-gray-600"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] text-gray-600">
            Generative AI can make mistakes. Verify important info.
          </div>
        </div>
      </div>
    </div>
  );
}
