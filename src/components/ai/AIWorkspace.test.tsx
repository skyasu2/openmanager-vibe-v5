/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIWorkspace from '@/components/ai/AIWorkspace';

// Mock next/navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: mockBack,
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock the AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    sendMessage: vi.fn(),
    status: 'idle',
    setMessages: vi.fn(),
  })),
}));

// Mock Zustand store with selector support
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn((selector) => {
    const state = {
      isOpen: true,
      toggleSidebar: vi.fn(),
      setIsOpen: vi.fn(),
      messages: [],
      addMessage: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock child components to simplify testing
vi.mock('@/components/shared/OpenManagerLogo', () => ({
  OpenManagerLogo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/ai-sidebar/EnhancedAIChat', () => ({
  EnhancedAIChat: () => <div data-testid="enhanced-ai-chat">AI Chat</div>,
}));

vi.mock('@/components/ai-sidebar/AIFunctionPages', () => ({
  AIFunctionPages: () => (
    <div data-testid="ai-function-pages">Function Pages</div>
  ),
}));

vi.mock('@/components/ai/AIAssistantIconPanel', () => ({
  default: () => <div data-testid="ai-icon-panel">Icon Panel</div>,
}));

vi.mock('@/components/ai/AIContentArea', () => ({
  default: () => <div data-testid="ai-content-area">Content Area</div>,
}));

vi.mock('@/components/ai/ThinkingProcessVisualizer', () => ({
  default: () => <div data-testid="thinking-visualizer">Thinking</div>,
}));

describe('AIWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI workspace interface', () => {
    render(<AIWorkspace />);

    // Check for key UI elements (로고는 desktop/mobile 두 곳에 표시될 수 있음)
    const logos = screen.getAllByTestId('logo');
    expect(logos.length).toBeGreaterThan(0);
    // 새 대화 버튼 (한국어)
    expect(screen.getByText('새 대화')).toBeInTheDocument();
    // Features 섹션 레이블
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('handles back navigation', () => {
    render(<AIWorkspace />);

    // Find the back button by its title
    const backButton = screen.getByTitle('뒤로 가기');
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('displays loading state correctly', async () => {
    const { useChat } = await import('@ai-sdk/react');

    vi.mocked(useChat).mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      sendMessage: vi.fn(),
      status: 'streaming',
      setMessages: vi.fn(),
    } as unknown as ReturnType<typeof useChat>);

    render(<AIWorkspace />);

    // Component should render without errors during streaming state
    const logos = screen.getAllByTestId('logo');
    expect(logos.length).toBeGreaterThan(0);
  });
});
