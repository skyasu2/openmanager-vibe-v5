import { describe, expect, it } from 'vitest';
import type {
  AIThinkingStep,
  ChatMessage,
  EnhancedChatMessage,
} from '@/stores/useAISidebarStore';

describe('EnhancedChatMessage Type', () => {
  it('should be compatible with base ChatMessage', () => {
    const baseMessage: ChatMessage = {
      id: '1',
      content: 'Test message',
      role: 'user',
      timestamp: new Date(),
    };

    // EnhancedChatMessage should be assignable from ChatMessage
    const enhancedMessage: EnhancedChatMessage = {
      ...baseMessage,
      thinkingSteps: [],
      isStreaming: false,
    };

    expect(enhancedMessage.id).toBe('1');
    expect(enhancedMessage.content).toBe('Test message');
    expect(enhancedMessage.role).toBe('user');
  });

  it('should support thinking role messages', () => {
    const thinkingMessage: EnhancedChatMessage = {
      id: 'thinking-1',
      content: '🤖 AI가 생각하는 중...',
      role: 'thinking',
      timestamp: new Date(),
      isStreaming: true,
      thinkingSteps: [
        {
          id: 'step-1',
          step: 'Analyzing query',
          status: 'thinking',
          timestamp: new Date(),
          description: 'Processing user input',
        },
      ],
    };

    expect(thinkingMessage.role).toBe('thinking');
    expect(thinkingMessage.isStreaming).toBe(true);
    expect(thinkingMessage.thinkingSteps).toHaveLength(1);
    expect(thinkingMessage.thinkingSteps?.[0].status).toBe('thinking');
  });

  it('should support assistant messages with thinking steps', () => {
    const assistantMessage: EnhancedChatMessage = {
      id: 'assistant-1',
      content: 'Here is my analysis of the server status...',
      role: 'assistant',
      timestamp: new Date(),
      engine: 'LOCAL_AI',
      metadata: {
        processingTime: 2500,
        confidence: 0.95,
      },
      thinkingSteps: [
        {
          id: 'step-1',
          step: 'Query analysis',
          status: 'complete',
          timestamp: new Date(),
          description: 'Analyzed user query for server status',
        },
        {
          id: 'step-2',
          step: 'Data retrieval',
          status: 'complete',
          timestamp: new Date(),
          description: 'Retrieved server metrics from database',
        },
        {
          id: 'step-3',
          step: 'Response generation',
          status: 'complete',
          timestamp: new Date(),
          description: 'Generated comprehensive status report',
        },
      ],
      isStreaming: false,
      isCompleted: true,
    };

    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.thinkingSteps).toHaveLength(3);
    expect(
      assistantMessage.thinkingSteps?.every(
        (step) => step.status === 'complete'
      )
    ).toBe(true);
    expect(assistantMessage.isCompleted).toBe(true);
  });

  it('should handle Google AI messages without thinking steps', () => {
    const googleAIMessage: EnhancedChatMessage = {
      id: 'google-1',
      content:
        'Based on the current metrics, your servers are performing well.',
      role: 'assistant',
      timestamp: new Date(),
      engine: 'GOOGLE_AI',
      metadata: {
        processingTime: 450,
        confidence: 0.88,
      },
      // Google AI messages typically don't have thinking steps
      thinkingSteps: undefined,
      isStreaming: false,
      isCompleted: true,
    };

    expect(googleAIMessage.engine).toBe('GOOGLE_AI');
    expect(googleAIMessage.thinkingSteps).toBeUndefined();
    expect(googleAIMessage.metadata?.processingTime).toBe(450);
  });

  it('should validate AIThinkingStep structure', () => {
    const thinkingSteps: AIThinkingStep[] = [
      {
        id: 'step-1',
        step: 'Initial analysis',
        status: 'thinking',
        timestamp: new Date(),
        description: 'Starting the analysis process',
      },
      {
        id: 'step-2',
        step: 'Data processing',
        status: 'complete',
        timestamp: new Date(),
        // description is optional
      },
      {
        id: 'step-3',
        step: 'Error encountered',
        status: 'error',
        timestamp: new Date(),
        description: 'Failed to access external API',
      },
    ];

    expect(thinkingSteps).toHaveLength(3);
    expect(thinkingSteps[0].status).toBe('thinking');
    expect(thinkingSteps[1].status).toBe('complete');
    expect(thinkingSteps[2].status).toBe('error');
    expect(thinkingSteps[1].description).toBeUndefined();
  });

  it('should support streaming state transitions', () => {
    const streamingMessage: EnhancedChatMessage = {
      id: 'streaming-1',
      content: 'Analyzing your request...',
      role: 'thinking',
      timestamp: new Date(),
      isStreaming: true,
      thinkingSteps: [
        {
          id: 'step-1',
          step: 'Processing',
          status: 'thinking',
          timestamp: new Date(),
        },
      ],
    };

    // Simulate streaming completion
    const completedMessage: EnhancedChatMessage = {
      ...streamingMessage,
      content: 'Complete analysis of your system status.',
      role: 'assistant',
      isStreaming: false,
      isCompleted: true,
      thinkingSteps: [
        {
          ...streamingMessage.thinkingSteps![0],
          status: 'complete',
        },
      ],
    };

    expect(streamingMessage.isStreaming).toBe(true);
    expect(completedMessage.isStreaming).toBe(false);
    expect(completedMessage.isCompleted).toBe(true);
    expect(completedMessage.thinkingSteps?.[0].status).toBe('complete');
  });

  it('should handle error states correctly', () => {
    const errorMessage: EnhancedChatMessage = {
      id: 'error-1',
      content: '죄송합니다. AI 응답 생성 중 오류가 발생했습니다.',
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        error: 'API timeout after 30 seconds',
      },
      isError: true,
      isCompleted: true,
    };

    expect(errorMessage.isError).toBe(true);
    expect(errorMessage.metadata?.error).toContain('timeout');
    expect(errorMessage.isCompleted).toBe(true);
  });

  it('should support user messages without enhanced features', () => {
    const userMessage: EnhancedChatMessage = {
      id: 'user-1',
      content: '서버 상태를 확인해주세요',
      role: 'user',
      timestamp: new Date(),
      // User messages don't need thinking steps or streaming
    };

    expect(userMessage.role).toBe('user');
    expect(userMessage.thinkingSteps).toBeUndefined();
    expect(userMessage.isStreaming).toBeUndefined();
  });

  it('should validate timestamp consistency in thinking steps', () => {
    const baseTimestamp = new Date('2025-08-25T12:00:00Z');
    const message: EnhancedChatMessage = {
      id: 'timestamped-1',
      content: 'Processing complete',
      role: 'assistant',
      timestamp: baseTimestamp,
      thinkingSteps: [
        {
          id: 'step-1',
          step: 'Start',
          status: 'complete',
          timestamp: new Date('2025-08-25T11:59:30Z'), // Earlier than message
        },
        {
          id: 'step-2',
          step: 'Process',
          status: 'complete',
          timestamp: new Date('2025-08-25T11:59:45Z'),
        },
        {
          id: 'step-3',
          step: 'Complete',
          status: 'complete',
          timestamp: new Date('2025-08-25T12:00:00Z'), // Same as message
        },
      ],
    };

    const steps = message.thinkingSteps!;
    expect(steps[0].timestamp.getTime()).toBeLessThan(
      message.timestamp.getTime()
    );
    expect(steps[1].timestamp.getTime()).toBeLessThan(
      message.timestamp.getTime()
    );
    expect(steps[2].timestamp.getTime()).toBeLessThanOrEqual(
      message.timestamp.getTime()
    );
  });
});
