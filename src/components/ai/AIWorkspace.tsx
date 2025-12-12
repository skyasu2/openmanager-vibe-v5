'use client';

/**
 * 🤖 AI Workspace Controller (Unified Streaming Architecture)
 *
 * v3.0.0 - Unified Streaming Upgrade:
 * - Replaced legacy `AIChatInterface` with `EnhancedAIChat`.
 * - Integrated Vercel AI SDK (`useChat`) for streaming responses.
 * - Supports "Thinking Mode" and Tool Calling in Fullscreen.
 * - Logic mirrored from `AISidebarV4`.
 */

import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Activity,
  ArrowLeftFromLine,
  Bot,
  Layout,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Server,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useMemo, useRef, useState } from 'react';
import { AIFunctionPages } from '../../domains/ai-sidebar/components/AIFunctionPages';
import { EnhancedAIChat } from '../../domains/ai-sidebar/components/EnhancedAIChat';
import type { AIThinkingStep } from '../../domains/ai-sidebar/types/ai-sidebar-types';
import type { EnhancedChatMessage } from '../../stores/useAISidebarStore';
import { OpenManagerLogo } from '../shared/OpenManagerLogo';
import AIAssistantIconPanel, {
  type AIAssistantFunction,
} from './AIAssistantIconPanel';
import AIContentArea from './AIContentArea';
import ThinkingProcessVisualizer from './ThinkingProcessVisualizer';

// --- Shared Helpers (Mirrored from AISidebarV4) ---

function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return '';
  }
  return message.parts
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text'
    )
    .map((part) => part.text)
    .join('');
}

const MemoizedThinkingProcessVisualizer = memo(ThinkingProcessVisualizer);

const MessageComponent = memo<{
  message: EnhancedChatMessage;
  onRegenerateResponse?: (messageId: string) => void;
}>(({ message }) => {
  if (message.role === 'thinking' && message.thinkingSteps) {
    return (
      <div className="my-4">
        <MemoizedThinkingProcessVisualizer
          steps={message.thinkingSteps as AIThinkingStep[]}
          isActive={message.isStreaming || false}
          className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[90%] items-start space-x-2 sm:max-w-[85%] ${
          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs ${
            message.role === 'user'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          }`}
        >
          {message.role === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1">
          <div
            className={`rounded-2xl p-4 shadow-xs ${
              message.role === 'user'
                ? 'rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
            }`}
          >
            <div className="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed">
              {message.content}
            </div>
          </div>

          <div
            className={`mt-1 flex items-center justify-between ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <p className="text-xs text-gray-500">
              {typeof message.timestamp === 'string'
                ? new Date(message.timestamp).toLocaleTimeString()
                : message.timestamp.toLocaleTimeString()}
            </p>
            {message.role === 'assistant' &&
              message.metadata?.processingTime && (
                <p className="text-xs text-gray-400">
                  {message.metadata.processingTime}ms
                </p>
              )}
          </div>

          {message.role === 'assistant' &&
            message.thinkingSteps &&
            message.thinkingSteps.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <MemoizedThinkingProcessVisualizer
                  steps={message.thinkingSteps}
                  isActive={message.isStreaming || false}
                  className="rounded border border-gray-200 bg-gray-50"
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

interface AIWorkspaceProps {
  mode: 'sidebar' | 'fullscreen';
  onClose?: () => void;
}

export default function AIWorkspace({ mode, onClose }: AIWorkspaceProps) {
  const router = useRouter();
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // --- Vercel AI SDK Integration (Mirrored from AISidebarV4) ---
  const [input, setInput] = useState('');
  const [thinkingEnabled, setThinkingEnabled] = useState(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/unified-stream',
    }),
    onFinish: () => {
      setInput('');
    },
  });

  const regenerateLastResponse = () => {
    if (messages.length < 2) return;
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];
    if (!lastUserMessage) return;
    const textContent = extractTextFromMessage(lastUserMessage);
    if (textContent) {
      setMessages(messages.slice(0, actualIndex));
      void sendMessage({ text: textContent });
    }
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  const enhancedMessages = useMemo(() => {
    return messages
      .filter(
        (m) =>
          m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      )
      .map((m): EnhancedChatMessage => {
        const textContent = extractTextFromMessage(m);
        const toolParts =
          m.parts?.filter(
            (part): part is typeof part & { toolCallId: string } =>
              part.type.startsWith('tool-') && 'toolCallId' in part
          ) ?? [];

        const thinkingSteps = toolParts.map((toolPart) => {
          const toolName = toolPart.type.slice(5);
          const state = (toolPart as { state?: string }).state;
          const output = (toolPart as { output?: unknown }).output;
          const isCompleted =
            state === 'output-available' || output !== undefined;
          const hasError = state === 'output-error';

          return {
            id: toolPart.toolCallId,
            step: toolName,
            status: hasError
              ? ('failed' as const)
              : isCompleted
                ? ('completed' as const)
                : ('processing' as const),
            description: hasError
              ? `Error: ${(toolPart as { errorText?: string }).errorText || 'Unknown error'}`
              : isCompleted
                ? `Completed: ${JSON.stringify(output)}`
                : `Executing ${toolName}...`,
            timestamp: new Date(),
          };
        });

        return {
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system' | 'thinking',
          content: textContent,
          timestamp: new Date(),
          isStreaming: isLoading && m.id === messages[messages.length - 1]?.id,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
        };
      });
  }, [messages, isLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Render Logic ---

  // 📱 SIDEBAR LAYOUT (Mobile/Compact) - Only used if this component is used in sidebar mode (though AISidebarV4 is preferred)
  // 🎨 화이트 모드 전환 (2025-12 업데이트)
  if (mode === 'sidebar') {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">AI Assistant</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftFromLine className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedFunction === 'chat' ? (
            <EnhancedAIChat
              enableRealTimeThinking={true}
              thinkingEnabled={thinkingEnabled}
              onThinkingToggle={setThinkingEnabled}
              autoReportTrigger={{ shouldGenerate: false }}
              allMessages={enhancedMessages}
              limitedMessages={enhancedMessages}
              messagesEndRef={messagesEndRef}
              MessageComponent={MessageComponent}
              inputValue={input}
              setInputValue={setInput}
              handleSendInput={() => {
                if (input.trim()) {
                  void sendMessage({
                    text: input,
                    metadata: { thinking: thinkingEnabled },
                  });
                }
              }}
              isGenerating={isLoading}
              regenerateResponse={() => {
                regenerateLastResponse();
              }}
              currentEngine={
                thinkingEnabled ? 'Thinking Mode' : 'Vercel AI SDK'
              }
              routingReason={thinkingEnabled ? '심층 추론 활성화' : undefined}
            />
          ) : (
            <AIFunctionPages
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
            />
          )}
        </div>
        {selectedFunction === 'chat' && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-2">
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              isMobile
            />
          </div>
        )}
      </div>
    );
  }

  // 🖥️ FULLSCREEN LAYOUT (Unified)
  // 🎨 화이트 모드 전환 (2025-12 업데이트)
  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-gray-900">
      {/* LEFT SIDEBAR (Navigation) */}
      <div className="flex w-[260px] flex-col border-r border-gray-200 bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <OpenManagerLogo variant="light" showSubtitle={false} href="/" />
          <button
            onClick={() => router.back()}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            title="뒤로 가기"
          >
            <ArrowLeftFromLine className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={() => setMessages([])}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 px-2">
          <div className="mb-2 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Features
          </div>
          <div className="mt-2">
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              className="w-full !bg-transparent !border-none !p-0 items-start"
            />
          </div>
        </div>
      </div>

      {/* CENTER & RIGHT (Main Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* CENTER CONTENT */}
        <div className="flex flex-1 flex-col relative min-w-0">
          {/* Context Header */}
          <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span className="font-medium text-gray-900">
                OpenManager Vibe
              </span>
              <span>/</span>
              <span>AI Workspace</span>
              <span>/</span>
              <span className="text-blue-600 capitalize font-medium">
                {selectedFunction}
              </span>
            </div>
            {selectedFunction === 'chat' && (
              <button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Toggle Context Panel"
              >
                {isRightPanelOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {selectedFunction === 'chat' ? (
              <EnhancedAIChat
                enableRealTimeThinking={true}
                thinkingEnabled={thinkingEnabled}
                onThinkingToggle={setThinkingEnabled}
                autoReportTrigger={{ shouldGenerate: false }}
                allMessages={enhancedMessages}
                limitedMessages={enhancedMessages}
                messagesEndRef={messagesEndRef}
                MessageComponent={MessageComponent}
                inputValue={input}
                setInputValue={setInput}
                handleSendInput={() => {
                  if (input.trim()) {
                    void sendMessage({
                      text: input,
                      metadata: { thinking: thinkingEnabled },
                    });
                  }
                }}
                isGenerating={isLoading}
                regenerateResponse={() => {
                  regenerateLastResponse();
                }}
                currentEngine={
                  thinkingEnabled ? 'Thinking Mode' : 'Vercel AI SDK'
                }
                routingReason={thinkingEnabled ? '심층 추론 활성화' : undefined}
              />
            ) : (
              <div className="h-full p-0">
                <AIContentArea selectedFunction={selectedFunction} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (System Context) - Hardcoded for demo/MVP similar to legacy, but clean */}
        {/* 🎨 화이트 모드 전환 (2025-12 업데이트) */}
        {selectedFunction === 'chat' && isRightPanelOpen && (
          <div className="w-[320px] border-l border-gray-200 bg-gray-50 flex flex-col">
            <div className="flex h-14 items-center border-b border-gray-200 px-4">
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                System Context
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Live Status Summary
                </h4>
                <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-blue-500" />
                      Servers Online
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      12 / 12
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Layout className="h-3.5 w-3.5 text-purple-500" />
                      Environments
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      Production
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
