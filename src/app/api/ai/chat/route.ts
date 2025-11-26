import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getGoogleAIKey } from '@/lib/ai/google-ai-manager';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const apiKey = getGoogleAIKey();

  if (!apiKey) {
    return new Response('Google AI API Key not found', { status: 500 });
  }

  const result = streamText({
    model: google('gemini-1.5-flash', {
      apiKey: apiKey,
    }),
    messages,
    tools: {
      getSystemStatus: tool({
        description: 'Get the current status of the system components',
        parameters: z.object({}),
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 800));
          return {
            database: 'online',
            api: 'online',
            ai_engine: 'online',
            timestamp: new Date().toISOString(),
          };
        },
      }),
      checkResourceUsage: tool({
        description: 'Check current CPU and Memory usage',
        parameters: z.object({}),
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          return {
            cpu: '45%',
            memory: '60%',
            disk: '20%',
          };
        },
      }),
      analyzeLogs: tool({
        description: 'Analyze recent system logs for errors',
        parameters: z.object({}),
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return {
            error_count: 0,
            warning_count: 2,
            last_error: null,
          };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
