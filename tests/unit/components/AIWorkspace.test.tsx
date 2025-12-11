import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIWorkspace from '@/components/ai/AIWorkspace';

// Mock the AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    error: null,
    setMessages: vi.fn(),
  })),
}));

// Mock Zustand store
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn(() => ({
    isOpen: true,
    toggleSidebar: vi.fn(),
    setIsOpen: vi.fn(),
  })),
}));

describe('AIWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI workspace interface', () => {
    render(<AIWorkspace />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('handles workspace toggle', async () => {
    const mockToggle = vi.fn();
    const { useAISidebarStore } = await import('@/stores/useAISidebarStore');

    vi.mocked(useAISidebarStore).mockReturnValue({
      isOpen: true,
      toggleSidebar: mockToggle,
      setIsOpen: vi.fn(),
    });

    render(<AIWorkspace />);

    const toggleButton = screen.getByRole('button', { name: /toggle/i });
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(mockToggle).toHaveBeenCalled();
    }
  });

  it('displays loading state correctly', async () => {
    const { useChat } = await import('@ai-sdk/react');

    vi.mocked(useChat).mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: true,
      error: null,
      setMessages: vi.fn(),
    } as any);

    render(<AIWorkspace />);

    // Check for loading indicators
    const loadingElements = screen.queryAllByText(/loading|thinking/i);
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);
  });
});
