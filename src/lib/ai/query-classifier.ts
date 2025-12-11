import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import * as z from 'zod';

// Define the classification schema
const classificationSchema = z.object({
  complexity: z
    .number()
    .min(1)
    .max(5)
    .describe(
      'The complexity of the query from 1 (simple) to 5 (complex). 1-3: Simple retrieval or conversation. 4-5: Complex analysis, coding, or reasoning.'
    ),
  intent: z
    .enum(['general', 'monitoring', 'analysis', 'guide', 'coding'])
    .describe('The primary intent of the user.'),
  reasoning: z.string().describe('Brief explanation for the classification.'),
});

export type QueryClassification = z.infer<typeof classificationSchema>;

export class QueryClassifier {
  private static instance: QueryClassifier;

  private constructor() {}

  static getInstance(): QueryClassifier {
    if (!QueryClassifier.instance) {
      QueryClassifier.instance = new QueryClassifier();
    }
    return QueryClassifier.instance;
  }

  /**
   * Classifies a user query using Groq (Llama-3.1-8b-instant).
   * This is designed to be extremely fast (< 500ms).
   */
  async classify(query: string): Promise<QueryClassification> {
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        '⚠️ GROQ_API_KEY missing. Fallback to basic regex classification.'
      );
      return this.fallbackClassify(query);
    }

    try {
      const { object } = await generateObject({
        model: groq('llama-3.1-8b-instant'),
        schema: classificationSchema,
        prompt: `Classify the following user query for an IT infrastructure monitoring assistant.
        
        Query: "${query}"
        
        Guidelines:
        - Complexity 1-2: Greetings, simple status checks ("is server up?"), checking distinct metric ("cpu usage").
        - Complexity 3: How-to guides, explanation of concepts, multiple metrics.
        - Complexity 4-5: Root cause analysis, "why" questions, coding requests, log analysis, complex correlations.`,
        temperature: 0, // Deterministic
      });

      return object;
    } catch (error) {
      console.error('❌ Groq classification failed:', error);
      return this.fallbackClassify(query);
    }
  }

  /**
   * Fallback classification using regex (Zero latency, low intelligence)
   */
  private fallbackClassify(query: string): QueryClassification {
    const q = query.toLowerCase();

    // Coding/Analysis -> High complexity
    if (
      q.includes('code') ||
      q.includes('script') ||
      q.includes('analysis') ||
      q.includes('why') ||
      q.includes('fix')
    ) {
      return {
        complexity: 4,
        intent: 'analysis',
        reasoning: 'Keyword match: Analysis/Coding',
      };
    }

    // Monitoring -> Medium complexity
    if (
      q.includes('status') ||
      q.includes('cpu') ||
      q.includes('memory') ||
      q.includes('server')
    ) {
      return {
        complexity: 2,
        intent: 'monitoring',
        reasoning: 'Keyword match: Monitoring',
      };
    }

    // Default -> Simple
    return { complexity: 1, intent: 'general', reasoning: 'Fallback default' };
  }
}

export const classifyQuery = (query: string) =>
  QueryClassifier.getInstance().classify(query);
