import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AISidebarV3 from '@/domains/ai-sidebar/components/AISidebarV3';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import { RealAISidebarService } from '@/domains/ai-sidebar/services/RealAISidebarService';

// Mock Next.js App Router hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock modules
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn(),
  useAIThinking: () => ({
    steps: [],
    isThinking: false,
    startThinking: vi.fn(),
    simulateThinkingSteps: vi.fn(),
    clearSteps: vi.fn(),
  }),
  EnhancedChatMessage: vi.fn(),
}));

vi.mock('@/hooks/useRealTimeAILogs', () => ({
  useRealTimeAILogs: () => ({ logs: [], isConnected: true }),
}));

vi.mock('@/components/ai/ThinkingProcessVisualizer', () => ({
  default: ({ steps, isActive }: any) => (
    <div data-testid="thinking-visualizer">
      <span>🤖 AI 처리 과정</span>
      <span>분석 중...</span>
      <div data-testid="thinking-active">{isActive?.toString() || 'false'}</div>
      <div data-testid="thinking-steps-count">{steps?.length || 0}</div>
    </div>
  ),
}));

// Mock RealAISidebarService
vi.mock('@/domains/ai-sidebar/services/RealAISidebarService', () => {
  return {
    RealAISidebarService: vi.fn().mockImplementation(() => ({
      processV3Query: vi.fn().mockResolvedValue({
        success: true,
        response: 'AI response',
        confidence: 0.9,
      }),
    })),
  };
});

// Mock user permissions
vi.mock('@/hooks/useUserPermissions', () => ({
  useUserPermissions: () => ({
    canToggleAI: true,
  }),
}));

describe('AISidebarV3', () => {
  const mockStore = {
    messages: [],
    isOpen: true,
    sessionId: 'test-session',
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    clearMessages: vi.fn(),
    toggleSidebar: vi.fn(),
  };

  const mockProcessV3Query = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAISidebarStore as any).mockReturnValue(mockStore);
    
    // Setup RealAISidebarService mock
    (RealAISidebarService as any).mockImplementation(() => ({
      processV3Query: mockProcessV3Query,
    }));
    
    // Default successful response
    mockProcessV3Query.mockResolvedValue({
      success: true,
      response: 'AI response',
      confidence: 0.9,
    });
  });

  it('renders V3 with new features enabled', () => {
    render(<AISidebarV3 isOpen={true} enableRealTimeThinking={true} onClose={vi.fn()} />);

    expect(screen.getByText('AI와 자연어로 시스템 질의')).toBeInTheDocument();
    expect(screen.getByText('실시간 thinking 지원')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/시스템에 대해 질문해보세요/)).toBeInTheDocument();
  });

  it('shows different UI when real-time thinking is disabled', () => {
    render(<AISidebarV3 isOpen={true} enableRealTimeThinking={false} onClose={vi.fn()} />);

    expect(screen.getByText('AI 기반 대화형 인터페이스')).toBeInTheDocument();
    expect(screen.queryByText('실시간 thinking 지원')).not.toBeInTheDocument();
  });

  it('handles EnhancedChatMessage with thinking steps', () => {
    const messagesWithThinking: EnhancedChatMessage[] = [
      {
        id: '1',
        content: 'Test response',
        role: 'assistant',
        timestamp: new Date(),
        thinkingSteps: [
          {
            id: 'step1',
            step: 'Analyzing query',
            status: 'complete',
            timestamp: new Date(),
          },
          {
            id: 'step2', 
            step: 'Generating response',
            status: 'complete',
            timestamp: new Date(),
          },
        ],
      },
    ];

    (useAISidebarStore as any).mockReturnValue({
      ...mockStore,
      messages: messagesWithThinking,
    });

    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('thinking-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-steps-count')).toHaveTextContent('2');
  });

  it('displays thinking role messages correctly', () => {
    const thinkingMessage: EnhancedChatMessage = {
      id: '1',
      content: '🤖 Google AI API 사용중...',
      role: 'thinking',
      timestamp: new Date(),
      isStreaming: true,
      thinkingSteps: [
        {
          id: 'step1',
          step: 'Processing',
          status: 'thinking',
          timestamp: new Date(),
        },
      ],
    };

    (useAISidebarStore as any).mockReturnValue({
      ...mockStore,
      messages: [thinkingMessage],
    });

    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('thinking-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-active')).toHaveTextContent('true');
    expect(screen.getByText('분석 중...')).toBeInTheDocument();
  });

  it('limits messages to MAX_MESSAGES for memory efficiency', () => {
    const manyMessages: EnhancedChatMessage[] = Array.from({ length: 60 }, (_, i) => ({
      id: `msg-${i}`,
      content: `Message ${i}`,
      role: 'user' as const,
      timestamp: new Date(),
    }));

    (useAISidebarStore as any).mockReturnValue({
      ...mockStore,
      messages: manyMessages,
    });

    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    // Only the last 50 messages should be rendered (MAX_MESSAGES = 50)
    const messageElements = screen.getAllByText(/Message \d+/);
    expect(messageElements).toHaveLength(50);
    
    // First message should be Message 10 (60 - 50 = 10)
    expect(screen.getByText('Message 10')).toBeInTheDocument();
    expect(screen.getByText('Message 59')).toBeInTheDocument();
    expect(screen.queryByText('Message 9')).not.toBeInTheDocument();
  });

  it('handles AI query submission with sequential processing', async () => {
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/);
    const sendButton = screen.getByRole('button', { name: /메시지 전송/ });

    fireEvent.input(input, { target: { value: '테스트 질문' } });
    fireEvent.click(sendButton);

    // Should add user message
    await waitFor(() => {
      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '테스트 질문',
          role: 'user',
        })
      );
    });

    // Should call processV3Query with correct parameters
    expect(mockProcessV3Query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: '테스트 질문',
        includeThinking: true,
      }),
      expect.any(AbortSignal)
    );

    // Should add assistant response message
    await waitFor(() => {
      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: 'AI response',
        })
      );
    });
  });

  it('clears input after successful submission', async () => {
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/) as HTMLTextAreaElement;
    const sendButton = screen.getByRole('button', { name: /메시지 전송/ });

    fireEvent.input(input, { target: { value: '테스트 질문' } });
    expect(input.value).toBe('테스트 질문');

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('shows error message when API fails', async () => {
    mockProcessV3Query.mockRejectedValue(new Error('API Error'));

    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/);
    const sendButton = screen.getByRole('button', { name: /메시지 전송/ });

    fireEvent.input(input, { target: { value: '테스트 질문' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockStore.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('AI 응답 생성 중 오류가 발생했습니다'),
          role: 'assistant',
        })
      );
    });
  });

  it('prevents submission when input is empty', () => {
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    const sendButton = screen.getByRole('button', { name: /메시지 전송/ });
    
    expect(sendButton).toBeDisabled();
    
    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/);
    fireEvent.input(input, { target: { value: '   ' } }); // Only whitespace
    
    expect(sendButton).toBeDisabled();
    
    fireEvent.input(input, { target: { value: '실제 질문' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('handles Ctrl+Enter key submission', () => {
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/);

    fireEvent.input(input, { target: { value: '테스트 질문' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

    expect(mockStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '테스트 질문',
        role: 'user',
      })
    );
  });

  it('allows Shift+Enter for line breaks', () => {
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/);
    
    fireEvent.input(input, { target: { value: '첫 줄' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    // Should not submit when Shift+Enter is pressed
    expect(mockStore.addMessage).not.toHaveBeenCalled();
  });

  it('calls onMessageSend callback when provided', async () => {
    const onMessageSend = vi.fn();
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} onMessageSend={onMessageSend} />);

    const input = screen.getByPlaceholderText(/시스템에 대해 질문해보세요/);
    const sendButton = screen.getByRole('button', { name: /메시지 전송/ });

    fireEvent.input(input, { target: { value: '테스트 질문' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(onMessageSend).toHaveBeenCalledWith('테스트 질문');
    });
  });

  it('uses provided sessionId', () => {
    // This is implicit as we can't easily check internal state,
    // but we can verify it renders without error with a custom session ID
    render(<AISidebarV3 isOpen={true} onClose={vi.fn()} sessionId="custom-session-id" />);
    expect(screen.getByText('AI와 자연어로 시스템 질의')).toBeInTheDocument();
  });
});