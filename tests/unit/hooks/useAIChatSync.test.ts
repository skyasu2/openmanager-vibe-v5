import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAIChatSync } from '@/hooks/useAIChatSync';

// Mock stores
const mockAIChatStore = {
  messages: [],
  setMessages: vi.fn(),
  addMessage: vi.fn(),
  clearMessages: vi.fn(),
};

const mockAISidebarStore = {
  messages: [],
  setMessages: vi.fn(),
  addMessage: vi.fn(),
  clearMessages: vi.fn(),
};

vi.mock('@/stores/ai-chat-store', () => ({
  useAIChatStore: vi.fn(() => mockAIChatStore),
}));

vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn(() => mockAISidebarStore),
}));

describe('useAIChatSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAIChatStore.messages = [];
    mockAISidebarStore.messages = [];
  });

  it('initializes without errors', () => {
    const { result } = renderHook(() => useAIChatSync());

    expect(result.current).toBeDefined();
    expect(typeof result.current.syncToSidebar).toBe('function');
    expect(typeof result.current.syncToChat).toBe('function');
  });

  it('syncs messages from chat to sidebar', () => {
    const { result } = renderHook(() => useAIChatSync());

    const testMessages = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      },
    ];

    act(() => {
      result.current.syncToSidebar(testMessages);
    });

    expect(mockAISidebarStore.setMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: 'Hello' }),
        expect.objectContaining({ content: 'Hi there!' }),
      ])
    );
  });

  it('syncs messages from sidebar to chat', () => {
    const { result } = renderHook(() => useAIChatSync());

    const testMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Test message',
        timestamp: Date.now(),
        isStreaming: false,
      },
    ];

    act(() => {
      result.current.syncToChat(testMessages);
    });

    expect(mockAIChatStore.setMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: 'Test message' }),
      ])
    );
  });

  it('handles empty message arrays', () => {
    const { result } = renderHook(() => useAIChatSync());

    act(() => {
      result.current.syncToSidebar([]);
      result.current.syncToChat([]);
    });

    expect(mockAISidebarStore.setMessages).toHaveBeenCalledWith([]);
    expect(mockAIChatStore.setMessages).toHaveBeenCalledWith([]);
  });

  it('preserves message order during sync', () => {
    const { result } = renderHook(() => useAIChatSync());

    const orderedMessages = [
      { id: '1', role: 'user', content: 'First', timestamp: 1000 },
      { id: '2', role: 'assistant', content: 'Second', timestamp: 2000 },
      { id: '3', role: 'user', content: 'Third', timestamp: 3000 },
    ];

    act(() => {
      result.current.syncToSidebar(orderedMessages);
    });

    const syncedMessages = mockAISidebarStore.setMessages.mock.calls[0][0];
    expect(syncedMessages[0].content).toBe('First');
    expect(syncedMessages[1].content).toBe('Second');
    expect(syncedMessages[2].content).toBe('Third');
  });
});
