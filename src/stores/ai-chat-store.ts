/**
 * 🧠 AI Chat Store
 *
 * Manages the global state for the AI Assistant chat interface.
 * Handles messages, thinking process modes, and multi-modal attachments.
 *
 * @created 2025-11-29
 * @author AI Assistant
 * @version 1.2.0 (Models & Thinking Mode Integrated)
 */

import { create } from 'zustand';
import type { ThinkingStep } from '@/domains/ai-sidebar/types/ai-sidebar-types';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type?: 'text' | 'report' | 'analysis';
  error?: boolean;
  thinkingSteps?: ThinkingStep[];
  engine?: string;
  responseTime?: number;
  attachments?: string[];
}

interface Attachment {
  type: 'image' | 'file';
  url: string; // Base64 or URL
  name: string;
}

interface AIChatState {
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  isThinkingMode: boolean;
  attachments: Attachment[];

  // Actions
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => void;
  addMessage: (message: ChatMessage) => void;
  setInputValue: (value: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsThinkingMode: (enabled: boolean) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
  resetChat: () => void;
}

export const useAIChatStore = create<AIChatState>((set) => ({
  messages: [
    {
      id: '1',
      content: '안녕하세요! 실시간 서버 데이터 및 멀티모달 분석을 지원합니다.',
      role: 'assistant',
      timestamp: new Date(),
    },
  ],
  inputValue: '',
  isLoading: false,
  isThinkingMode: false,
  attachments: [],

  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === 'function' ? messages(state.messages) : messages,
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setInputValue: (value) => set({ inputValue: value }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setIsThinkingMode: (enabled) => set({ isThinkingMode: enabled }),

  addAttachment: (attachment) =>
    set((state) => ({
      attachments: [...state.attachments, attachment],
    })),

  removeAttachment: (index) =>
    set((state) => ({
      attachments: state.attachments.filter((_, i) => i !== index),
    })),

  clearAttachments: () => set({ attachments: [] }),

  resetChat: () =>
    set({
      messages: [
        {
          id: Date.now().toString(),
          content:
            '안녕하세요! 실시간 서버 데이터 및 멀티모달 분석을 지원합니다.',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      inputValue: '',
      isLoading: false,
      attachments: [],
    }),
}));
