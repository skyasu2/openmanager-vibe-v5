import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import { useAISidebarStore } from '@/stores/useAISidebarStore';

// Mock Zustand store
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn(),
}));

describe('Memory Management (MAX_MESSAGES)', () => {
  let mockMessages: EnhancedChatMessage[];
  let mockAddMessage: ReturnType<typeof vi.fn>;
  let mockClearMessages: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMessages = [];
    mockAddMessage = vi.fn((message: EnhancedChatMessage) => {
      mockMessages.push(message);
    });
    mockClearMessages = vi.fn(() => {
      mockMessages = [];
    });

    (useAISidebarStore as any).mockReturnValue({
      messages: mockMessages,
      addMessage: mockAddMessage,
      clearMessages: mockClearMessages,
    });
  });

  it('should handle messages under MAX_MESSAGES limit efficiently', () => {
    const MAX_MESSAGES = 50;

    // Generate messages under the limit
    const messages: EnhancedChatMessage[] = Array.from(
      { length: 25 },
      (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user' as const,
        timestamp: new Date(Date.now() + i * 1000),
      })
    );

    // Simulate the limitedMessages logic from AISidebarV3
    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(25);
    expect(limitedMessages).toEqual(messages);
    expect(limitedMessages[0].content).toBe('Message 0');
    expect(limitedMessages[24].content).toBe('Message 24');
  });

  it('should limit messages to MAX_MESSAGES when exceeded', () => {
    const MAX_MESSAGES = 50;

    // Generate messages exceeding the limit
    const messages: EnhancedChatMessage[] = Array.from(
      { length: 75 },
      (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        timestamp: new Date(Date.now() + i * 1000),
      })
    );

    // Simulate the limitedMessages logic from AISidebarV3
    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(MAX_MESSAGES);

    // Should keep the last 50 messages (index 25-74)
    expect(limitedMessages[0].content).toBe('Message 25');
    expect(limitedMessages[49].content).toBe('Message 74');

    // Verify older messages are removed
    expect(
      limitedMessages.find((msg) => msg.content === 'Message 0')
    ).toBeUndefined();
    expect(
      limitedMessages.find((msg) => msg.content === 'Message 24')
    ).toBeUndefined();
  });

  it('should preserve conversation context when limiting messages', () => {
    const MAX_MESSAGES = 50;

    // Create a realistic conversation pattern
    const messages: EnhancedChatMessage[] = [];

    for (let i = 0; i < 60; i++) {
      // Add user message
      messages.push({
        id: `user-${i}`,
        content: `User question ${i}: 서버 상태는 어떤가요?`,
        role: 'user',
        timestamp: new Date(Date.now() + i * 2000),
      });

      // Add assistant response
      messages.push({
        id: `assistant-${i}`,
        content: `Assistant response ${i}: 서버가 정상 작동 중입니다.`,
        role: 'assistant',
        timestamp: new Date(Date.now() + i * 2000 + 1000),
        engine: 'UNIFIED',
        metadata: {
          processingTime: 1500,
          confidence: 0.9,
        },
      });
    }

    expect(messages).toHaveLength(120); // 60 pairs

    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(MAX_MESSAGES);

    // Should maintain conversation pairs
    const userMessages = limitedMessages.filter((msg) => msg.role === 'user');
    const assistantMessages = limitedMessages.filter(
      (msg) => msg.role === 'assistant'
    );

    // Due to the slicing, we might have imbalanced pairs, but that's expected
    expect(userMessages.length + assistantMessages.length).toBe(MAX_MESSAGES);

    // Verify the oldest kept message
    expect(limitedMessages[0].content).toContain('35'); // From user-35 onwards
  });

  it('should handle thinking messages in memory management', () => {
    const MAX_MESSAGES = 50;

    const messages: EnhancedChatMessage[] = [];

    // Create mixed message types including thinking messages
    for (let i = 0; i < 40; i++) {
      // User message
      messages.push({
        id: `user-${i}`,
        content: `Question ${i}`,
        role: 'user',
        timestamp: new Date(Date.now() + i * 3000),
      });

      // Thinking message
      messages.push({
        id: `thinking-${i}`,
        content: '🤖 AI가 생각하는 중...',
        role: 'thinking',
        timestamp: new Date(Date.now() + i * 3000 + 1000),
        isStreaming: true,
        thinkingSteps: [
          {
            id: `step-${i}`,
            step: `Processing question ${i}`,
            status: 'thinking',
            timestamp: new Date(Date.now() + i * 3000 + 500),
          },
        ],
      });

      // Assistant response
      messages.push({
        id: `assistant-${i}`,
        content: `Response ${i}`,
        role: 'assistant',
        timestamp: new Date(Date.now() + i * 3000 + 2000),
        isCompleted: true,
      });
    }

    expect(messages).toHaveLength(120); // 40 triplets

    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(MAX_MESSAGES);

    // Count message types
    const thinkingMessages = limitedMessages.filter(
      (msg) => msg.role === 'thinking'
    );
    const userMessages = limitedMessages.filter((msg) => msg.role === 'user');
    const assistantMessages = limitedMessages.filter(
      (msg) => msg.role === 'assistant'
    );

    expect(thinkingMessages.length).toBeGreaterThan(0);
    expect(userMessages.length).toBeGreaterThan(0);
    expect(assistantMessages.length).toBeGreaterThan(0);
    expect(
      thinkingMessages.length + userMessages.length + assistantMessages.length
    ).toBe(MAX_MESSAGES);
  });

  it('should maintain message ordering after memory management', () => {
    const MAX_MESSAGES = 50;

    const messages: EnhancedChatMessage[] = Array.from(
      { length: 80 },
      (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user' as const,
        timestamp: new Date(2025, 7, 25, 12, 0, i), // Sequential timestamps
      })
    );

    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(MAX_MESSAGES);

    // Verify chronological ordering is maintained
    for (let i = 1; i < limitedMessages.length; i++) {
      expect(limitedMessages[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        limitedMessages[i - 1].timestamp.getTime()
      );
    }

    // Verify continuous sequence after memory management
    expect(limitedMessages[0].content).toBe('Message 30');
    expect(limitedMessages[1].content).toBe('Message 31');
    expect(limitedMessages[49].content).toBe('Message 79');
  });

  it('should handle edge case with exactly MAX_MESSAGES', () => {
    const MAX_MESSAGES = 50;

    const messages: EnhancedChatMessage[] = Array.from(
      { length: MAX_MESSAGES },
      (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user' as const,
        timestamp: new Date(Date.now() + i * 1000),
      })
    );

    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(MAX_MESSAGES);
    expect(limitedMessages).toEqual(messages);
    expect(limitedMessages[0].content).toBe('Message 0');
    expect(limitedMessages[49].content).toBe('Message 49');
  });

  it('should handle memory management with enhanced message features', () => {
    const MAX_MESSAGES = 50;

    const messages: EnhancedChatMessage[] = Array.from(
      { length: 70 },
      (_, i) => ({
        id: `enhanced-${i}`,
        content: `Message ${i}`,
        role: 'assistant' as const,
        timestamp: new Date(Date.now() + i * 1000),
        engine: i % 2 === 0 ? 'GOOGLE_AI' : 'LOCAL_AI',
        metadata: {
          processingTime: 1000 + i * 10,
          confidence: 0.8 + (i % 20) * 0.01,
        },
        thinkingSteps:
          i % 3 === 0
            ? [
                {
                  id: `step-${i}`,
                  step: `Thinking step for message ${i}`,
                  status: 'complete' as const,
                  timestamp: new Date(Date.now() + i * 1000 - 500),
                },
              ]
            : undefined,
        isCompleted: true,
      })
    );

    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    expect(limitedMessages).toHaveLength(MAX_MESSAGES);

    // Verify enhanced features are preserved
    const messagesWithThinking = limitedMessages.filter(
      (msg) => msg.thinkingSteps?.length > 0
    );
    expect(messagesWithThinking.length).toBeGreaterThan(0);

    const messagesWithMetadata = limitedMessages.filter(
      (msg) => msg.metadata?.processingTime
    );
    expect(messagesWithMetadata.length).toBe(MAX_MESSAGES);

    // Verify the slice maintained enhanced features
    expect(limitedMessages[0].content).toBe('Message 20');
    expect(limitedMessages[0].metadata?.processingTime).toBe(1200);
  });

  it('should calculate memory usage estimation', () => {
    const MAX_MESSAGES = 50;

    // Estimate memory usage per message
    const estimateMessageSize = (message: EnhancedChatMessage): number => {
      let size = 0;
      size += message.id.length * 2; // UTF-16 characters
      size += message.content.length * 2;
      size += 8; // timestamp
      size += message.engine?.length * 2 || 0;

      if (message.thinkingSteps) {
        size += message.thinkingSteps.reduce((stepSize, step) => {
          return (
            stepSize +
            step.id.length * 2 +
            step.step.length * 2 +
            (step.description?.length * 2 || 0) +
            8
          ); // timestamp
        }, 0);
      }

      return size;
    };

    const messages: EnhancedChatMessage[] = Array.from(
      { length: 100 },
      (_, i) => ({
        id: `memory-test-${i}`,
        content: `This is a test message ${i} to estimate memory usage for the AI sidebar`,
        role: 'assistant' as const,
        timestamp: new Date(),
        engine: 'UNIFIED',
        thinkingSteps: [
          {
            id: `step-${i}`,
            step: `Thinking step ${i}`,
            status: 'complete',
            timestamp: new Date(),
            description: `Detailed description for thinking step ${i}`,
          },
        ],
      })
    );

    const limitedMessages =
      messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;

    const totalMemoryEstimate = limitedMessages.reduce((total, msg) => {
      return total + estimateMessageSize(msg);
    }, 0);

    // Memory should be reasonably bounded
    expect(limitedMessages).toHaveLength(MAX_MESSAGES);
    expect(totalMemoryEstimate).toBeLessThan(1024 * 1024); // Less than 1MB

    // Memory per message should be reasonable
    const avgMemoryPerMessage = totalMemoryEstimate / limitedMessages.length;
    expect(avgMemoryPerMessage).toBeLessThan(10 * 1024); // Less than 10KB per message
  });
});
