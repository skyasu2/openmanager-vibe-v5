/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAIChatSync } from '@/hooks/useAIChatSync';

// Mock Zustand stores with selector support
const mockSidebarMessages: Array<{
  id: string;
  content: string;
  role: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  engine?: string;
  thinkingSteps?: unknown[];
  isCompleted?: boolean;
}> = [];
const mockChatMessages: Array<{
  id: string;
  content: string;
  role: string;
  timestamp: number;
  type?: string;
  error?: boolean;
  engine?: string;
  responseTime?: number;
  thinkingSteps?: unknown[];
}> = [];

const mockSetChatMessages = vi.fn();
const mockSidebarAddMessage = vi.fn();
const mockSidebarClearMessages = vi.fn();

// Mock ai-chat-store with selector support
vi.mock('@/stores/ai-chat-store', () => ({
  useAIChatStore: vi.fn((selector) => {
    const state = {
      messages: mockChatMessages,
      setMessages: mockSetChatMessages,
      resetChat: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock useAISidebarStore with selector support
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn((selector) => {
    const state = {
      messages: mockSidebarMessages,
      addMessage: mockSidebarAddMessage,
      clearMessages: mockSidebarClearMessages,
      setMessages: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('useAIChatSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarMessages.length = 0;
    mockChatMessages.length = 0;
  });

  it('initializes without errors', () => {
    const { result } = renderHook(() => useAIChatSync());

    expect(result.current).toBeDefined();
    expect(typeof result.current.syncSidebarToFullscreen).toBe('function');
    expect(typeof result.current.syncFullscreenToSidebar).toBe('function');
    expect(typeof result.current.initializeSync).toBe('function');
    expect(typeof result.current.resetBothStores).toBe('function');
  });

  it('syncs messages from sidebar to fullscreen', () => {
    // Setup sidebar messages
    mockSidebarMessages.push(
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }
    );

    const { result } = renderHook(() => useAIChatSync({ autoSync: false }));

    act(() => {
      result.current.syncSidebarToFullscreen();
    });

    expect(mockSetChatMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: 'Hello' }),
        expect.objectContaining({ content: 'Hi there!' }),
      ])
    );
  });

  it('syncs new messages from fullscreen to sidebar', () => {
    // Setup: chat has messages, sidebar is empty
    mockChatMessages.push({
      id: '1',
      role: 'user',
      content: 'Test message',
      timestamp: Date.now(),
      type: 'text',
    });

    const { result } = renderHook(() => useAIChatSync({ autoSync: false }));

    act(() => {
      result.current.syncFullscreenToSidebar();
    });

    expect(mockSidebarAddMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Test message' })
    );
  });

  it('handles empty message arrays', () => {
    const { result } = renderHook(() => useAIChatSync({ autoSync: false }));

    // With empty arrays, sync should not throw
    expect(() => {
      act(() => {
        result.current.syncSidebarToFullscreen();
        result.current.syncFullscreenToSidebar();
      });
    }).not.toThrow();
  });

  it('preserves message order during sync', () => {
    mockSidebarMessages.push(
      { id: '1', role: 'user', content: 'First', timestamp: 1000 },
      { id: '2', role: 'assistant', content: 'Second', timestamp: 2000 },
      { id: '3', role: 'user', content: 'Third', timestamp: 3000 }
    );

    const { result } = renderHook(() => useAIChatSync({ autoSync: false }));

    act(() => {
      result.current.syncSidebarToFullscreen();
    });

    const syncedMessages = mockSetChatMessages.mock.calls[0][0];
    expect(syncedMessages[0].content).toBe('First');
    expect(syncedMessages[1].content).toBe('Second');
    expect(syncedMessages[2].content).toBe('Third');
  });

  it('reports correct message counts', () => {
    mockSidebarMessages.push({
      id: '1',
      role: 'user',
      content: 'Msg 1',
      timestamp: 1000,
    });
    mockChatMessages.push(
      { id: '1', role: 'user', content: 'Msg 1', timestamp: 1000 },
      { id: '2', role: 'assistant', content: 'Msg 2', timestamp: 2000 }
    );

    const { result } = renderHook(() => useAIChatSync({ autoSync: false }));

    expect(result.current.sidebarMessageCount).toBe(1);
    expect(result.current.fullscreenMessageCount).toBe(2);
  });
});
