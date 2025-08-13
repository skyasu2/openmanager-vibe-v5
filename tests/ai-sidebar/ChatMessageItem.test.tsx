import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChatMessageItem } from '@/domains/ai-sidebar/components/ChatMessageItem';

describe('ChatMessageItem', () => {
  const mockMessage = {
    id: '1',
    content: '안녕하세요! 서버 상태를 확인해주세요.',
    role: 'user' as const,
    timestamp: new Date('2025-08-13T10:00:00Z')
  };

  it('renders user message correctly', () => {
    render(<ChatMessageItem message={mockMessage} />);

    expect(screen.getByText('안녕하세요! 서버 상태를 확인해주세요.')).toBeInTheDocument();
    expect(screen.getByText('사용자')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: '현재 서버들이 모두 정상 작동 중입니다.'
    };

    render(<ChatMessageItem message={assistantMessage} />);

    expect(screen.getByText('현재 서버들이 모두 정상 작동 중입니다.')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('displays timestamp correctly', () => {
    render(<ChatMessageItem message={mockMessage} />);

    // 시간이 상대적으로 표시되는지 확인
    expect(screen.getByText(/ago|전/)).toBeInTheDocument();
  });

  it('handles markdown content', () => {
    const markdownMessage = {
      ...mockMessage,
      content: '**굵은 텍스트**와 `코드`가 포함된 메시지입니다.',
      role: 'assistant' as const
    };

    render(<ChatMessageItem message={markdownMessage} />);

    expect(screen.getByText('굵은 텍스트')).toBeInTheDocument();
    expect(screen.getByText('코드')).toBeInTheDocument();
  });

  it('shows loading state for pending messages', () => {
    const pendingMessage = {
      ...mockMessage,
      content: '',
      role: 'assistant' as const,
      isPending: true
    };

    render(<ChatMessageItem message={pendingMessage} />);

    expect(screen.getByText(/생각 중/)).toBeInTheDocument();
  });

  it('applies correct styling for different roles', () => {
    const { rerender } = render(<ChatMessageItem message={mockMessage} />);
    
    const userContainer = screen.getByTestId('message-container');
    expect(userContainer).toHaveClass('justify-end');

    const assistantMessage = { ...mockMessage, role: 'assistant' as const };
    rerender(<ChatMessageItem message={assistantMessage} />);

    const assistantContainer = screen.getByTestId('message-container');
    expect(assistantContainer).toHaveClass('justify-start');
  });
});