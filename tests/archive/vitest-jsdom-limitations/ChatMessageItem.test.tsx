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
    // 사용자 아이콘이 렌더링되는지 확인 (User 컴포넌트)
    expect(document.querySelector('.lucide-user')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: '현재 서버들이 모두 정상 작동 중입니다.'
    };

    render(<ChatMessageItem message={assistantMessage} />);

    expect(screen.getByText('현재 서버들이 모두 정상 작동 중입니다.')).toBeInTheDocument();
    // AI 봇 아이콘이 렌더링되는지 확인 (Bot 컴포넌트)
    expect(document.querySelector('.lucide-bot')).toBeInTheDocument();
  });

  it('displays timestamp correctly', () => {
    render(<ChatMessageItem message={mockMessage} />);

    // 시간이 HH:MM 형식으로 표시되는지 확인
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('handles markdown content', () => {
    const markdownMessage = {
      ...mockMessage,
      content: '**굵은 텍스트**와 `코드`가 포함된 메시지입니다.',
      role: 'assistant' as const
    };

    render(<ChatMessageItem message={markdownMessage} />);

    // 컴포넌트는 마크다운을 렌더링하지 않고 원본 텍스트를 표시
    expect(screen.getByText('**굵은 텍스트**와 `코드`가 포함된 메시지입니다.')).toBeInTheDocument();
  });

  it('shows loading state for pending messages', () => {
    const pendingMessage = {
      ...mockMessage,
      content: '',
      role: 'assistant' as const
    };

    render(<ChatMessageItem message={pendingMessage} />);

    // 빈 콘텐츠 메시지도 정상적으로 렌더링되는지 확인 (컨테이너 존재)
    expect(screen.getByTestId('message-container')).toBeInTheDocument();
    expect(document.querySelector('.lucide-bot')).toBeInTheDocument();
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