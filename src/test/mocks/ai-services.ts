/**
 * 🤖 AI 서비스 Mock
 */

import { vi } from 'vitest';

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() =>
        Promise.resolve({
          response: {
            text: vi.fn(() => 'Mock AI response'),
          },
        })
      ),
    })),
  })),
}));

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(() =>
          Promise.resolve({
            choices: [{ message: { content: 'Mock OpenAI response' } }],
          })
        ),
      },
    },
  })),
}));
