/**
 * 🧪 AISidebarV2 컴포넌트 단위 테스트
 *
 * 테스트 범위:
 * - 사이드바 열기/닫기 동작
 * - AI 채팅 기능
 * - 사전 정의된 질문 표시
 * - 실시간 로그 표시
 * - 접근성 기능
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AISidebarV2 from '@/domains/ai-sidebar/components/AISidebarV2';
import type { AIMessage } from '@/types/ai-types';

// Mock DOM methods
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock stores
const mockSetOpen = vi.fn();
const mockSendMessage = vi.fn();
const mockClearMessages = vi.fn();
const mockSetThinking = vi.fn();
const mockAddLog = vi.fn();

vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: () => ({
    setOpen: mockSetOpen,
  }),
  useAIChat: () => ({
    messages: [] as AIMessage[],
    sendMessage: mockSendMessage,
    clearMessages: mockClearMessages,
    isLoading: false,
    error: null,
    sessionId: 'test-session',
  }),
  useAIThinking: () => ({
    isThinking: false,
    currentQuestion: '',
    logs: [],
    setThinking: mockSetThinking,
    setCurrentQuestion: vi.fn(),
    addLog: mockAddLog,
    clearLogs: vi.fn(),
  }),
}));

vi.mock('@/hooks/useRealTimeAILogs', () => ({
  useRealTimeAILogs: () => ({
    logs: [],
    isConnected: false,
    isProcessing: false,
    currentEngine: 'LOCAL',
    techStack: '',
    connectionStatus: 'disconnected',
  }),
}));

describe('AISidebarV2 Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링 및 상호작용', () => {
    it('should render when open', () => {
      render(<AISidebarV2 {...defaultProps} />);
      
      const sidebar = screen.getByRole('dialog');
      expect(sidebar).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<AISidebarV2 {...defaultProps} isOpen={false} />);
      
      const sidebar = screen.queryByRole('dialog');
      expect(sidebar).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /닫기|close/i });
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      const overlay = screen.getByTestId('sidebar-overlay');
      await user.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('AI 채팅 기능', () => {
    it('should display chat input', () => {
      render(<AISidebarV2 {...defaultProps} />);
      
      const chatInput = screen.getByPlaceholderText(/질문|메시지|ask/i);
      expect(chatInput).toBeInTheDocument();
    });

    it('should send message when submit button is clicked', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      const chatInput = screen.getByPlaceholderText(/질문|메시지|ask/i);
      await user.type(chatInput, 'Test message');
      
      const submitButton = screen.getByRole('button', { name: /전송|send/i });
      await user.click(submitButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should send message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      const chatInput = screen.getByPlaceholderText(/질문|메시지|ask/i);
      await user.type(chatInput, 'Test message{Enter}');
      
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should display loading state', () => {
      vi.mocked(useAIChat).mockReturnValueOnce({
        messages: [],
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        isLoading: true,
        error: null,
        sessionId: 'test-session',
      });
      
      render(<AISidebarV2 {...defaultProps} />);
      
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('메시지 표시', () => {
    it('should display messages', () => {
      const testMessages: AIMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello AI',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hello! How can I help you?',
          timestamp: new Date().toISOString(),
        },
      ];
      
      vi.mocked(useAIChat).mockReturnValueOnce({
        messages: testMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        isLoading: false,
        error: null,
        sessionId: 'test-session',
      });
      
      render(<AISidebarV2 {...defaultProps} />);
      
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
    });

    it('should display error message', () => {
      vi.mocked(useAIChat).mockReturnValueOnce({
        messages: [],
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
        isLoading: false,
        error: { message: 'Connection failed' },
        sessionId: 'test-session',
      });
      
      render(<AISidebarV2 {...defaultProps} />);
      
      expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
    });
  });

  describe('사전 정의된 질문', () => {
    it('should display preset questions', () => {
      render(<AISidebarV2 {...defaultProps} />);
      
      const presetQuestions = screen.getAllByTestId(/preset-question/i);
      expect(presetQuestions.length).toBeGreaterThan(0);
    });

    it('should send preset question when clicked', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      const presetQuestion = screen.getAllByTestId(/preset-question/i)[0];
      await user.click(presetQuestion);
      
      expect(mockSendMessage).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('should have proper ARIA labels', () => {
      render(<AISidebarV2 {...defaultProps} />);
      
      const sidebar = screen.getByRole('dialog');
      expect(sidebar).toHaveAttribute('aria-label');
      
      const closeButton = screen.getByRole('button', { name: /닫기|close/i });
      expect(closeButton).toHaveAttribute('aria-label');
    });

    it('should trap focus within sidebar', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      const firstFocusable = screen.getByRole('button', { name: /닫기|close/i });
      const lastFocusable = screen.getByRole('button', { name: /전송|send/i });
      
      firstFocusable.focus();
      await user.tab();
      
      // Focus should move to next focusable element
      expect(document.activeElement).not.toBe(firstFocusable);
      
      // Tab through all elements and verify focus returns to first
      for (let i = 0; i < 10; i++) {
        await user.tab();
      }
      
      // Focus should eventually return to first element
      expect(document.activeElement).toBe(firstFocusable);
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      render(<AISidebarV2 {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('반응형 디자인', () => {
    it('should have mobile-friendly styles', () => {
      render(<AISidebarV2 {...defaultProps} />);
      
      const sidebar = screen.getByRole('dialog');
      const styles = window.getComputedStyle(sidebar);
      
      // 모바일에서 전체 너비
      expect(styles.width).toBe('100%');
    });
  });
});