/**
 * 🤖 제3자 AI 대화 관리자
 * 다양한 AI 서비스와 직접 대화할 수 있는 통합 모듈
 */

import KoreanTimeUtil from '@/utils/koreanTime';

export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    confidence?: number;
  };
}

export interface ConversationSession {
  id: string;
  title: string;
  provider: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export class AIConversationManager {
  private providers: Map<string, AIProvider> = new Map();
  private sessions: Map<string, ConversationSession> = new Map();
  private currentSessionId: string | null = null;

  constructor() {
    this._initializeProviders();
  }

  /**
   * AI 제공자 초기화
   */
  private _initializeProviders() {
    // Google AI (Gemini)
    this.providers.set('google', {
      name: 'Google AI (Gemini)',
      apiKey:
        process.env.GOOGLE_AI_API_KEY ||
        (() => {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '⚠️ GOOGLE_AI_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.'
            );
            return '';
          } else {
            throw new Error(
              'GOOGLE_AI_API_KEY environment variable is required in production'
            );
          }
        })(),
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-1.5-flash',
      enabled: true,
    });

    // OpenAI (GPT)
    this.providers.set('openai', {
      name: 'OpenAI (GPT)',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      enabled: !!process.env.OPENAI_API_KEY,
    });

    // Anthropic (Claude)
    this.providers.set('anthropic', {
      name: 'Anthropic (Claude)',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-sonnet-20240229',
      enabled: !!process.env.ANTHROPIC_API_KEY,
    });

    // Cohere
    this.providers.set('cohere', {
      name: 'Cohere',
      apiKey: process.env.COHERE_API_KEY || '',
      baseUrl: 'https://api.cohere.ai/v1',
      model: 'command',
      enabled: !!process.env.COHERE_API_KEY,
    });
  }

  /**
   * 새로운 대화 세션 시작
   */
  async startConversation(
    providerName: string,
    title?: string
  ): Promise<string> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`❌ 지원하지 않는 AI 제공자: ${providerName}`);
    }

    if (!provider.enabled) {
      throw new Error(
        `❌ ${provider.name}이 비활성화되어 있습니다. API 키를 확인해주세요.`
      );
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ConversationSession = {
      id: sessionId,
      title: title || `${provider.name} 대화 - ${KoreanTimeUtil.now()}`,
      provider: providerName,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    console.log(`🚀 새로운 대화 세션 시작: ${session.title} (${sessionId})`);
    return sessionId;
  }

  /**
   * AI와 메시지 주고받기
   */
  async sendMessage(
    message: string,
    sessionId?: string
  ): Promise<ConversationMessage> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) {
      throw new Error(
        '❌ 활성 대화 세션이 없습니다. 먼저 대화를 시작해주세요.'
      );
    }

    const session = this.sessions.get(targetSessionId);
    if (!session) {
      throw new Error(`❌ 대화 세션을 찾을 수 없습니다: ${targetSessionId}`);
    }

    const provider = this.providers.get(session.provider);
    if (!provider) {
      throw new Error(`❌ AI 제공자를 찾을 수 없습니다: ${session.provider}`);
    }

    // 사용자 메시지 추가
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      provider: session.provider,
    };

    session.messages.push(userMessage);

    try {
      // AI 응답 요청
      const startTime = Date.now();
      const aiResponse = await this.callAIProvider(provider, session.messages);
      const processingTime = Date.now() - startTime;

      // AI 응답 메시지 추가
      const assistantMessage: ConversationMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        provider: session.provider,
        metadata: {
          tokensUsed: aiResponse.tokensUsed,
          processingTime,
          confidence: aiResponse.confidence,
        },
      };

      session.messages.push(assistantMessage);
      session.updatedAt = new Date();

      console.log(
        `💬 [${provider.name}] 응답 완료 (${processingTime}ms, ${aiResponse.tokensUsed} 토큰)`
      );
      return assistantMessage;
    } catch (error) {
      console.error(`❌ [${provider.name}] 응답 실패:`, error);

      // 에러 메시지 추가
      const errorMessage: ConversationMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `죄송합니다. ${provider.name}에서 오류가 발생했습니다: ${(error as Error).message}`,
        timestamp: new Date(),
        provider: session.provider,
        metadata: {
          processingTime: Date.now() - Date.now(),
        },
      };

      session.messages.push(errorMessage);
      return errorMessage;
    }
  }

  /**
   * AI 제공자별 API 호출
   */
  private async callAIProvider(
    provider: AIProvider,
    messages: ConversationMessage[]
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
  }> {
    switch (provider.name) {
      case 'Google AI (Gemini)':
        return this.callGoogleAI(provider, messages);
      case 'OpenAI (GPT)':
        return this.callOpenAI(provider, messages);
      case 'Anthropic (Claude)':
        return this.callAnthropic(provider, messages);
      case 'Cohere':
        return this.callCohere(provider, messages);
      default:
        throw new Error(`❌ 지원하지 않는 AI 제공자: ${provider.name}`);
    }
  }

  /**
   * Google AI 호출
   */
  private async callGoogleAI(
    provider: AIProvider,
    messages: ConversationMessage[]
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
  }> {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error('메시지가 없습니다.');
    }
    const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: lastMessage.content,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Google AI API 오류: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      '응답을 받을 수 없습니다.';
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return {
      content,
      tokensUsed,
      confidence: 0.9,
    };
  }

  /**
   * OpenAI 호출
   */
  private async callOpenAI(
    provider: AIProvider,
    messages: ConversationMessage[]
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
  }> {
    const url = `${provider.baseUrl}/chat/completions`;

    const openaiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API 오류: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content || '응답을 받을 수 없습니다.';
    const tokensUsed = data.usage?.total_tokens || 0;

    return {
      content,
      tokensUsed,
      confidence: 0.95,
    };
  }

  /**
   * Anthropic 호출
   */
  private async callAnthropic(
    provider: AIProvider,
    messages: ConversationMessage[]
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
  }> {
    const url = `${provider.baseUrl}/messages`;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error('메시지가 없습니다.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: lastMessage.content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Anthropic API 오류: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '응답을 받을 수 없습니다.';
    const tokensUsed =
      data.usage?.input_tokens + data.usage?.output_tokens || 0;

    return {
      content,
      tokensUsed,
      confidence: 0.92,
    };
  }

  /**
   * Cohere 호출
   */
  private async callCohere(
    provider: AIProvider,
    messages: ConversationMessage[]
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
  }> {
    const url = `${provider.baseUrl}/generate`;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error('메시지가 없습니다.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        prompt: lastMessage.content,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Cohere API 오류: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.generations?.[0]?.text || '응답을 받을 수 없습니다.';
    const tokensUsed = data.meta?.billed_units?.output_tokens || 0;

    return {
      content,
      tokensUsed,
      confidence: 0.88,
    };
  }

  /**
   * 대화 세션 목록 조회
   */
  getSessions(): ConversationSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * 특정 세션 조회
   */
  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 현재 세션 조회
   */
  getCurrentSession(): ConversationSession | null {
    return this.currentSessionId
      ? this.sessions.get(this.currentSessionId) || null
      : null;
  }

  /**
   * 세션 전환
   */
  switchSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      return true;
    }
    return false;
  }

  /**
   * 사용 가능한 AI 제공자 목록
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.enabled);
  }

  /**
   * 세션 종료
   */
  endSession(sessionId?: string): boolean {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return false;

    const session = this.sessions.get(targetSessionId);
    if (session) {
      session.isActive = false;
      session.updatedAt = new Date();

      if (this.currentSessionId === targetSessionId) {
        this.currentSessionId = null;
      }

      return true;
    }
    return false;
  }

  /**
   * 대화 기록 내보내기
   */
  exportConversation(
    sessionId: string,
    format: 'json' | 'text' = 'json'
  ): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`❌ 세션을 찾을 수 없습니다: ${sessionId}`);
    }

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    } else {
      let text = `=== ${session.title} ===\n`;
      text += `제공자: ${session.provider}\n`;
      text += `생성일: ${session.createdAt.toLocaleString('ko-KR')}\n`;
      text += `수정일: ${session.updatedAt.toLocaleString('ko-KR')}\n\n`;

      session.messages.forEach((msg) => {
        const role = msg.role === 'user' ? '👤 사용자' : '🤖 AI';
        text += `${role} [${msg.timestamp.toLocaleTimeString('ko-KR')}]:\n`;
        text += `${msg.content}\n\n`;
      });

      return text;
    }
  }
}
